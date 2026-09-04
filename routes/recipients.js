import { Op } from '@sequelize/core';
import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sequelize from '../config/database.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  Recipient, ReGroup, LegalRepresentative,
  Nozology, CRG, CRGDesc, User,
  RecipientDoc, RecipientDocVersion, RecipientScanDoc, ReResult, CRGRecipientSec, DocType,
  ScheduleEvent, Direction, RecipientDraft, RecipientDraftScan,
  FamilyStatus, LegalRepFamilyStatus,
  DiagnosticSession, DiagnosticAssignment, DiagnosticConclusion, AccessGrant
} from '../models/index.js';
import { getRecipientReadiness } from '../services/recipientReadiness.js';
import { getEnrollmentState, generateEnrollmentDocument } from '../services/enrollmentDocs.js';
import { summarizeDraft } from '../src/utils/recipientDraft.js';
import { buildScanFileName } from '../services/scanFileName.js';
import {
  CATEGORIES, CATEGORY_LABELS, REASON_CODES, GRANT_MS, CATEGORY_OF,
  hasGrant, grantAccess, loadGrants, validateReason, logAccess, redactRecipient, isAdmin,
  authorWindowUntil
} from '../services/dataAccess.js';

const router = express.Router();

const groupInclude = {
  model: ReGroup,
  as: 'group',
  include: [{ model: User, as: 'curatorUser', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'fullName'] }]
};
const listInclude = [groupInclude];
const detailInclude = [
  groupInclude,
  { model: User, as: 'user', attributes: ['id', 'email', 'role'] },
  {
    model: LegalRepresentative, as: 'representative',
    include: [{
      model: FamilyStatus, as: 'familyStatuses',
      attributes: ['id', 'code', 'name', 'hint', 'groupKey', 'sortOrder'],
      through: { attributes: [] }
    }]
  },
  { model: Nozology, as: 'nozologyRef' },
  { model: CRG, as: 'crgMain' },
  { model: CRGDesc, as: 'secondaryCRG' },
  { model: RecipientDoc, as: 'docs' }
];

const RECIPIENT_FIELDS = [
  'userId', 'firstName', 'middleName', 'lastName', 'birthDate', 'email',
  'telephone', 'photo', 'representativeId', 'status', 'disableGroup',
  'diagnosis', 'nozology', 'groupId', 'CRGMain'
];

function pickFields(body) {
  const out = {};
  for (const key of RECIPIENT_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

const likeEscape = (v) => String(v).replace(/[\\%_]/g, (c) => '\\' + c);

const diagnosisWhere = (value) => {
  const d = likeEscape(value);
  return {
    [Op.or]: [
      { [Op.eq]: value },
      { [Op.like]: `${d}\n%` },
      { [Op.like]: `%\n${d}` },
      { [Op.like]: `%\n${d}\n%` }
    ]
  };
};

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const personName = (u) => (u ? (u.fullName || u.email || null) : null);

async function buildCardAudit(recipient) {
  const [creator, lastChange] = await Promise.all([
    recipient.createdBy
      ? User.findByPk(recipient.createdBy, { attributes: ['id', 'firstName', 'lastName', 'email'] })
      : null,
    RecipientDocVersion.findOne({
      where: { recipientId: recipient.id },
      attributes: ['id', 'changedAt', 'changedBy', 'reason'],
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['changedAt', 'DESC'], ['id', 'DESC']]
    })
  ]);

  return {
    createdAt: recipient.createdAt || null,
    createdBy: recipient.createdBy || null,
    createdByName: personName(creator),
    changedAt: lastChange?.changedAt || null,
    changedBy: lastChange?.changedBy || null,
    changedByName: personName(lastChange?.author),
    changeReason: lastChange?.reason || null
  };
}

async function enrichRecipients(rows, teacherUserId = null) {
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const soon = new Date(today); soon.setDate(today.getDate() + 30);
  const todayStr = fmtDate(today);
  const tomorrowStr = fmtDate(tomorrow);
  const weekEndStr = fmtDate(weekEnd);
  const soonStr = fmtDate(soon);

  const nextByRecipient = new Map();
  const eventWhere = {
    recipientId: { [Op.in]: ids },
    status: { [Op.ne]: 'cancelled' },
    date: { [Op.between]: [todayStr, weekEndStr] }
  };
  if (teacherUserId) eventWhere.specialistUserId = teacherUserId;
  const events = await ScheduleEvent.findAll({
    where: eventWhere,
    attributes: ['recipientId', 'date'],
    order: [['date', 'ASC']]
  });
  for (const ev of events) {
    const d = String(ev.date);
    const prev = nextByRecipient.get(ev.recipientId);
    if (!prev || d < prev) nextByRecipient.set(ev.recipientId, d);
  }

  const docByRecipient = new Map();
  const docs = await RecipientDoc.findAll({
    where: { recipientId: { [Op.in]: ids } },
    attributes: ['recipientId', 'mseValidDate', 'specialNote']
  });
  for (const doc of docs) {
    const cur = docByRecipient.get(doc.recipientId) || { mseValidDate: null, specialNote: '' };
    if (doc.mseValidDate) {
      const v = String(doc.mseValidDate);
      if (!cur.mseValidDate || v < cur.mseValidDate) cur.mseValidDate = v;
    }
    if (!cur.specialNote && doc.specialNote && String(doc.specialNote).trim()) {
      cur.specialNote = String(doc.specialNote).trim();
    }
    docByRecipient.set(doc.recipientId, cur);
  }

  return rows.map((r) => {
    const json = r.toJSON();
    const nextClassDate = nextByRecipient.get(r.id) || null;
    const doc = docByRecipient.get(r.id) || { mseValidDate: null, specialNote: '' };
    json.attendsToday = nextClassDate === todayStr;
    json.attendsTomorrow = nextClassDate === tomorrowStr;
    json.attendsThisWeek = !!nextClassDate;
    json.nextClassDate = nextClassDate;
    json.docExpiring = !!doc.mseValidDate && doc.mseValidDate <= soonStr;
    json.docExpiryDate = doc.mseValidDate || null;
    json.attentionNote = doc.specialNote || null;
    return json;
  });
}

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const diagnosis = req.query.diagnosis;
    const groupId = req.query.groupId ? parseInt(req.query.groupId) : undefined;

    const where = {};
    if (search) {
      where[Op.or] = [
        { lastName: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { middleName: { [Op.like]: `%${search}%` } }
      ];
    }
    if (diagnosis && diagnosis !== 'all') where.diagnosis = diagnosisWhere(diagnosis);
    if (groupId) where.groupId = groupId;

    const teacherUserId = req.user.role === 'teacher' ? req.user.id : null;
    if (teacherUserId) {
      const myEvents = await ScheduleEvent.findAll({
        where: { specialistUserId: teacherUserId, status: { [Op.ne]: 'cancelled' } },
        attributes: ['recipientId']
      });
      const myRecipientIds = [...new Set(
        myEvents.map((e) => e.recipientId).filter((v) => v != null)
      )];
      if (!myRecipientIds.length) {
        return res.json({ data: [], total: 0, page, limit, totalPages: 0 });
      }
      where.id = where.id ? { [Op.and]: [where.id, { [Op.in]: myRecipientIds }] } : { [Op.in]: myRecipientIds };
    }

    const { count, rows } = await Recipient.findAndCountAll({
      where,
      limit,
      offset,
      include: listInclude,
      order: [['id', 'DESC']]
    });

    const data = await enrichRecipients(rows, teacherUserId);

    res.json({ data, total: count, page, limit, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/access/options', authMiddleware, (req, res) => {
  const fields = {};
  for (const [scope, map] of Object.entries(CATEGORY_OF)) {
    fields[scope] = Object.fromEntries(map);
  }
  res.json({
    categories: CATEGORIES.map((code) => ({ code, label: CATEGORY_LABELS[code] })),
    reasons: REASON_CODES,
    grantMinutes: Math.round(GRANT_MS / 60000),
    fields
  });
});

const DRAFT_EDIT_ROLES = ['admin', 'employee'];
const INTAKE_ROLES = ['admin', 'employee'];
const DRAFT_LIST_ROLES = ['admin', 'employee'];

const MAX_DRAFT_PAYLOAD = 100 * 1024;

const personLabel = (u) =>
  ([u?.lastName, u?.firstName].filter(Boolean).join(' ').trim() || u?.fullName || u?.email || '')
    .slice(0, 150);

const trimStr = (v) => (typeof v === 'string' ? v.trim() : '');

function validateDraftPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'Черновик пуст или имеет неверный формат';
  }
  let size;
  try {
    size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
  } catch (e) {
    return 'Черновик не удалось разобрать';
  }
  if (size > MAX_DRAFT_PAYLOAD) return 'Черновик слишком велик';
  return null;
}

function draftColumns(payload) {
  const birth = trimStr(payload.rBirth);
  return {
    lastName: trimStr(payload.rLast).slice(0, 50) || null,
    firstName: trimStr(payload.rFirst).slice(0, 50) || null,
    middleName: trimStr(payload.rMid).slice(0, 50) || null,
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(birth) ? birth : null,
    repName: [trimStr(payload.lrLast), trimStr(payload.lrFirst), trimStr(payload.lrMid)]
      .filter(Boolean).join(' ').slice(0, 150) || null
  };
}

async function draftFileCounts(draftIds) {
  const counts = new Map(draftIds.map((id) => [id, 0]));
  if (!draftIds.length) return counts;
  const rows = await RecipientDraftScan.findAll({
    where: { draftId: { [Op.in]: draftIds } },
    attributes: ['id', 'draftId']
  });
  for (const r of rows) counts.set(r.draftId, (counts.get(r.draftId) || 0) + 1);
  return counts;
}

function draftBrief(d, fileCount) {
  return {
    id: d.id,
    lastName: d.lastName,
    firstName: d.firstName,
    middleName: d.middleName,
    birthDate: d.birthDate,
    repName: d.repName,
    fileCount,
    createdBy: d.createdBy,
    createdByName: d.createdByName,
    updatedBy: d.updatedBy,
    updatedByName: d.updatedByName,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    summary: summarizeDraft(d.payload, fileCount)
  };
}

const canTouchDraft = (user, draft) =>
  DRAFT_LIST_ROLES.includes(user.role) || draft.createdBy === user.id;

router.get('/drafts', authMiddleware, roleMiddleware(...DRAFT_LIST_ROLES), async (req, res, next) => {
  try {
    const search = trimStr(req.query.search);
    const where = {};
    if (search) {
      where[Op.or] = [
        { lastName: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { middleName: { [Op.like]: `%${search}%` } },
        { repName: { [Op.like]: `%${search}%` } }
      ];
    }

    const rows = await RecipientDraft.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      limit: 200
    });
    const counts = await draftFileCounts(rows.map((r) => r.id));

    res.json({ data: rows.map((r) => draftBrief(r, counts.get(r.id) || 0)), total: rows.length });
  } catch (err) {
    next(err);
  }
});

router.get('/drafts/:draftId', authMiddleware, roleMiddleware(...DRAFT_EDIT_ROLES), async (req, res, next) => {
  try {
    const draft = await RecipientDraft.findByPk(req.params.draftId);
    if (!draft) return res.status(404).json({ message: 'Черновик не найден' });
    if (!canTouchDraft(req.user, draft)) {
      return res.status(403).json({ message: 'Это чужой черновик' });
    }

    const scans = await RecipientDraftScan.findAll({
      where: { draftId: draft.id },
      attributes: { exclude: ['fileData'] },
      order: [['id', 'ASC']]
    });

    if (draft.createdBy !== req.user.id) {
      await logAccess(req, {
        recipientId: null,
        category: 'passport',
        action: 'view',
        reasonText: `Черновик #${draft.id} — продолжение заполнения`
      });
    }

    res.json({
      ...draftBrief(draft, scans.length),
      payload: draft.payload,
      scans: scans.map((s) => ({
        id: s.id,
        docKey: s.docKey,
        originalName: s.originalName,
        mimeType: s.mimeType,
        sizeBytes: Number(s.sizeBytes) || 0
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.post('/drafts', authMiddleware, roleMiddleware(...DRAFT_EDIT_ROLES), async (req, res, next) => {
  try {
    const payload = req.body?.payload;
    const problem = validateDraftPayload(payload);
    if (problem) return res.status(400).json({ message: problem });

    const now = new Date();
    const who = personLabel(req.user);
    const draft = await RecipientDraft.create({
      ...draftColumns(payload),
      payload,
      createdBy: req.user.id,
      createdByName: who,
      updatedBy: req.user.id,
      updatedByName: who,
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json(draftBrief(draft, 0));
  } catch (err) {
    next(err);
  }
});

router.put('/drafts/:draftId', authMiddleware, roleMiddleware(...DRAFT_EDIT_ROLES), async (req, res, next) => {
  try {
    const draft = await RecipientDraft.findByPk(req.params.draftId);
    if (!draft) return res.status(404).json({ message: 'Черновик не найден' });
    if (!canTouchDraft(req.user, draft)) {
      return res.status(403).json({ message: 'Это чужой черновик' });
    }

    const payload = req.body?.payload;
    const problem = validateDraftPayload(payload);
    if (problem) return res.status(400).json({ message: problem });

    await draft.update({
      ...draftColumns(payload),
      payload,
      updatedBy: req.user.id,
      updatedByName: personLabel(req.user),
      updatedAt: new Date()
    });

    const fileCount = await RecipientDraftScan.count({ where: { draftId: draft.id } });
    res.json(draftBrief(draft, fileCount));
  } catch (err) {
    next(err);
  }
});

router.delete('/drafts/:draftId', authMiddleware, roleMiddleware(...DRAFT_EDIT_ROLES), async (req, res, next) => {
  try {
    const draft = await RecipientDraft.findByPk(req.params.draftId, { attributes: ['id', 'createdBy'] });
    if (!draft) return res.status(404).json({ message: 'Черновик не найден' });
    if (!canTouchDraft(req.user, draft)) {
      return res.status(403).json({ message: 'Это чужой черновик' });
    }

    await draft.destroy();
    res.json({ message: 'Черновик удалён' });
  } catch (err) {
    next(err);
  }
});

router.post('/drafts/:draftId/scans', authMiddleware, roleMiddleware(...DRAFT_EDIT_ROLES), async (req, res, next) => {
  try {
    const draft = await RecipientDraft.findByPk(req.params.draftId, { attributes: ['id', 'createdBy'] });
    if (!draft) return res.status(404).json({ message: 'Черновик не найден' });
    if (!canTouchDraft(req.user, draft)) {
      return res.status(403).json({ message: 'Это чужой черновик' });
    }

    const { docKey, originalName, mimeType, base64 } = req.body || {};
    if (!trimStr(docKey) || !base64) {
      return res.status(400).json({ message: 'Не передан файл или его тип' });
    }

    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) return res.status(400).json({ message: 'Файл пустой' });

    await RecipientDraftScan.destroy({ where: { draftId: draft.id, docKey: trimStr(docKey) } });
    const row = await RecipientDraftScan.create({
      draftId: draft.id,
      docKey: trimStr(docKey).slice(0, 50),
      originalName: String(originalName || 'файл').slice(0, 255),
      mimeType: String(mimeType || 'application/octet-stream').slice(0, 100),
      sizeBytes: buffer.length,
      fileData: buffer,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    });

    res.status(201).json({ id: row.id, docKey: row.docKey, sizeBytes: buffer.length });
  } catch (err) {
    next(err);
  }
});

router.delete('/drafts/:draftId/scans/:docKey', authMiddleware, roleMiddleware(...DRAFT_EDIT_ROLES), async (req, res, next) => {
  try {
    const draft = await RecipientDraft.findByPk(req.params.draftId, { attributes: ['id', 'createdBy'] });
    if (!draft) return res.status(404).json({ message: 'Черновик не найден' });
    if (!canTouchDraft(req.user, draft)) {
      return res.status(403).json({ message: 'Это чужой черновик' });
    }

    const removed = await RecipientDraftScan.destroy({
      where: { draftId: draft.id, docKey: String(req.params.docKey).slice(0, 50) }
    });
    res.json({ removed });
  } catch (err) {
    next(err);
  }
});

router.get('/drafts/:draftId/scans/:scanId/file', authMiddleware, roleMiddleware(...DRAFT_EDIT_ROLES), async (req, res, next) => {
  try {
    const draft = await RecipientDraft.findByPk(req.params.draftId, { attributes: ['id', 'createdBy'] });
    if (!draft) return res.status(404).json({ message: 'Черновик не найден' });
    if (!canTouchDraft(req.user, draft)) {
      return res.status(403).json({ message: 'Это чужой черновик' });
    }

    const scan = await RecipientDraftScan.findOne({
      where: { id: req.params.scanId, draftId: draft.id }
    });
    if (!scan || !scan.fileData) return res.status(404).json({ message: 'Файл не найден' });

    if (draft.createdBy !== req.user.id) {
      await logAccess(req, {
        recipientId: null,
        category: 'scans',
        action: 'download',
        scanId: scan.id,
        reasonText: `Черновик #${draft.id} — продолжение заполнения`
      });
    }

    res.setHeader('Content-Type', scan.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(scan.originalName)}"`);
    res.send(scan.fileData);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authMiddleware, loadGrants, async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id, { include: detailInclude });
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const payload = redactRecipient(recipient, req);

    payload.repSharedWith = recipient.representativeId
      ? await Recipient.count({
          where: { representativeId: recipient.representativeId, id: { [Op.ne]: recipient.id } }
        })
      : 0;

    payload.audit = await buildCardAudit(recipient);
    payload.authorWindowUntil = authorWindowUntil(req, recipient.id);

    if (isAdmin(req.user)) {
      await logAccess(req, { recipientId: recipient.id, category: 'passport', action: 'view' });
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/agenda', authMiddleware, async (req, res, next) => {
  try {
    const events = await ScheduleEvent.findAll({
      where: { recipientId: req.params.id, status: { [Op.ne]: 'cancelled' } },
      include: [
        { model: User, as: 'specialist', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'fullName'] },
        { model: Direction, as: 'direction', attributes: ['id', 'name'] }
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/readiness', authMiddleware, async (req, res, next) => {
  try {
    const readiness = await getRecipientReadiness(req.params.id);
    if (!readiness) return res.status(404).json({ message: 'Реабилитант не найден' });
    res.json(readiness);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/enrollment', authMiddleware, async (req, res, next) => {
  try {
    const state = await getEnrollmentState(req.params.id);
    if (!state) return res.status(404).json({ message: 'Реабилитант не найден' });
    res.json(state);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/enrollment/:docKey/file', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res, next) => {
  try {
    const { buffer, filename, contentType } = await generateEnrollmentDocument(req.params.id, req.params.docKey);

    await logAccess(req, {
      recipientId: Number(req.params.id),
      category: 'passport',
      action: 'download',
      reasonCode: 'contract',
      reasonText: `Документ на зачисление: ${req.params.docKey}`
    });

    const ext = filename.split('.').pop();
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="document.${ext}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.send(buffer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
});

const onlyDigits = (s) => (s || '').replace(/\D/g, '');

class IntakeError extends Error {}

const normName = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const normDoc  = (s) => String(s || '').trim().replace(/[\s-]/g, '').toUpperCase();

const briefRecipient = (r) => ({
  id: r.id,
  lastName: r.lastName,
  firstName: r.firstName,
  middleName: r.middleName,
  birthDate: r.birthDate,
  status: r.status,
  groupName: r.group?.groupName || null
});

async function findNameMatches({ firstName, lastName, middleName, birthDate }, excludeId) {
  if (!birthDate || !normName(firstName) || !normName(lastName)) return [];

  const where = { birthDate };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const rows = await Recipient.findAll({ where, include: [groupInclude], limit: 50 });
  const mid = normName(middleName);

  return rows.filter((r) =>
    normName(r.lastName) === normName(lastName) &&
    normName(r.firstName) === normName(firstName) &&
    !(mid && normName(r.middleName) && normName(r.middleName) !== mid)
  );
}

async function findDocMatch({ docSeries, docNumber }, excludeId) {
  const num = normDoc(docNumber);
  const ser = normDoc(docSeries);
  if (!num || !ser) return null;

  const rows = await RecipientDoc.findAll({
    where: { docNumber: num },
    include: [{ model: Recipient, as: 'recipient', include: [groupInclude] }],
    limit: 50
  });

  const hit = rows.find((d) =>
    normDoc(d.docSeries) === ser && (!excludeId || d.recipientId !== excludeId)
  );
  if (!hit) return null;

  return {
    ...(hit.recipient ? briefRecipient(hit.recipient) : { id: hit.recipientId }),
    docType: hit.docType,
    docSeries: hit.docSeries,
    docNumber: hit.docNumber
  };
}

router.post('/check-duplicate', authMiddleware, roleMiddleware(...INTAKE_ROLES), async (req, res, next) => {
  try {
    const { firstName, middleName, lastName, birthDate, docSeries, docNumber, excludeId } = req.body || {};
    const skip = Number(excludeId) || null;

    const [nameRows, docMatch] = await Promise.all([
      findNameMatches({ firstName, middleName, lastName, birthDate }, skip),
      findDocMatch({ docSeries, docNumber }, skip)
    ]);

    res.json({ nameMatches: nameRows.map(briefRecipient), docMatch });
  } catch (err) {
    next(err);
  }
});

router.post('/family-status-lookup', authMiddleware, roleMiddleware(...INTAKE_ROLES), async (req, res, next) => {
  try {
    const series = String(req.body?.passportSeries || '').trim();
    const number = String(req.body?.passportNumber || '').trim();
    if (series.length !== 4 || number.length !== 6) return res.json({ found: false, statuses: [] });

    const rep = await LegalRepresentative.findOne({
      where: { passportSeries: series, passportNumber: number },
      include: [{
        model: FamilyStatus, as: 'familyStatuses',
        attributes: ['code'], through: { attributes: [] }
      }]
    });
    if (!rep) return res.json({ found: false, statuses: [] });

    res.json({
      found: true,
      repName: [rep.lastName, rep.firstName].filter(Boolean).join(' ').trim(),
      statuses: (rep.familyStatuses || []).map((s) => s.code)
    });
  } catch (err) {
    next(err);
  }
});

async function applyFamilyStatuses(repId, codes, userId, t) {
  const wanted = [...new Set((Array.isArray(codes) ? codes : [])
    .map((c) => String(c || '').trim())
    .filter(Boolean))];
  if (!wanted.length) return;

  const rows = await FamilyStatus.findAll({
    where: { code: { [Op.in]: wanted }, isActive: true },
    transaction: t
  });
  if (!rows.length) return;

  const seenGroups = new Set();
  const keep = [];
  for (const row of rows.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)) {
    if (row.groupKey) {
      if (seenGroups.has(row.groupKey)) continue;
      seenGroups.add(row.groupKey);
    }
    keep.push(row.id);
  }

  await LegalRepFamilyStatus.destroy({ where: { representativeId: repId }, transaction: t });
  const now = new Date();
  await LegalRepFamilyStatus.bulkCreate(
    keep.map((statusId) => ({ representativeId: repId, statusId, setBy: userId || null, setAt: now })),
    { transaction: t }
  );
}

router.post('/intake', authMiddleware, roleMiddleware(...INTAKE_ROLES), async (req, res, next) => {
  const {
    recipient = {}, doc = {},
    nozologyClasses = [], crg = {}, groupId, familyStatuses = []
  } = req.body;

  const representative = req.body.representative || {};
  const hasRep = req.body.representative != null;
  const contactPhone = hasRep
    ? (representative.telephone || '')
    : (req.body.telephone || recipient.telephone || '');

  if (!recipient.firstName || !recipient.lastName) {
    return res.status(400).json({ message: 'Не заполнено ФИО реабилитанта' });
  }

  try {
    if (doc.snils) {
      const dup = await RecipientDoc.findOne({ where: { snils: doc.snils } });
      if (dup) {
        return res.status(409).json({ message: `Реабилитант с таким СНИЛС (${doc.snils}) уже зарегистрирован в системе` });
      }
    }

    const docDup = await findDocMatch({ docSeries: doc.docSeries, docNumber: doc.docNumber });
    if (docDup) {
      const fio = [docDup.lastName, docDup.firstName, docDup.middleName].filter(Boolean).join(' ');
      return res.status(409).json({
        message: `Документ ${doc.docSeries} ${doc.docNumber} уже зарегистрирован` +
          (fio ? ` за реабилитантом ${fio}` : '') +
          '. Один документ не может принадлежать двум людям.'
      });
    }

    const result = await sequelize.transaction(async (t) => {

      if (!nozologyClasses.length) {
        throw new IntakeError('Не выбран класс нозологии (шаг 2)');
      }
      const noz = await Nozology.findOne({
        where: { class: { [Op.in]: nozologyClasses } }, transaction: t
      });
      if (!noz) {
        throw new IntakeError(`Класс нозологии не найден в справочнике: ${nozologyClasses.join(', ')}`);
      }
      const nozId = noz.id;

      if (!crg.code) {
        throw new IntakeError('Не выбрана целевая реабилитационная группа (ЦРГ, шаг 2)');
      }
      const crgRaw = String(crg.code).trim();
      const crgNum = crgRaw.replace(/^ЦРГ\s*/i, '').trim();
      const crgRow = await CRG.findOne({
        where: { code: { [Op.in]: [crgRaw, `ЦРГ ${crgNum}`] }, child: !!crg.child },
        transaction: t
      });
      if (!crgRow) {
        const who = crg.child ? 'для детей' : 'для взрослых';
        throw new IntakeError(`ЦРГ ${crgNum} (${who}) не найдена в справочнике`);
      }
      const crgId = crgRow.id;

      const uniqSuffix = crypto.randomBytes(5).toString('hex');

      const repPhone = representative.telephone || '';
      const repSeries = String(representative.passportSeries || '').trim();
      const repNumber = String(representative.passportNumber || '').trim();

      let rep = hasRep && repSeries && repNumber
        ? await LegalRepresentative.findOne({
            where: { passportSeries: repSeries, passportNumber: repNumber },
            transaction: t
          })
        : null;

      if (!hasRep) {
        rep = null;
      } else if (rep) {
        const fresh = {};
        const carry = (field, value) => {
          const v = typeof value === 'string' ? value.trim() : value;
          if (v !== '' && v != null && v !== rep[field]) fresh[field] = v;
        };
        carry('firstName', representative.firstName);
        carry('middleName', representative.middleName);
        carry('lastName', representative.lastName);
        carry('relation', representative.relation);
        carry('telephone', repPhone);
        carry('passportIssuer', representative.passportIssuer);
        carry('passportIssuerDate', representative.passportIssuerDate);
        carry('passportDeptCode', representative.passportDeptCode);
        carry('passportReg', representative.passportReg);
        if (Object.keys(fresh).length) await rep.update(fresh, { transaction: t });
      } else {
        rep = await LegalRepresentative.create({
          firstName: representative.firstName || '',
          middleName: representative.middleName || '',
          lastName: representative.lastName || '',
          relation: representative.relation || null,
          telephone: repPhone,
          email: `lr-${onlyDigits(repPhone) || 'na'}-${uniqSuffix}@intake.local`,
          passportSeries: repSeries,
          passportNumber: repNumber,
          passportIssuer: representative.passportIssuer || '',
          passportIssuerDate: representative.passportIssuerDate || null,
          passportDeptCode: representative.passportDeptCode || '',
          passportReg: representative.passportReg || ''
        }, { transaction: t });
      }

      if (rep) await applyFamilyStatuses(rep.id, familyStatuses, req.user?.id, t);

      const recEmail = `rcp-${onlyDigits(doc.snils) || 'na'}-${uniqSuffix}@intake.local`;
      const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      const user = await User.create({ email: recEmail, passwordHash: tempHash, role: 'recipient' }, { transaction: t });

      const created = await Recipient.create({
        userId: user.id,
        representativeId: rep ? rep.id : null,
        firstName: recipient.firstName,
        middleName: recipient.middleName || '',
        lastName: recipient.lastName,
        birthDate: recipient.birthDate || null,
        email: recEmail,
        telephone: contactPhone,
        photo: '',
        status: recipient.status || 'draft',
        diagnosis: recipient.diagnosis || '',
        nozology: nozId,
        groupId: groupId || null,
        CRGMain: crgId,
        createdAt: new Date(),
        createdBy: req.user?.id ?? null
      }, { transaction: t });

      const mseIndefinite = doc.mseIndefinite === true || doc.mseIndefinite === 'true';
      const docReady = doc.snils && doc.docSeries && doc.docNumber && doc.docIssuer &&
        doc.docIssuerDate && doc.mseIssueDate && (doc.mseValidDate || mseIndefinite) &&
        doc.regAddress && doc.educationPlace;
      if (docReady) {
        await RecipientDoc.create({
          recipientId: created.id,
          docType: doc.docType === 'passport' ? 'Паспорт' : 'Свидетельство',
          docSeries: doc.docSeries,
          docNumber: doc.docNumber,
          docIssuer: doc.docIssuer,
          docIssuerDate: doc.docIssuerDate,
          snils: doc.snils,
          mseIssueDate: doc.mseIssueDate,
          mseValidDate: mseIndefinite ? null : doc.mseValidDate,
          mseIndefinite,
          regAddress: doc.regAddress,
          factAddress: doc.factSameReg ? doc.regAddress : (doc.factAddress || doc.regAddress),
          factSameReg: !!doc.factSameReg,
          district: doc.district || null,
          area: doc.area || null,
          educationPlace: doc.educationPlace,
          specialNote: doc.specialNote || ''
        }, { transaction: t });
      }

      return created.id;
    });

    for (const category of CATEGORIES) {
      await logAccess(req, {
        recipientId: result,
        category,
        action: 'view',
        reasonCode: 'author',
        reasonText: 'Карточка только что заведена этим сотрудником — полный доступ на 30 минут'
      });
    }

    const full = await Recipient.findByPk(result, { include: detailInclude });
    res.status(201).json(full);
  } catch (err) {
    if (err instanceof IntakeError) {
      return res.status(400).json({ message: err.message });
    }
    if (err?.name === 'SequelizeUniqueConstraintError') {
      const path = err?.errors?.[0]?.path || '';
      let msg = `Запись с такими данными уже существует (${path || 'дубликат'})`;
      if (/snils/i.test(path)) {
        msg = 'Реабилитант с таким СНИЛС уже зарегистрирован в системе';
      } else if (/le_telephone/i.test(path)) {
        msg = 'Этот номер телефона уже записан за другим законным представителем. ' +
          'Если это тот же человек — проверьте серию и номер его паспорта: ' +
          'по паспорту представитель находится и переиспользуется автоматически.';
      }
      return res.status(409).json({ message: msg });
    }
    next(err);
  }
});

router.post('/', authMiddleware, roleMiddleware(...INTAKE_ROLES), async (req, res, next) => {
  try {
    const data = pickFields(req.body);
    const recipient = await Recipient.create({
      ...data,
      createdAt: new Date(),
      createdBy: req.user?.id ?? null
    });

    if (Array.isArray(req.body.secondaryCRG) && req.body.secondaryCRG.length) {
      await recipient.setSecondaryCRG(req.body.secondaryCRG);
    }

    const fullRecipient = await Recipient.findByPk(recipient.id, { include: detailInclude });
    res.status(201).json(fullRecipient);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    await recipient.update(pickFields(req.body));

    if (Array.isArray(req.body.secondaryCRG)) {
      await recipient.setSecondaryCRG(req.body.secondaryCRG);
    }

    const updated = await Recipient.findByPk(recipient.id, { include: detailInclude });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const CARD_RECIPIENT_FIELDS = [
  'firstName', 'middleName', 'lastName', 'birthDate', 'telephone', 'email',
  'status', 'disableGroup', 'diagnosis', 'nozology', 'groupId', 'CRGMain'
];
const CARD_DOC_FIELDS = [
  'docType', 'docSeries', 'docNumber', 'docIssuer', 'docIssuerDate', 'snils',
  'mseIssueDate', 'mseValidDate', 'mseIndefinite',
  'regAddress', 'factAddress', 'factSameReg', 'district', 'area',
  'educationPlace', 'specialNote'
];
const CARD_REP_FIELDS = [
  'firstName', 'middleName', 'lastName', 'relation', 'telephone', 'email',
  'passportSeries', 'passportNumber', 'passportIssuer', 'passportIssuerDate',
  'passportDeptCode', 'passportReg'
];

const DOC_REQUIRED = [
  'docSeries', 'docNumber', 'docIssuer', 'docIssuerDate',
  'snils', 'mseIssueDate', 'regAddress', 'educationPlace'
];

const DOC_FIELD_LABELS = {
  docType: 'тип документа',
  docSeries: 'серия документа',
  docNumber: 'номер документа',
  docIssuer: 'кем выдан документ',
  docIssuerDate: 'дата выдачи документа',
  snils: 'СНИЛС',
  mseIssueDate: 'дата выдачи справки МСЭ',
  mseValidDate: 'срок действия справки МСЭ',
  regAddress: 'адрес регистрации',
  factAddress: 'адрес проживания',
  educationPlace: 'место обучения'
};

const DATE_FIELDS = new Set(['birthDate', 'docIssuerDate', 'mseIssueDate', 'mseValidDate', 'passportIssuerDate']);
const BOOL_FIELDS = new Set(['mseIndefinite', 'factSameReg']);
const INT_FIELDS = new Set(['nozology', 'groupId', 'CRGMain']);
const ENUM_VALUES = {
  docType: ['Свидетельство', 'Паспорт'],
  status: ['draft', 'active', 'archived'],
  disableGroup: ['Ребенок-инвалид', 'I группа', 'II группа', 'III группа', 'Нет']
};

const normalizeField = (field, raw) => {
  if (DATE_FIELDS.has(field)) {
    const s = String(raw ?? '').slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  }
  if (BOOL_FIELDS.has(field)) return raw === true || raw === 'true';
  if (INT_FIELDS.has(field)) {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return String(raw ?? '').trim();
};

const sameValue = (prev, next) => {
  if (typeof next === 'boolean') return !!prev === next;
  if (prev == null && next == null) return true;
  return String(prev ?? '').slice(0, 500) === String(next ?? '').slice(0, 500);
};

const NEVER_EMPTY = new Set([
  'firstName', 'lastName', 'telephone', 'email', 'nozology', 'CRGMain',
  'docSeries', 'docNumber', 'docIssuer', 'docIssuerDate', 'snils',
  'mseIssueDate', 'regAddress', 'factAddress', 'educationPlace',
  'passportSeries', 'passportNumber', 'passportIssuer', 'passportDeptCode', 'passportReg'
]);

const FIXED_FORMATS = {
  snils: [/^\d{3}-\d{3}-\d{3} \d{2}$/, 'СНИЛС записывается как 000-000-000 00'],
  passportSeries: [/^\d{4}$/, 'серия паспорта — ровно 4 цифры'],
  passportNumber: [/^\d{6}$/, 'номер паспорта — ровно 6 цифр'],
  passportDeptCode: [/^\d{3}-\d{3}$/, 'код подразделения записывается как 000-000']
};

const CARD_FIELD_LABELS = {
  firstName: 'имя', middleName: 'отчество', lastName: 'фамилия',
  birthDate: 'дата рождения', telephone: 'телефон', email: 'e-mail',
  status: 'статус карточки', disableGroup: 'группа инвалидности',
  diagnosis: 'диагноз', nozology: 'нозология', groupId: 'группа', CRGMain: 'КРГ',
  relation: 'степень родства', passportSeries: 'серия паспорта',
  passportNumber: 'номер паспорта', passportIssuer: 'кем выдан паспорт',
  passportIssuerDate: 'дата выдачи паспорта', passportDeptCode: 'код подразделения',
  passportReg: 'адрес регистрации по паспорту',
  district: 'округ проживания', area: 'район', factSameReg: 'совпадение адресов',
  mseIndefinite: 'бессрочность МСЭ',
  ...DOC_FIELD_LABELS
};

const collectPatch = (req, recipientId, target, allowed, categoryOf, body, scope = '') => {
  const patch = {};
  const lockedTouched = [];
  const rejected = [];
  const name = (field) => scope + (CARD_FIELD_LABELS[field] || field);
  if (!target || !body || typeof body !== 'object') return { patch, lockedTouched, rejected };

  for (const field of allowed) {
    if (body[field] === undefined) continue;

    const category = categoryOf.get(field);
    if (category && !hasGrant(req, recipientId, category)) {
      if (String(body[field] ?? '').trim()) lockedTouched.push(category);
      continue;
    }

    const next = normalizeField(field, body[field]);
    if (ENUM_VALUES[field] && !ENUM_VALUES[field].includes(next)) continue;

    if (NEVER_EMPTY.has(field) && (next == null || next === '')) {
      rejected.push(`${name(field)} — это поле нельзя оставить пустым`);
      continue;
    }

    const format = FIXED_FORMATS[field];
    if (format && next && !format[0].test(next)) {
      rejected.push(`${name(field)}: ${format[1]}`);
      continue;
    }

    const prev = DATE_FIELDS.has(field)
      ? (target.get(field) == null ? null : String(target.get(field)).slice(0, 10))
      : target.get(field);
    if (!sameValue(prev, next)) patch[field] = next;
  }

  return { patch, lockedTouched, rejected };
};

router.patch('/:id/card', authMiddleware, roleMiddleware('admin', 'employee'), loadGrants, async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const reason = String(req.body?.reason ?? '').trim();
    if (reason.length < 3) {
      return res.status(400).json({
        message: 'Укажите причину изменения (обязательное поле, не менее 3 символов)',
        field: 'reason'
      });
    }

    const doc = await RecipientDoc.findOne({ where: { recipientId: recipient.id } });
    const rep = recipient.representativeId
      ? await LegalRepresentative.findByPk(recipient.representativeId)
      : null;

    const r = collectPatch(req, recipient.id, recipient, CARD_RECIPIENT_FIELDS, CATEGORY_OF.recipient, req.body);
    const d = collectPatch(req, recipient.id, doc, CARD_DOC_FIELDS, CATEGORY_OF.doc, req.body);
    const p = collectPatch(req, recipient.id, rep, CARD_REP_FIELDS, CATEGORY_OF.rep, req.body?.representative, 'у представителя ');

    if (doc) {
      const sameReg = 'factSameReg' in d.patch ? d.patch.factSameReg : !!doc.factSameReg;
      if (sameReg) {
        const reg = 'regAddress' in d.patch ? d.patch.regAddress : doc.regAddress;
        d.rejected = d.rejected.filter((m) => !m.startsWith('адрес проживания'));
        if (reg && reg !== doc.factAddress) d.patch.factAddress = reg;
        else delete d.patch.factAddress;
      }
    }

    const rejected = [...r.rejected, ...d.rejected, ...p.rejected];
    if (rejected.length) {
      return res.status(400).json({
        message: 'Проверьте заполнение: ' + rejected.join('; ') + '.',
        rejectedFields: rejected
      });
    }

    const locked = [...new Set([...r.lockedTouched, ...d.lockedTouched, ...p.lockedTouched])];
    if (locked.length) {
      return res.status(403).json({
        message: 'Сначала откройте доступ кнопкой «Показать»: ' +
          locked.map((c) => (CATEGORY_LABELS[c] || c).toLowerCase()).join(', ') +
          '. Править вслепую нельзя — прежнее значение не видно, и его легко затереть.',
        lockedCategories: locked
      });
    }

    let createdDoc = null;
    if (!doc) {
      const draft = {};
      for (const field of CARD_DOC_FIELDS) {
        if (req.body[field] === undefined) continue;
        const category = CATEGORY_OF.doc.get(field);
        if (category && !hasGrant(req, recipient.id, category)) continue;
        draft[field] = normalizeField(field, req.body[field]);
      }
      const filled = (v) => v != null && String(v).trim() !== '';
      const anyGiven = Object.values(draft).some(filled);
      if (anyGiven) {
        const missing = DOC_REQUIRED.filter((f) => !filled(draft[f]));
        if (!draft.mseIndefinite && !filled(draft.mseValidDate)) missing.push('mseValidDate');
        if (missing.length) {
          return res.status(400).json({
            message: 'Анкета этой карточки ещё не заведена, а для неё нужны все поля. ' +
              'Не заполнено: ' + missing.map((f) => DOC_FIELD_LABELS[f] || f).join(', ') + '.',
            missingFields: missing
          });
        }
        createdDoc = {
          ...draft,
          recipientId: recipient.id,
          docType: draft.docType || 'Свидетельство',
          factAddress: draft.factSameReg ? draft.regAddress : (draft.factAddress || draft.regAddress),
          mseValidDate: draft.mseIndefinite ? null : draft.mseValidDate,
          specialNote: draft.specialNote || ''
        };
      }
    }

    const changedFields = [
      ...Object.keys(r.patch),
      ...Object.keys(d.patch),
      ...Object.keys(p.patch).map((f) => 'representative.' + f),
      ...(createdDoc ? ['docs'] : [])
    ];
    if (!changedFields.length) {
      return res.status(400).json({ message: 'Данные карточки не изменились' });
    }

    const snapshot = {
      ...(doc ? doc.toJSON() : {}),
      firstName: recipient.firstName,
      middleName: recipient.middleName,
      lastName: recipient.lastName,
      birthDate: recipient.birthDate,
      telephone: recipient.telephone,
      email: recipient.email,
      status: recipient.status,
      disableGroup: recipient.disableGroup,
      diagnosis: recipient.diagnosis,
      nozology: recipient.nozology,
      groupId: recipient.groupId,
      CRGMain: recipient.CRGMain,
      representative: rep ? rep.toJSON() : null
    };

    await sequelize.transaction(async (t) => {
      await RecipientDocVersion.create({
        docId: doc ? doc.id : null,
        recipientId: recipient.id,
        snapshot,
        changedFields,
        reason,
        changedBy: req.user.id,
        changedAt: new Date()
      }, { transaction: t });

      if (Object.keys(r.patch).length) await recipient.update(r.patch, { transaction: t });
      if (Object.keys(d.patch).length) await doc.update(d.patch, { transaction: t });
      if (Object.keys(p.patch).length) await rep.update(p.patch, { transaction: t });
      if (createdDoc) await RecipientDoc.create(createdDoc, { transaction: t });
    });

    let repSharedWith = 0;
    if (Object.keys(p.patch).length) {
      repSharedWith = await Recipient.count({
        where: { representativeId: recipient.representativeId, id: { [Op.ne]: recipient.id } }
      });
    }

    const updated = await Recipient.findByPk(recipient.id, { include: detailInclude });
    const payload = redactRecipient(updated, req);
    payload.audit = await buildCardAudit(updated);
    payload.authorWindowUntil = authorWindowUntil(req, updated.id);
    res.json({ recipient: payload, changedFields, reason, repSharedWith });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      const path = err?.errors?.[0]?.path || '';
      let msg = `Такое значение уже занято другой записью (${path || 'дубликат'})`;
      if (/snils/i.test(path)) {
        msg = 'Этот СНИЛС уже записан за другим реабилитантом — проверьте номер';
      } else if (/telephone/i.test(path)) {
        msg = 'Этот номер телефона уже записан за другим законным представителем';
      } else if (/email/i.test(path)) {
        msg = 'Этот e-mail уже занят другой учётной записью';
      }
      return res.status(409).json({ message: msg });
    }
    next(err);
  }
});

router.put('/:id/attendance', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const raw = req.body?.status;
    const allowed = ['present', 'absent', 'left'];
    const status = raw == null || raw === '' ? null : String(raw);
    if (status !== null && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус посещения' });
    }

    await recipient.update({
      attendanceStatus: status,
      attendanceDate: status ? fmtDate(new Date()) : null
    });

    res.json({
      id: recipient.id,
      attendanceStatus: recipient.attendanceStatus,
      attendanceDate: recipient.attendanceDate
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const id = recipient.id;
    const sessionIds = (await DiagnosticSession.findAll({
      where: { recipientId: id }, attributes: ['id'], raw: true
    })).map((s) => s.id);

    await sequelize.transaction(async (t) => {
      await DiagnosticConclusion.destroy({
        where: sessionIds.length
          ? { [Op.or]: [{ recipientId: id }, { sessionId: { [Op.in]: sessionIds } }] }
          : { recipientId: id },
        transaction: t
      });
      await DiagnosticAssignment.destroy({
        where: sessionIds.length
          ? { [Op.or]: [{ recipientId: id }, { diagnosticSessionId: { [Op.in]: sessionIds } }] }
          : { recipientId: id },
        transaction: t
      });
      await DiagnosticSession.destroy({ where: { recipientId: id }, transaction: t });
      await ScheduleEvent.destroy({ where: { recipientId: id }, transaction: t });
      await AccessGrant.destroy({ where: { recipientId: id }, transaction: t });
      await CRGRecipientSec.destroy({ where: { idRecipient: id }, transaction: t });
      await RecipientDocVersion.destroy({ where: { recipientId: id }, transaction: t });
      await RecipientDoc.destroy({ where: { recipientId: id }, transaction: t });
      await RecipientScanDoc.destroy({ where: { recipId: id }, transaction: t });
      await ReResult.destroy({ where: { idRecipient: id }, transaction: t });
      await recipient.destroy({ transaction: t });
    });

    res.json({ message: 'Реабилитант удалён' });
  } catch (err) {
    next(err);
  }
});

const ENTITY_TYPES = ['rehabilitant', 'representative'];

router.post('/:id/scans', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const scans = Array.isArray(req.body.scans) ? req.body.scans : [];
    if (!scans.length) return res.status(400).json({ message: 'Нет файлов для сохранения' });

    const isUpdate = req.body.mode === 'update' || req.body.replace === true;

    const canReplace = req.user.role === 'admin' || req.user.role === 'employee';
    if (isUpdate && !canReplace) {
      return res.status(403).json({
        message: 'Заменять приложенные документы могут только сотрудник и администратор'
      });
    }

    const reason = String(req.body.reason ?? '').trim();
    if (isUpdate && reason.length < 3) {
      return res.status(400).json({
        message: 'Укажите причину обновления документов (обязательное поле, не менее 3 символов)',
        field: 'reason'
      });
    }

    const docTypes = await DocType.findAll();
    const codeToId = new Map(docTypes.map((d) => [d.code, d.id]));
    const codeToName = new Map(docTypes.map((d) => [d.code, d.name]));

    if (!canReplace) {
      if (scans.some((s) => String(s.docKey || '').startsWith('signed-'))) {
        return res.status(403).json({
          message: 'Загружать подписанные документы на зачисление могут только сотрудник и администратор'
        });
      }

      const requestedTypeIds = scans
        .map((s) => codeToId.get(s.docKey))
        .filter((v) => v !== undefined);
      const alreadyAttached = requestedTypeIds.length
        ? await RecipientScanDoc.count({
            where: { recipId: recipient.id, docType: { [Op.in]: requestedTypeIds }, isCurrent: true }
          })
        : 0;
      if (alreadyAttached > 0) {
        return res.status(403).json({
          message: 'Заменять приложенные документы могут только сотрудник и администратор'
        });
      }
    }

    const now = new Date();
    const created = [];
    const superseded = [];
    const asDate = (v) => {
      const s = String(v ?? '').slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
    };

    for (const scan of scans) {
      const { docKey, entityType, originalName, mimeType, base64 } = scan;
      if (!docKey || !base64) continue;

      const perpetual = scan.perpetual === true || scan.perpetual === 'true';

      const docTypeId = codeToId.get(docKey);
      if (!docTypeId) continue;

      const buffer = Buffer.from(base64, 'base64');
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
      const et = ENTITY_TYPES.includes(entityType) ? entityType : 'rehabilitant';

      const prev = await RecipientScanDoc.findOne({
        where: { recipId: recipient.id, docType: docTypeId, isCurrent: true },
        attributes: { exclude: ['fileData'] },
        order: [['id', 'DESC']]
      });

      const row = await RecipientScanDoc.create({
        entityType: et,
        recipId: recipient.id,
        represId: recipient.representativeId ?? null,
        docType: docTypeId,
        storageKey: `db://${checksum}`,
        originalName: buildScanFileName({
          recipientId: recipient.id,
          lastName: recipient.lastName,
          firstName: recipient.firstName,
          middleName: recipient.middleName,
          docTypeName: codeToName.get(docKey),
          originalName,
          uploadedAt: now
        }),
        mimeType: mimeType || 'application/octet-stream',
        sizeBytes: buffer.length,
        checksum_sha256: checksum,
        fileData: buffer,
        issuedAt: asDate(scan.issuedAt),
        validUntil: perpetual ? null : asDate(scan.validUntil),
        perpetual,
        uploadedBy: req.user.id,
        uploadedAt: now,
        updateReason: prev ? (reason || null) : null,
        replacesScanId: prev ? prev.id : null,
        isCurrent: true
      });
      created.push(row.id);

      if (prev) {
        await prev.update({ isCurrent: false });
        superseded.push(prev.id);
      }
    }

    res.status(201).json({ saved: created.length, ids: created, superseded });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/scans', authMiddleware, loadGrants, async (req, res, next) => {
  try {
    const includeArchived = req.query.all === '1' || req.query.all === 'true';
    const where = { recipId: req.params.id };
    if (!includeArchived) where.isCurrent = true;

    if (!hasGrant(req, Number(req.params.id), 'scans')) {
      await logAccess(req, { recipientId: Number(req.params.id), category: 'scans', action: 'denied' });
      return res.json({ locked: true, category: 'scans', scans: [] });
    }

    const scans = await RecipientScanDoc.findAll({
      where,
      attributes: { exclude: ['fileData'] },
      include: [
        { model: DocType, as: 'docTypeRef' },
        { model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'email', 'fullName'] }
      ],
      order: [['docType', 'ASC'], ['id', 'DESC']]
    });
    if (isAdmin(req.user)) {
      await logAccess(req, { recipientId: Number(req.params.id), category: 'scans', action: 'view' });
    }
    res.json({ locked: false, category: 'scans', scans });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/scans/:scanId/file', authMiddleware, loadGrants, async (req, res, next) => {
  try {
    if (!hasGrant(req, Number(req.params.id), 'scans')) {
      await logAccess(req, {
        recipientId: Number(req.params.id), category: 'scans',
        action: 'denied', scanId: Number(req.params.scanId)
      });
      return res.status(403).json({ message: 'Нет доступа к сканам. Запросите доступ с указанием причины.' });
    }

    const scan = await RecipientScanDoc.findOne({
      where: { id: req.params.scanId, recipId: req.params.id }
    });
    if (!scan || !scan.fileData) return res.status(404).json({ message: 'Файл не найден' });

    await logAccess(req, {
      recipientId: Number(req.params.id), category: 'scans',
      action: 'download', scanId: scan.id
    });

    res.setHeader('Content-Type', scan.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(scan.originalName)}"`);
    res.send(scan.fileData);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/access', authMiddleware, async (req, res, next) => {
  try {
    const recipientId = Number(req.params.id);
    const { category, reasonCode, reasonText } = req.body || {};

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Неизвестная категория данных' });
    }

    const recipient = await Recipient.findByPk(recipientId, { attributes: ['id'] });
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    if (isAdmin(req.user)) {
      await logAccess(req, { recipientId, category, action: 'view' });
      return res.json({ ok: true, category, expiresAt: null, admin: true });
    }

    const problem = validateReason(reasonCode, reasonText);
    if (problem) {
      await logAccess(req, { recipientId, category, action: 'denied', reasonCode, reasonText });
      return res.status(400).json({ message: problem, field: 'reason' });
    }

    const expiresAt = await grantAccess(req, recipientId, category, reasonCode);
    await logAccess(req, {
      recipientId, category, action: 'view',
      reasonCode, reasonText: String(reasonText ?? '').trim() || null
    });

    res.json({ ok: true, category, expiresAt: new Date(expiresAt).toISOString() });
  } catch (err) {
    next(err);
  }
});

export default router;

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
import { readScan, sendScanFile, sniffMime, ALLOWED_SCAN_MIME, MAX_SCANS_PER_REQUEST } from '../services/fileGuard.js';
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

const ROLE_LABELS = {
  admin: 'Администратор',
  employee: 'Сотрудник',
  teacher: 'Педагог',
  recipient: 'Реабилитант'
};

const personRole = (u) => (u?.role ? (ROLE_LABELS[u.role] || null) : null);

const AUDIT_AUTHOR = { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] };
const AUDIT_HISTORY_LIMIT = 10;

const versionEntry = (v) => ({
  id: v.id,
  changedAt: v.changedAt,
  changedBy: v.changedBy || null,
  changedByName: personName(v.author),
  changedByRole: personRole(v.author),
  reason: v.reason || null,
  fields: Array.isArray(v.changedFields) ? v.changedFields : []
});

async function buildCardAudit(recipient) {
  const [creator, history, editsCount] = await Promise.all([
    recipient.createdBy
      ? User.findByPk(recipient.createdBy, { attributes: ['id', 'firstName', 'lastName', 'email', 'role'] })
      : null,
    RecipientDocVersion.findAll({
      where: { recipientId: recipient.id },
      attributes: ['id', 'changedAt', 'changedBy', 'reason', 'changedFields'],
      include: [AUDIT_AUTHOR],
      order: [['changedAt', 'DESC'], ['id', 'DESC']],
      limit: AUDIT_HISTORY_LIMIT
    }),
    RecipientDocVersion.count({ where: { recipientId: recipient.id } })
  ]);

  const entries = history.map(versionEntry);
  const last = entries[0] || null;

  return {
    createdAt: recipient.createdAt || null,
    createdBy: recipient.createdBy || null,
    createdByName: personName(creator),
    createdByRole: personRole(creator),
    changedAt: last?.changedAt || null,
    changedBy: last?.changedBy || null,
    changedByName: last?.changedByName || null,
    changedByRole: last?.changedByRole || null,
    changeReason: last?.reason || null,
    changedFields: last?.fields || [],
    editsCount,
    history: entries
  };
}

const LIST_FIELDS = [
  'id', 'firstName', 'middleName', 'lastName', 'birthDate', 'photo',
  'status', 'diagnosis', 'nozology', 'groupId', 'CRGMain',
  'attendanceStatus', 'attendanceDate', 'createdAt', 'createdBy', 'group'
];

async function enrichRecipients(rows, teacherUserId = null, req = null) {
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
    const full = r.toJSON();
    const json = {};
    for (const key of LIST_FIELDS) if (key in full) json[key] = full[key];

    const nextClassDate = nextByRecipient.get(r.id) || null;
    const doc = docByRecipient.get(r.id) || { mseValidDate: null, specialNote: '' };
    json.attendsToday = nextClassDate === todayStr;
    json.attendsTomorrow = nextClassDate === tomorrowStr;
    json.attendsThisWeek = !!nextClassDate;
    json.nextClassDate = nextClassDate;

    const medical = req ? hasGrant(req, r.id, 'medical') : false;
    json.docExpiring = !!doc.mseValidDate && doc.mseValidDate <= soonStr;
    json.docExpiryDate = medical ? (doc.mseValidDate || null) : null;
    json.needsAttention = !!doc.specialNote;
    json.attentionNote = medical ? (doc.specialNote || null) : null;
    return json;
  });
}

const MAX_LIST_LIMIT = 200;

router.get('/', authMiddleware, loadGrants, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, parseInt(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const diagnosis = req.query.diagnosis;
    const groupId = req.query.groupId ? parseInt(req.query.groupId) : undefined;

    const where = {};
    if (search) {
      const like = `%${likeEscape(search)}%`;
      where[Op.or] = [
        { lastName: { [Op.like]: like } },
        { firstName: { [Op.like]: like } },
        { middleName: { [Op.like]: like } }
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

    const data = await enrichRecipients(rows, teacherUserId, req);

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

const canDeleteDraft = (user, draft) =>
  user.role === 'admin' || draft.createdBy === user.id;

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

    const payload = req.body?.payload;
    const problem = validateDraftPayload(payload);
    if (problem) return res.status(400).json({ message: problem });

    const known = req.body?.knownUpdatedAt;
    if (known) {
      const stored = draft.updatedAt ? new Date(draft.updatedAt).getTime() : 0;
      const sent = new Date(known).getTime();
      if (Number.isFinite(sent) && stored && Math.abs(stored - sent) > 1000) {
        return res.status(409).json({
          message: `Черновик уже изменён — ${draft.updatedByName || 'другой сотрудник'}. ` +
            'Откройте его заново, чтобы не затереть чужие правки.',
          conflict: true,
          updatedAt: draft.updatedAt,
          updatedByName: draft.updatedByName
        });
      }
    }

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
    const draft = await RecipientDraft.findByPk(req.params.draftId, {
      attributes: ['id', 'createdBy', 'createdByName']
    });
    if (!draft) return res.status(404).json({ message: 'Черновик не найден' });

    if (!canDeleteDraft(req.user, draft)) {
      return res.status(403).json({
        message: `Этот черновик начал ${draft.createdByName || 'другой сотрудник'} — удалить его может автор или администратор`
      });
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

    const { docKey, originalName } = req.body || {};
    if (!trimStr(docKey)) {
      return res.status(400).json({ message: 'Не передан тип документа' });
    }

    const { buffer, mimeType, error } = readScan(req.body, 'Скан для черновика');
    if (error) return res.status(400).json({ message: error });

    const key = trimStr(docKey).slice(0, 50);
    const row = await RecipientDraftScan.create({
      draftId: draft.id,
      docKey: key,
      originalName: String(originalName || 'файл').slice(0, 255),
      mimeType,
      sizeBytes: buffer.length,
      fileData: buffer,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    });
    await RecipientDraftScan.destroy({
      where: { draftId: draft.id, docKey: key, id: { [Op.lt]: row.id } }
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

    sendScanFile(res, {
      mimeType: scan.mimeType,
      originalName: scan.originalName,
      data: scan.fileData
    });
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

    await logAccess(req, { recipientId: recipient.id, category: 'passport', action: 'view' });

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

const blankToNull = (v) => {
  const s = typeof v === 'string' ? v.trim() : v;
  return s === '' || s == null ? null : s;
};

const dateOrNull = (v) => {
  const s = String(v ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

const SNILS_RE = /^\d{3}-\d{3}-\d{3} \d{2}$/;

class IntakeError extends Error {
  constructor(message, status = 400, extra = null) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

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

  const candidates = await RecipientDoc.findAll({
    attributes: ['id', 'recipientId', 'docType', 'docSeries', 'docNumber'],
    where: { docNumber: { [Op.ne]: null } },
    raw: true
  });

  const found = candidates.find((d) =>
    normDoc(d.docNumber) === num &&
    normDoc(d.docSeries) === ser &&
    (!excludeId || d.recipientId !== excludeId)
  );
  if (!found) return null;

  const hit = await RecipientDoc.findByPk(found.id, {
    include: [{ model: Recipient, as: 'recipient', include: [groupInclude] }]
  });
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

const scansMissing = (docKeys) => new IntakeError(
  'Часть сканов не дошла до сервера. Нажмите «Сохранить» ещё раз — файлы загрузятся заново.',
  409,
  { code: 'draft-scans-missing', docKeys }
);

function readIntakeScans(raw, codeToId) {
  if (raw == null) return { list: [] };
  const invalid = { error: 'Список сканов передан в неверном формате' };
  if (!Array.isArray(raw) || raw.length > codeToId.size) return invalid;

  const list = [];
  const seen = new Set();
  for (const item of raw) {
    const docKey = trimStr(item?.docKey);
    const draftScanId = Number(item?.draftScanId);
    if (!docKey || !Number.isInteger(draftScanId) || draftScanId <= 0 || seen.has(docKey)) return invalid;
    if (!codeToId.has(docKey)) return { error: `Неизвестный тип документа: ${docKey}` };
    seen.add(docKey);
    list.push({ docKey, draftScanId });
  }
  return { list };
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
    const snils = blankToNull(doc.snils);
    if (snils && !SNILS_RE.test(snils)) {
      return res.status(400).json({
        message: 'СНИЛС записывается как 000-000-000 00',
        field: 'snils'
      });
    }
    if (snils) {
      const dup = await RecipientDoc.findOne({ where: { snils } });
      if (dup) {
        return res.status(409).json({ message: `Реабилитант с таким СНИЛС (${snils}) уже зарегистрирован в системе` });
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

    const draftId = req.body.draftId == null ? null : Number(req.body.draftId);
    if (draftId !== null && (!Number.isInteger(draftId) || draftId <= 0)) {
      return res.status(400).json({ message: 'Черновик карточки указан неверно' });
    }

    const docTypes = await DocType.findAll({ attributes: ['id', 'code', 'name'] });
    const codeToId = new Map(docTypes.map((d) => [d.code, d.id]));
    const codeToName = new Map(docTypes.map((d) => [d.code, d.name]));

    const { list: scanItems, error: scanError } = readIntakeScans(req.body.scans, codeToId);
    if (scanError) return res.status(400).json({ message: scanError });
    if (scanItems.length && !draftId) {
      return res.status(400).json({ message: 'Сканы прикладываются к карточке только из её черновика' });
    }

    const result = await sequelize.transaction(async (t) => {

      let draft = null;
      if (draftId) {
        draft = await RecipientDraft.findByPk(draftId, { attributes: ['id'], transaction: t, lock: true });
        if (!draft) {
          throw new IntakeError(
            'Черновик этой карточки уже оформлен или удалён. ' +
            'Проверьте список реабилитантов: если карточки там нет, нажмите «Сохранить» ещё раз.',
            409,
            { code: 'draft-gone' }
          );
        }
        if (scanItems.length) {
          const rows = await RecipientDraftScan.findAll({
            where: { draftId, id: { [Op.in]: scanItems.map((s) => s.draftScanId) } },
            attributes: ['id', 'docKey'],
            transaction: t
          });
          const keyOf = new Map(rows.map((r) => [r.id, r.docKey]));
          const missing = scanItems.filter((s) => keyOf.get(s.draftScanId) !== s.docKey);
          if (missing.length) throw scansMissing(missing.map((s) => s.docKey));
        }
      }

      if (!nozologyClasses.length) {
        throw new IntakeError('Не выбран класс нозологии (шаг 2)');
      }
      const nozRows = await Nozology.findAll({
        where: { class: { [Op.in]: nozologyClasses } },
        order: [['id', 'ASC']],
        transaction: t
      });
      if (!nozRows.length) {
        throw new IntakeError(`Класс нозологии не найден в справочнике: ${nozologyClasses.join(', ')}`);
      }
      const firstChosen = String(nozologyClasses[0]);
      const noz = nozRows.find((n) => String(n.class) === firstChosen) || nozRows[0];
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

      const DISABLE_GROUPS = ['Ребенок-инвалид', 'I группа', 'II группа', 'III группа', 'Нет'];
      const disableGroup = DISABLE_GROUPS.includes(recipient.disableGroup)
        ? recipient.disableGroup
        : 'Нет';

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
        disableGroup,
        diagnosis: recipient.diagnosis || '',
        nozology: nozId,
        groupId: groupId || null,
        CRGMain: crgId,
        createdAt: new Date(),
        createdBy: req.user?.id ?? null
      }, { transaction: t });

      const subRaw = String(crg.subCode || '').trim();
      if (subRaw) {
        const subNum = subRaw.replace(/^ЦРГ\s*/i, '').trim();
        const sub = await CRGDesc.findOne({
          where: { code: { [Op.in]: [subRaw, `ЦРГ ${subNum}`] }, categoryId: crgId },
          transaction: t
        });
        if (sub) {
          await CRGRecipientSec.create(
            { idRecipient: created.id, idCRGDesc: sub.id },
            { transaction: t }
          );
        }
      }

      const mseIndefinite = doc.mseIndefinite === true || doc.mseIndefinite === 'true';

      const docRow = {
        recipientId: created.id,
        docType: doc.docType === 'passport' ? 'Паспорт' : 'Свидетельство',
        docSeries: blankToNull(doc.docSeries),
        docNumber: blankToNull(doc.docNumber),
        docIssuer: blankToNull(doc.docIssuer),
        docIssuerDate: dateOrNull(doc.docIssuerDate),
        snils: blankToNull(doc.snils),
        mseIssueDate: dateOrNull(doc.mseIssueDate),
        mseValidDate: mseIndefinite ? null : dateOrNull(doc.mseValidDate),
        mseIndefinite,
        regAddress: blankToNull(doc.regAddress),
        factAddress: blankToNull(
          doc.factSameReg ? doc.regAddress : (doc.factAddress || doc.regAddress)
        ),
        factSameReg: !!doc.factSameReg,
        district: blankToNull(doc.district),
        area: blankToNull(doc.area),
        educationPlace: blankToNull(doc.educationPlace),
        specialNote: blankToNull(doc.specialNote)
      };

      const anythingFilled = Object.entries(docRow).some(
        ([key, value]) =>
          !['recipientId', 'docType', 'factSameReg', 'mseIndefinite'].includes(key) && value != null
      );
      if (anythingFilled) {
        await RecipientDoc.create(docRow, { transaction: t });
      }

      const attached = [];
      const uploadedAt = new Date();
      for (const item of scanItems) {
        const source = await RecipientDraftScan.findOne({
          where: { id: item.draftScanId, draftId },
          transaction: t
        });
        const buffer = source?.fileData;
        if (!Buffer.isBuffer(buffer) || !buffer.length) throw scansMissing([item.docKey]);

        const docTypeName = codeToName.get(item.docKey) || item.docKey;
        const mimeType = sniffMime(buffer);
        if (!ALLOWED_SCAN_MIME.includes(mimeType)) {
          throw new IntakeError(`${docTypeName}: это не PDF, JPG, PNG или WEBP — замените файл на шаге 3`);
        }

        const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
        const row = await RecipientScanDoc.create({
          entityType: rep && (item.docKey === 'rep-pass' || item.docKey.startsWith('signed-'))
            ? 'representative'
            : 'rehabilitant',
          recipId: created.id,
          represId: rep ? rep.id : null,
          docType: codeToId.get(item.docKey),
          storageKey: `db://${checksum}`,
          originalName: buildScanFileName({
            recipientId: created.id,
            lastName: created.lastName,
            firstName: created.firstName,
            middleName: created.middleName,
            docTypeName,
            originalName: source.originalName,
            uploadedAt
          }),
          mimeType,
          sizeBytes: buffer.length,
          checksum_sha256: checksum,
          fileData: buffer,
          issuedAt: null,
          validUntil: null,
          perpetual: false,
          uploadedBy: req.user.id,
          uploadedAt,
          updateReason: null,
          replacesScanId: null,
          isCurrent: true
        }, { transaction: t });
        attached.push({ id: row.id, name: docTypeName });
      }

      if (draft) await draft.destroy({ transaction: t });

      return {
        id: created.id,
        lastName: created.lastName,
        firstName: created.firstName,
        middleName: created.middleName,
        attached
      };
    });

    for (const category of CATEGORIES) {
      await logAccess(req, {
        recipientId: result.id,
        category,
        action: 'view',
        reasonCode: 'author',
        reasonText: 'Карточка только что заведена этим сотрудником — полный доступ на 30 минут'
      });
    }
    for (const scan of result.attached) {
      await logAccess(req, {
        recipientId: result.id,
        category: 'scans',
        action: 'download',
        scanId: scan.id,
        reasonText: `Загружен скан «${scan.name}»`
      });
    }

    let full = null;
    try {
      full = await Recipient.findByPk(result.id, { include: detailInclude });
    } catch (readErr) {
      req.log?.error({ err: readErr, recipientId: result.id }, 'карточка создана, но не прочитана для ответа');
    }
    res.status(201).json(full || {
      id: result.id,
      lastName: result.lastName,
      firstName: result.firstName,
      middleName: result.middleName
    });
  } catch (err) {
    if (err instanceof IntakeError) {
      return res.status(err.status).json({ message: err.message, ...(err.extra || {}) });
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

const PUT_ALLOWED_FIELDS = ['groupId', 'status'];
const PUT_STATUS_ROLES = ['admin', 'employee'];

router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const givenKeys = Object.keys(req.body || {}).filter((k) => req.body[k] !== undefined);
    const forbidden = givenKeys.filter(
      (k) => !PUT_ALLOWED_FIELDS.includes(k) && k !== 'secondaryCRG'
    );
    if (forbidden.length) {
      return res.status(400).json({
        message: 'Личные данные правятся в карточке реабилитанта — там фиксируются причина и автор изменения. ' +
          'Здесь можно менять только группу и статус карточки.',
        forbiddenFields: forbidden
      });
    }

    const patch = {};
    if (req.body.groupId !== undefined) {
      const gid = parseInt(req.body.groupId, 10);
      patch.groupId = Number.isInteger(gid) && gid > 0 ? gid : null;
    }
    if (req.body.status !== undefined) {
      if (!PUT_STATUS_ROLES.includes(req.user.role)) {
        return res.status(403).json({ message: 'Менять статус карточки может сотрудник или администратор' });
      }
      if (!ENUM_VALUES.status.includes(req.body.status)) {
        return res.status(400).json({ message: 'Неизвестный статус карточки' });
      }
      patch.status = req.body.status;
    }

    const statusChanged = 'status' in patch && patch.status !== recipient.status;
    const groupChanged = 'groupId' in patch && (patch.groupId ?? null) !== (recipient.groupId ?? null);

    if (statusChanged) {
      await RecipientDocVersion.create({
        docId: null,
        recipientId: recipient.id,
        snapshot: { status: recipient.status, groupId: recipient.groupId },
        changedFields: ['status'],
        reason: String(req.body.reason ?? '').trim() || `Статус карточки: ${recipient.status} → ${patch.status}`,
        changedBy: req.user.id,
        changedAt: new Date()
      });
    }

    if (statusChanged || groupChanged) await recipient.update(patch);

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
  'snils', 'mseIssueDate', 'regAddress'
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

const isBadDate = (field, raw) => {
  if (!DATE_FIELDS.has(field)) return false;
  const s = String(raw ?? '').trim();
  if (s === '') return false;
  return !/^\d{4}-\d{2}-\d{2}$/.test(s.slice(0, 10));
};

const sameValue = (prev, next) => {
  if (typeof next === 'boolean') return !!prev === next;
  if (prev == null && next == null) return true;
  return String(prev ?? '') === String(next ?? '');
};

const NEVER_EMPTY = new Set([
  'firstName', 'lastName', 'telephone', 'email', 'nozology', 'CRGMain',
  'docSeries', 'docNumber', 'docIssuer', 'docIssuerDate', 'snils',
  'mseIssueDate', 'regAddress', 'factAddress',
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

    if (isBadDate(field, body[field])) {
      rejected.push(`${name(field)} — дата записывается как ДД.ММ.ГГГГ`);
      continue;
    }

    const next = normalizeField(field, body[field]);

    if (ENUM_VALUES[field] && !ENUM_VALUES[field].includes(next)) {
      rejected.push(`${name(field)}: допустимые значения — ${ENUM_VALUES[field].join(', ')}`);
      continue;
    }

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

    const nextSeries = 'docSeries' in d.patch ? d.patch.docSeries : (createdDoc?.docSeries ?? doc?.docSeries);
    const nextNumber = 'docNumber' in d.patch ? d.patch.docNumber : (createdDoc?.docNumber ?? doc?.docNumber);
    if ('docSeries' in d.patch || 'docNumber' in d.patch || createdDoc) {
      const clash = await findDocMatch(
        { docSeries: nextSeries, docNumber: nextNumber },
        recipient.id
      );
      if (clash) {
        const fio = [clash.lastName, clash.firstName, clash.middleName].filter(Boolean).join(' ');
        return res.status(409).json({
          message: `Документ ${nextSeries} ${nextNumber} уже зарегистрирован` +
            (fio ? ` за реабилитантом ${fio}` : '') +
            '. Один документ не может принадлежать двум людям.'
        });
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

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'employee'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const reason = String(req.body?.reason ?? '').trim();
    if (reason.length < 3) {
      return res.status(400).json({
        message: 'Удаление карточки записывается в журнал. Укажите причину (не менее 3 символов).',
        field: 'reason'
      });
    }

    const id = recipient.id;
    const sessionIds = (await DiagnosticSession.findAll({
      where: { recipientId: id }, attributes: ['id'], raw: true
    })).map((s) => s.id);

    const docsSnapshot = await RecipientDoc.findAll({ where: { recipientId: id }, raw: true });
    await RecipientDocVersion.create({
      docId: null,
      recipientId: id,
      snapshot: {
        deletedAt: new Date().toISOString(),
        recipient: recipient.toJSON(),
        docs: docsSnapshot
      },
      changedFields: ['recipient.deleted'],
      reason,
      changedBy: req.user.id,
      changedAt: new Date()
    });

    const orphanUserId = recipient.userId;
    const repId = recipient.representativeId;

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
      await RecipientDoc.destroy({ where: { recipientId: id }, transaction: t });
      await RecipientScanDoc.destroy({ where: { recipId: id }, transaction: t });
      await ReResult.destroy({ where: { idRecipient: id }, transaction: t });
      await recipient.destroy({ transaction: t });

      if (orphanUserId) {
        const stillUsed = await Recipient.count({ where: { userId: orphanUserId }, transaction: t });
        if (!stillUsed) {
          const u = await User.findByPk(orphanUserId, { transaction: t });
          if (u && u.role === 'recipient') await u.destroy({ transaction: t });
        }
      }

      if (repId) {
        const otherKids = await Recipient.count({ where: { representativeId: repId }, transaction: t });
        if (!otherKids) {
          await LegalRepFamilyStatus.destroy({ where: { representativeId: repId }, transaction: t });
          await LegalRepresentative.destroy({ where: { id: repId }, transaction: t });
        }
      }
    });

    await logAccess(req, {
      recipientId: id,
      category: 'passport',
      action: 'view',
      reasonCode: 'other',
      reasonText: `Карточка удалена: ${reason}`.slice(0, 500)
    });

    res.json({ message: 'Реабилитант удалён' });
  } catch (err) {
    next(err);
  }
});

const ENTITY_TYPES = ['rehabilitant', 'representative'];

router.post('/:id/scans', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), loadGrants, async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    if (!hasGrant(req, recipient.id, 'scans')) {
      await logAccess(req, { recipientId: recipient.id, category: 'scans', action: 'denied' });
      return res.status(403).json({
        message: 'Нет доступа к сканам этой карточки. Запросите доступ с указанием причины.',
        category: 'scans'
      });
    }

    const scans = Array.isArray(req.body.scans) ? req.body.scans : [];
    if (!scans.length) return res.status(400).json({ message: 'Нет файлов для сохранения' });
    if (scans.length > MAX_SCANS_PER_REQUEST) {
      return res.status(400).json({
        message: `За один раз можно загрузить не больше ${MAX_SCANS_PER_REQUEST} файлов`
      });
    }

    const canReplace = req.user.role === 'admin' || req.user.role === 'employee';
    const reason = String(req.body.reason ?? '').trim();

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

    const prepared = [];
    for (const scan of scans) {
      const { docKey, entityType } = scan || {};
      if (!docKey) continue;

      const docTypeId = codeToId.get(docKey);
      if (!docTypeId) continue;

      const label = codeToName.get(docKey) || 'Файл';
      const { buffer, mimeType, error } = readScan(scan, label);
      if (error) return res.status(400).json({ message: error, docKey });

      const prev = await RecipientScanDoc.findOne({
        where: { recipId: recipient.id, docType: docTypeId, isCurrent: true },
        attributes: { exclude: ['fileData'] },
        order: [['id', 'DESC']]
      });

      prepared.push({
        scan, docKey, docTypeId, buffer, mimeType, prev,
        entityType: ENTITY_TYPES.includes(entityType) ? entityType : 'rehabilitant'
      });
    }

    if (!prepared.length) {
      return res.status(400).json({ message: 'Ни один файл не подошёл: неизвестный тип документа' });
    }

    const replacing = prepared.filter((p) => p.prev);
    if (replacing.length && !canReplace) {
      return res.status(403).json({
        message: 'Заменять приложенные документы могут только сотрудник и администратор'
      });
    }
    if (replacing.length && reason.length < 3) {
      return res.status(400).json({
        message: 'Этот документ уже приложен — замена требует причины (не менее 3 символов). ' +
          'Прежняя версия останется в истории.',
        field: 'reason',
        replacing: replacing.map((p) => codeToName.get(p.docKey) || p.docKey)
      });
    }

    for (const item of prepared) {
      const { scan, docKey, docTypeId, buffer, mimeType, prev, entityType: et } = item;
      const { originalName } = scan;
      const perpetual = scan.perpetual === true || scan.perpetual === 'true';
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

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
        mimeType,
        sizeBytes: buffer.length,
        checksum_sha256: checksum,
        fileData: buffer,
        issuedAt: asDate(scan.issuedAt),
        validUntil: perpetual ? null : asDate(scan.validUntil),
        perpetual,
        uploadedBy: req.user.id,
        uploadedAt: now,
        updateReason: prev ? reason : null,
        replacesScanId: prev ? prev.id : null,
        isCurrent: true
      });
      created.push(row.id);

      if (prev) {
        await prev.update({ isCurrent: false });
        superseded.push(prev.id);
      }

      await logAccess(req, {
        recipientId: recipient.id,
        category: 'scans',
        action: 'download',
        scanId: row.id,
        reasonText: prev ? `Замена скана «${codeToName.get(docKey) || docKey}»: ${reason}` : `Загружен скан «${codeToName.get(docKey) || docKey}»`
      });
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
    await logAccess(req, { recipientId: Number(req.params.id), category: 'scans', action: 'view' });
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

    const logged = await logAccess(req, {
      recipientId: Number(req.params.id), category: 'scans',
      action: 'download', scanId: scan.id
    });
    if (!logged) {
      return res.status(503).json({
        message: 'Журнал доступа временно недоступен. Выдача сканов приостановлена — сообщите администратору.'
      });
    }

    sendScanFile(res, {
      mimeType: scan.mimeType,
      originalName: scan.originalName,
      data: scan.fileData
    });
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

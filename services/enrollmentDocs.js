import { Op } from '@sequelize/core';
import {
  Recipient, RecipientDoc, RecipientScanDoc, DocType,
  LegalRepresentative, DiagnosticConclusion, DiagnosticSession
} from '../models/index.js';
import { generateDocument, ageFromBirth } from './documentGenerator.js';

export const POSITIVE_VERDICTS = ['recommended', 'trial'];

export const VERDICT_LABELS = {
  recommended: 'рекомендован к зачислению',
  trial: 'пробные занятия',
  rejected: 'не рекомендован'
};

export const ENROLL_DOCS = [
  { key: 'contract', scanCode: 'signed-contract', title: 'Договор оказания услуг' },
  { key: 'enroll',   scanCode: 'signed-enroll',   title: 'Заявление о зачислении на курс' },
  { key: 'plan',     scanCode: 'signed-plan',     title: 'Индивидуальный план' }
];

const DISABILITY_TO_CODE = {
  'Ребенок-инвалид': 'child',
  'Ребёнок-инвалид': 'child',
  'I группа': '1',
  'II группа': '2',
  'III группа': '3',
  'Нет': 'none'
};

const iso = (v) => (v ? String(v).slice(0, 10) : '');

export function buildFormFromRecipient(recipient, rep, doc) {
  return {
    rLast: recipient.lastName || '',
    rFirst: recipient.firstName || '',
    rMid: recipient.middleName || '',
    rBirth: iso(recipient.birthDate),
    rPhone: recipient.telephone || '',
    rInvalidity: DISABILITY_TO_CODE[recipient.disableGroup] || 'none',

    rDocSeries: doc?.docSeries || '',
    rDocNum: doc?.docNumber || '',
    rDocIssuer: doc?.docIssuer || '',
    rDocDate: iso(doc?.docIssuerDate),
    rDocRelation: doc?.docType === 'Свидетельство' ? 'Сын' : '',
    rSnils: doc?.snils || '',
    rAddrReg: doc?.regAddress || '',
    rAddrFact: doc?.factAddress || '',
    rAddrSame: !!doc?.factSameReg,

    lrLast: rep?.lastName || '',
    lrFirst: rep?.firstName || '',
    lrMid: rep?.middleName || '',
    lrPhone: rep?.telephone || '',
    lrPassSeries: rep?.passportSeries || '',
    lrPassNum: rep?.passportNumber || '',
    lrPassIssuer: rep?.passportIssuer || '',
    lrPassDate: iso(rep?.passportIssuerDate),
    lrPassCode: rep?.passportDeptCode || '',
    lrAddress: rep?.passportReg || ''
  };
}

async function loadRecipientBundle(recipientId) {
  const id = parseInt(recipientId, 10);
  if (!id) return null;

  const recipient = await Recipient.findByPk(id, {
    include: [
      { model: RecipientDoc, as: 'docs' },
      { model: LegalRepresentative, as: 'representative' }
    ]
  });
  if (!recipient) return null;

  return {
    recipient,
    rep: recipient.representative || null,
    doc: recipient.docs?.[0] || null
  };
}

async function scanCodeMap() {
  const types = await DocType.findAll({
    where: { code: { [Op.in]: ENROLL_DOCS.map((d) => d.scanCode) } }
  });
  const byCode = new Map(types.map((t) => [t.code, t]));
  const byId = new Map(types.map((t) => [t.id, t.code]));
  return { byCode, byId };
}

export async function getPrimaryConclusion(recipientId) {
  const primary = await DiagnosticSession.findAll({
    where: { recipientId, kind: 'primary' },
    attributes: ['id']
  });
  const ids = primary.map((s) => s.id);
  if (!ids.length) return null;

  return DiagnosticConclusion.findOne({
    where: { recipientId, sessionId: { [Op.in]: ids } },
    order: [['issuedAt', 'ASC'], ['id', 'ASC']]
  });
}

export async function getEnrollmentState(recipientId) {
  const bundle = await loadRecipientBundle(recipientId);
  if (!bundle) return null;

  const { recipient } = bundle;
  const conclusion = await getPrimaryConclusion(recipient.id);
  const { byCode, byId } = await scanCodeMap();

  const typeIds = ENROLL_DOCS
    .map((d) => byCode.get(d.scanCode)?.id)
    .filter((x) => x != null);

  const scans = typeIds.length
    ? await RecipientScanDoc.findAll({
        where: { recipId: recipient.id, docType: { [Op.in]: typeIds } },
        attributes: ['id', 'docType', 'isCurrent', 'originalName', 'uploadedAt']
      })
    : [];

  const currentByCode = new Map();
  for (const s of scans) {
    if (s.isCurrent === false) continue;
    const code = byId.get(s.docType);
    if (code) currentByCode.set(code, s);
  }

  const age = ageFromBirth(recipient.birthDate);
  const isMinor = age == null ? true : age < 18;

  const docs = ENROLL_DOCS.map((d) => {
    const scan = currentByCode.get(d.scanCode) || null;
    return {
      key: d.key,
      title: d.title,
      scanCode: d.scanCode,
      scanTypeId: byCode.get(d.scanCode)?.id || null,
      uploaded: !!scan,
      scanId: scan?.id || null,
      originalName: scan?.originalName || null,
      uploadedAt: scan?.uploadedAt || null
    };
  });

  const verdict = conclusion?.verdict || null;

  return {
    recipientId: recipient.id,
    age,
    isMinor,
    verdict,
    verdictLabel: VERDICT_LABELS[verdict] || null,
    positive: POSITIVE_VERDICTS.includes(verdict),
    conclusionId: conclusion?.id || null,
    issuedAt: conclusion?.issuedAt || null,
    docs,
    signedCount: docs.filter((d) => d.uploaded).length,
    allSigned: docs.every((d) => d.uploaded),
    enrolled: !!recipient.groupId
  };
}

export async function generateEnrollmentDocument(recipientId, docKey) {
  if (!ENROLL_DOCS.some((d) => d.key === docKey)) {
    const err = new Error('Неизвестный документ на зачисление: ' + docKey);
    err.status = 400;
    throw err;
  }

  const bundle = await loadRecipientBundle(recipientId);
  if (!bundle) {
    const err = new Error('Реабилитант не найден');
    err.status = 404;
    throw err;
  }
  if (!bundle.doc) {
    const err = new Error('У реабилитанта не заполнены документы — нечем заполнять шаблон');
    err.status = 409;
    throw err;
  }

  const form = buildFormFromRecipient(bundle.recipient, bundle.rep, bundle.doc);
  return generateDocument(docKey, form);
}

export async function findPendingEnrollment(limit = 50) {
  const conclusions = await DiagnosticConclusion.findAll({
    where: { verdict: { [Op.in]: POSITIVE_VERDICTS } },
    order: [['issuedAt', 'ASC'], ['id', 'ASC']]
  });
  if (!conclusions.length) return [];

  const firstByRecipient = new Map();
  for (const c of conclusions) {
    if (!firstByRecipient.has(c.recipientId)) firstByRecipient.set(c.recipientId, c);
  }

  const recipientIds = [...firstByRecipient.keys()];
  const recipients = await Recipient.findAll({
    where: { id: { [Op.in]: recipientIds }, status: 'active' },
    attributes: ['id', 'firstName', 'middleName', 'lastName', 'birthDate', 'groupId']
  });
  if (!recipients.length) return [];

  const { byCode, byId } = await scanCodeMap();
  const typeIds = ENROLL_DOCS
    .map((d) => byCode.get(d.scanCode)?.id)
    .filter((x) => x != null);

  const scans = typeIds.length
    ? await RecipientScanDoc.findAll({
        where: {
          recipId: { [Op.in]: recipients.map((r) => r.id) },
          docType: { [Op.in]: typeIds }
        },
        attributes: ['id', 'recipId', 'docType', 'isCurrent']
      })
    : [];

  const signedByRecipient = new Map();
  for (const s of scans) {
    if (s.isCurrent === false) continue;
    const code = byId.get(s.docType);
    if (!code) continue;
    if (!signedByRecipient.has(s.recipId)) signedByRecipient.set(s.recipId, new Set());
    signedByRecipient.get(s.recipId).add(code);
  }

  const rows = [];
  for (const r of recipients) {
    const signed = signedByRecipient.get(r.id) || new Set();
    if (signed.size >= ENROLL_DOCS.length) continue;

    const c = firstByRecipient.get(r.id);
    rows.push({
      recipientId: r.id,
      name: [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ').trim(),
      verdict: c.verdict,
      verdictLabel: VERDICT_LABELS[c.verdict] || '',
      issuedAt: c.issuedAt,
      signedCount: signed.size,
      totalDocs: ENROLL_DOCS.length,
      enrolled: !!r.groupId
    });
  }

  rows.sort((a, b) => new Date(a.issuedAt) - new Date(b.issuedAt));
  return rows.slice(0, limit);
}

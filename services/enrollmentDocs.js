import { Op } from '@sequelize/core';
import {
  Recipient, RecipientDoc, RecipientScanDoc, DocType,
  LegalRepresentative, DiagnosticConclusion, DiagnosticSession
} from '../models/index.js';
import { generateDocument, ageFromBirth } from './documentGenerator.js';
import {
  POSITIVE_VERDICTS, CONSENT_BY_KEY, CONSENT_SCAN_CODES, buildConsentState
} from '../src/utils/consentRules.js';

export { POSITIVE_VERDICTS };

export const VERDICT_LABELS = {
  recommended: 'рекомендован к зачислению',
  trial: 'пробные занятия',
  rejected: 'не рекомендован'
};

export const ENROLL_DOCS = [
  { key: 'contract', scanCode: 'signed-contract', title: 'Договор оказания услуг',  required: true },
  { key: 'enroll',   scanCode: 'signed-enroll',   title: 'Заявление на зачисление', required: true }
];

export const ENROLL_RELATED_CODES = [...ENROLL_DOCS.map((d) => d.scanCode), ...CONSENT_SCAN_CODES];

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

    rDocType: doc?.docType === 'Паспорт' ? 'passport' : 'birth',
    rDocSeries: doc?.docSeries || '',
    rDocNum: doc?.docNumber || '',
    rDocIssuer: doc?.docIssuer || '',
    rDocDate: iso(doc?.docIssuerDate),
    rDocRelation: '',
    rSnils: doc?.snils || '',
    rAddrReg: doc?.regAddress || '',
    rAddrFact: doc?.factAddress || '',
    rAddrSame: !!doc?.factSameReg,

    lrLast: rep?.lastName || '',
    lrFirst: rep?.firstName || '',
    lrMid: rep?.middleName || '',
    lrRelation: rep?.relation || '',
    lrPhone: rep?.telephone || '',
    lrPassSeries: rep?.passportSeries || '',
    lrPassNum: rep?.passportNumber || '',
    lrPassIssuer: rep?.passportIssuer || '',
    lrPassDate: iso(rep?.passportIssuerDate),
    lrPassCode: rep?.passportDeptCode || '',
    lrAddress: rep?.passportReg || '',

    guardianBasis: recipient.guardianBasis || ''
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

async function typeMaps(codes) {
  const types = await DocType.findAll({
    where: { code: { [Op.in]: codes } },
    attributes: ['id', 'code']
  });
  return {
    byCode: new Map(types.map((t) => [t.code, t])),
    byId: new Map(types.map((t) => [t.id, t.code]))
  };
}

async function currentScans(recipientIds, byId) {
  const out = new Map(recipientIds.map((id) => [id, []]));
  if (!recipientIds.length || !byId.size) return out;

  const rows = await RecipientScanDoc.findAll({
    where: {
      recipId: { [Op.in]: recipientIds },
      docType: { [Op.in]: [...byId.keys()] },
      isCurrent: true
    },
    attributes: ['id', 'recipId', 'docType', 'originalName', 'uploadedAt', 'issuedAt', 'validUntil', 'perpetual']
  });

  for (const row of rows) {
    const code = byId.get(row.docType);
    if (!code || !out.has(row.recipId)) continue;
    out.get(row.recipId).push({
      id: row.id,
      code,
      originalName: row.originalName,
      uploadedAt: row.uploadedAt,
      issuedAt: row.issuedAt,
      validUntil: row.validUntil,
      perpetual: !!row.perpetual
    });
  }
  return out;
}

async function firstPrimaryConclusions(recipientIds) {
  const out = new Map();
  if (!recipientIds.length) return out;

  const sessions = await DiagnosticSession.findAll({
    where: { recipientId: { [Op.in]: recipientIds }, kind: 'primary' },
    attributes: ['id']
  });
  if (!sessions.length) return out;

  const conclusions = await DiagnosticConclusion.findAll({
    where: {
      recipientId: { [Op.in]: recipientIds },
      sessionId: { [Op.in]: sessions.map((s) => s.id) }
    },
    order: [['issuedAt', 'ASC'], ['id', 'ASC']]
  });
  for (const c of conclusions) {
    if (!out.has(c.recipientId)) out.set(c.recipientId, c);
  }
  return out;
}

export async function getPrimaryConclusion(recipientId) {
  const id = parseInt(recipientId, 10);
  if (!id) return null;
  const found = await firstPrimaryConclusions([id]);
  return found.get(id) || null;
}

export async function getConsentState(recipientId) {
  const id = parseInt(recipientId, 10);
  if (!id) return null;

  const recipient = await Recipient.findByPk(id, { attributes: ['id', 'birthDate', 'legalCapacity'] });
  if (!recipient) return null;

  const { byId } = await typeMaps(CONSENT_SCAN_CODES);
  const [conclusions, scans] = await Promise.all([
    firstPrimaryConclusions([id]),
    currentScans([id], byId)
  ]);
  const conclusion = conclusions.get(id) || null;

  return {
    recipientId: id,
    verdict: conclusion?.verdict || null,
    ...buildConsentState({
      birthDate: recipient.birthDate,
      legalCapacity: recipient.legalCapacity,
      verdict: conclusion?.verdict || null,
      scans: scans.get(id) || []
    })
  };
}

export async function getEnrollmentState(recipientId) {
  const bundle = await loadRecipientBundle(recipientId);
  if (!bundle) return null;

  const { recipient } = bundle;
  const { byCode, byId } = await typeMaps(ENROLL_RELATED_CODES);
  const [conclusions, scanMap] = await Promise.all([
    firstPrimaryConclusions([recipient.id]),
    currentScans([recipient.id], byId)
  ]);
  const conclusion = conclusions.get(recipient.id) || null;
  const scans = scanMap.get(recipient.id) || [];
  const scanOf = new Map(scans.map((s) => [s.code, s]));

  const age = ageFromBirth(recipient.birthDate);
  const isMinor = age == null ? true : age < 18;

  const consents = buildConsentState({
    birthDate: recipient.birthDate,
    legalCapacity: recipient.legalCapacity,
    verdict: POSITIVE_VERDICTS[0],
    scans
  });

  const consentDocs = consents.items.map((item) => ({
    key: item.blank,
    title: `${item.title} · ${item.signerLabel}`,
    required: true,
    scanCode: item.code,
    scanTypeId: byCode.get(item.code)?.id || null,
    uploaded: item.done,
    legacy: item.legacy,
    scanId: item.scanId,
    originalName: null,
    uploadedAt: item.uploadedAt,
    issuedAt: null,
    validUntil: null,
    perpetual: false
  }));

  const fixedDocs = ENROLL_DOCS.map((d) => {
    const scan = scanOf.get(d.scanCode) || null;
    return {
      key: d.key,
      title: d.title,
      required: !!d.required,
      scanCode: d.scanCode,
      scanTypeId: byCode.get(d.scanCode)?.id || null,
      uploaded: !!scan,
      legacy: false,
      scanId: scan?.id || null,
      originalName: scan?.originalName || null,
      uploadedAt: scan?.uploadedAt || null,
      issuedAt: scan?.issuedAt || null,
      validUntil: scan?.validUntil || null,
      perpetual: !!scan?.perpetual
    };
  });

  const docs = [...consentDocs, ...fixedDocs];
  const verdict = conclusion?.verdict || null;

  return {
    recipientId: recipient.id,
    age,
    isMinor,
    consentCategory: consents.category,
    consentCategoryLabel: consents.categoryLabel,
    verdict,
    verdictLabel: VERDICT_LABELS[verdict] || null,
    positive: POSITIVE_VERDICTS.includes(verdict),
    conclusionId: conclusion?.id || null,
    issuedAt: conclusion?.issuedAt || null,
    docs,
    signedCount: docs.filter((d) => d.uploaded).length,
    totalDocs: docs.length,
    allSigned: docs.every((d) => d.uploaded || !d.required),
    enrolled: !!recipient.groupId
  };
}

export async function generateEnrollmentDocument(recipientId, docKey) {
  const consent = CONSENT_BY_KEY.get(docKey);
  const fixed = ENROLL_DOCS.some((d) => d.key === docKey);
  if (!consent && !fixed) {
    const err = new Error('Неизвестный документ: ' + docKey);
    err.status = 400;
    throw err;
  }

  const bundle = await loadRecipientBundle(recipientId);
  if (!bundle) {
    const err = new Error('Реабилитант не найден');
    err.status = 404;
    throw err;
  }
  if (fixed && !bundle.doc) {
    const err = new Error('У реабилитанта не заполнены документы — нечем заполнять шаблон');
    err.status = 409;
    throw err;
  }

  const form = buildFormFromRecipient(bundle.recipient, bundle.rep, bundle.doc);
  return generateDocument(docKey, form);
}

async function loadConsentInputs(recipientIds, codes) {
  const ids = [...new Set((recipientIds || []).filter((x) => x != null))];
  if (!ids.length) return { ids, recipients: [], scanMap: new Map() };
  const { byId } = await typeMaps(codes);
  const [recipients, scanMap] = await Promise.all([
    Recipient.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ['id', 'birthDate', 'legalCapacity']
    }),
    currentScans(ids, byId)
  ]);
  return { ids, recipients, scanMap };
}

export async function enrollmentProgressFor(recipientIds) {
  const out = new Map();
  const { recipients, scanMap } = await loadConsentInputs(recipientIds, ENROLL_RELATED_CODES);

  for (const r of recipients) {
    const scans = scanMap.get(r.id) || [];
    const codes = new Set(scans.map((s) => s.code));
    const consents = buildConsentState({
      birthDate: r.birthDate,
      legalCapacity: r.legalCapacity,
      verdict: POSITIVE_VERDICTS[0],
      scans
    });
    const fixedSigned = ENROLL_DOCS.filter((d) => codes.has(d.scanCode)).length;
    const fixedComplete = ENROLL_DOCS.every((d) => !d.required || codes.has(d.scanCode));
    out.set(r.id, {
      signed: consents.done + fixedSigned,
      total: consents.total + ENROLL_DOCS.length,
      complete: consents.complete && fixedComplete
    });
  }
  return out;
}

export async function consentNeedsFor(recipientIds) {
  const out = new Map();
  const { ids, recipients, scanMap } = await loadConsentInputs(recipientIds, CONSENT_SCAN_CODES);
  if (!recipients.length) return out;

  const conclusions = await firstPrimaryConclusions(ids);
  for (const r of recipients) {
    out.set(r.id, buildConsentState({
      birthDate: r.birthDate,
      legalCapacity: r.legalCapacity,
      verdict: conclusions.get(r.id)?.verdict || null,
      scans: scanMap.get(r.id) || []
    }));
  }
  return out;
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

  const recipients = await Recipient.findAll({
    where: { id: { [Op.in]: [...firstByRecipient.keys()] }, status: 'active' },
    attributes: ['id', 'firstName', 'middleName', 'lastName', 'birthDate', 'groupId']
  });
  if (!recipients.length) return [];

  const progress = await enrollmentProgressFor(recipients.map((r) => r.id));

  const rows = [];
  for (const r of recipients) {
    const p = progress.get(r.id);
    if (!p || p.complete) continue;

    const c = firstByRecipient.get(r.id);
    rows.push({
      recipientId: r.id,
      name: [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ').trim(),
      verdict: c.verdict,
      verdictLabel: VERDICT_LABELS[c.verdict] || '',
      issuedAt: c.issuedAt,
      signedCount: p.signed,
      totalDocs: p.total,
      enrolled: !!r.groupId
    });
  }

  rows.sort((a, b) => new Date(a.issuedAt) - new Date(b.issuedAt));
  return rows.slice(0, limit);
}

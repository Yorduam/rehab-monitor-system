import { Op } from '@sequelize/core';
import { AccessLog, AccessGrant } from '../models/index.js';

export const CATEGORIES = ['passport', 'scans', 'contacts', 'medical'];

export const CATEGORY_LABELS = {
  passport: 'Паспортные данные и СНИЛС',
  scans: 'Сканы документов',
  contacts: 'Адреса и телефоны',
  medical: 'Диагноз и медицинские сведения'
};

export const REASON_CODES = [
  { code: 'contract', label: 'Оформление или продление договора' },
  { code: 'verify', label: 'Сверка данных в документах' },
  { code: 'agency', label: 'Запрос ведомства или проверяющего органа' },
  { code: 'diagnostic', label: 'Подготовка к диагностике или занятию' },
  { code: 'conclusion', label: 'Подготовка заключения' },
  { code: 'correction', label: 'Исправление ошибки в данных' },
  { code: 'other', label: 'Иное' }
];

const REASON_SET = new Set(REASON_CODES.map((r) => r.code));

export const GRANT_MS = 30 * 60 * 1000;

const keyOf = (recipientId, category) => `${recipientId}:${category}`;

export const isAdmin = (user) => user?.role === 'admin';

export const loadGrants = async (req, res, next) => {
  if (!req._grants) {
    req._grants = new Set();
    if (req.user?.id) {
      const rows = await AccessGrant.findAll({
        attributes: ['recipientId', 'category'],
        where: { userId: req.user.id, expiresAt: { [Op.gt]: new Date() } }
      });
      for (const row of rows) req._grants.add(keyOf(row.recipientId, row.category));
    }
  }
  if (typeof next === 'function') next();
};

export const hasGrant = (req, recipientId, category) => {
  if (isAdmin(req?.user)) return true;
  return req?._grants?.has(keyOf(Number(recipientId), category)) === true;
};

export const grantAccess = async (req, recipientId, category, reasonCode = null) => {
  const expiresAt = new Date(Date.now() + GRANT_MS);
  await AccessGrant.destroy({ where: { expiresAt: { [Op.lte]: new Date() } } });

  const [row, created] = await AccessGrant.findOrCreate({
    where: { userId: req.user.id, recipientId, category },
    defaults: { expiresAt, reasonCode, createdAt: new Date() }
  });
  if (!created) {
    row.expiresAt = expiresAt;
    row.reasonCode = reasonCode;
    await row.save();
  }

  req._grants?.add(keyOf(Number(recipientId), category));
  return expiresAt.getTime();
};

export const validateReason = (reasonCode, reasonText) => {
  if (!REASON_SET.has(reasonCode)) return 'Выберите причину из списка';
  const text = String(reasonText ?? '').trim();
  if (reasonCode === 'other' && text.length < 10) {
    return 'Опишите причину подробнее — не менее 10 символов';
  }
  if (text.length > 500) return 'Пояснение слишком длинное (максимум 500 символов)';
  return null;
};

export const logAccess = async (req, entry) => {
  try {
    await AccessLog.create({
      userId: req.user?.id ?? null,
      userRole: req.user?.role ?? null,
      recipientId: entry.recipientId ?? null,
      category: entry.category,
      action: entry.action,
      reasonCode: entry.reasonCode ?? null,
      reasonText: entry.reasonText ?? null,
      scanId: entry.scanId ?? null,
      ip: (req.ip || '').slice(0, 64),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 255),
      createdAt: new Date()
    });
  } catch (err) {
    req.log?.error({ err }, 'не удалось записать обращение в журнал доступа');
  }
};

export const RECIPIENT_FIELDS = {
  contacts: ['telephone', 'email'],
  medical: ['diagnosis', 'nozology']
};

export const DOC_FIELDS = {
  passport: ['docSeries', 'docNumber', 'docIssuer', 'docIssuerDate', 'snils'],
  contacts: ['regAddress', 'factAddress'],
  medical: ['mseIssueDate', 'mseValidDate', 'mseIndefinite', 'specialNote']
};

export const REP_FIELDS = {
  passport: ['passportSeries', 'passportNumber', 'passportIssuer', 'passportIssuerDate', 'passportDeptCode'],
  contacts: ['telephone', 'email', 'passportReg']
};

const reverse = (map) => {
  const out = new Map();
  for (const [category, fields] of Object.entries(map)) {
    for (const f of fields) out.set(f, category);
  }
  return out;
};

export const CATEGORY_OF = {
  recipient: reverse(RECIPIENT_FIELDS),
  doc: reverse(DOC_FIELDS),
  rep: reverse(REP_FIELDS)
};

const blankOut = (target, fields) => {
  if (!target) return;
  for (const f of fields) if (f in target) target[f] = null;
};

export const redactRecipient = (recipient, req) => {
  const plain = typeof recipient.toJSON === 'function' ? recipient.toJSON() : { ...recipient };
  const hidden = [];

  for (const category of CATEGORIES) {
    if (hasGrant(req, plain.id, category)) continue;
    hidden.push(category);

    blankOut(plain, RECIPIENT_FIELDS[category] || []);
    blankOut(plain.representative, REP_FIELDS[category] || []);
    for (const doc of plain.docs || []) blankOut(doc, DOC_FIELDS[category] || []);

    if (category === 'medical') {
      plain.nozologyRef = null;
    }
  }

  plain.hiddenCategories = hidden;
  return plain;
};

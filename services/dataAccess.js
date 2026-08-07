// Закрытие персональных данных и выдача временного доступа к ним.
//
// Правило: всем, кроме администратора, сервер НЕ отдаёт закрытые поля вообще,
// пока человек не запросит их с указанием причины. Именно не отдаёт, а не
// «отдаёт и прячет на экране»: размытие в интерфейсе — только подсказка, данные
// при таком подходе видны во вкладке «Сеть» браузера за три клика.
//
// Разрешение действует 30 минут, на одного реабилитанта и одну категорию.
import { AccessLog } from '../models/index.js';

export const CATEGORIES = ['passport', 'scans', 'contacts', 'medical'];

export const CATEGORY_LABELS = {
  passport: 'Паспортные данные и СНИЛС',
  scans: 'Сканы документов',
  contacts: 'Адреса и телефоны',
  medical: 'Диагноз и медицинские сведения'
};

// Готовые причины: по ним журнал можно фильтровать и считать, а не только
// читать глазами. Свободное пояснение идёт отдельным полем.
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

// Разрешения держим в памяти процесса, а не в БД, нарочно: перезапуск сервера
// обязан их сбрасывать. Журнал при этом лежит в БД и переживает всё — важна
// именно запись о доступе, а не само разрешение.
const grants = new Map();   // `${userId}:${recipientId}:${category}` -> срок

const keyOf = (userId, recipientId, category) => `${userId}:${recipientId}:${category}`;

// Подчищаем протухшее, чтобы карта не росла бесконечно на долго живущем сервере.
const sweep = (now) => {
  for (const [key, expiresAt] of grants) if (expiresAt <= now) grants.delete(key);
};

export const isAdmin = (user) => user?.role === 'admin';

export const hasGrant = (user, recipientId, category) => {
  // Администратор видит всё сразу — причину у него не спрашиваем. Но его
  // просмотры всё равно попадают в журнал (см. logAccess в маршрутах).
  if (isAdmin(user)) return true;
  const expiresAt = grants.get(keyOf(user?.id, recipientId, category));
  return typeof expiresAt === 'number' && expiresAt > Date.now();
};

export const grantAccess = (user, recipientId, category) => {
  const now = Date.now();
  sweep(now);
  const expiresAt = now + GRANT_MS;
  grants.set(keyOf(user.id, recipientId, category), expiresAt);
  return expiresAt;
};

export const validateReason = (reasonCode, reasonText) => {
  if (!REASON_SET.has(reasonCode)) return 'Выберите причину из списка';
  const text = String(reasonText ?? '').trim();
  // На «Иное» пояснение обязательно: без него в журнале осталось бы слово
  // «иное», по которому потом ничего не восстановить.
  if (reasonCode === 'other' && text.length < 10) {
    return 'Опишите причину подробнее — не менее 10 символов';
  }
  if (text.length > 500) return 'Пояснение слишком длинное (максимум 500 символов)';
  return null;
};

// Запись в журнал никогда не должна ронять сам запрос: если журнал недоступен,
// это повод для ошибки в логе, а не для отказа человеку в работе.
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

// Какие поля к какой категории относятся. Держим одним списком, чтобы
// закрытие и подсказка интерфейсу не разъезжались.
const RECIPIENT_FIELDS = {
  contacts: ['telephone', 'email'],
  medical: ['diagnosis', 'nozology']
};

const DOC_FIELDS = {
  passport: ['docSeries', 'docNumber', 'docIssuer', 'docIssuerDate', 'snils'],
  contacts: ['regAddress', 'factAddress'],
  medical: ['mseIssueDate', 'mseValidDate', 'specialNote']
};

const REP_FIELDS = {
  passport: ['passportSeries', 'passportNumber', 'passportIssuer', 'passportIssuerDate', 'passportDeptCode'],
  contacts: ['telephone', 'email', 'passportReg']
};

const blankOut = (target, fields) => {
  if (!target) return;
  for (const f of fields) if (f in target) target[f] = null;
};

// Возвращает карточку, из которой вырезано всё, к чему нет доступа, плюс
// признак hidden — по нему интерфейс понимает, какие блоки закрывать.
export const redactRecipient = (recipient, user) => {
  const plain = typeof recipient.toJSON === 'function' ? recipient.toJSON() : { ...recipient };
  const hidden = [];

  for (const category of CATEGORIES) {
    if (hasGrant(user, plain.id, category)) continue;
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

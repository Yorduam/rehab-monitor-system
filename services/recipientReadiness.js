// Готовность реабилитанта к назначению диагностики.
//
// Собирает три группы сведений:
//   route  — «Маршрут реабилитанта»: заполнена ли анкета, медкарта, сканы, группа.
//            Диагностику назначаем только когда маршрут заполнен полностью.
//   docs   — просроченные и скоро истекающие документы + недостающие обязательные
//            сканы. Именно отсюда карточка берёт значок уведомления на вкладках
//            «Обзор» и «Анкета и медкарта».
//   diagnostic — что мешает назначить/переназначить диагностику прямо сейчас
//            (идёт незавершённая диагностика, уже есть запланированная и т.п.).
//
// Используется:
//   GET  /recipients/:id/readiness           — карточка и модалка назначения
//   POST /schedule/assignments               — серверная валидация перед записью
import { Op } from '@sequelize/core';
import {
  Recipient, RecipientDoc, RecipientScanDoc, DocType,
  DiagnosticAssignment, DiagnosticSession, ScheduleEvent, ReResult, Direction, User
} from '../models/index.js';

// Сколько дней «до истечения» считаем предупреждением.
const EXPIRING_SOON_DAYS = 30;

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayStr = (offset = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return fmtDate(d);
};

const filled = (v) => v !== null && v !== undefined && String(v).trim() !== '';

// Карточкам, заведённым мастером, выдаются служебные плейсхолдеры вида
// rcp-…@intake.local (аккаунт реабилитанта никогда не логинится). Телефон при
// пустом номере представителя раньше подставлялся из этого же плейсхолдера,
// поэтому шаг «Анкета» засчитывался всегда. Такие значения за данные не считаем.
// Ловим и целый плейсхолдер, и обрезанный: telephone — STRING(20), поэтому
// у старых карточек в поле лежит огрызок вроде «rcp-12345678901-ab» без хвоста
// «@intake.local». Настоящий номер с «rcp-», «lr-» или «no-phone-» начинаться
// не может, так что проверка префикса безопасна.
const SYNTHETIC_RE = /(@intake\.local|^rcp-|^lr-|^no-phone-)/i;
const realFilled = (v) => filled(v) && !SYNTHETIC_RE.test(String(v).trim());

// 'HH:MM[:SS]' → минуты от полуночи
function toMinutes(t) {
  if (!t) return NaN;
  const [h, m] = String(t).split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

// Человекочитаемое имя реабилитанта/специалиста.
const personName = (p) =>
  p ? [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ').trim() : '';

/**
 * Полный отчёт о готовности реабилитанта.
 * @param {number} recipientId
 * @returns {Promise<object|null>} null — реабилитант не найден
 */
export async function getRecipientReadiness(recipientId) {
  const id = parseInt(recipientId, 10);
  if (!id) return null;

  const recipient = await Recipient.findByPk(id, {
    include: [{ model: RecipientDoc, as: 'docs' }]
  });
  if (!recipient) return null;

  const today = dayStr();
  const soon = dayStr(EXPIRING_SOON_DAYS);
  const doc = recipient.docs?.[0] || null;

  // ---- Сканы: только актуальные версии ------------------------------------
  const docTypes = await DocType.findAll();
  const scans = await RecipientScanDoc.findAll({
    where: { recipId: id },
    attributes: ['id', 'docType', 'isCurrent', 'originalName', 'uploadedAt']
  });
  const currentScanTypeIds = new Set(
    scans.filter((s) => s.isCurrent !== false).map((s) => s.docType)
  );
  const requiredTypes = docTypes.filter((t) => t.isRequired);
  const missingScans = requiredTypes
    .filter((t) => !currentScanTypeIds.has(t.id))
    .map((t) => ({ id: t.id, code: t.code, name: t.name }));

  // ---- Просроченные / истекающие документы --------------------------------
  const expired = [];
  const expiringSoon = [];
  if (doc?.mseValidDate) {
    const v = String(doc.mseValidDate).slice(0, 10);
    const row = { key: 'mse', label: 'Справка МСЭ', date: v, docId: doc.id };
    if (v < today) expired.push(row);
    else if (v <= soon) expiringSoon.push(row);
  }

  // ---- Шаги маршрута -------------------------------------------------------
  const steps = [
    {
      key: 'profile',
      label: 'Анкета',
      // E-mail здесь не проверяем: он всегда синтетический и о заполненности
      // карточки ничего не говорит. Телефон — наоборот, должен быть настоящим.
      done: filled(recipient.firstName) && filled(recipient.lastName) &&
            filled(recipient.birthDate) && realFilled(recipient.telephone),
      hint: 'ФИО, дата рождения и контактный телефон'
    },
    {
      key: 'medical',
      label: 'Медкарта',
      done: filled(recipient.diagnosis) && !!recipient.nozology && !!recipient.CRGMain,
      hint: 'Диагноз, нозология и ЦРГ'
    },
    {
      key: 'representative',
      label: 'Представитель',
      done: !!recipient.representativeId,
      hint: 'Законный представитель привязан к карточке'
    },
    {
      key: 'documents',
      label: 'Документы',
      done: !!doc && filled(doc.snils) && filled(doc.docSeries) && filled(doc.docNumber) &&
            filled(doc.mseValidDate),
      hint: 'СНИЛС, документ личности и справка МСЭ'
    },
    {
      key: 'scans',
      label: 'Сканы',
      done: missingScans.length === 0,
      hint: missingScans.length
        ? `Не загружены: ${missingScans.map((m) => m.name).join(', ')}`
        : 'Все обязательные файлы загружены'
    },
    {
      key: 'docsValid',
      label: 'Сроки документов',
      done: expired.length === 0,
      hint: expired.length
        ? `Просрочено: ${expired.map((e) => e.label).join(', ')}`
        : 'Просроченных документов нет'
    }
  ];

  const routeComplete = steps.every((s) => s.done);

  // ---- Текущие и запланированные диагностики -------------------------------
  const assignments = await DiagnosticAssignment.findAll({
    where: { recipientId: id },
    include: [
      { model: Direction, as: 'direction', attributes: ['id', 'name'] },
      { model: User, as: 'specialist', attributes: ['id', 'firstName', 'lastName', 'fullName'] }
    ],
    order: [['date', 'DESC'], ['startTime', 'DESC']]
  });

  const mapAssignment = (a) => ({
    id: a.id,
    sessionId: a.sessionId,
    date: String(a.date).slice(0, 10),
    startTime: a.startTime,
    endTime: a.endTime,
    blockStatus: a.blockStatus,
    directionId: a.directionId,
    direction: a.direction?.name || null,
    specialistUserId: a.specialistUserId,
    specialist: a.specialist?.fullName || personName(a.specialist) || null
  });

  // «Идёт сейчас» — незавершённый этап, дата которого сегодня или в прошлом.
  const inProgress = assignments
    .filter((a) => a.blockStatus !== 'completed' && String(a.date).slice(0, 10) <= today)
    .map(mapAssignment);

  // «Запланировано» — незавершённый этап в будущем.
  const upcoming = assignments
    .filter((a) => a.blockStatus !== 'completed' && String(a.date).slice(0, 10) > today)
    .map(mapAssignment);

  // Легаси-назначения (ReResult, published=false) тоже блокируют повтор.
  const legacyRows = await ReResult.findAll({
    where: { idRecipient: id, published: false },
    include: [{ model: Direction, as: 'direction', attributes: ['id', 'name'] }],
    order: [['date', 'DESC']]
  });
  const legacyOpen = legacyRows.map((r) => ({
    id: r.id,
    legacy: true,
    date: r.date ? String(r.date).slice(0, 10) : null,
    directionId: r.idDirection,
    direction: r.direction?.name || null
  }));

  // Незакрытые заявки на диагностику (назначенные датой).
  const openSessions = (await DiagnosticSession.findAll({
    where: { recipientId: id, status: { [Op.in]: ['open', 'in_progress'] } },
    order: [['date', 'ASC']]
  })).map((s) => ({
    id: s.id,
    date: String(s.date).slice(0, 10),
    status: s.status
  }));

  // ---- Собираем блокеры ----------------------------------------------------
  const blockers = [];

  if (recipient.status === 'archived') {
    blockers.push({
      code: 'archived',
      severity: 'error',
      message: 'Реабилитант в архиве — назначение диагностики недоступно'
    });
  }
  // Черновик — карточка заведена, но не завершена. Отдельная проверка нужна
  // потому, что шаги маршрута смотрят только на заполненность полей: у черновика
  // они все могут быть «зелёными», а карточка так и не была подтверждена.
  if (recipient.status === 'draft') {
    blockers.push({
      code: 'draft',
      severity: 'error',
      message: 'Карточка не завершена (черновик) — сначала завершите заполнение'
    });
  }
  for (const s of steps.filter((x) => !x.done)) {
    blockers.push({
      code: `route:${s.key}`,
      severity: 'error',
      message: `Маршрут не заполнен: ${s.label.toLowerCase()} — ${s.hint}`
    });
  }
  for (const a of inProgress) {
    blockers.push({
      code: 'diagnostic-in-progress',
      severity: 'error',
      message: `Диагностика уже идёт: ${a.direction || 'направление не указано'}` +
               `, ${a.date}${a.specialist ? ', ' + a.specialist : ''} — этап не завершён`,
      assignmentId: a.id
    });
  }
  for (const a of upcoming) {
    blockers.push({
      code: 'diagnostic-scheduled',
      severity: 'warning',
      message: `Уже запланирована диагностика на ${a.date}` +
               `${a.direction ? ' (' + a.direction + ')' : ''}`,
      assignmentId: a.id
    });
  }
  for (const r of legacyOpen) {
    blockers.push({
      code: 'diagnostic-legacy-open',
      severity: 'warning',
      message: `Есть непроведённая диагностика от ${r.date || 'без даты'}` +
               `${r.direction ? ' (' + r.direction + ')' : ''}`,
      assignmentId: r.id
    });
  }
  for (const s of openSessions) {
    // Заявка на сегодня/прошедшую дату — диагностика уже в работе.
    const started = s.date <= today;
    blockers.push({
      code: started ? 'session-in-progress' : 'session-open',
      severity: started ? 'error' : 'warning',
      message: started
        ? `Диагностика по заявке от ${s.date} ещё не закрыта заключением`
        : `Уже есть заявка на диагностику на ${s.date}`,
      sessionId: s.id
    });
  }
  for (const e of expiringSoon) {
    blockers.push({
      code: 'doc-expiring',
      severity: 'warning',
      message: `${e.label} истекает ${e.date} — обновите документ`
    });
  }

  const errors = blockers.filter((b) => b.severity === 'error');
  const warnings = blockers.filter((b) => b.severity === 'warning');

  return {
    recipientId: id,
    recipientName: personName(recipient),
    status: recipient.status,
    route: { complete: routeComplete, steps },
    docs: {
      hasDoc: !!doc,
      docId: doc?.id || null,
      expired,
      expiringSoon,
      missingScans,
      // Сводный флаг для значка уведомления в подменю карточки.
      alertCount: expired.length + missingScans.length,
      warnCount: expiringSoon.length
    },
    diagnostic: { inProgress, upcoming, legacyOpen, openSessions },
    blockers,
    errors,
    warnings,
    canAssign: errors.length === 0
  };
}

/**
 * Проверка занятости самого реабилитанта в указанном слоте.
 * Специалиста проверяет routes/schedule.js, а здесь ловим двойную запись
 * реабилитанта к разным специалистам на одно и то же время.
 */
export async function findRecipientSlotConflict(recipientId, date, startTime, endTime, excludeEventId = null) {
  const where = {
    recipientId,
    date,
    status: { [Op.ne]: 'cancelled' }
  };
  if (excludeEventId) where.id = { [Op.ne]: excludeEventId };
  const sameDay = await ScheduleEvent.findAll({
    where,
    include: [{ model: User, as: 'specialist', attributes: ['id', 'fullName', 'firstName', 'lastName'] }]
  });
  return sameDay.find((ev) => intervalsOverlap(startTime, endTime, ev.startTime, ev.endTime)) || null;
}

export { EXPIRING_SOON_DAYS, personName };

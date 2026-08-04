import { Op } from '@sequelize/core';
import {
  Recipient, RecipientDoc, RecipientScanDoc, DocType, ReGroup,
  DiagnosticAssignment, DiagnosticSession, DiagnosticConclusion,
  ScheduleEvent, ReResult, Direction, User
} from '../models/index.js';

const EXPIRING_SOON_DAYS = 30;

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dayStr = (offset = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return fmtDate(d);
};

const fmtRu = (v) => {
  if (!v) return '';
  const iso = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const VERDICT_SHORT = {
  recommended: 'рекомендован к зачислению',
  trial: 'пробные занятия',
  rejected: 'не рекомендован'
};

function lessonWord(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'занятие';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'занятия';
  return 'занятий';
}

const filled = (v) => v !== null && v !== undefined && String(v).trim() !== '';

const SYNTHETIC_RE = /(@intake\.local|^rcp-|^lr-|^no-phone-)/i;
const realFilled = (v) => filled(v) && !SYNTHETIC_RE.test(String(v).trim());

function toMinutes(t) {
  if (!t) return NaN;
  const [h, m] = String(t).split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

const personName = (p) =>
  p ? [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ').trim() : '';

export function buildLifecycle({
  recipient, steps, docTypes, currentScanTypeIds, missingScans,
  assignments, sessions, conclusions, group, lessons, today
}) {
  const concBySession = new Map((conclusions || []).map((c) => [c.sessionId, c]));
  const stepBy = Object.fromEntries((steps || []).map((s) => [s.key, s]));

  const intakeMissing = [];
  if (!stepBy.profile?.done) intakeMissing.push('анкета');
  if (!stepBy.medical?.done) intakeMissing.push('медкарта');
  if (!stepBy.representative?.done) intakeMissing.push('представитель');
  const intakeDone = recipient.status !== 'draft' && intakeMissing.length === 0;
  const intakeHint = recipient.status === 'draft'
    ? 'Карточка не завершена — черновик'
    : (intakeMissing.length
        ? `Не заполнено: ${intakeMissing.join(', ')}`
        : 'Карточка заведена · анкета, медкарта и представитель заполнены');

  const signedDiagType = (docTypes || []).find((t) => t.code === 'signed-diag') || null;
  const signedDiagOk = !signedDiagType || currentScanTypeIds.has(signedDiagType.id);
  const paperMissing = [];
  if (!stepBy.documents?.done) paperMissing.push('реквизиты документов');
  if (!stepBy.scans?.done) paperMissing.push(`сканы (${(missingScans || []).length})`);
  if (!stepBy.docsValid?.done) paperMissing.push('просроченные документы');
  if (!signedDiagOk) paperMissing.push('подписанное заявление');
  const paperDone = paperMissing.length === 0;
  const paperHint = paperDone
    ? 'Пакет документов собран · заявление подписано'
    : `Не хватает: ${paperMissing.join(', ')}`;

  const liveSessions = (sessions || []).filter((s) => s.status !== 'cancelled');
  const primarySession = liveSessions.find((s) => concBySession.has(s.id)) || null;
  const primaryConclusion = primarySession ? concBySession.get(primarySession.id) : null;
  const diagDone = !!primaryConclusion;
  let diagHint;
  if (diagDone) {
    const verdict = VERDICT_SHORT[primaryConclusion.verdict] || '';
    diagHint = `Заключение от ${fmtRu(primaryConclusion.issuedAt)}` + (verdict ? ` · ${verdict}` : '');
  } else if (liveSessions.length) {
    const last = liveSessions[liveSessions.length - 1];
    const blocks = (assignments || []).filter((a) => a.diagnosticSessionId === last.id);
    const doneBlocks = blocks.filter((a) => a.blockStatus === 'completed').length;
    diagHint = blocks.length
      ? `Заявка от ${fmtRu(last.date)} · сдано блоков: ${doneBlocks} из ${blocks.length}`
      : `Заявка от ${fmtRu(last.date)} — специалисты ещё не разобрали`;
  } else {
    diagHint = 'Диагностика не назначена';
  }

  const curatorName = personName(group?.curatorUser) || group?.curatorUser?.fullName || '';
  const enrolled = !!recipient.groupId;
  const enrollHint = enrolled
    ? `Группа «${group?.groupName || '—'}»` + (curatorName ? ` · куратор ${curatorName}` : ' · куратор не назначен')
    : (diagDone ? 'Заключение есть — осталось назначить группу' : 'Зачисление — после заключения диагностики');

  const lessonDates = (lessons || []).map((e) => String(e.date).slice(0, 10));
  const firstLesson = lessonDates[0] || null;
  const lessonsPast = lessonDates.filter((d) => d <= today).length;
  const weekNo = firstLesson
    ? Math.floor((Date.parse(today) - Date.parse(firstLesson)) / 604800000) + 1
    : null;
  const finalSession = firstLesson
    ? ([...liveSessions].reverse().find((s) =>
        String(s.date).slice(0, 10) >= firstLesson &&
        (!primarySession || s.id !== primarySession.id)) || null)
    : null;
  const lessonsDone = !!finalSession;
  let lessonsHint;
  if (lessonsDone) {
    lessonsHint = `Цикл занятий завершён · проведено ${lessonsPast} ${lessonWord(lessonsPast)}`;
  } else if (lessonDates.length) {
    lessonsHint = `${lessonsPast} из ${lessonDates.length} ${lessonWord(lessonDates.length)}` +
                  (weekNo ? ` · ${weekNo}-я неделя цикла` : '');
  } else if (enrolled) {
    lessonsHint = 'Занятия ещё не поставлены в расписание';
  } else {
    lessonsHint = 'Начинается после зачисления в группу';
  }

  const finalConclusion = finalSession ? (concBySession.get(finalSession.id) || null) : null;
  const cycleDone = !!finalConclusion;
  let cycleHint;
  if (cycleDone) {
    const verdict = VERDICT_SHORT[finalConclusion.verdict] || '';
    cycleHint = `Итоги подведены ${fmtRu(finalConclusion.issuedAt)}` + (verdict ? ` · ${verdict}` : '');
  } else if (finalSession) {
    cycleHint = `Итоговая диагностика назначена на ${fmtRu(finalSession.date)}`;
  } else {
    cycleHint = 'Подводится итоговой диагностикой в конце цикла';
  }

  const rawStages = [
    { key: 'intake',     num: '01', label: 'Заявка',           done: intakeDone,  hint: intakeHint,  warn: !intakeDone },
    { key: 'statement',  num: '02', label: 'Заявление',        done: paperDone,   hint: paperHint,   warn: !paperDone },
    { key: 'diagnostic', num: '03', label: 'Диагностика',      done: diagDone,    hint: diagHint,    warn: false },
    { key: 'enrollment', num: '04', label: 'Зачисление',       done: enrolled,    hint: enrollHint,  warn: false },
    { key: 'lessons',    num: '05', label: 'Занятия в группе', done: lessonsDone, hint: lessonsHint, warn: false },
    { key: 'cycle',      num: '06', label: 'Итоги цикла',      done: cycleDone,   hint: cycleHint,   warn: false }
  ];

  const currentIdx = rawStages.findIndex((s) => !s.done);
  const stages = rawStages.map((s, i) => ({
    ...s,
    state: s.done ? 'done' : (i === currentIdx ? 'current' : 'todo')
  }));

  return {
    stages,
    doneCount: stages.filter((s) => s.done).length,
    complete: currentIdx === -1,
    current: currentIdx === -1 ? null : {
      key: rawStages[currentIdx].key,
      num: rawStages[currentIdx].num,
      label: rawStages[currentIdx].label
    },
    cycle: {
      groupId: recipient.groupId || null,
      groupName: group?.groupName || '',
      curatorName,
      firstLesson,
      lessonsTotal: lessonDates.length,
      lessonsPast,
      weekNo
    }
  };
}

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

  const expired = [];
  const expiringSoon = [];
  if (doc?.mseValidDate) {
    const v = String(doc.mseValidDate).slice(0, 10);
    const row = { key: 'mse', label: 'Справка МСЭ', date: v, docId: doc.id };
    if (v < today) expired.push(row);
    else if (v <= soon) expiringSoon.push(row);
  }

  const steps = [
    {
      key: 'profile',
      label: 'Анкета',
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

  const inProgress = assignments
    .filter((a) => a.blockStatus !== 'completed' && String(a.date).slice(0, 10) <= today)
    .map(mapAssignment);

  const upcoming = assignments
    .filter((a) => a.blockStatus !== 'completed' && String(a.date).slice(0, 10) > today)
    .map(mapAssignment);

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

  const allSessions = await DiagnosticSession.findAll({
    where: { recipientId: id },
    order: [['date', 'ASC'], ['id', 'ASC']]
  });
  const openSessions = allSessions
    .filter((s) => s.status === 'open' || s.status === 'in_progress')
    .map((s) => ({
      id: s.id,
      date: String(s.date).slice(0, 10),
      status: s.status
    }));

  const group = recipient.groupId
    ? await ReGroup.findByPk(recipient.groupId, {
        include: [{
          model: User, as: 'curatorUser',
          attributes: ['id', 'firstName', 'lastName', 'middleName', 'fullName']
        }]
      })
    : null;

  const lessons = await ScheduleEvent.findAll({
    where: { recipientId: id, type: 'lesson', status: { [Op.ne]: 'cancelled' } },
    attributes: ['id', 'date', 'status'],
    order: [['date', 'ASC']]
  });

  const conclusions = await DiagnosticConclusion.findAll({
    where: { recipientId: id },
    order: [['issuedAt', 'ASC']]
  });

  const lifecycle = buildLifecycle({
    recipient, steps, docTypes, currentScanTypeIds, missingScans,
    assignments, sessions: allSessions, conclusions, group, lessons, today
  });

  const blockers = [];

  if (recipient.status === 'archived') {
    blockers.push({
      code: 'archived',
      severity: 'error',
      message: 'Реабилитант в архиве — назначение диагностики недоступно'
    });
  }
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
    lifecycle,
    docs: {
      hasDoc: !!doc,
      docId: doc?.id || null,
      expired,
      expiringSoon,
      missingScans,
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

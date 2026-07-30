import express from 'express';
import { Op } from '@sequelize/core';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  sequelize,
  ScheduleEvent,
  DiagnosticAssignment,
  DiagnosticSession,
  DiagnosticConclusion,
  User,
  Recipient,
  Direction
} from '../models/index.js';
import { getRecipientReadiness, findRecipientSlotConflict } from '../services/recipientReadiness.js';

const router = express.Router();

// ---- helpers ---------------------------------------------------------------

const RECIPIENT_ATTRS = ['id', 'firstName', 'lastName', 'middleName', 'photo', 'diagnosis'];
const SPECIALIST_ATTRS = ['id', 'firstName', 'lastName', 'email', 'phone', 'cabinet', 'directionId'];
const DIRECTION_ATTRS = ['id', 'name', 'profileKey'];

const eventIncludes = [
  { model: Recipient, as: 'recipient', attributes: RECIPIENT_ATTRS },
  { model: Direction, as: 'direction', attributes: DIRECTION_ATTRS },
  { model: User, as: 'specialist', attributes: SPECIALIST_ATTRS },
  {
    model: DiagnosticAssignment,
    as: 'assignment',
    attributes: ['id', 'sessionId', 'blockStatus', 'results', 'comment', 'completedAt']
  }
];

const assignmentIncludes = [
  { model: Recipient, as: 'recipient', attributes: RECIPIENT_ATTRS },
  { model: Direction, as: 'direction', attributes: DIRECTION_ATTRS },
  { model: User, as: 'specialist', attributes: SPECIALIST_ATTRS }
];

// 'HH:MM' | 'HH:MM:SS' → минуты от полуночи
function toMinutes(t) {
  if (!t) return NaN;
  const [h, m] = String(t).split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

// нормализуем время к 'HH:MM:SS' для хранения в MySQL TIME
function normTime(t) {
  if (!t) return null;
  const parts = String(t).split(':');
  const h = String(parts[0] ?? '00').padStart(2, '0');
  const m = String(parts[1] ?? '00').padStart(2, '0');
  const s = String(parts[2] ?? '00').padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

// Проверка занятости слота специалиста. Возвращает конфликтующее событие или null.
async function findConflict(specialistUserId, date, startTime, endTime, excludeEventId = null) {
  const where = {
    specialistUserId,
    date,
    status: { [Op.ne]: 'cancelled' }
  };
  if (excludeEventId) where.id = { [Op.ne]: excludeEventId };
  const sameDay = await ScheduleEvent.findAll({ where });
  return sameDay.find(ev => intervalsOverlap(startTime, endTime, ev.startTime, ev.endTime)) || null;
}

function isCoordinator(user) {
  return user.role === 'admin' || user.role === 'employee';
}

// Кто хозяин события/назначения (может редактировать/завершать этап).
function ownsAssignment(user, assignment) {
  return user.role === 'admin' || assignment.specialistUserId === user.id;
}

// Кто может видеть ЗАПОЛНЕННЫЕ блоки других специалистов, а не только свой.
// По умолчанию специалист видит лишь свой блок; отдельным специалистам
// администратор выставляет флаг canViewAllResults.
function canSeeAllResults(user) {
  return isCoordinator(user) || user.canViewAllResults === true;
}

// Кто может выдать итоговое заключение по диагностике.
// Право точечное: администратор выдаёт его конкретным специалистам.
function canIssueConclusion(user) {
  return user.role === 'admin' || user.canConclude === true;
}

// Решение по итогам диагностики — три варианта этапа 04 карточки:
// «Рекомендованы» / «Пробные (2 недели)» / «Не рекомендованы».
const VERDICTS = ['recommended', 'trial', 'rejected'];

// Маршрут диагностики — три этапа карточки; заключение это их итог, этап 04.
// Ключ — Direction.profileKey, значение — этап. Соответствие держим таким же,
// как PROFILE_BLOCKS в src/views/Diagnostics.vue.
const STAGE_BY_PROFILE = {
  psy: 'psy',
  log: 'psy',
  afk: 'afk',
  izo: 'soc',
  theatre: 'soc',
  vocal: 'soc',
  instrument: 'soc'
};

// Заключение выдаётся только после этапов 01–03 — ровно то, что написано
// на самой карточке: «Ожидает этапов 01–03». Раньше сервер смотрел лишь на
// ВЗЯТЫЕ блоки, поэтому заявку, где отметился один психолог, можно было
// закрыть заключением, не проведя ни АФК, ни социокультурную диагностику.
const REQUIRED_STAGES = [
  { key: 'psy', title: '01 Психолог + логопед' },
  { key: 'afk', title: '02 АФК' },
  { key: 'soc', title: '03 Социокультурная' }
];

// Незакрытые этапы. Этап пройден, когда сданы ВСЕ его блоки в заявке.
//
// Раньше хватало одного завершённого блока на этап, и этап 01 закрывался
// психологом в одиночку — логопед оставался «в работе», но сервер считал
// этап пройденным. Отсюда и расхождение: карточка (она требует все блоки)
// показывала одно, сервер — другое, и у разных специалистов «пройденные
// этапы» не совпадали. Теперь правило одно и то же с обеих сторон.
function missingStages(assignments) {
  const byStage = new Map();
  for (const a of assignments || []) {
    const stage = STAGE_BY_PROFILE[a.direction?.profileKey || ''];
    if (!stage) continue;
    if (!byStage.has(stage)) byStage.set(stage, []);
    byStage.get(stage).push(a);
  }
  return REQUIRED_STAGES.filter((s) => {
    const blocks = byStage.get(s.key) || [];
    // Ни одного блока — этап вообще никто не взял, он точно не пройден.
    if (!blocks.length) return true;
    return !blocks.every((a) => a.blockStatus === 'completed');
  });
}

const today = () => new Date().toISOString().slice(0, 10);

// Один блок диагностики глазами конкретного пользователя.
// Чужие результаты скрываем, если нет права их видеть.
function serializeBlock(a, viewer) {
  const mine = a.specialistUserId === viewer.id;
  const visible = mine || canSeeAllResults(viewer);
  return {
    id: a.id,
    // Заявка, которой принадлежит блок. Без неё карточка не может отличить
    // блоки текущей диагностики от блоков прошлых, уже закрытых заявок
    // того же реабилитанта — и рискует записать результат не в ту.
    diagnosticSessionId: a.diagnosticSessionId,
    directionId: a.directionId,
    direction: a.direction || null,
    specialistUserId: a.specialistUserId,
    specialistName: a.specialist?.fullName || '',
    cabinet: a.specialist?.cabinet || null,
    profileKey: a.direction?.profileKey || null,
    blockStatus: a.blockStatus,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    completedAt: a.completedAt,
    isMine: mine,
    results: visible ? (a.results || null) : null,
    comment: visible ? (a.comment || null) : null,
    // Блок заполнен, но конкретно этому пользователю его содержимое не видно.
    resultsHidden: !visible
  };
}

// ---- список специалистов (для формы назначения) ----------------------------
router.get('/specialists', authMiddleware, async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: { role: 'teacher' },
      attributes: SPECIALIST_ATTRS,
      include: [{ model: Direction, as: 'direction', attributes: DIRECTION_ATTRS }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ---- события расписания -----------------------------------------------------
// GET /events?from=YYYY-MM-DD&to=YYYY-MM-DD&specialistUserId=&type=
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { from, to, type } = req.query;
    const where = {};

    // Преподаватель видит только своё расписание. Координатор может указать
    // конкретного специалиста, иначе видит все события за период.
    if (req.user.role === 'teacher') {
      where.specialistUserId = req.user.id;
    } else if (req.query.specialistUserId) {
      where.specialistUserId = parseInt(req.query.specialistUserId, 10);
    }

    if (from && to) where.date = { [Op.between]: [from, to] };
    else if (from) where.date = { [Op.gte]: from };
    else if (to) where.date = { [Op.lte]: to };

    if (type) where.type = type;
    where.status = { [Op.ne]: 'cancelled' };

    const events = await ScheduleEvent.findAll({
      where,
      include: eventIncludes,
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /events — создать обычное занятие (lesson)
router.post('/events', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    let { specialistUserId, recipientId, directionId, title, date, startTime, endTime } = req.body;
    // Преподаватель может создавать события только в своём расписании.
    if (req.user.role === 'teacher') specialistUserId = req.user.id;
    if (!specialistUserId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Укажите специалиста, дату и время' });
    }
    startTime = normTime(startTime);
    endTime = normTime(endTime);
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res.status(400).json({ message: 'Время окончания должно быть позже начала' });
    }

    const conflict = await findConflict(specialistUserId, date, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        message: `Слот занят: уже есть событие ${conflict.startTime}–${conflict.endTime}`
      });
    }

    const event = await ScheduleEvent.create({
      specialistUserId,
      recipientId: recipientId || null,
      directionId: directionId || null,
      assignmentId: null,
      type: 'lesson',
      title: title || 'Занятие',
      date,
      startTime,
      endTime,
      status: 'scheduled',
      createdBy: req.user.id
    });
    const full = await ScheduleEvent.findByPk(event.id, { include: eventIncludes });
    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// DELETE /events/:id — отменить/удалить событие (и связанное назначение)
router.delete('/events/:id', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    const event = await ScheduleEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Событие не найдено' });
    if (req.user.role === 'teacher' && event.specialistUserId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    const assignmentId = event.assignmentId;
    await event.destroy();
    if (assignmentId) {
      await DiagnosticAssignment.destroy({ where: { id: assignmentId } });
    }
    res.json({ message: 'Событие удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ---- назначения диагностики -------------------------------------------------
// GET /assignments/readiness/:recipientId — проверка перед назначением.
// Отдаёт заполненность маршрута, просроченные документы и мешающие факторы,
// чтобы форма назначения показала чек-лист ещё до отправки.
router.get('/assignments/readiness/:recipientId', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    const readiness = await getRecipientReadiness(req.params.recipientId);
    if (!readiness) return res.status(404).json({ message: 'Реабилитант не найден' });
    res.json(readiness);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ============================================================================
//  ЗАЯВКИ НА ДИАГНОСТИКУ — назначение ТОЛЬКО датой
// ============================================================================
// Ресепшн (employee) не знает, кто из специалистов сегодня работает, поэтому
// он не выбирает ни направление, ни специалиста, ни время — только дату.
// Дальше специалисты сами разбирают заявки из общего пула (POST .../claim).

const sessionIncludes = [
  { model: Recipient, as: 'recipient', attributes: RECIPIENT_ATTRS },
  { model: User, as: 'author', attributes: SPECIALIST_ATTRS },
  {
    model: DiagnosticAssignment,
    as: 'assignments',
    include: [
      { model: Direction, as: 'direction', attributes: DIRECTION_ATTRS },
      { model: User, as: 'specialist', attributes: SPECIALIST_ATTRS }
    ]
  },
  {
    model: DiagnosticConclusion,
    as: 'conclusion',
    include: [{ model: User, as: 'author', attributes: SPECIALIST_ATTRS }]
  }
];

function loadSession(id) {
  return DiagnosticSession.findByPk(id, { include: sessionIncludes });
}

// Заявка глазами конкретного пользователя.
function serializeSession(s, viewer) {
  const blocks = (s.assignments || [])
    .slice()
    .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')))
    .map((a) => serializeBlock(a, viewer));
  const completed = blocks.filter((b) => b.blockStatus === 'completed').length;
  // Чего не хватает для заключения: этапы 01–03 без единого сданного блока.
  const missing = missingStages(s.assignments || []);
  return {
    id: s.id,
    recipientId: s.recipientId,
    recipient: s.recipient || null,
    date: s.date,
    status: s.status,
    note: s.note || null,
    createdBy: s.createdBy,
    authorName: s.author?.fullName || '',
    createdAt: s.createdAt,
    closedAt: s.closedAt,
    blocks,
    total: blocks.length,
    completed,
    fullyCompleted: blocks.length > 0 && completed === blocks.length,
    // Непройденные этапы маршрута и общий признак готовности к заключению.
    // Форма этапа 04 опирается на них, чтобы не предлагать выдать вердикт
    // раньше, чем специалисты закончат свои этапы.
    missingStages: missing,
    readyForConclusion: blocks.length > 0 && completed === blocks.length && missing.length === 0,
    mine: blocks.filter((b) => b.isMine).map((b) => b.id),
    canViewAll: canSeeAllResults(viewer),
    canConclude: canIssueConclusion(viewer),
    conclusion: s.conclusion
      ? {
          id: s.conclusion.id,
          // Решение по итогам диагностики (этап 04 карточки). null у старых
          // заключений, выданных из «Расписания» до появления поля.
          verdict: s.conclusion.verdict || null,
          summary: s.conclusion.summary,
          recommendations: s.conclusion.recommendations,
          authorId: s.conclusion.authorId,
          authorName: s.conclusion.author?.fullName || '',
          issuedAt: s.conclusion.issuedAt
        }
      : null
  };
}

// POST /sessions — ресепшн создаёт заявку. В теле только recipientId + date.
router.post('/sessions', authMiddleware, roleMiddleware('admin', 'employee'), async (req, res) => {
  try {
    const { recipientId, date, note } = req.body;
    if (!recipientId || !date) {
      return res.status(400).json({ message: 'Укажите реабилитанта и дату диагностики' });
    }
    if (String(date) < today()) {
      return res.status(400).json({ message: 'Дата диагностики не может быть в прошлом' });
    }

    // Незакрытая заявка — жёсткий стоп, и проверяем его ПЕРВЫМ. Готовность
    // маршрута выдаёт на ту же ситуацию расплывчатый блокер (а на будущую дату —
    // всего лишь warning, который админ мог бы продавить через force и получить
    // дубль). Точное сообщение здесь важнее.
    const active = await DiagnosticSession.findOne({
      where: { recipientId, status: { [Op.in]: ['open', 'in_progress'] } }
    });
    if (active) {
      return res.status(409).json({
        message: `У реабилитанта уже есть активная заявка на диагностику от ${String(active.date).slice(0, 10)}`,
        sessionId: active.id
      });
    }

    // Те же проверки готовности, что и раньше: маршрут, документы, занятость.
    const readiness = await getRecipientReadiness(recipientId);
    if (!readiness) return res.status(404).json({ message: 'Реабилитант не найден' });

    const force = req.body.force === true && req.user.role === 'admin';
    if (readiness.errors.length) {
      return res.status(422).json({
        message: 'Нельзя назначить диагностику: сначала устраните препятствия',
        blockers: readiness.errors,
        readiness
      });
    }
    if (!force && readiness.warnings.length) {
      return res.status(422).json({
        message: 'Есть предупреждения — подтвердите назначение',
        blockers: readiness.warnings,
        confirmable: req.user.role === 'admin',
        readiness
      });
    }

    const created = await DiagnosticSession.create({
      recipientId,
      date,
      status: 'open',
      note: note?.trim() || null,
      createdBy: req.user.id
    });

    res.status(201).json(serializeSession(await loadSession(created.id), req.user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// GET /sessions?from=&to=&status=&recipientId=
router.get('/sessions', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    const { from, to, status, recipientId } = req.query;
    const where = {};
    if (from && to) where.date = { [Op.between]: [from, to] };
    else if (from) where.date = { [Op.gte]: from };
    else if (to) where.date = { [Op.lte]: to };
    if (status) where.status = status;
    if (recipientId) where.recipientId = parseInt(recipientId, 10);

    // Преподаватель в этом списке видит только те заявки, которые он взял.
    if (req.user.role === 'teacher') {
      const mine = await DiagnosticAssignment.findAll({
        where: { specialistUserId: req.user.id, diagnosticSessionId: { [Op.ne]: null } },
        attributes: ['diagnosticSessionId']
      });
      const ids = [...new Set(mine.map((a) => a.diagnosticSessionId))];
      if (!ids.length) return res.json([]);
      where.id = { [Op.in]: ids };
    }

    const rows = await DiagnosticSession.findAll({
      where,
      include: sessionIncludes,
      order: [['date', 'DESC'], ['id', 'DESC']]
    });
    res.json(rows.map((s) => serializeSession(s, req.user)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// GET /pool?from=&to= — свободные заявки, которые специалист может взять себе.
// Именно здесь специалист «берёт» реабилитанта на диагностику.
router.get('/pool', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    const from = req.query.from || today();
    const to = req.query.to || null;
    const where = {
      status: { [Op.in]: ['open', 'in_progress'] },
      date: to ? { [Op.between]: [from, to] } : { [Op.gte]: from }
    };

    const rows = await DiagnosticSession.findAll({
      where,
      include: sessionIncludes,
      order: [['date', 'ASC'], ['id', 'ASC']]
    });

    const list = rows.map((s) => {
      const view = serializeSession(s, req.user);
      // Уже взял этого реабилитанта — повторно брать нельзя.
      view.claimedByMe = view.blocks.some((b) => b.specialistUserId === req.user.id);
      return view;
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// GET /sessions/:id — доска диагностики (для просмотра в реальном времени)
router.get('/sessions/:id', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    const s = await loadSession(req.params.id);
    if (!s) return res.status(404).json({ message: 'Заявка не найдена' });
    res.json(serializeSession(s, req.user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /sessions/:id/claim — специалист берёт реабилитанта себе.
// Направление НЕ передаётся: берём профиль из учётной записи специалиста.
router.post('/sessions/:id/claim', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  const t = await sequelize.startUnmanagedTransaction();
  try {
    let { startTime, endTime, specialistUserId } = req.body;

    // Преподаватель берёт только на себя; админ может назначить за другого.
    const targetId = req.user.role === 'admin' && specialistUserId ? specialistUserId : req.user.id;
    const specialist = await User.findByPk(targetId);
    if (!specialist) {
      await t.rollback();
      return res.status(400).json({ message: 'Специалист не найден' });
    }
    if (!specialist.directionId) {
      await t.rollback();
      return res.status(400).json({
        message: 'У специалиста не указан профиль (направление). Обратитесь к администратору.'
      });
    }

    const session = await DiagnosticSession.findByPk(req.params.id);
    if (!session) {
      await t.rollback();
      return res.status(404).json({ message: 'Заявка не найдена' });
    }
    if (session.status === 'cancelled') {
      await t.rollback();
      return res.status(409).json({ message: 'Заявка отменена' });
    }
    if (session.status === 'completed') {
      await t.rollback();
      return res.status(409).json({ message: 'По заявке уже выдано заключение' });
    }

    const already = await DiagnosticAssignment.findOne({
      where: { diagnosticSessionId: session.id, specialistUserId: targetId }
    });
    if (already) {
      await t.rollback();
      return res.status(409).json({ message: 'Вы уже взяли этого реабилитанта на диагностику' });
    }

    startTime = normTime(startTime);
    endTime = normTime(endTime);
    if (!startTime || !endTime) {
      await t.rollback();
      return res.status(400).json({ message: 'Укажите время начала и окончания' });
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      await t.rollback();
      return res.status(400).json({ message: 'Время окончания должно быть позже начала' });
    }

    // Специалист не может вести двоих одновременно.
    const conflict = await findConflict(targetId, session.date, startTime, endTime);
    if (conflict) {
      await t.rollback();
      return res.status(409).json({
        message: `Ваш слот занят: уже есть событие ${conflict.startTime}–${conflict.endTime}`
      });
    }
    // Реабилитант тоже не может быть в двух кабинетах сразу.
    const ownConflict = await findRecipientSlotConflict(session.recipientId, session.date, startTime, endTime);
    if (ownConflict) {
      await t.rollback();
      const who = ownConflict.specialist?.fullName || '';
      return res.status(409).json({
        message: `Реабилитант занят ${ownConflict.startTime}–${ownConflict.endTime}${who ? ' (' + who + ')' : ''}`
      });
    }

    const assignment = await DiagnosticAssignment.create({
      sessionId: `S-${session.recipientId}-${session.date}`,
      diagnosticSessionId: session.id,
      recipientId: session.recipientId,
      directionId: specialist.directionId,
      specialistUserId: targetId,
      date: session.date,
      startTime,
      endTime,
      blockStatus: 'assigned',
      results: null,
      comment: null,
      createdBy: req.user.id
    }, { transaction: t });

    await ScheduleEvent.create({
      specialistUserId: targetId,
      recipientId: session.recipientId,
      directionId: specialist.directionId,
      assignmentId: assignment.id,
      type: 'diagnostic',
      title: 'Диагностика',
      date: session.date,
      startTime,
      endTime,
      status: 'scheduled',
      createdBy: req.user.id
    }, { transaction: t });

    if (session.status === 'open') {
      session.status = 'in_progress';
      await session.save({ transaction: t });
    }

    await t.commit();
    res.status(201).json({
      assignmentId: assignment.id,
      session: serializeSession(await loadSession(session.id), req.user)
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /sessions/:id/cancel — снять заявку (координатор).
router.post('/sessions/:id/cancel', authMiddleware, roleMiddleware('admin', 'employee'), async (req, res) => {
  try {
    const session = await DiagnosticSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ message: 'Заявка не найдена' });
    if (session.status === 'completed') {
      return res.status(409).json({ message: 'По заявке уже выдано заключение' });
    }

    const blocks = await DiagnosticAssignment.findAll({ where: { diagnosticSessionId: session.id } });
    const done = blocks.filter((b) => b.blockStatus === 'completed');
    if (done.length && req.user.role !== 'admin') {
      return res.status(409).json({
        message: `Нельзя отменить: ${done.length} этап(ов) уже заполнены специалистами`
      });
    }

    // Снимаем незавершённые слоты из расписания, заполненные данные не трогаем.
    for (const b of blocks) {
      if (b.blockStatus === 'completed') continue;
      await ScheduleEvent.destroy({ where: { assignmentId: b.id } });
      await b.destroy();
    }

    session.status = 'cancelled';
    session.closedAt = new Date();
    await session.save();
    res.json({ message: 'Заявка отменена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ---- Итоговое заключение ----------------------------------------------------
// Право выдать заключение есть НЕ у всех: только у специалистов с флагом
// canConclude (выставляет администратор) и у самого администратора.
router.post('/sessions/:id/conclusion', authMiddleware, async (req, res) => {
  try {
    if (!canIssueConclusion(req.user)) {
      return res.status(403).json({
        message: 'У вас нет права выдавать заключение по диагностике'
      });
    }
    const session = await DiagnosticSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ message: 'Заявка не найдена' });
    if (session.status === 'cancelled') {
      return res.status(409).json({ message: 'Заявка отменена' });
    }

    const summary = String(req.body.summary || '').trim();
    if (summary.length < 10) {
      return res.status(400).json({
        message: 'Заключение слишком короткое (минимум 10 символов)',
        field: 'summary'
      });
    }

    const existing = await DiagnosticConclusion.findOne({ where: { sessionId: session.id } });

    // Готовность маршрута проверяем только при ПЕРВОЙ выдаче. Правка уже
    // выданного заключения — это исправление текста, а не новое решение,
    // и запирать её из-за незакрытых этапов нельзя.
    if (!existing) {
      // Направление блока нужно, чтобы понять, к какому этапу маршрута он
      // относится: проверяем не только «все ли взятые блоки сданы», но и
      // «пройдены ли сами этапы 01–03».
      const blocks = await DiagnosticAssignment.findAll({
        where: { diagnosticSessionId: session.id },
        include: [{ model: Direction, as: 'direction', attributes: DIRECTION_ATTRS }]
      });
      if (!blocks.length) {
        return res.status(422).json({ message: 'Ни один специалист ещё не провёл диагностику' });
      }
      const pending = blocks.filter((b) => b.blockStatus !== 'completed');
      const missing = missingStages(blocks);
      const force = req.body.force === true && req.user.role === 'admin';
      // Заключение — четвёртый этап, и выдаётся он только когда пройдены первые
      // три. Проверки две, и обе обязательны: по каждому из этапов 01–03 должен
      // быть хотя бы один ЗАВЕРШЁННЫЙ блок, и ни один взятый блок не должен
      // висеть незакрытым. Раньше была только вторая — поэтому заявку, где
      // отметился один психолог, можно было закрыть заключением, не проведя
      // ни АФК, ни социокультурную диагностику.
      if ((pending.length || missing.length) && !force) {
        const parts = [];
        if (missing.length) parts.push('не пройдены этапы ' + missing.map((s) => s.title).join(', '));
        if (pending.length) parts.push(`не сдано блоков: ${pending.length} из ${blocks.length}`);
        return res.status(422).json({
          message: 'Заключение выдаётся после этапов 01–03: ' + parts.join('; '),
          pending: pending.length,
          total: blocks.length,
          missingStages: missing,
          confirmable: req.user.role === 'admin'
        });
      }
    }

    const recommendations = String(req.body.recommendations || '').trim() || null;

    // Вердикт приходит с этапа 04 карточки диагностики. Из «Расписания»
    // его могут не прислать — тогда сохраняем то, что было (не затираем
    // ранее выставленное решение пустым значением).
    const rawVerdict = String(req.body.verdict || '').trim();
    if (rawVerdict && !VERDICTS.includes(rawVerdict)) {
      return res.status(400).json({
        message: 'Недопустимое решение по итогам диагностики',
        field: 'verdict'
      });
    }

    if (existing) {
      existing.summary = summary;
      existing.recommendations = recommendations;
      if (rawVerdict) existing.verdict = rawVerdict;
      existing.authorId = req.user.id;
      existing.issuedAt = new Date();
      await existing.save();
    } else {
      await DiagnosticConclusion.create({
        sessionId: session.id,
        recipientId: session.recipientId,
        verdict: rawVerdict || null,
        summary,
        recommendations,
        authorId: req.user.id,
        issuedAt: new Date()
      });
    }

    session.status = 'completed';
    session.closedAt = new Date();
    await session.save();

    res.status(201).json(serializeSession(await loadSession(session.id), req.user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /assignments — прямое назначение конкретному специалисту.
// Оставлено только администратору как ручное исключение: обычный сценарий —
// заявка датой (POST /sessions) + разбор специалистами (POST .../claim).
router.post('/assignments', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const t = await sequelize.startUnmanagedTransaction();
  try {
    let { recipientId, directionId, specialistUserId, date, startTime, endTime, comment, sessionId } = req.body;
    if (!recipientId || !directionId || !specialistUserId || !date || !startTime || !endTime) {
      await t.rollback();
      return res.status(400).json({ message: 'Заполните реабилитанта, тип, специалиста, дату и время' });
    }
    startTime = normTime(startTime);
    endTime = normTime(endTime);
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      await t.rollback();
      return res.status(400).json({ message: 'Время окончания должно быть позже начала' });
    }

    const specialist = await User.findByPk(specialistUserId);
    if (!specialist) {
      await t.rollback();
      return res.status(400).json({ message: 'Специалист не найден' });
    }

    // ---- Проверка готовности реабилитанта ----------------------------------
    // Диагностику назначаем только при полностью заполненном маршруте, без
    // просроченных документов и когда другая диагностика не идёт прямо сейчас.
    // Предупреждения (истекающие документы, уже запланированная диагностика)
    // можно осознанно проигнорировать флагом force — только для админа.
    const readiness = await getRecipientReadiness(recipientId);
    if (!readiness) {
      await t.rollback();
      return res.status(404).json({ message: 'Реабилитант не найден' });
    }
    const force = req.body.force === true && req.user.role === 'admin';
    if (readiness.errors.length) {
      await t.rollback();
      return res.status(422).json({
        message: 'Нельзя назначить диагностику: сначала устраните препятствия',
        blockers: readiness.errors,
        readiness
      });
    }
    if (!force && readiness.warnings.length) {
      await t.rollback();
      return res.status(422).json({
        message: 'Есть предупреждения — подтвердите назначение',
        blockers: readiness.warnings,
        confirmable: req.user.role === 'admin',
        readiness
      });
    }

    // Валидация конфликта времени — не сохраняем, если слот занят.
    const conflict = await findConflict(specialistUserId, date, startTime, endTime);
    if (conflict) {
      await t.rollback();
      return res.status(409).json({
        message: `Слот занят: у специалиста уже есть событие ${conflict.startTime}–${conflict.endTime}`
      });
    }

    // Реабилитант тоже не может быть в двух местах одновременно.
    const ownConflict = await findRecipientSlotConflict(recipientId, date, startTime, endTime);
    if (ownConflict) {
      await t.rollback();
      const who = ownConflict.specialist?.fullName || '';
      return res.status(409).json({
        message: `Реабилитант уже занят ${ownConflict.startTime}–${ownConflict.endTime}` +
                 `${who ? ' (' + who + ')' : ''}`
      });
    }

    const assignment = await DiagnosticAssignment.create({
      sessionId: sessionId || `S-${recipientId}-${date}`,
      recipientId,
      directionId,
      specialistUserId,
      date,
      startTime,
      endTime,
      blockStatus: 'assigned',
      results: null,
      comment: comment || null,
      createdBy: req.user.id
    }, { transaction: t });

    // Авто-пуш события в расписание специалиста.
    await ScheduleEvent.create({
      specialistUserId,
      recipientId,
      directionId,
      assignmentId: assignment.id,
      type: 'diagnostic',
      title: 'Диагностика',
      date,
      startTime,
      endTime,
      status: 'scheduled',
      createdBy: req.user.id
    }, { transaction: t });

    await t.commit();
    const full = await DiagnosticAssignment.findByPk(assignment.id, { include: assignmentIncludes });
    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Все блоки одной диагностики. Новые назначения группируются по заявке
// (diagnosticSessionId), старые — по строковому sessionId/дате.
async function siblingBlocks(assignment) {
  const where = {};
  if (assignment.diagnosticSessionId) {
    where.diagnosticSessionId = assignment.diagnosticSessionId;
  } else {
    where.recipientId = assignment.recipientId;
    if (assignment.sessionId) where.sessionId = assignment.sessionId;
    else where.date = assignment.date;
  }
  return DiagnosticAssignment.findAll({
    where,
    include: [
      { model: Direction, as: 'direction', attributes: DIRECTION_ATTRS },
      { model: User, as: 'specialist', attributes: SPECIALIST_ATTRS }
    ],
    order: [['startTime', 'ASC']]
  });
}

// Статус сессии (FULLY_COMPLETED, когда все этапы завершены) + блоки коллег.
// viewer нужен, чтобы решить, показывать ли содержимое чужих блоков.
async function sessionSummary(assignment, viewer) {
  const siblings = await siblingBlocks(assignment);
  const total = siblings.length;
  const completed = siblings.filter(a => a.blockStatus === 'completed').length;
  return {
    sessionId: assignment.diagnosticSessionId || null,
    total,
    completed,
    fullyCompleted: total > 0 && completed === total,
    canViewAll: canSeeAllResults(viewer),
    canConclude: canIssueConclusion(viewer),
    siblings: siblings.map(a => serializeBlock(a, viewer))
  };
}

// GET /assignments/:id — данные для модалки заполнения + агрегат сессии
router.get('/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await DiagnosticAssignment.findByPk(req.params.id, { include: assignmentIncludes });
    if (!assignment) return res.status(404).json({ message: 'Назначение не найдено' });
    // Свой блок открыт всегда. Чужой — только координаторам и специалистам
    // с правом видеть результаты коллег (canViewAllResults), и только на чтение.
    const mine = assignment.specialistUserId === req.user.id;
    if (!mine && !canSeeAllResults(req.user)) {
      return res.status(403).json({ message: 'Доступ запрещён: это блок другого специалиста' });
    }
    const session = await sessionSummary(assignment, req.user);
    res.json({
      assignment,
      session,
      canEdit: ownsAssignment(req.user, assignment),
      canViewAll: canSeeAllResults(req.user),
      canConclude: canIssueConclusion(req.user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PATCH /assignments/:id — сохранить черновик своего блока
router.patch('/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await DiagnosticAssignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Назначение не найдено' });
    // Доступ строго: только владелец блока (или админ). Логопед не может
    // редактировать чужой блок.
    if (!ownsAssignment(req.user, assignment)) {
      return res.status(403).json({ message: 'Можно редактировать только свой блок' });
    }
    const { results, comment } = req.body;
    if (results !== undefined) assignment.results = results;
    if (comment !== undefined) assignment.comment = comment;
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /assignments/:id/complete — «Завершить свой этап»
router.post('/assignments/:id/complete', authMiddleware, async (req, res) => {
  try {
    const assignment = await DiagnosticAssignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Назначение не найдено' });
    if (!ownsAssignment(req.user, assignment)) {
      return res.status(403).json({ message: 'Можно завершать только свой этап' });
    }
    const { results, comment } = req.body;
    if (results !== undefined) assignment.results = results;
    if (comment !== undefined) assignment.comment = comment;
    assignment.blockStatus = 'completed';
    assignment.completedAt = new Date();
    await assignment.save();

    // Синхронизируем статус события в расписании.
    await ScheduleEvent.update(
      { status: 'completed' },
      { where: { assignmentId: assignment.id } }
    );

    const session = await sessionSummary(assignment, req.user);
    res.json({ assignment, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /assignments/:id/reopen — вернуть этап в работу
router.post('/assignments/:id/reopen', authMiddleware, async (req, res) => {
  try {
    const assignment = await DiagnosticAssignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Назначение не найдено' });
    if (!ownsAssignment(req.user, assignment)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    assignment.blockStatus = 'assigned';
    assignment.completedAt = null;
    await assignment.save();
    await ScheduleEvent.update(
      { status: 'scheduled' },
      { where: { assignmentId: assignment.id } }
    );
    const session = await sessionSummary(assignment, req.user);
    res.json({ assignment, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /assignments/:id/release — специалист отказывается от взятого блока.
// Слот освобождается, заявка снова доступна другим специалистам в пуле.
router.post('/assignments/:id/release', authMiddleware, async (req, res) => {
  try {
    const assignment = await DiagnosticAssignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Назначение не найдено' });
    if (!ownsAssignment(req.user, assignment)) {
      return res.status(403).json({ message: 'Можно освободить только свой блок' });
    }
    if (assignment.blockStatus === 'completed' && req.user.role !== 'admin') {
      return res.status(409).json({
        message: 'Этап уже завершён — сначала верните его в работу'
      });
    }

    const sessionId = assignment.diagnosticSessionId;
    await ScheduleEvent.destroy({ where: { assignmentId: assignment.id } });
    await assignment.destroy();

    // Если блоков не осталось — заявка снова «свободна».
    if (sessionId) {
      const left = await DiagnosticAssignment.count({ where: { diagnosticSessionId: sessionId } });
      if (!left) {
        await DiagnosticSession.update({ status: 'open' }, { where: { id: sessionId, status: 'in_progress' } });
      }
    }
    res.json({ message: 'Блок освобождён', sessionId: sessionId || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

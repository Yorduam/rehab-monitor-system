import express from 'express';
import { Op } from '@sequelize/core';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  sequelize,
  ScheduleEvent,
  DiagnosticAssignment,
  User,
  Recipient,
  Direction
} from '../models/index.js';

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
// POST /assignments — Сценарий А: координатор назначает диагностику
router.post('/assignments', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
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

    // Валидация конфликта времени — не сохраняем, если слот занят.
    const conflict = await findConflict(specialistUserId, date, startTime, endTime);
    if (conflict) {
      await t.rollback();
      return res.status(409).json({
        message: `Слот занят: у специалиста уже есть событие ${conflict.startTime}–${conflict.endTime}`
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

// Собрать статус сессии (FULLY_COMPLETED, когда все этапы завершены).
async function sessionSummary(assignment) {
  const where = { recipientId: assignment.recipientId };
  if (assignment.sessionId) where.sessionId = assignment.sessionId;
  else where.date = assignment.date;
  const siblings = await DiagnosticAssignment.findAll({
    where,
    include: [{ model: Direction, as: 'direction', attributes: DIRECTION_ATTRS }],
    order: [['startTime', 'ASC']]
  });
  const total = siblings.length;
  const completed = siblings.filter(a => a.blockStatus === 'completed').length;
  return {
    total,
    completed,
    fullyCompleted: total > 0 && completed === total,
    siblings: siblings.map(a => ({
      id: a.id,
      directionId: a.directionId,
      direction: a.direction,
      blockStatus: a.blockStatus,
      specialistUserId: a.specialistUserId
    }))
  };
}

// GET /assignments/:id — данные для модалки заполнения + агрегат сессии
router.get('/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await DiagnosticAssignment.findByPk(req.params.id, { include: assignmentIncludes });
    if (!assignment) return res.status(404).json({ message: 'Назначение не найдено' });
    if (req.user.role === 'teacher' && assignment.specialistUserId !== req.user.id && !isCoordinator(req.user)) {
      // преподаватель может открыть только своё назначение
      if (assignment.specialistUserId !== req.user.id) {
        return res.status(403).json({ message: 'Доступ запрещён' });
      }
    }
    const session = await sessionSummary(assignment);
    res.json({ assignment, session, canEdit: ownsAssignment(req.user, assignment) });
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

    const session = await sessionSummary(assignment);
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
    const session = await sessionSummary(assignment);
    res.json({ assignment, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

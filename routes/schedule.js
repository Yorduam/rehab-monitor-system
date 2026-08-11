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

function toMinutes(t) {
  if (!t) return NaN;
  const [h, m] = String(t).split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

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

function ownsAssignment(user, assignment) {
  return user.role === 'admin' || assignment.specialistUserId === user.id;
}

function canSeeAllResults(user) {
  return isCoordinator(user) || user.canViewAllResults === true;
}

function canIssueConclusion(user) {
  return user.role === 'admin' || user.canConclude === true;
}

const VERDICTS = ['recommended', 'trial', 'rejected'];

const STAGE_BY_PROFILE = {
  psy: 'psy',
  log: 'psy',
  afk: 'afk',
  izo: 'soc',
  theatre: 'soc',
  vocal: 'soc',
  instrument: 'soc'
};

const REQUIRED_STAGES = [
  { key: 'psy', title: '01 Психолог + логопед' },
  { key: 'afk', title: '02 АФК' },
  { key: 'soc', title: '03 Социокультурная' }
];

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
    if (!blocks.length) return true;
    return !blocks.every((a) => a.blockStatus === 'completed');
  });
}

const today = () => new Date().toISOString().slice(0, 10);

function serializeBlock(a, viewer) {
  const mine = a.specialistUserId === viewer.id;
  const visible = mine || canSeeAllResults(viewer);
  return {
    id: a.id,
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
    resultsHidden: !visible
  };
}

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

router.get('/events', authMiddleware, async (req, res) => {
  try {
    const { from, to, type } = req.query;
    const where = {};

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

router.post('/events', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    let { specialistUserId, recipientId, directionId, title, date, startTime, endTime } = req.body;
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

router.patch('/events/:id', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    const event = await ScheduleEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Событие не найдено' });
    if (req.user.role === 'teacher' && event.specialistUserId !== req.user.id) {
      return res.status(403).json({ message: 'Можно отмечать только свои занятия' });
    }

    const allowed = ['scheduled', 'completed'];
    const status = String(req.body?.status ?? '');
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус занятия' });
    }
    if (event.status === 'cancelled') {
      return res.status(409).json({ message: 'Событие отменено, отметить его нельзя' });
    }

    await event.update({ status });
    const full = await ScheduleEvent.findByPk(event.id, { include: eventIncludes });
    res.json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

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

function serializeSession(s, viewer) {
  const blocks = (s.assignments || [])
    .slice()
    .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')))
    .map((a) => serializeBlock(a, viewer));
  const completed = blocks.filter((b) => b.blockStatus === 'completed').length;
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
    missingStages: missing,
    readyForConclusion: blocks.length > 0 && completed === blocks.length && missing.length === 0,
    mine: blocks.filter((b) => b.isMine).map((b) => b.id),
    canViewAll: canSeeAllResults(viewer),
    canConclude: canIssueConclusion(viewer),
    conclusion: s.conclusion
      ? {
          id: s.conclusion.id,
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

router.post('/sessions', authMiddleware, roleMiddleware('admin', 'employee'), async (req, res) => {
  try {
    const { recipientId, date, note } = req.body;
    if (!recipientId || !date) {
      return res.status(400).json({ message: 'Укажите реабилитанта и дату диагностики' });
    }
    if (String(date) < today()) {
      return res.status(400).json({ message: 'Дата диагностики не может быть в прошлом' });
    }

    const active = await DiagnosticSession.findOne({
      where: { recipientId, status: { [Op.in]: ['open', 'in_progress'] } }
    });
    if (active) {
      return res.status(409).json({
        message: `У реабилитанта уже есть активная заявка на диагностику от ${String(active.date).slice(0, 10)}`,
        sessionId: active.id,
        date: String(active.date).slice(0, 10)
      });
    }

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

router.get('/sessions', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res) => {
  try {
    const { from, to, status, recipientId } = req.query;
    const where = {};
    if (from && to) where.date = { [Op.between]: [from, to] };
    else if (from) where.date = { [Op.gte]: from };
    else if (to) where.date = { [Op.lte]: to };
    if (status) where.status = status;
    if (recipientId) where.recipientId = parseInt(recipientId, 10);

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
      view.claimedByMe = view.blocks.some((b) => b.specialistUserId === req.user.id);
      return view;
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

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

router.post('/sessions/:id/claim', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  const t = await sequelize.startUnmanagedTransaction();
  try {
    let { startTime, endTime, specialistUserId } = req.body;

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

    const conflict = await findConflict(targetId, session.date, startTime, endTime);
    if (conflict) {
      await t.rollback();
      return res.status(409).json({
        message: `Ваш слот занят: уже есть событие ${conflict.startTime}–${conflict.endTime}`
      });
    }
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

    if (!existing) {
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

    const conflict = await findConflict(specialistUserId, date, startTime, endTime);
    if (conflict) {
      await t.rollback();
      return res.status(409).json({
        message: `Слот занят: у специалиста уже есть событие ${conflict.startTime}–${conflict.endTime}`
      });
    }

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

router.get('/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await DiagnosticAssignment.findByPk(req.params.id, { include: assignmentIncludes });
    if (!assignment) return res.status(404).json({ message: 'Назначение не найдено' });
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

router.patch('/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await DiagnosticAssignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Назначение не найдено' });
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

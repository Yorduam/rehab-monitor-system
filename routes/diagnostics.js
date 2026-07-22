import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { ReResult, Recipient, Direction, User } from '../models/index.js';

const router = express.Router();

const resultInclude = [
  { model: Recipient, as: 'recipient', attributes: ['id', 'firstName', 'middleName', 'lastName'] },
  { model: Direction, as: 'direction', attributes: ['id', 'name', 'profileKey'] },
  // Специалист диагностики — учётная запись (User). idSpecialist = userId.
  { model: User, as: 'specialist', attributes: ['id', 'firstName', 'lastName', 'email'] }
];

const specialistName = (u) =>
  u ? ([u.lastName, u.firstName].filter(Boolean).join(' ').trim() || u.email) : null;

// Приводим специалиста-пользователя к прежней форме { id, fullName },
// чтобы фронтенд (ожидающий specialist.fullName) не менялся.
function serializeResult(row) {
  const json = row.toJSON();
  json.specialist = row.specialist
    ? { id: row.specialist.id, fullName: specialistName(row.specialist) }
    : null;
  return json;
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.recipientId) where.idRecipient = parseInt(req.query.recipientId);
    if (req.query.directionId) where.idDirection = parseInt(req.query.directionId);
    // Фильтр по специалисту (учётной записи преподавателя) — нужен, чтобы
    // преподаватель на вкладке «Диагностика» видел только тех реабилитантов,
    // которых направили на диагностику именно к нему (idSpecialist = его userId).
    if (req.query.specialistId) where.idSpecialist = parseInt(req.query.specialistId);

    const { count, rows } = await ReResult.findAndCountAll({
      where,
      limit,
      offset,
      include: resultInclude,
      order: [['date', 'DESC']]
    });

    res.json({
      data: rows.map(serializeResult),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res) => {
  try {
    const { idRecipient, idDirection, idSpecialist, date, results, published } = req.body;
    const result = await ReResult.create({
      idRecipient,
      idDirection,
      idSpecialist,
      date,
      results: results ?? {},
      published: published ?? false
    });
    const full = await ReResult.findByPk(result.id, { include: resultInclude });
    res.status(201).json(serializeResult(full));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res) => {
  try {
    const result = await ReResult.findByPk(req.params.id);
    if (!result) return res.status(404).json({ message: 'Запись не найдена' });
    const { idRecipient, idDirection, idSpecialist, date, results, published } = req.body;
    const patch = {};
    if (idRecipient !== undefined) patch.idRecipient = idRecipient;
    if (idDirection !== undefined) patch.idDirection = idDirection;
    if (idSpecialist !== undefined) patch.idSpecialist = idSpecialist;
    if (date !== undefined) patch.date = date;
    if (results !== undefined) patch.results = results;
    if (published !== undefined) patch.published = published;
    await result.update(patch);
    const full = await ReResult.findByPk(result.id, { include: resultInclude });
    res.json(serializeResult(full));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res) => {
  try {
    const result = await ReResult.findByPk(req.params.id);
    if (!result) return res.status(404).json({ message: 'Запись не найдена' });
    await result.destroy();
    res.json({ message: 'Запись удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

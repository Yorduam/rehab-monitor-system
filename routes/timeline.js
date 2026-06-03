import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import TimelineEvent from '../models/TimelineEvent.js';
import Diagnostic from '../models/Diagnostic.js';

const router = express.Router();

// GET /timeline – возвращает массив событий
router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = {};
    if (req.query.recipientId) where.recipientId = req.query.recipientId;

    const limit = parseInt(req.query.limit) || undefined;

    const events = await TimelineEvent.findAll({
      where,
      order: [['date', 'DESC']],
      ...(limit && { limit }),
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /timeline
router.post('/', authMiddleware, async (req, res) => {
  try {
    const event = await TimelineEvent.create(req.body);
    // Если тип диагностика – синхронизируем с таблицей diagnostics
    if (event.type === 'diagnostic' && event.recipientId) {
      const [diagnostic, created] = await Diagnostic.findOrCreate({
        where: {
          recipientId: event.recipientId,
          name: event.title,
          date: event.date
        },
        defaults: {
          name: event.title,
          recipientId: event.recipientId,
          date: event.date,
          time: event.time,
          specialist: event.specialist,
          status: event.status || 'planned'
        }
      });
      if (!created) {
        await diagnostic.update({
          name: event.title,
          date: event.date,
          time: event.time,
          specialist: event.specialist,
          status: event.status
        });
      }
    }
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PUT /timeline/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await TimelineEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Событие не найдено' });
    await event.update(req.body);
    // Синхронизация с диагностикой
    if (event.type === 'diagnostic' && event.recipientId) {
      const diagnostic = await Diagnostic.findOne({
        where: {
          recipientId: event.recipientId,
          name: event.title,
          date: event.date
        }
      });
      if (diagnostic) {
        await diagnostic.update({
          name: event.title,
          date: event.date,
          time: event.time,
          specialist: event.specialist,
          status: event.status
        });
      } else {
        await Diagnostic.create({
          name: event.title,
          recipientId: event.recipientId,
          date: event.date,
          time: event.time,
          specialist: event.specialist,
          status: event.status || 'planned'
        });
      }
    }
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// DELETE /timeline/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await TimelineEvent.findByPk(req.params.id);
    if (!event) return res.status(404).json({ message: 'Событие не найдено' });
    // Удаляем связанную диагностику
    if (event.type === 'diagnostic' && event.recipientId) {
      await Diagnostic.destroy({
        where: {
          recipientId: event.recipientId,
          name: event.title,
          date: event.date
        }
      });
    }
    await event.destroy();
    res.json({ message: 'Событие удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
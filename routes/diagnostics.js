import { Op } from '@sequelize/core';
import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import Diagnostic from '../models/Diagnostic.js';
import TimelineEvent from '../models/TimelineEvent.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const where = {};
    if (req.query.recipientId) where.recipientId = req.query.recipientId;
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Diagnostic.findAndCountAll({
      where,
      limit,
      offset,
      order: [['date', 'DESC']]
    });

    res.json({
      data: rows,
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

router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { name, recipientId, date, time, specialist, status, type } = req.body;
    const diagnostic = await Diagnostic.create({
      name,
      recipientId,
      date,
      time,
      specialist,
      status: status || 'planned',
      type: type || 'diagnostic'
    });
    await TimelineEvent.create({
      title: diagnostic.name,
      date: diagnostic.date,
      time: diagnostic.time,
      type: diagnostic.type,
      recipientId: diagnostic.recipientId,
      specialist: diagnostic.specialist,
      status: diagnostic.status
    });
    res.status(201).json(diagnostic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const diagnostic = await Diagnostic.findByPk(req.params.id);
    if (!diagnostic) return res.status(404).json({ message: 'Диагностика не найдена' });
    const { name, recipientId, date, time, specialist, status, type } = req.body;
    await diagnostic.update({
      name,
      recipientId,
      date,
      time,
      specialist,
      status,
      type
    });
    const timelineEvent = await TimelineEvent.findOne({
      where: {
        recipientId: diagnostic.recipientId,
        title: diagnostic.name,
        date: diagnostic.date,
        type: diagnostic.type
      }
    });
    if (timelineEvent) {
      await timelineEvent.update({
        title: diagnostic.name,
        date: diagnostic.date,
        time: diagnostic.time,
        type: diagnostic.type,
        specialist: diagnostic.specialist,
        status: diagnostic.status
      });
    } else {
      await TimelineEvent.create({
        title: diagnostic.name,
        date: diagnostic.date,
        time: diagnostic.time,
        type: diagnostic.type,
        recipientId: diagnostic.recipientId,
        specialist: diagnostic.specialist,
        status: diagnostic.status
      });
    }
    res.json(diagnostic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const diagnostic = await Diagnostic.findByPk(req.params.id);
    if (!diagnostic) return res.status(404).json({ message: 'Диагностика не найдена' });
    await TimelineEvent.destroy({
      where: {
        recipientId: diagnostic.recipientId,
        title: diagnostic.name,
        date: diagnostic.date,
        type: diagnostic.type
      }
    });
    await diagnostic.destroy();
    res.json({ message: 'Диагностика удалена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
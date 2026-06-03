import { Op } from '@sequelize/core';
import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import Recipient from '../models/Recipient.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

const router = express.Router();

// GET /recipients
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const diagnosis = req.query.diagnosis;
    const groupId = req.query.groupId ? parseInt(req.query.groupId) : undefined;

    const where = {};
    if (search) where.fullName = { [Op.like]: `%${search}%` };
    if (diagnosis && diagnosis !== 'all') where.diagnosis = diagnosis;
    if (groupId) where.groupId = groupId;

    const { count, rows } = await Recipient.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { 
          model: Group, 
          as: 'group', 
          include: [{ model: User, as: 'curator', attributes: ['id', 'fullName'] }] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    next(err);
  }
});

// GET /recipients/:id
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id, {
      include: [{ 
        model: Group, 
        as: 'group', 
        include: [{ model: User, as: 'curator', attributes: ['id', 'fullName'] }] 
      }]
    });
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });
    res.json(recipient);
  } catch (err) {
    next(err);
  }
});

// POST /recipients
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const {
      fullName, age, diagnosis, groupId, photo,
      contacts, legalRepresentative,
      aggressionLevel, showAggression, aggressionNote, completionStatus
    } = req.body;

    // Если выбран groupId, можно дополнительно подгрузить groupName и curator
    let groupName = null;
    let curatorName = null;
    if (groupId) {
      const group = await Group.findByPk(groupId, {
        include: [{ model: User, as: 'curator', attributes: ['fullName'] }]
      });
      if (group) {
        groupName = group.name;
        curatorName = group.curator?.fullName;
      }
    }

    const recipient = await Recipient.create({
      fullName, age, diagnosis, groupId: groupId || null, photo,
      contacts, legalRepresentative,
      aggressionLevel: aggressionLevel || 1,
      showAggression: showAggression !== undefined ? showAggression : true,
      aggressionNote: aggressionNote || null,
      completionStatus: completionStatus || 'in_progress',
      groupName,          // плоское поле (заполняется автоматически)
      curator: curatorName, // плоское поле (заполняется автоматически)
      attendance: 0, commScore: 0, groupScore: 0, creativityScore: 0, selfScore: 0, status: 'active'
    });

    const fullRecipient = await Recipient.findByPk(recipient.id, {
      include: [{ model: Group, as: 'group', include: [{ model: User, as: 'curator', attributes: ['fullName'] }] }]
    });
    res.status(201).json(fullRecipient);
  } catch (err) {
    next(err);
  }
});

// PUT /recipients/:id
router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const {
      fullName, age, diagnosis, groupId, photo,
      contacts, legalRepresentative,
      aggressionLevel, showAggression, aggressionNote, completionStatus
    } = req.body;

    // Обновляем groupName и curator на основе выбранной группы
    let groupName = null;
    let curatorName = null;
    if (groupId) {
      const group = await Group.findByPk(groupId, {
        include: [{ model: User, as: 'curator', attributes: ['fullName'] }]
      });
      if (group) {
        groupName = group.name;
        curatorName = group.curator?.fullName;
      }
    }

    await recipient.update({
      fullName, age, diagnosis, groupId: groupId || null, photo,
      contacts, legalRepresentative,
      aggressionLevel, showAggression, aggressionNote, completionStatus,
      groupName,
      curator: curatorName
    });

    const updated = await Recipient.findByPk(recipient.id, {
      include: [{ model: Group, as: 'group', include: [{ model: User, as: 'curator', attributes: ['fullName'] }] }]
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /recipients/:id
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });
    await recipient.destroy();
    res.json({ message: 'Реабилитант удалён' });
  } catch (err) {
    next(err);
  }
});

export default router;
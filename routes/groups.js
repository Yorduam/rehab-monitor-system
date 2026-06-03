import express from 'express'
import { Op } from '@sequelize/core'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import Group from '../models/Group.js'
import User from '../models/User.js'
import Recipient from '../models/Recipient.js'

const router = express.Router()

// Получить все группы (с пагинацией, поиском и количеством участников)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 15
    const offset = (page - 1) * limit
    const search = req.query.search || ''

    const where = {}
    if (search) {
      where.name = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await Group.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: User, as: 'curator', attributes: ['id', 'fullName'] }],
      order: [['name', 'ASC']]
    })

    // Для каждой группы получаем количество участников
    const groupsWithCount = await Promise.all(rows.map(async (group) => {
      const participantsCount = await Recipient.count({ where: { groupId: group.id } })
      return {
        id: group.id,
        name: group.name,
        curator: group.curator?.fullName || null,
        curatorId: group.curatorId,
        direction: group.direction,
        participantsCount
      }
    }))

    res.json({
      data: groupsWithCount,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Получить участников конкретной группы
router.get('/:id/recipients', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id
    const recipients = await Recipient.findAll({
      where: { groupId },
      attributes: ['id', 'fullName', 'age', 'diagnosis', 'photo']
    })
    res.json(recipients)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Получить группу по ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id, {
      include: [{ model: User, as: 'curator', attributes: ['id', 'fullName'] }]
    })
    if (!group) return res.status(404).json({ message: 'Группа не найдена' })
    res.json(group)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Создать группу (только админ или преподаватель)
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { name, curatorId, direction } = req.body
    const group = await Group.create({ name, curatorId, direction })
    const fullGroup = await Group.findByPk(group.id, {
      include: [{ model: User, as: 'curator', attributes: ['fullName'] }]
    })
    res.status(201).json({
      id: fullGroup.id,
      name: fullGroup.name,
      curator: fullGroup.curator?.fullName || null,
      curatorId: fullGroup.curatorId,
      direction: fullGroup.direction,
      participantsCount: 0
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Обновить группу
router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id)
    if (!group) return res.status(404).json({ message: 'Группа не найдена' })
    const { name, curatorId, direction } = req.body
    await group.update({ name, curatorId, direction })
    const updated = await Group.findByPk(group.id, {
      include: [{ model: User, as: 'curator', attributes: ['fullName'] }]
    })
    res.json({
      id: updated.id,
      name: updated.name,
      curator: updated.curator?.fullName || null,
      curatorId: updated.curatorId,
      direction: updated.direction,
      participantsCount: await Recipient.count({ where: { groupId: updated.id } })
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Удалить группу (только админ)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const group = await Group.findByPk(req.params.id)
    if (!group) return res.status(404).json({ message: 'Группа не найдена' })
    // Отвязываем реципиентов
    await Recipient.update({ groupId: null }, { where: { groupId: group.id } })
    await group.destroy()
    res.json({ message: 'Группа удалена' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router
import express from 'express'
import { Op } from '@sequelize/core'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import { ReGroup, Specialist, Recipient } from '../models/index.js'

const router = express.Router()

function serializeGroup(group, participantsCount) {
  return {
    id: group.id,
    name: group.groupName,
    curator: group.curatorRef?.fullName || null,
    curatorId: group.curator,
    participantsCount
  }
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 15
    const offset = (page - 1) * limit
    const search = req.query.search || ''

    const where = {}
    if (search) {
      where.groupName = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await ReGroup.findAndCountAll({
      where,
      limit,
      offset,
      include: [{ model: Specialist, as: 'curatorRef', attributes: ['id', 'fullName'] }],
      order: [['id', 'ASC']]
    })

    const groupsWithCount = await Promise.all(rows.map(async (group) => {
      const participantsCount = await Recipient.count({ where: { groupId: group.id } })
      return serializeGroup(group, participantsCount)
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

router.get('/:id/recipients', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id
    const recipients = await Recipient.findAll({
      where: { groupId },
      attributes: ['id', 'firstName', 'middleName', 'lastName', 'birthDate', 'diagnosis', 'photo']
    })
    res.json(recipients)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await ReGroup.findByPk(req.params.id, {
      include: [{ model: Specialist, as: 'curatorRef', attributes: ['id', 'fullName'] }]
    })
    if (!group) return res.status(404).json({ message: 'Группа не найдена' })
    const participantsCount = await Recipient.count({ where: { groupId: group.id } })
    res.json(serializeGroup(group, participantsCount))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { name, curatorId } = req.body
    if (!name || !curatorId) {
      return res.status(400).json({ message: 'Укажите название группы и куратора' })
    }
    const group = await ReGroup.create({ groupName: name, curator: curatorId })
    const fullGroup = await ReGroup.findByPk(group.id, {
      include: [{ model: Specialist, as: 'curatorRef', attributes: ['id', 'fullName'] }]
    })
    res.status(201).json(serializeGroup(fullGroup, 0))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const group = await ReGroup.findByPk(req.params.id)
    if (!group) return res.status(404).json({ message: 'Группа не найдена' })
    const { name, curatorId } = req.body
    const patch = {}
    if (name !== undefined) patch.groupName = name
    if (curatorId !== undefined) patch.curator = curatorId
    await group.update(patch)
    const updated = await ReGroup.findByPk(group.id, {
      include: [{ model: Specialist, as: 'curatorRef', attributes: ['id', 'fullName'] }]
    })
    const participantsCount = await Recipient.count({ where: { groupId: updated.id } })
    res.json(serializeGroup(updated, participantsCount))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const group = await ReGroup.findByPk(req.params.id)
    if (!group) return res.status(404).json({ message: 'Группа не найдена' })

    const participantsCount = await Recipient.count({ where: { groupId: group.id } })
    if (participantsCount > 0) {
      return res.status(409).json({
        message: 'Нельзя удалить группу с участниками. Сначала переведите реабилитантов в другую группу.'
      })
    }
    await group.destroy()
    res.json({ message: 'Группа удалена' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router

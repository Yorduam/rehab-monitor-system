import express from 'express'
import { Op } from '@sequelize/core'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import { sequelize, ReGroup, Recipient, User } from '../models/index.js'

const router = express.Router()

const curatorUserName = (u) =>
  u ? [u.lastName, u.firstName].filter(Boolean).join(' ').trim() || u.email : null

const groupIncludes = [
  { model: User, as: 'curatorUser', attributes: ['id', 'firstName', 'lastName', 'email'] }
]

function serializeGroup(group, participantsCount) {
  const name = curatorUserName(group.curatorUser)
  return {
    id: group.id,
    name: group.groupName,
    // Куратор группы — учётная запись (пользователь = специалист/куратор).
    curator: name,
    curatorUserId: group.curatorUserId || null,
    curatorUserName: name,
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

    // Преподаватель (куратор) видит только свои группы — те, где он назначен
    // куратором-преподавателем (curatorUserId = его userId).
    if (req.user.role === 'teacher') {
      where.curatorUserId = req.user.id
    }

    const { count, rows } = await ReGroup.findAndCountAll({
      where,
      limit,
      offset,
      include: groupIncludes,
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

// Проверка доступа преподавателя к конкретной группе (только своя).
async function assertTeacherOwnsGroup(req, res, groupId) {
  if (req.user.role !== 'teacher') return true
  const group = await ReGroup.findByPk(groupId, { attributes: ['id', 'curatorUserId'] })
  if (!group || group.curatorUserId !== req.user.id) {
    res.status(403).json({ message: 'Доступ запрещён' })
    return false
  }
  return true
}

router.get('/:id/recipients', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id
    if (!(await assertTeacherOwnsGroup(req, res, groupId))) return
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
    if (!(await assertTeacherOwnsGroup(req, res, req.params.id))) return
    const group = await ReGroup.findByPk(req.params.id, { include: groupIncludes })
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
    const { name, curatorUserId } = req.body
    // Преподаватель, создающий группу, автоматически становится её
    // куратором — иначе он не увидит свою же группу.
    const ownerUserId = req.user.role === 'teacher'
      ? req.user.id
      : (curatorUserId || null)
    if (!name || !ownerUserId) {
      return res.status(400).json({ message: 'Укажите название группы и куратора' })
    }
    const group = await ReGroup.create({
      groupName: name,
      curatorUserId: ownerUserId
    })
    const fullGroup = await ReGroup.findByPk(group.id, { include: groupIncludes })
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
    // Преподаватель может редактировать только свою группу.
    if (req.user.role === 'teacher' && group.curatorUserId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещён' })
    }
    const { name, curatorUserId } = req.body
    const patch = {}
    if (name !== undefined) patch.groupName = name
    // Куратора группы (учётную запись) назначает только админ.
    if (curatorUserId !== undefined && req.user.role === 'admin') {
      patch.curatorUserId = curatorUserId || null
    }
    await group.update(patch)
    const updated = await ReGroup.findByPk(group.id, { include: groupIncludes })
    const participantsCount = await Recipient.count({ where: { groupId: updated.id } })
    res.json(serializeGroup(updated, participantsCount))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const t = await sequelize.startUnmanagedTransaction()
  try {
    const group = await ReGroup.findByPk(req.params.id, { transaction: t })
    if (!group) {
      await t.rollback()
      return res.status(404).json({ message: 'Группа не найдена' })
    }

    // Открепляем участников (Recipient.groupId допускает NULL) — реабилитанты
    // не удаляются, лишь перестают числиться в этой группе. Так группу всегда
    // можно удалить, не оставляя «висячих» ссылок.
    const [detached] = await Recipient.update(
      { groupId: null },
      { where: { groupId: group.id }, transaction: t }
    )

    await group.destroy({ transaction: t })
    await t.commit()
    res.json({ message: 'Группа удалена', detached })
  } catch (err) {
    await t.rollback()
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router

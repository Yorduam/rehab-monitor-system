import express from 'express'
import bcrypt from 'bcrypt'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import { User, Recipient, AdminAuditLog } from '../models/index.js'
import { validatePassword } from '../validations/passwordPolicy.js'

const ROLES = ['admin', 'teacher', 'employee', 'recipient']

const router = express.Router()

const nameOf = (u) =>
  ([u?.lastName, u?.firstName].filter(Boolean).join(' ').trim() || u?.fullName || u?.email || '')
    .slice(0, 150)

const audit = async (req, action, target, details = null) => {
  try {
    await AdminAuditLog.create({
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      actorName: nameOf(req.user),
      targetUserId: target?.id ?? null,
      targetName: nameOf(target),
      action,
      details,
      ip: (req.ip || '').slice(0, 64),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 255),
      createdAt: new Date()
    })
  } catch (err) {
    req.log?.error({ err }, 'не удалось записать действие в журнал администрирования')
  }
}

const countAdmins = () => User.count({ where: { role: 'admin' } })

router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] }
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const {
      email, password, role, firstName, lastName, directionId, phone, cabinet,
      canConclude, canViewAllResults, canFillForOthers
    } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' })
    }
    const weak = validatePassword(password)
    if (weak) return res.status(400).json({ message: weak, field: 'password' })

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: 'Неизвестная роль', field: 'role' })
    }
    const existing = await User.findOne({ where: { email } })
    if (existing) return res.status(400).json({ message: 'Email уже используется' })
    const finalRole = role || 'recipient'
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      email,
      passwordHash: hash,
      role: finalRole,
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone || null,
      cabinet: cabinet || null,
      directionId: finalRole === 'teacher' && directionId ? directionId : null,
      canConclude: finalRole === 'teacher' ? canConclude === true : false,
      canViewAllResults: finalRole === 'teacher' ? canViewAllResults === true : false,
      canFillForOthers: finalRole === 'teacher' ? canFillForOthers === true : false
    })

    await audit(req, 'user.create', user, { role: finalRole })

    const { passwordHash, ...safeUser } = user.toJSON()
    res.status(201).json(safeUser)
  } catch (err) {
    next(err)
  }
})

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    })
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    const isSelf = req.user.id === targetId
    const isAdmin = req.user.role === 'admin'

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Можно менять только свою учётную запись' })
    }
    const user = await User.findByPk(targetId)
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' })

    const {
      email, role, password, currentPassword, firstName, lastName, directionId, phone, cabinet,
      canConclude, canViewAllResults, canFillForOthers
    } = req.body

    const changes = []

    if (password) {
      const weak = validatePassword(password)
      if (weak) return res.status(400).json({ message: weak, field: 'password' })

      if (isSelf) {
        const ok = currentPassword && await bcrypt.compare(String(currentPassword), user.passwordHash)
        if (!ok) {
          return res.status(400).json({
            message: 'Введите текущий пароль — без него сменить пароль нельзя',
            field: 'currentPassword'
          })
        }
      }
    }

    if (role !== undefined && role !== user.role) {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Менять роль может только администратор' })
      }
      if (!ROLES.includes(role)) {
        return res.status(400).json({ message: 'Неизвестная роль', field: 'role' })
      }
      if (isSelf) {
        return res.status(400).json({
          message: 'Нельзя снять роль с самого себя. Попросите другого администратора.'
        })
      }
      if (user.role === 'admin' && (await countAdmins()) <= 1) {
        return res.status(400).json({
          message: 'Это последний администратор — сначала назначьте другого'
        })
      }
      changes.push({ field: 'role', from: user.role, to: role })
      user.role = role
    }

    if (email !== undefined && email !== user.email) {
      if (!isAdmin) {
        return res.status(403).json({
          message: 'Адрес входа меняет администратор — обратитесь к нему'
        })
      }
      const taken = await User.findOne({ where: { email } })
      if (taken && taken.id !== user.id) {
        return res.status(409).json({ message: 'Этот e-mail уже занят другой учётной записью', field: 'email' })
      }
      changes.push({ field: 'email', from: user.email, to: email })
      user.email = email
    }

    if (password) user.passwordHash = await bcrypt.hash(password, 10)
    if (firstName !== undefined) user.firstName = firstName || null
    if (lastName !== undefined) user.lastName = lastName || null
    if (phone !== undefined) user.phone = phone || null
    if (cabinet !== undefined) user.cabinet = cabinet || null
    if (directionId !== undefined) user.directionId = directionId || null

    if (isAdmin) {
      const right = (name, value) => {
        if (value === undefined) return
        const next = value === true
        if (user[name] !== next) changes.push({ field: name, from: user[name], to: next })
        user[name] = next
      }
      right('canConclude', canConclude)
      right('canViewAllResults', canViewAllResults)
      right('canFillForOthers', canFillForOthers)
    }

    if (user.role !== 'teacher') {
      user.directionId = null
      user.canConclude = false
      user.canViewAllResults = false
      user.canFillForOthers = false
    }
    await user.save()

    if (password) {
      await audit(req, isSelf ? 'password.change' : 'password.reset', user)
    }
    for (const change of changes) {
      const action = change.field === 'role' ? 'role.change'
        : change.field === 'email' ? 'email.change'
          : 'rights.change'
      await audit(req, action, user, change)
    }

    const { passwordHash, ...safeUser } = user.toJSON()
    res.json(safeUser)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' })

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Нельзя удалить собственную учётную запись' })
    }
    if (user.role === 'admin' && (await countAdmins()) <= 1) {
      return res.status(400).json({ message: 'Это последний администратор — удалять его нельзя' })
    }

    const cards = await Recipient.findAll({
      where: { userId: user.id },
      attributes: ['id', 'lastName', 'firstName']
    })
    if (cards.length) {
      const fio = cards
        .map((c) => [c.lastName, c.firstName].filter(Boolean).join(' ').trim() || `#${c.id}`)
        .join(', ')
      return res.status(409).json({
        message: `К этой учётной записи привязана карточка реабилитанта (${fio}). ` +
          'Сначала удалите карточку в разделе «Реабилитанты» — там удаление проходит ' +
          'по всем связанным данным и записывается в журнал.',
        recipientIds: cards.map((c) => c.id)
      })
    }

    await audit(req, 'user.delete', user, { role: user.role, email: user.email })
    await user.destroy()
    res.json({ message: 'Пользователь удалён' })
  } catch (err) {
    next(err)
  }
})

export default router

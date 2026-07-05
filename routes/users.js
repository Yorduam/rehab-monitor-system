import express from 'express'
import bcrypt from 'bcrypt'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import { User, Recipient } from '../models/index.js'

const router = express.Router()

router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] }
    })
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Создание пользователя администратором.
// ВАЖНО: в отличие от /auth/register, здесь НЕ выдаётся cookie/токен,
// поэтому сессия администратора не подменяется на нового пользователя.
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, directionId } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' })
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
      // Проф. ориентированность актуальна только для преподавателя.
      directionId: finalRole === 'teacher' && directionId ? directionId : null
    })
    const { passwordHash, ...safeUser } = user.toJSON()
    res.status(201).json(safeUser)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    })
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещён' })
    }
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' })
    const { email, role, password, firstName, lastName, directionId } = req.body
    if (email) user.email = email
    if (role && req.user.role === 'admin') user.role = role
    if (password) user.passwordHash = await bcrypt.hash(password, 10)
    if (firstName !== undefined) user.firstName = firstName || null
    if (lastName !== undefined) user.lastName = lastName || null
    if (directionId !== undefined) user.directionId = directionId || null
    // Проф. ориентированность имеет смысл только для преподавателя.
    if (user.role !== 'teacher') user.directionId = null
    await user.save()
    const { passwordHash, ...safeUser } = user.toJSON()
    res.json(safeUser)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' })

    await Recipient.destroy({ where: { userId: user.id } })
    await user.destroy()
    res.json({ message: 'Пользователь удалён' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router

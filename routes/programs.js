import express from 'express'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'
import Program from '../models/Program.js'

const router = express.Router()

// Получить все программы
router.get('/', authMiddleware, async (req, res) => {
  try {
    const programs = await Program.findAll()
    res.json(programs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Получить программу по ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id)
    if (!program) return res.status(404).json({ message: 'Программа не найдена' })
    res.json(program)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Создать программу
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const program = await Program.create(req.body)
    res.status(201).json(program)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Обновить программу
router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id)
    if (!program) return res.status(404).json({ message: 'Программа не найдена' })
    await program.update(req.body)
    res.json(program)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

// Удалить программу
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id)
    if (!program) return res.status(404).json({ message: 'Программа не найдена' })
    await program.destroy()
    res.json({ message: 'Программа удалена' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router
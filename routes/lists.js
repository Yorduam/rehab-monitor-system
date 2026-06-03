// routes/lists.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import Group from '../models/Group.js';

const router = express.Router();

// Получить список кураторов (пользователи с ролью teacher или employee)
router.get('/curators', authMiddleware, async (req, res) => {
  try {
    const curators = await User.findAll({
      where: { role: ['teacher', 'employee'] },
      attributes: ['id', 'fullName', 'role']
    })
    res.json(curators)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})
// Список групп
router.get('/groups', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.findAll({
      attributes: ['id', 'name']
    });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
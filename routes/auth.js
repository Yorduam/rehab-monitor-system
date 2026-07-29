import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const router = express.Router();

// Единая форма пользователя для /register, /login и /me.
//
// Раньше вход отдавал только { id, email, role }, а полную запись фронтенд
// получал лишь из GET /me — то есть после перезагрузки страницы. До этого
// момента в authStore не было ни directionId, ни прав на заключение, и
// преподаватель на вкладке «Заявки на диагностику» видел «в вашей учётной
// записи не указана профессиональная ориентированность», хотя направление
// у него в базе есть. Отдаём один и тот же объект отовсюду.
const publicUser = (user) => {
  const { passwordHash, ...rest } = user.toJSON();
  return rest;
};

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role, agreedToTerms, firstName, lastName, directionId } = req.body;
    if (!agreedToTerms) {
      return res.status(400).json({ message: 'Необходимо принять пользовательское соглашение' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const finalRole = role || 'recipient';
    const user = await User.create({
      email,
      passwordHash: hash,
      role: finalRole,
      firstName: firstName || null,
      lastName: lastName || null,
      // Проф. ориентированность актуальна только для преподавателя.
      directionId: finalRole === 'teacher' && directionId ? directionId : null
    });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['passwordHash'] } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

export default router;

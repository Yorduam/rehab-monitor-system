import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Recipient from '../models/Recipient.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Регистрация
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName, role, agreedToTerms } = req.body;
    if (!agreedToTerms) {
      return res.status(400).json({ message: 'Необходимо принять пользовательское соглашение' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash: hash, fullName, role, agreedToTerms: true, agreedAt: new Date() });
    if (role === 'recipient') {
      await Recipient.create({ userId: user.id, fullName });
    } else {
      await Employee.create({ userId: user.id, fullName });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ user: { id: user.id, email, fullName, role } });
  } catch (err) {
    next(err);
  }
});

// Логин
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
    res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// Получение текущего пользователя (me)
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

// Выход
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

export default router;
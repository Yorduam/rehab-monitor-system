import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { validatePassword } from '../validations/passwordPolicy.js';

const router = express.Router();

const publicUser = (user) => {
  const { passwordHash, failedLoginCount, lockedUntil, ...rest } = user.toJSON();
  return rest;
};

const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, agreedToTerms, firstName, lastName } = req.body;
    if (!agreedToTerms) {
      return res.status(400).json({ message: 'Необходимо принять пользовательское соглашение' });
    }
    const weak = validatePassword(password);
    if (weak) return res.status(400).json({ message: weak, field: 'password' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash: hash,
      role: 'recipient',
      firstName: firstName || null,
      lastName: lastName || null,
      directionId: null
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
    if (!email || !password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const lockedFor = user.lockedUntil ? user.lockedUntil.getTime() - Date.now() : 0;
    if (lockedFor > 0) {
      return res.status(423).json({
        message: `Учётная запись временно заблокирована. Повторите через ${Math.ceil(lockedFor / 60000)} мин.`
      });
    }

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
        user.failedLoginCount = 0;
        user.lockedUntil = new Date(Date.now() + LOCK_MS);
        req.log?.warn({ userId: user.id, ip: req.ip }, 'учётная запись заблокирована после неудачных входов');
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.failedLoginCount || user.lockedUntil) {
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      await user.save();
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
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['passwordHash', 'failedLoginCount', 'lockedUntil'] }
    });
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

import express from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import { validatePassword } from '../validations/passwordPolicy.js';
import { ensureCsrfToken } from '../middleware/csrf.js';
import { isTwoFactorRequired } from '../services/twoFactorPolicy.js';
import {
  issueSession, issuePending, readSession, readPending, clearSession, clearPending,
  toPublicUser as publicUser, USER_ATTRIBUTES_EXCLUDE, MAX_FAILED_LOGINS, LOCK_MS
} from '../services/session.js';

const router = express.Router();

router.get('/csrf', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ csrfToken: ensureCsrfToken(req, res) });
});

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
    issueSession(res, user);
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

    if (user.twoFactorEnabled || await isTwoFactorRequired(user)) {
      if (user.lockedUntil) {
        user.lockedUntil = null;
        await user.save();
      }
      const stage = user.twoFactorEnabled ? 'mfa' : 'enroll';
      clearSession(res);
      issuePending(res, user, stage);
      res.set('Cache-Control', 'no-store');
      return res.json(stage === 'mfa' ? { mfaRequired: true } : { enrollRequired: true });
    }

    if (user.failedLoginCount || user.lockedUntil) {
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      await user.save();
    }

    issueSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const pendingReply = () => {
      const pending = readPending(req);
      if (!pending) return null;
      return pending.stage === 'enroll'
        ? res.status(401).json({ code: 'MFA_ENROLL_PENDING', message: 'Привяжите ключ электронной подписи, чтобы продолжить' })
        : res.status(401).json({ code: 'MFA_PENDING', message: 'Подтвердите вход ключом электронной подписи' });
    };
    const decoded = readSession(req);
    if (!decoded) return pendingReply() || res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: USER_ATTRIBUTES_EXCLUDE }
    });
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (decoded.mfa !== true && (user.twoFactorEnabled || await isTwoFactorRequired(user))) {
      return pendingReply() || res.status(401).json({ code: 'MFA_REQUIRED', message: 'Войдите заново с ключом электронной подписи' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  clearSession(res);
  clearPending(res);
  res.json({ message: 'Logged out' });
});

export default router;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Op } from '@sequelize/core';
import { sequelize, Recipient } from './models/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { authMiddleware, staffOnly } from './middleware/auth.js';
import { requireHttps, trustProxySetting } from './middleware/https.js';
import { csrfProtection } from './middleware/csrf.js';
import logger from './config/logger.js';
import { MAX_REQUEST_MB } from './src/utils/uploadLimits.js';
import { readSession } from './services/session.js';
import { createCadescomVerifier } from './services/cryptoProVerifier.js';
import { sequelizeUsers, sequelizeChallenges, auditTwoFactor, startChallengeCleanup } from './services/twoFactor.js';
import { sequelizePolicy } from './services/twoFactorPolicy.js';

import authRoutes from './routes/auth.js';
import { createTwoFactorRouter } from './routes/twoFactor.js';
import recipientsRoutes from './routes/recipients.js';
import groupsRoutes from './routes/groups.js';
import diagnosticsRoutes from './routes/diagnostics.js';
import usersRoutes from './routes/users.js';
import documentsRoutes from './routes/documents.js';
import listsRoutes from './routes/lists.js';
import dashboardRoutes from './routes/dashboard.js';
import scheduleRoutes from './routes/schedule.js';

dotenv.config();
const app = express();

app.set('trust proxy', trustProxySetting());
app.use(helmet());
app.use('/api', requireHttps);
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json({ limit: `${MAX_REQUEST_MB}mb` }));
app.use(cookieParser());

const isAuthenticated = (req) => !!readSession(req);

const guestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isAuthenticated(req),
  message: { message: 'Слишком много запросов. Попробуйте позже (примерно через час).' },
});
app.use('/api', guestLimiter);

const userLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !isAuthenticated(req),
  keyGenerator: (req) => {
    const session = readSession(req);
    return session ? 'user:' + session.id : ipKeyGenerator(req.ip);
  },
  message: { message: 'Слишком много запросов подряд. Подождите несколько минут.' },
});
app.use('/api', userLimiter);

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
  customProps: (req) => ({
    userId: req.user?.id ?? null,
    userRole: req.user?.role ?? null
  })
}));
app.use(requestId);
app.use('/api', csrfProtection);

const twoFactorVerifier = createCadescomVerifier({ logger });
app.use('/api/v1/auth/2fa', createTwoFactorRouter({
  users: sequelizeUsers,
  challenges: sequelizeChallenges,
  verifier: twoFactorVerifier,
  audit: auditTwoFactor,
  policy: sequelizePolicy,
  authenticate: authMiddleware
}));
app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/recipients', authMiddleware, staffOnly, recipientsRoutes);
app.use('/api/v1/groups', authMiddleware, staffOnly, groupsRoutes);
app.use('/api/v1/diagnostics', authMiddleware, staffOnly, diagnosticsRoutes);
app.use('/api/v1/lists', authMiddleware, staffOnly, listsRoutes);
app.use('/api/v1/dashboard', authMiddleware, staffOnly, dashboardRoutes);
app.use('/api/v1/schedule', authMiddleware, staffOnly, scheduleRoutes);

app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/documents', documentsRoutes);

app.get('/api/search', authMiddleware, staffOnly, async (req, res, next) => {
  try {
    const q = req.query.q?.toLowerCase();
    if (!q) return res.json({});
    const pages = [
      { id: 'dashboard', label: 'Дашборд', keywords: ['дашборд', 'главная'] },
      { id: 'recipients', label: 'Реабилитанты', keywords: ['реабилитанты', 'участники'] },
      { id: 'groups', label: 'Группы', keywords: ['группы'] },
      { id: 'diagnostics', label: 'Диагностика', keywords: ['диагностика'] },
      { id: 'progress', label: 'Прогресс', keywords: ['прогресс'] }
    ];
    const matchedPage = pages.find(p => p.keywords.some(k => q.includes(k)));
    if (matchedPage) return res.json({ page: matchedPage });
    const like = `%${q.replace(/[\\%_]/g, (c) => '\\' + c)}%`;
    const recipient = await Recipient.findOne({
      attributes: ['id', 'lastName', 'firstName', 'middleName'],
      where: {
        [Op.or]: [
          { lastName: { [Op.like]: like } },
          { firstName: { [Op.like]: like } },
          { middleName: { [Op.like]: like } }
        ]
      }
    });
    if (recipient) return res.json({ recipient });
    res.json({});
  } catch (err) {
    next(err);
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
sequelize.authenticate()
  .then(() => {
    console.log('Database connected');
    startChallengeCleanup({ logger });
    twoFactorVerifier.about().then((info) => {
      if (!info.ok) logger.warn({ detail: info.detail }, '2FA: КриптоПро для проверки подписи недоступен — вход по ключу работать не будет');
    });
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });

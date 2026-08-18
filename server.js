import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Op } from '@sequelize/core';
import { sequelize, Recipient } from './models/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { authMiddleware } from './middleware/auth.js';
import logger from './config/logger.js';

import authRoutes from './routes/auth.js';
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

app.use(helmet());
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

function isAuthenticated(req) {
  const token = req.cookies?.token;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

const guestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isAuthenticated(req),
  message: { message: 'Слишком много запросов. Попробуйте позже (примерно через час).' },
});
app.use('/api', guestLimiter);

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
  customProps: (req) => ({
    userId: req.user?.id ?? null,
    userRole: req.user?.role ?? null
  })
}));
app.use(requestId);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/recipients', recipientsRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/diagnostics', diagnosticsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/lists', listsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/schedule', scheduleRoutes);

app.get('/api/search', authMiddleware, async (req, res, next) => {
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
    const recipient = await Recipient.findOne({
      attributes: ['id', 'lastName', 'firstName', 'middleName'],
      where: {
        [Op.or]: [
          { lastName: { [Op.like]: `%${q}%` } },
          { firstName: { [Op.like]: `%${q}%` } },
          { middleName: { [Op.like]: `%${q}%` } }
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
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1);
  });

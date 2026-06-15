import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Op } from '@sequelize/core';
import { sequelize, Recipient } from './models/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import logger from './config/logger.js';

import authRoutes from './routes/auth.js';
import recipientsRoutes from './routes/recipients.js';
import groupsRoutes from './routes/groups.js';
import diagnosticsRoutes from './routes/diagnostics.js';
import usersRoutes from './routes/users.js';
import documentsRoutes from './routes/documents.js';
import listsRoutes from './routes/lists.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors({
  credentials: true,
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api', limiter);

app.use(pinoHttp({ logger, genReqId: (req) => req.headers['x-request-id'] || uuidv4() }));
app.use(requestId);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/recipients', recipientsRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/diagnostics', diagnosticsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/lists', listsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/api/search', async (req, res, next) => {
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

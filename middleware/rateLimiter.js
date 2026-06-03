import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // для логина/регистрации строже
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// Можно добавить другие лимитеры под разные эндпоинты
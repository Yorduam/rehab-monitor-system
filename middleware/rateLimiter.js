import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export function createUserLimiter({ prefix, windowMs, limit, message, onLimit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => (req.limitKey
      ? `${prefix}:user:${req.limitKey}`
      : `${prefix}:ip:${ipKeyGenerator(req.ip || '')}`),
    handler: async (req, res, next, options) => {
      try {
        await onLimit?.(req);
      } catch (err) {
        req.log?.error({ err }, 'не удалось записать превышение лимита');
      }
      res.status(options.statusCode).json({
        code: 'RATE_LIMITED',
        message,
        retryAfterSec: Math.ceil(windowMs / 1000)
      });
    }
  });
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, 
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});


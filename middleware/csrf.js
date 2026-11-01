import crypto from 'node:crypto';

export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const allowedOrigins = () => new Set(
  [process.env.FRONTEND_URL || 'http://localhost:3000', ...(process.env.ALLOWED_ORIGINS || '').split(',')]
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)
);

const isLocalDevOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
};

export function ensureCsrfToken(req, res) {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!TOKEN_RE.test(token || '')) token = crypto.randomBytes(32).toString('base64url');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
  });
  return token;
}

const reject = (req, res, reason) => {
  req.log?.warn({ reason, url: req.originalUrl }, 'CSRF: запрос отклонён');
  return res.status(403).json({
    code: 'CSRF_FAILED',
    message: 'Страница устарела. Обновите её и повторите действие.'
  });
};

export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (origin) {
    const self = `${req.protocol}://${req.get('host')}`;
    if (origin !== self && !allowedOrigins().has(origin) && !isLocalDevOrigin(origin)) return reject(req, res, 'origin');
  }

  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get(CSRF_HEADER);
  if (!TOKEN_RE.test(cookie || '') || typeof header !== 'string' || header.length !== cookie.length) {
    return reject(req, res, 'token');
  }
  if (!crypto.timingSafeEqual(Buffer.from(header), Buffer.from(cookie))) return reject(req, res, 'token');
  return next();
}

import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'token';
export const PENDING_COOKIE = 'mfa_pending';
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const PENDING_TTL_MS = 5 * 60 * 1000;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MS = 15 * 60 * 1000;

const PENDING_AUDIENCE = 'mfa-pending';
const PENDING_PATH = '/api/v1/auth';
const ALGORITHMS = ['HS256'];

const HIDDEN_USER_FIELDS = ['passwordHash', 'failedLoginCount', 'lockedUntil', 'certPem'];
export const USER_ATTRIBUTES_EXCLUDE = HIDDEN_USER_FIELDS;

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET не задан');
  return process.env.JWT_SECRET;
};

const baseCookie = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
});

export function toPublicUser(user) {
  const plain = typeof user?.toJSON === 'function' ? user.toJSON() : { ...user };
  for (const field of HIDDEN_USER_FIELDS) delete plain[field];
  return plain;
}

export function issueSession(res, user, { mfa = false } = {}) {
  const token = jwt.sign(
    { id: user.id, role: user.role, mfa: mfa === true },
    secret(),
    { expiresIn: Math.floor(SESSION_TTL_MS / 1000), algorithm: 'HS256' }
  );
  res.cookie(SESSION_COOKIE, token, { ...baseCookie(), maxAge: SESSION_TTL_MS });
}

export function verifySessionToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, secret(), { algorithms: ALGORITHMS });
    if (!decoded?.id || decoded.aud === PENDING_AUDIENCE) return null;
    return decoded;
  } catch {
    return null;
  }
}

export const readSession = (req) => verifySessionToken(req.cookies?.[SESSION_COOKIE]);

export const PENDING_STAGES = ['mfa', 'enroll'];

export function issuePending(res, user, stage = 'mfa') {
  const token = jwt.sign(
    { id: user.id, stage: PENDING_STAGES.includes(stage) ? stage : 'mfa' },
    secret(),
    { expiresIn: Math.floor(PENDING_TTL_MS / 1000), audience: PENDING_AUDIENCE, algorithm: 'HS256' }
  );
  res.cookie(PENDING_COOKIE, token, { ...baseCookie(), maxAge: PENDING_TTL_MS, path: PENDING_PATH });
}

export function readPending(req) {
  const token = req.cookies?.[PENDING_COOKIE];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, secret(), { algorithms: ALGORITHMS, audience: PENDING_AUDIENCE });
    if (!decoded?.id) return null;
    return { ...decoded, stage: PENDING_STAGES.includes(decoded.stage) ? decoded.stage : 'mfa' };
  } catch {
    return null;
  }
}

export const clearSession = (res) => res.clearCookie(SESSION_COOKIE, baseCookie());
export const clearPending = (res) => res.clearCookie(PENDING_COOKIE, { ...baseCookie(), path: PENDING_PATH });

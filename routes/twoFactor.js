import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { csrfProtection } from '../middleware/csrf.js';
import { createUserLimiter } from '../middleware/rateLimiter.js';
import {
  CmsError, parseSignedData, parseCertificate, signerCertificate, signerMatches, toPem, fromPem,
  decodeCertificateInput
} from '../services/cms.js';
import {
  issueSession, readPending, clearPending, toPublicUser, MAX_FAILED_LOGINS, LOCK_MS
} from '../services/session.js';
import { TWO_FACTOR_ROLES, TWO_FACTOR_MODES, isRequiredFor } from '../services/twoFactorRules.js';

export { TWO_FACTOR_ROLES };
export const CHALLENGE_TTL_MS = 3 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SIGNATURE_CHARS = 100 * 1024;

export const ERRORS = {
  BAD_REQUEST: [400, 'Некорректный запрос. Обновите страницу и повторите.'],
  BAD_CERTIFICATE: [400, 'Не удалось прочитать сертификат. Нужен файл .cer (DER или Base64).'],
  NOT_STAFF: [400, 'Вход по ключу ЭП настраивается только для сотрудников центра.'],
  PASSWORD_INVALID: [400, 'Неверный текущий пароль.'],
  MFA_SESSION_EXPIRED: [401, 'Время на вход по ключу истекло. Введите логин и пароль заново.'],
  SIGNATURE_INVALID: [401, 'Подпись не прошла проверку.'],
  CERT_MISMATCH: [401, 'Подпись сделана не тем сертификатом, который привязан к учётной записи.'],
  CERT_EXPIRED: [401, 'Срок действия сертификата истёк или ещё не наступил.'],
  CERT_REVOKED: [401, 'Сертификат отозван удостоверяющим центром.'],
  CERT_UNTRUSTED: [401, 'Сертификат выдан удостоверяющим центром, которому сервер не доверяет.'],
  FORBIDDEN_ROLE: [403, 'Вход по ключу ЭП доступен только сотрудникам центра.'],
  FORBIDDEN_ADMIN: [403, 'Это действие доступно только администратору.'],
  CHALLENGE_NOT_FOUND: [404, 'Запрос на подпись не найден. Получите новый код.'],
  USER_NOT_FOUND: [404, 'Пользователь не найден.'],
  NONCE_REUSED: [409, 'Этот код уже использован. Получите новый.'],
  TWOFA_NOT_BOUND: [409, 'К учётной записи не привязан ключ ЭП.'],
  TWOFA_ALREADY_BOUND: [409, 'Ключ уже привязан. Войдите заново.'],
  TWOFA_REQUIRED: [409, 'Вход по ключу для вас обязателен: отвязать ключ нельзя, его можно только заменить.'],
  SELF_LOCKOUT: [409, 'Сначала привяжите ключ себе: после этого изменения без ключа вы не сможете войти.'],
  CERT_IN_USE: [409, 'Этот сертификат уже привязан к другой учётной записи.'],
  NONCE_EXPIRED: [410, 'Время на подпись истекло. Получите новый код.'],
  ACCOUNT_LOCKED: [423, 'Учётная запись временно заблокирована.'],
  RATE_LIMITED: [429, 'Слишком много попыток. Подождите несколько минут.'],
  REVOCATION_UNAVAILABLE: [503, 'Не удалось проверить, не отозван ли сертификат. Повторите позже.'],
  CSP_UNAVAILABLE: [503, 'Служба проверки подписи недоступна. Сообщите администратору.']
};

const COUNTED_FAILURES = new Set(['SIGNATURE_INVALID', 'CERT_MISMATCH']);
const ADMIN_CERT_STATUS = { BAD_CERTIFICATE: 400, CERT_IN_USE: 409, REVOCATION_UNAVAILABLE: 503, CSP_UNAVAILABLE: 503 };

const readSignatureBody = (body) => {
  const challengeId = body?.challengeId;
  const signature = body?.signature;
  if (typeof challengeId !== 'string' || !UUID_RE.test(challengeId)) return null;
  if (typeof signature !== 'string' || !signature || signature.length > MAX_SIGNATURE_CHARS) return null;
  return { challengeId: challengeId.toLowerCase(), signature };
};

const readPassword = (body) => {
  const value = body?.currentPassword;
  return typeof value === 'string' && value && value.length <= 200 ? value : null;
};

const isoOrNull = (value) => (value ? new Date(value).toISOString() : null);

const nameOf = (u) =>
  ([u?.lastName, u?.firstName].filter(Boolean).join(' ').trim() || u?.email || '').slice(0, 150);

export const statusView = (user, required = false) => ({
  available: TWO_FACTOR_ROLES.includes(user.role),
  enabled: !!user.twoFactorEnabled,
  required: !!required,
  thumbprint: user.twoFactorEnabled ? user.certThumbprint : null,
  subject: user.twoFactorEnabled ? user.certSubject : null,
  validTo: user.twoFactorEnabled ? isoOrNull(user.certValidTo) : null,
  boundAt: user.twoFactorEnabled ? isoOrNull(user.twoFactorBoundAt) : null
});

export const adminView = (user, policies) => ({
  id: user.id,
  twoFactorEnabled: !!user.twoFactorEnabled,
  twoFactorMode: TWO_FACTOR_MODES.includes(user.twoFactorMode) ? user.twoFactorMode : 'inherit',
  twoFactorRequired: isRequiredFor(user, policies),
  certThumbprint: user.twoFactorEnabled ? user.certThumbprint : null,
  certSubject: user.twoFactorEnabled ? user.certSubject : null,
  certValidTo: user.twoFactorEnabled ? isoOrNull(user.certValidTo) : null,
  twoFactorBoundAt: user.twoFactorEnabled ? isoOrNull(user.twoFactorBoundAt) : null
});

const UNBOUND = {
  twoFactorEnabled: false,
  certThumbprint: null,
  certPem: null,
  certSubject: null,
  certValidTo: null,
  twoFactorBoundAt: null
};

export function createTwoFactorRouter({
  users,
  challenges,
  verifier,
  audit,
  policy,
  authenticate,
  csrf = csrfProtection,
  comparePassword = (plain, hash) => bcrypt.compare(plain, hash),
  now = () => new Date(),
  limits = {}
}) {
  if (!users || !challenges || !verifier || !audit || !policy || !authenticate) {
    throw new Error('createTwoFactorRouter: не переданы зависимости');
  }

  const router = express.Router();

  const reply = (res, code, extra = {}, status = ERRORS[code][0]) => {
    res.set('Cache-Control', 'no-store');
    return res.status(status).json({ code, message: ERRORS[code][1], ...extra });
  };

  const fail = async (req, res, code, { user, action, challengeId = null, extra = {}, status } = {}) => {
    if (action) await audit(req, action, user, { result: 'fail', reason: code, challengeId, ...extra });
    return reply(res, code, {}, status);
  };

  const limiterAudit = (action) => (req) =>
    audit(req, action, req.twoFactorUser || req.user, { result: 'fail', reason: 'RATE_LIMITED' });

  const limiter = (prefix, windowMs, limit, action, override) => createUserLimiter({
    prefix,
    windowMs,
    limit,
    message: ERRORS.RATE_LIMITED[1],
    onLimit: limiterAudit(action),
    ...override
  });

  const startLimiter = limiter('2fa-start', 5 * 60 * 1000, 5, '2fa.start', limits.start);
  const verifyLimiter = limiter('2fa-verify', 15 * 60 * 1000, 10, '2fa.verify', limits.verify);
  const bindLimiter = limiter('2fa-bind', 5 * 60 * 1000, 5, '2fa.bind', limits.bind);
  const adminCertLimiter = limiter('2fa-admin-cert', 5 * 60 * 1000, 30, '2fa.bind', limits.adminCert);

  const lockedForMs = (user) => (user.lockedUntil ? new Date(user.lockedUntil).getTime() - now().getTime() : 0);

  const lockedReply = (res, ms) => {
    res.set('Cache-Control', 'no-store');
    return res.status(423).json({
      code: 'ACCOUNT_LOCKED',
      message: `Учётная запись временно заблокирована. Повторите через ${Math.ceil(ms / 60000)} мин.`
    });
  };

  const registerFailure = async (req, user) => {
    const count = (user.failedLoginCount || 0) + 1;
    if (count >= MAX_FAILED_LOGINS) {
      await users.update(user.id, { failedLoginCount: 0, lockedUntil: new Date(now().getTime() + LOCK_MS) });
      req.log?.warn({ userId: user.id, ip: req.ip }, 'учётная запись заблокирована после неудачных проверок ключа');
    } else {
      await users.update(user.id, { failedLoginCount: count });
    }
  };

  const loadPendingUser = (stage) => async (req, res, next) => {
    try {
      const pending = readPending(req);
      const user = pending && pending.stage === stage ? await users.findById(pending.id) : null;
      if (!user) {
        clearPending(res);
        return reply(res, 'MFA_SESSION_EXPIRED');
      }
      req.twoFactorUser = user;
      req.limitKey = String(user.id);
      return next();
    } catch (err) {
      return next(err);
    }
  };

  const loadSessionUser = async (req, res, next) => {
    try {
      const user = await users.findById(req.user.id);
      if (!user) return reply(res, 'MFA_SESSION_EXPIRED');
      req.twoFactorUser = user;
      req.limitKey = String(user.id);
      return next();
    } catch (err) {
      return next(err);
    }
  };

  const staffOnly = (action) => async (req, res, next) => {
    if (TWO_FACTOR_ROLES.includes(req.twoFactorUser.role)) return next();
    return fail(req, res, 'FORBIDDEN_ROLE', { user: req.twoFactorUser, action });
  };

  const adminOnly = (req, res, next) => (req.twoFactorUser.role === 'admin' ? next() : reply(res, 'FORBIDDEN_ADMIN'));

  const loadTarget = async (req, res, next) => {
    try {
      const id = Number.parseInt(req.params.userId, 10);
      const target = Number.isInteger(id) && id > 0 ? await users.findById(id) : null;
      if (!target) return reply(res, 'USER_NOT_FOUND');
      req.target = target;
      return next();
    } catch (err) {
      return next(err);
    }
  };

  const issueChallenge = async (req, user, purpose, thumbprint) => {
    const created = now();
    await challenges.expireActive(user.id, purpose, created);
    return challenges.create({
      id: uuidv4(),
      userId: user.id,
      purpose,
      nonce: crypto.randomBytes(32).toString('base64'),
      thumbprint,
      status: 'pending',
      createdAt: created,
      expiresAt: new Date(created.getTime() + CHALLENGE_TTL_MS),
      ip: String(req.ip || '').slice(0, 64),
      userAgent: String(req.get('user-agent') || '').slice(0, 255)
    });
  };

  const challengeView = (challenge, extra = {}) => ({
    challengeId: challenge.id,
    purpose: challenge.purpose,
    nonce: challenge.nonce,
    thumbprint: challenge.thumbprint,
    expiresAt: new Date(challenge.expiresAt).toISOString(),
    ttlSeconds: Math.max(0, Math.round((new Date(challenge.expiresAt).getTime() - now().getTime()) / 1000)),
    ...extra
  });

  const claimChallenge = async (challengeId, user, purpose) => {
    const challenge = await challenges.findById(challengeId);
    if (!challenge || challenge.userId !== user.id || challenge.purpose !== purpose) {
      return { code: 'CHALLENGE_NOT_FOUND' };
    }
    if (challenge.status === 'expired') return { code: 'NONCE_EXPIRED' };
    if (challenge.status !== 'pending') return { code: 'NONCE_REUSED' };
    const at = now();
    if (new Date(challenge.expiresAt).getTime() <= at.getTime()) {
      await challenges.markExpired(challenge.id);
      return { code: 'NONCE_EXPIRED' };
    }
    if (!(await challenges.claim(challenge.id, at))) {
      const again = await challenges.findById(challenge.id);
      return { code: again?.status === 'expired' ? 'NONCE_EXPIRED' : 'NONCE_REUSED' };
    }
    return { challenge };
  };

  const certTimeValid = (cert) => {
    const at = now().getTime();
    return at >= cert.notBefore.getTime() && at <= cert.notAfter.getTime();
  };

  const checkSignature = async ({ challenge, signature, boundPem }) => {
    let cms;
    let cert;
    try {
      cms = parseSignedData(signature);
      if (!cms.detached) return { ok: false, code: 'SIGNATURE_INVALID', detail: 'ожидалась откреплённая подпись' };
      if (boundPem) {
        cert = parseCertificate(fromPem(boundPem));
        if (!signerMatches(cms, cert)) return { ok: false, code: 'CERT_MISMATCH', detail: 'подписант не совпадает с привязанным сертификатом' };
      } else {
        cert = signerCertificate(cms);
      }
    } catch (err) {
      if (err instanceof CmsError) return { ok: false, code: 'SIGNATURE_INVALID', detail: err.message };
      throw err;
    }
    if (!certTimeValid(cert)) return { ok: false, code: 'CERT_EXPIRED', cert };
    const verdict = await verifier.verify({
      content: challenge.nonce,
      signature: cms.der.toString('base64'),
      certificate: cert.der.toString('base64'),
      expectedThumbprint: cert.thumbprint
    });
    return verdict.ok ? { ok: true, cert } : { ...verdict, cert };
  };

  const rejectSignature = async (req, res, user, action, challenge, result) => {
    await challenges.markFailed(challenge.id, result.code);
    if (COUNTED_FAILURES.has(result.code)) await registerFailure(req, user);
    req.log?.warn({ userId: user.id, challengeId: challenge.id, reason: result.code, detail: result.detail }, '2FA: подпись отклонена');
    return fail(req, res, result.code, {
      user,
      action,
      challengeId: challenge.id,
      extra: result.cert ? { thumbprint: result.cert.thumbprint } : {}
    });
  };

  const saveBinding = async (req, user, cert, { challengeId = null, by }) => {
    const owner = await users.findByThumbprint(cert.thumbprint);
    if (owner && owner.id !== user.id) return { code: 'CERT_IN_USE' };
    const patch = {
      twoFactorEnabled: true,
      certThumbprint: cert.thumbprint,
      certPem: toPem(cert.der),
      certSubject: cert.subject || null,
      certValidTo: cert.notAfter,
      twoFactorBoundAt: now()
    };
    try {
      await users.update(user.id, patch);
    } catch (err) {
      if (err?.name === 'SequelizeUniqueConstraintError' || err?.name === 'UniqueConstraintError') return { code: 'CERT_IN_USE' };
      throw err;
    }
    await challenges.expireActive(user.id, 'login', now());
    await audit(req, '2fa.bind', user, {
      result: 'success',
      by,
      challengeId,
      thumbprint: cert.thumbprint,
      subject: patch.certSubject,
      validTo: cert.notAfter.toISOString(),
      replaced: user.twoFactorEnabled ? user.certThumbprint : null
    });
    return { patch };
  };

  const confirmBySignature = async (req, res, user, { by, onSuccess }) => {
    const input = readSignatureBody(req.body);
    if (!input) return fail(req, res, 'BAD_REQUEST', { user, action: '2fa.bind' });

    const claim = await claimChallenge(input.challengeId, user, 'bind');
    if (!claim.challenge) return fail(req, res, claim.code, { user, action: '2fa.bind', challengeId: input.challengeId });

    const result = await checkSignature({ challenge: claim.challenge, signature: input.signature, boundPem: null });
    if (!result.ok) return rejectSignature(req, res, user, '2fa.bind', claim.challenge, result);

    const saved = await saveBinding(req, user, result.cert, { challengeId: claim.challenge.id, by });
    if (saved.code) {
      await challenges.markFailed(claim.challenge.id, saved.code);
      return fail(req, res, saved.code, {
        user, action: '2fa.bind', challengeId: claim.challenge.id, extra: { thumbprint: result.cert.thumbprint }
      });
    }
    issueSession(res, user, { mfa: true });
    res.set('Cache-Control', 'no-store');
    return onSuccess({ ...user, ...saved.patch });
  };

  const inspectUpload = async (input, target) => {
    let cert;
    try {
      cert = parseCertificate(decodeCertificateInput(input));
    } catch (err) {
      if (err instanceof CmsError) return { code: 'BAD_CERTIFICATE' };
      throw err;
    }
    const owner = await users.findByThumbprint(cert.thumbprint);
    const inUseBy = owner && owner.id !== target.id ? nameOf(owner) : null;
    const expired = !certTimeValid(cert);
    const chain = expired ? { ok: false, code: 'CERT_EXPIRED' } : await verifier.checkCertificate(cert.der);
    return { cert, inUseBy, expired, chain };
  };

  router.post('/start', csrf, loadPendingUser('mfa'), startLimiter, async (req, res, next) => {
    try {
      const user = req.twoFactorUser;
      const locked = lockedForMs(user);
      if (locked > 0) {
        await audit(req, '2fa.start', user, { result: 'fail', reason: 'ACCOUNT_LOCKED' });
        return lockedReply(res, locked);
      }
      if (!user.twoFactorEnabled || !user.certPem || !user.certThumbprint) {
        return fail(req, res, 'TWOFA_NOT_BOUND', { user, action: '2fa.start' });
      }
      if (user.certValidTo && new Date(user.certValidTo).getTime() <= now().getTime()) {
        return fail(req, res, 'CERT_EXPIRED', { user, action: '2fa.start', extra: { thumbprint: user.certThumbprint } });
      }
      const challenge = await issueChallenge(req, user, 'login', user.certThumbprint);
      await audit(req, '2fa.start', user, { result: 'success', purpose: 'login', challengeId: challenge.id });
      res.set('Cache-Control', 'no-store');
      return res.json(challengeView(challenge, {
        subject: user.certSubject,
        validTo: isoOrNull(user.certValidTo)
      }));
    } catch (err) {
      return next(err);
    }
  });

  router.post('/verify', csrf, loadPendingUser('mfa'), verifyLimiter, async (req, res, next) => {
    try {
      const user = req.twoFactorUser;
      const locked = lockedForMs(user);
      if (locked > 0) {
        await audit(req, '2fa.verify', user, { result: 'fail', reason: 'ACCOUNT_LOCKED' });
        return lockedReply(res, locked);
      }
      const input = readSignatureBody(req.body);
      if (!input) return fail(req, res, 'BAD_REQUEST', { user, action: '2fa.verify' });
      if (!user.twoFactorEnabled || !user.certPem) {
        return fail(req, res, 'TWOFA_NOT_BOUND', { user, action: '2fa.verify', challengeId: input.challengeId });
      }

      const claim = await claimChallenge(input.challengeId, user, 'login');
      if (!claim.challenge) return fail(req, res, claim.code, { user, action: '2fa.verify', challengeId: input.challengeId });

      const result = await checkSignature({ challenge: claim.challenge, signature: input.signature, boundPem: user.certPem });
      if (!result.ok) return rejectSignature(req, res, user, '2fa.verify', claim.challenge, result);

      await users.update(user.id, { failedLoginCount: 0, lockedUntil: null });
      clearPending(res);
      issueSession(res, user, { mfa: true });
      await audit(req, '2fa.verify', user, {
        result: 'success',
        challengeId: claim.challenge.id,
        thumbprint: user.certThumbprint
      });
      res.set('Cache-Control', 'no-store');
      return res.json({ user: toPublicUser(user) });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/enroll/start', csrf, loadPendingUser('enroll'), startLimiter, async (req, res, next) => {
    try {
      const user = req.twoFactorUser;
      const locked = lockedForMs(user);
      if (locked > 0) {
        await audit(req, '2fa.start', user, { result: 'fail', reason: 'ACCOUNT_LOCKED', purpose: 'enroll' });
        return lockedReply(res, locked);
      }
      if (!TWO_FACTOR_ROLES.includes(user.role)) return fail(req, res, 'FORBIDDEN_ROLE', { user, action: '2fa.start' });
      if (user.twoFactorEnabled) {
        clearPending(res);
        return reply(res, 'TWOFA_ALREADY_BOUND');
      }
      const challenge = await issueChallenge(req, user, 'bind', null);
      await audit(req, '2fa.start', user, { result: 'success', purpose: 'enroll', challengeId: challenge.id });
      res.set('Cache-Control', 'no-store');
      return res.json(challengeView(challenge));
    } catch (err) {
      return next(err);
    }
  });

  router.post('/enroll/confirm', csrf, loadPendingUser('enroll'), verifyLimiter, async (req, res, next) => {
    try {
      const user = req.twoFactorUser;
      if (user.twoFactorEnabled) {
        clearPending(res);
        return reply(res, 'TWOFA_ALREADY_BOUND');
      }
      return await confirmBySignature(req, res, user, {
        by: 'self',
        onSuccess: (updated) => {
          clearPending(res);
          return res.json({ user: toPublicUser(updated), status: statusView(updated, true) });
        }
      });
    } catch (err) {
      return next(err);
    }
  });

  router.get('/status', authenticate, loadSessionUser, async (req, res, next) => {
    try {
      const user = req.twoFactorUser;
      res.set('Cache-Control', 'no-store');
      return res.json(statusView(user, await policy.isRequired(user)));
    } catch (err) {
      return next(err);
    }
  });

  router.post('/bind/start', csrf, authenticate, loadSessionUser, staffOnly('2fa.bind'), bindLimiter, async (req, res, next) => {
    try {
      const user = req.twoFactorUser;
      const password = readPassword(req.body);
      if (!password || !(await comparePassword(password, user.passwordHash))) {
        return fail(req, res, 'PASSWORD_INVALID', { user, action: '2fa.bind' });
      }
      const challenge = await issueChallenge(req, user, 'bind', null);
      await audit(req, '2fa.start', user, { result: 'success', purpose: 'bind', challengeId: challenge.id });
      res.set('Cache-Control', 'no-store');
      return res.json(challengeView(challenge));
    } catch (err) {
      return next(err);
    }
  });

  router.post('/bind/confirm', csrf, authenticate, loadSessionUser, staffOnly('2fa.bind'), verifyLimiter, async (req, res, next) => {
    try {
      const user = req.twoFactorUser;
      const required = await policy.isRequired(user);
      return await confirmBySignature(req, res, user, {
        by: 'self',
        onSuccess: (updated) => res.json(statusView(updated, required))
      });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/unbind', csrf, authenticate, loadSessionUser, bindLimiter, async (req, res, next) => {
    try {
      const user = req.twoFactorUser;
      const password = readPassword(req.body);
      if (!password || !(await comparePassword(password, user.passwordHash))) {
        return fail(req, res, 'PASSWORD_INVALID', { user, action: '2fa.unbind' });
      }
      if (!user.twoFactorEnabled) return fail(req, res, 'TWOFA_NOT_BOUND', { user, action: '2fa.unbind' });
      if (await policy.isRequired(user)) return fail(req, res, 'TWOFA_REQUIRED', { user, action: '2fa.unbind' });
      await users.update(user.id, UNBOUND);
      await challenges.expireActive(user.id, 'login', now());
      issueSession(res, user, { mfa: false });
      await audit(req, '2fa.unbind', user, { result: 'success', by: 'self', thumbprint: user.certThumbprint });
      res.set('Cache-Control', 'no-store');
      return res.json(statusView({ ...user, ...UNBOUND }, false));
    } catch (err) {
      return next(err);
    }
  });

  router.get('/admin/policy', authenticate, loadSessionUser, adminOnly, async (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store');
      return res.json({ roles: await policy.getRolePolicies() });
    } catch (err) {
      return next(err);
    }
  });

  router.put('/admin/policy', csrf, authenticate, loadSessionUser, adminOnly, async (req, res, next) => {
    try {
      const actor = req.twoFactorUser;
      const { role, required } = req.body || {};
      if (!TWO_FACTOR_ROLES.includes(role) || typeof required !== 'boolean') return reply(res, 'BAD_REQUEST');
      const nextPolicies = { ...(await policy.getRolePolicies()), [role]: required };
      if (!actor.twoFactorEnabled && isRequiredFor(actor, nextPolicies)) {
        return fail(req, res, 'SELF_LOCKOUT', { user: actor, action: '2fa.policy', extra: { role, required } });
      }
      await policy.setRolePolicy(role, required, actor.id);
      await audit(req, '2fa.policy', actor, { result: 'success', scope: 'role', role, required });
      res.set('Cache-Control', 'no-store');
      return res.json({ roles: nextPolicies });
    } catch (err) {
      return next(err);
    }
  });

  router.put('/users/:userId/mode', csrf, authenticate, loadSessionUser, adminOnly, loadTarget, async (req, res, next) => {
    try {
      const actor = req.twoFactorUser;
      const target = req.target;
      const mode = req.body?.mode;
      if (!TWO_FACTOR_MODES.includes(mode)) return reply(res, 'BAD_REQUEST');
      if (!TWO_FACTOR_ROLES.includes(target.role)) return reply(res, 'NOT_STAFF');
      const policies = await policy.getRolePolicies();
      const updated = { ...target, twoFactorMode: mode };
      if (target.id === actor.id && !target.twoFactorEnabled && isRequiredFor(updated, policies)) {
        return fail(req, res, 'SELF_LOCKOUT', { user: target, action: '2fa.policy', extra: { mode } });
      }
      await users.update(target.id, { twoFactorMode: mode });
      await audit(req, '2fa.policy', target, {
        result: 'success',
        scope: 'user',
        mode,
        previous: target.twoFactorMode || 'inherit'
      });
      res.set('Cache-Control', 'no-store');
      return res.json(adminView(updated, policies));
    } catch (err) {
      return next(err);
    }
  });

  router.post('/users/:userId/certificate/check', csrf, authenticate, loadSessionUser, adminOnly, adminCertLimiter, loadTarget, async (req, res, next) => {
    try {
      const target = req.target;
      if (!TWO_FACTOR_ROLES.includes(target.role)) return reply(res, 'NOT_STAFF');
      const found = await inspectUpload(req.body?.certificate, target);
      if (found.code) return reply(res, found.code);
      const { cert, inUseBy, expired, chain } = found;
      res.set('Cache-Control', 'no-store');
      return res.json({
        thumbprint: cert.thumbprint,
        subject: cert.subject,
        surname: cert.surname,
        issuer: cert.issuer,
        validFrom: cert.notBefore.toISOString(),
        validTo: cert.notAfter.toISOString(),
        expired,
        inUseBy,
        sameAsCurrent: !!target.twoFactorEnabled && target.certThumbprint === cert.thumbprint,
        chainOk: !!chain.ok,
        chainCode: chain.ok ? null : chain.code,
        chainMessage: chain.ok ? null : (ERRORS[chain.code] || ERRORS.CERT_UNTRUSTED)[1],
        canBind: !expired && !inUseBy && !!chain.ok
      });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/users/:userId/certificate', csrf, authenticate, loadSessionUser, adminOnly, adminCertLimiter, loadTarget, async (req, res, next) => {
    try {
      const target = req.target;
      if (!TWO_FACTOR_ROLES.includes(target.role)) return reply(res, 'NOT_STAFF');
      const found = await inspectUpload(req.body?.certificate, target);
      const certFail = (code, extra = {}) => fail(req, res, code, {
        user: target,
        action: '2fa.bind',
        extra: { by: 'admin', ...extra },
        status: ADMIN_CERT_STATUS[code] ?? 422
      });
      if (found.code) return certFail(found.code);
      const thumbprint = found.cert.thumbprint;
      if (found.inUseBy) return certFail('CERT_IN_USE', { thumbprint });
      if (!found.chain.ok) {
        req.log?.warn({ userId: target.id, thumbprint, reason: found.chain.code, detail: found.chain.detail }, '2FA: сертификат не принят');
        return certFail(ERRORS[found.chain.code] ? found.chain.code : 'CERT_UNTRUSTED', { thumbprint });
      }
      const saved = await saveBinding(req, target, found.cert, { by: 'admin' });
      if (saved.code) return certFail(saved.code, { thumbprint });
      const policies = await policy.getRolePolicies();
      res.set('Cache-Control', 'no-store');
      return res.json(adminView({ ...target, ...saved.patch }, policies));
    } catch (err) {
      return next(err);
    }
  });

  router.post('/users/:userId/reset', csrf, authenticate, loadSessionUser, adminOnly, loadTarget, async (req, res, next) => {
    try {
      const target = req.target;
      if (!target.twoFactorEnabled) return fail(req, res, 'TWOFA_NOT_BOUND', { user: target, action: '2fa.unbind' });
      await users.update(target.id, UNBOUND);
      await challenges.expireActive(target.id, 'login', now());
      await audit(req, '2fa.unbind', target, { result: 'success', by: 'admin', thumbprint: target.certThumbprint });
      const policies = await policy.getRolePolicies();
      res.set('Cache-Control', 'no-store');
      return res.json(adminView({ ...target, ...UNBOUND }, policies));
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFakes, startApp, Client, decodeJwt } from './helpers/fakes.js';
import { makeCertificate, makeSignedData } from './helpers/asn1.js';
import { parseCertificate, toPem } from '../services/cms.js';
import { CHALLENGE_TTL_MS } from '../routes/twoFactor.js';

const boundCert = makeCertificate({ serial: '0A1B2C3D' });
const strangerCert = makeCertificate({ serial: '7F7F7F7F', sn: 'Петров', g: 'Пётр', cn: 'Петров Пётр' });
const boundInfo = parseCertificate(boundCert.der);
const strangerInfo = parseCertificate(strangerCert.der);

const sign = (cert, opts = {}) => makeSignedData({ cert, ...opts }).toString('base64');

function seedUsers(fakes) {
  fakes.users.set(1, {
    id: 1,
    email: 'teacher@test.local',
    role: 'teacher',
    firstName: 'Анна',
    lastName: 'Иванова',
    passwordHash: 'hash:secret-1',
    failedLoginCount: 0,
    lockedUntil: null,
    twoFactorEnabled: true,
    certThumbprint: boundInfo.thumbprint,
    certPem: toPem(boundCert.der),
    certSubject: boundInfo.subject,
    certValidTo: boundInfo.notAfter,
    twoFactorBoundAt: new Date()
  });
  fakes.users.set(2, {
    id: 2,
    email: 'employee@test.local',
    role: 'employee',
    passwordHash: 'hash:secret-2',
    failedLoginCount: 0,
    lockedUntil: null,
    twoFactorEnabled: false,
    certThumbprint: null,
    certPem: null,
    certSubject: null,
    certValidTo: null,
    twoFactorBoundAt: null
  });
}

describe('2FA: вход по ключу', () => {
  let fakes;
  let app;
  const user = { id: 1, role: 'teacher' };

  beforeEach(async () => {
    fakes = createFakes();
    seedUsers(fakes);
    app = await startApp({ ...fakes.deps, limits: { start: { limit: 3 } } });
  });

  afterEach(() => app.close());

  it('успех: nonce → подпись привязанным сертификатом → сессия с признаком mfa', async () => {
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    assert.equal(start.status, 200);
    assert.match(start.body.challengeId, /^[0-9a-f-]{36}$/);
    assert.equal(Buffer.from(start.body.nonce, 'base64').length, 32);
    assert.equal(start.body.thumbprint, boundInfo.thumbprint);
    assert.equal(start.body.ttlSeconds, CHALLENGE_TTL_MS / 1000);

    const res = await client.post('/verify', { challengeId: start.body.challengeId, signature: sign(boundCert) });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.user.id, 1);
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.certPem, undefined);

    assert.ok(client.jar.has('token'), 'выдана сессия');
    assert.equal(decodeJwt(client.jar.get('token')).mfa, true);
    assert.equal(client.jar.has('mfa_pending'), false, 'cookie первого фактора снята');

    const [call] = fakes.verifier.calls;
    assert.equal(call.content, start.body.nonce, 'проверяется именно выданный nonce');
    assert.equal(call.expectedThumbprint, boundInfo.thumbprint, 'сверка с серверным отпечатком');
    assert.equal(fakes.challenges.get(start.body.challengeId).status, 'used');
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.verify' && e.result === 'success' && e.ip && e.userAgent === 'node-test'));
  });

  it('истёкший nonce → 410 NONCE_EXPIRED, подпись не проверяется', async () => {
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    fakes.clock.t += CHALLENGE_TTL_MS + 1000;

    const res = await client.post('/verify', { challengeId: start.body.challengeId, signature: sign(boundCert) });
    assert.equal(res.status, 410);
    assert.equal(res.body.code, 'NONCE_EXPIRED');
    assert.equal(fakes.verifier.calls.length, 0);
    assert.equal(client.jar.has('token'), false);
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.verify' && e.result === 'fail' && e.reason === 'NONCE_EXPIRED'));
  });

  it('повторное использование nonce → 409 NONCE_REUSED', async () => {
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    const signature = sign(boundCert);
    assert.equal((await client.post('/verify', { challengeId: start.body.challengeId, signature })).status, 200);

    const replay = new Client(app.base).asPending(user);
    const res = await replay.post('/verify', { challengeId: start.body.challengeId, signature });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'NONCE_REUSED');
    assert.equal(replay.jar.has('token'), false);
  });

  it('параллельный replay: из двух одновременных проверок проходит ровно одна', async () => {
    const a = new Client(app.base).asPending(user);
    const start = await a.post('/start');
    const b = new Client(app.base).asPending(user);
    const body = { challengeId: start.body.challengeId, signature: sign(boundCert) };
    const results = await Promise.all([a.post('/verify', body), b.post('/verify', body)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    assert.equal(fakes.verifier.calls.length, 1);
  });

  it('неверная подпись → 401 SIGNATURE_INVALID, счётчик неудач растёт, код сгорает', async () => {
    fakes.verifier.result = { ok: false, code: 'SIGNATURE_INVALID' };
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    const res = await client.post('/verify', { challengeId: start.body.challengeId, signature: sign(boundCert) });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'SIGNATURE_INVALID');
    assert.equal(fakes.users.get(1).failedLoginCount, 1);
    assert.equal(fakes.challenges.get(start.body.challengeId).status, 'failed');
    assert.equal(client.jar.has('token'), false);

    const again = await client.post('/verify', { challengeId: start.body.challengeId, signature: sign(boundCert) });
    assert.equal(again.body.code, 'NONCE_REUSED');
  });

  it('повреждённый PKCS#7 → 401 SIGNATURE_INVALID без вызова CSP', async () => {
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    const res = await client.post('/verify', { challengeId: start.body.challengeId, signature: 'MIIBAAAA' });
    assert.equal(res.body.code, 'SIGNATURE_INVALID');
    assert.equal(fakes.verifier.calls.length, 0);
  });

  it('отозванный сертификат → 401 CERT_REVOKED и запись в аудит', async () => {
    fakes.verifier.result = { ok: false, code: 'CERT_REVOKED', detail: { chainStatus: ['Revoked'] } };
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    const res = await client.post('/verify', { challengeId: start.body.challengeId, signature: sign(boundCert) });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'CERT_REVOKED');
    assert.ok(fakes.auditLog.some((e) => e.reason === 'CERT_REVOKED' && e.thumbprint === boundInfo.thumbprint));
    assert.equal(fakes.users.get(1).failedLoginCount, 0, 'отзыв не считается попыткой подбора');
  });

  it('CSP недоступен → 503 CSP_UNAVAILABLE', async () => {
    fakes.verifier.result = { ok: false, code: 'CSP_UNAVAILABLE' };
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    const res = await client.post('/verify', { challengeId: start.body.challengeId, signature: sign(boundCert) });
    assert.equal(res.status, 503);
    assert.equal(res.body.code, 'CSP_UNAVAILABLE');
  });

  it('подпись чужим сертификатом → 401 CERT_MISMATCH: доверяем только серверному отпечатку', async () => {
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    const res = await client.post('/verify', {
      challengeId: start.body.challengeId,
      signature: sign(strangerCert),
      thumbprint: strangerInfo.thumbprint
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'CERT_MISMATCH');
    assert.equal(fakes.verifier.calls.length, 0);
  });

  it('ключ не привязан → 409 TWOFA_NOT_BOUND', async () => {
    const client = new Client(app.base).asPending({ id: 2, role: 'employee' });
    const res = await client.post('/start');
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'TWOFA_NOT_BOUND');
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.start' && e.reason === 'TWOFA_NOT_BOUND' && e.userId === 2));
  });

  it('rate limit на старт → 429 RATE_LIMITED', async () => {
    const client = new Client(app.base).asPending(user);
    for (let i = 0; i < 3; i++) assert.equal((await client.post('/start')).status, 200);
    const res = await client.post('/start');
    assert.equal(res.status, 429);
    assert.equal(res.body.code, 'RATE_LIMITED');
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.start' && e.reason === 'RATE_LIMITED'));
  });

  it('лимит считается по пользователю, а не по IP', async () => {
    const client = new Client(app.base).asPending(user);
    for (let i = 0; i < 3; i++) await client.post('/start');
    assert.equal((await client.post('/start')).status, 429);
    const other = new Client(app.base).asPending({ id: 2, role: 'employee' });
    assert.equal((await other.post('/start')).body.code, 'TWOFA_NOT_BOUND');
  });

  it('новый код аннулирует предыдущий', async () => {
    const client = new Client(app.base).asPending(user);
    const first = await client.post('/start');
    await client.post('/start');
    const res = await client.post('/verify', { challengeId: first.body.challengeId, signature: sign(boundCert) });
    assert.equal(res.body.code, 'NONCE_EXPIRED');
  });

  it('пять неудачных подписей → блокировка 423', async () => {
    fakes.verifier.result = { ok: false, code: 'SIGNATURE_INVALID' };
    const appWide = await startApp({ ...fakes.deps, limits: { start: { limit: 50 }, verify: { limit: 50 } } });
    try {
      const client = new Client(appWide.base).asPending(user);
      for (let i = 0; i < 5; i++) {
        const start = await client.post('/start');
        await client.post('/verify', { challengeId: start.body.challengeId, signature: sign(boundCert) });
      }
      const res = await client.post('/start');
      assert.equal(res.status, 423);
      assert.equal(res.body.code, 'ACCOUNT_LOCKED');
    } finally {
      await appWide.close();
    }
  });

  it('без CSRF-токена → 403 CSRF_FAILED', async () => {
    const client = new Client(app.base).asPending(user);
    client.csrf = false;
    const res = await client.post('/start');
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'CSRF_FAILED');
  });

  it('чужой Origin → 403 CSRF_FAILED даже с верным токеном', async () => {
    const client = new Client(app.base).asPending(user);
    client.extraHeaders.Origin = 'https://evil.example';
    const res = await client.post('/start');
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'CSRF_FAILED');
  });

  it('без cookie первого фактора → 401 MFA_SESSION_EXPIRED', async () => {
    const res = await new Client(app.base).post('/start');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'MFA_SESSION_EXPIRED');
  });

  it('cookie первого фактора не работает как сессия', async () => {
    const client = new Client(app.base).asPending(user);
    client.jar.set('token', client.jar.get('mfa_pending'));
    const res = await client.get('/status');
    assert.equal(res.status, 401);
  });

  it('в аудит не попадают nonce и подпись', async () => {
    const client = new Client(app.base).asPending(user);
    const start = await client.post('/start');
    const signature = sign(boundCert);
    await client.post('/verify', { challengeId: start.body.challengeId, signature });
    const dump = JSON.stringify(fakes.auditLog);
    assert.equal(dump.includes(start.body.nonce), false);
    assert.equal(dump.includes(signature.slice(0, 40)), false);
  });
});

describe('2FA: привязка и отвязка ключа', () => {
  let fakes;
  let app;

  beforeEach(async () => {
    fakes = createFakes();
    seedUsers(fakes);
    app = await startApp(fakes.deps);
  });

  afterEach(() => app.close());

  it('сессия без mfa у пользователя с 2FA → 401 MFA_REQUIRED', async () => {
    const res = await new Client(app.base).asSession({ id: 1, role: 'teacher' }).get('/status');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'MFA_REQUIRED');
  });

  it('привязка: пароль → nonce → подпись → ключ сохранён, сессия с mfa', async () => {
    const client = new Client(app.base).asSession({ id: 2, role: 'employee' });
    const bad = await client.post('/bind/start', { currentPassword: 'wrong' });
    assert.equal(bad.body.code, 'PASSWORD_INVALID');

    const start = await client.post('/bind/start', { currentPassword: 'secret-2' });
    assert.equal(start.status, 200);
    assert.equal(start.body.purpose, 'bind');

    const res = await client.post('/bind/confirm', { challengeId: start.body.challengeId, signature: sign(strangerCert) });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.enabled, true);
    assert.equal(res.body.thumbprint, strangerInfo.thumbprint);

    const stored = fakes.users.get(2);
    assert.equal(stored.twoFactorEnabled, true);
    assert.equal(stored.certThumbprint, strangerInfo.thumbprint);
    assert.match(stored.certPem, /BEGIN CERTIFICATE/);
    assert.equal(stored.certSubject, 'Петров Пётр');
    assert.equal(decodeJwt(client.jar.get('token')).mfa, true);
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.bind' && e.result === 'success'));
  });

  it('сертификат уже привязан к другому → 409 CERT_IN_USE', async () => {
    const client = new Client(app.base).asSession({ id: 2, role: 'employee' });
    const start = await client.post('/bind/start', { currentPassword: 'secret-2' });
    const res = await client.post('/bind/confirm', { challengeId: start.body.challengeId, signature: sign(boundCert) });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'CERT_IN_USE');
    assert.equal(fakes.users.get(2).twoFactorEnabled, false);
  });

  it('подпись без вложенного сертификата при привязке → SIGNATURE_INVALID', async () => {
    const client = new Client(app.base).asSession({ id: 2, role: 'employee' });
    const start = await client.post('/bind/start', { currentPassword: 'secret-2' });
    const res = await client.post('/bind/confirm', {
      challengeId: start.body.challengeId,
      signature: sign(strangerCert, { includeCert: false })
    });
    assert.equal(res.body.code, 'SIGNATURE_INVALID');
  });

  it('просроченный сертификат не привязывается → CERT_EXPIRED', async () => {
    const old = makeCertificate({ serial: '01020304', notAfter: new Date(Date.now() - 86400000) });
    const client = new Client(app.base).asSession({ id: 2, role: 'employee' });
    const start = await client.post('/bind/start', { currentPassword: 'secret-2' });
    const res = await client.post('/bind/confirm', { challengeId: start.body.challengeId, signature: sign(old) });
    assert.equal(res.body.code, 'CERT_EXPIRED');
    assert.equal(fakes.verifier.calls.length, 0);
  });

  it('nonce привязки нельзя использовать для входа', async () => {
    const session = new Client(app.base).asSession({ id: 1, role: 'teacher' }, { mfa: true });
    const start = await session.post('/bind/start', { currentPassword: 'secret-1' });
    const pending = new Client(app.base).asPending({ id: 1, role: 'teacher' });
    const res = await pending.post('/verify', { challengeId: start.body.challengeId, signature: sign(boundCert) });
    assert.equal(res.body.code, 'CHALLENGE_NOT_FOUND');
  });

  it('отвязка требует пароль и снимает ключ', async () => {
    const client = new Client(app.base).asSession({ id: 1, role: 'teacher' }, { mfa: true });
    assert.equal((await client.post('/unbind', {})).body.code, 'PASSWORD_INVALID');
    const res = await client.post('/unbind', { currentPassword: 'secret-1' });
    assert.equal(res.status, 200);
    assert.equal(res.body.enabled, false);
    assert.equal(fakes.users.get(1).certThumbprint, null);
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.unbind' && e.by === 'self'));
  });

  it('сброс ключа доступен только администратору', async () => {
    const teacher = new Client(app.base).asSession({ id: 2, role: 'employee' });
    assert.equal((await teacher.post('/users/1/reset')).status, 403);

    fakes.users.set(3, { id: 3, role: 'admin', email: 'admin@test.local', twoFactorEnabled: false });
    const admin = new Client(app.base).asSession({ id: 3, role: 'admin' });
    const res = await admin.post('/users/1/reset');
    assert.equal(res.status, 200);
    assert.equal(fakes.users.get(1).twoFactorEnabled, false);
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.unbind' && e.by === 'admin' && e.userId === 1));
  });

  it('реабилитанту привязка недоступна', async () => {
    fakes.users.set(4, { id: 4, role: 'recipient', passwordHash: 'hash:r', twoFactorEnabled: false });
    const client = new Client(app.base).asSession({ id: 4, role: 'recipient' });
    const res = await client.post('/bind/start', { currentPassword: 'r' });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'FORBIDDEN_ROLE');
  });
});

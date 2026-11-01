import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFakes, startApp, Client, decodeJwt } from './helpers/fakes.js';
import { makeCertificate, makeSignedData } from './helpers/asn1.js';
import { parseCertificate, toPem } from '../services/cms.js';
import { isRequiredFor } from '../services/twoFactorRules.js';

const keyCert = makeCertificate({ serial: '0A1B2C3D' });
const newCert = makeCertificate({ serial: '55667788', sn: 'Сидорова', g: 'Мария Олеговна', cn: 'Сидорова Мария Олеговна' });
const keyInfo = parseCertificate(keyCert.der);
const newInfo = parseCertificate(newCert.der);
const sign = (cert, opts = {}) => makeSignedData({ cert, ...opts }).toString('base64');
const b64 = (buf) => Buffer.from(buf).toString('base64');

const base = (over) => ({
  passwordHash: 'hash:pw',
  failedLoginCount: 0,
  lockedUntil: null,
  twoFactorEnabled: false,
  twoFactorMode: 'inherit',
  certThumbprint: null,
  certPem: null,
  certSubject: null,
  certValidTo: null,
  twoFactorBoundAt: null,
  ...over
});

function seed(fakes) {
  fakes.users.set(1, base({ id: 1, role: 'admin', email: 'admin@test.local', lastName: 'Админов', firstName: 'Олег' }));
  fakes.users.set(2, base({ id: 2, role: 'employee', email: 'emp@test.local', lastName: 'Сидорова', firstName: 'Мария' }));
  fakes.users.set(3, base({
    id: 3,
    role: 'teacher',
    email: 'teacher@test.local',
    lastName: 'Иванова',
    firstName: 'Анна',
    twoFactorEnabled: true,
    certThumbprint: keyInfo.thumbprint,
    certPem: toPem(keyCert.der),
    certSubject: keyInfo.subject,
    certValidTo: keyInfo.notAfter,
    twoFactorBoundAt: new Date()
  }));
  fakes.users.set(4, base({ id: 4, role: 'recipient', email: 'rec@test.local' }));
}

describe('правило обязательности', () => {
  const roles = { admin: true, employee: false, teacher: false };
  it('личная настройка сильнее роли, реабилитанту не требуется никогда', () => {
    assert.equal(isRequiredFor({ role: 'admin', twoFactorMode: 'inherit' }, roles), true);
    assert.equal(isRequiredFor({ role: 'admin', twoFactorMode: 'exempt' }, roles), false);
    assert.equal(isRequiredFor({ role: 'employee', twoFactorMode: 'inherit' }, roles), false);
    assert.equal(isRequiredFor({ role: 'employee', twoFactorMode: 'required' }, roles), true);
    assert.equal(isRequiredFor({ role: 'employee' }, roles), false);
    assert.equal(isRequiredFor({ role: 'recipient', twoFactorMode: 'required' }, roles), false);
    assert.equal(isRequiredFor(null, roles), false);
  });
});

describe('2FA: обязательный вход и привязка при входе', () => {
  let fakes;
  let app;

  beforeEach(async () => {
    fakes = createFakes();
    seed(fakes);
    app = await startApp(fakes.deps);
  });

  afterEach(() => app.close());

  it('включили обязательность роли — старая сессия без ключа перестаёт пускать', async () => {
    const client = new Client(app.base).asSession({ id: 2, role: 'employee' });
    assert.equal((await client.get('/status')).status, 200);
    fakes.rolePolicies.employee = true;
    const res = await client.get('/status');
    assert.equal(res.status, 401);
    assert.equal(res.body.code, 'MFA_REQUIRED');
  });

  it('исключение снимает требование роли', async () => {
    fakes.rolePolicies.employee = true;
    fakes.users.get(2).twoFactorMode = 'exempt';
    const res = await new Client(app.base).asSession({ id: 2, role: 'employee' }).get('/status');
    assert.equal(res.status, 200);
    assert.equal(res.body.required, false);
  });

  it('привязка при входе: код → подпись выбранным сертификатом → ключ сохранён, сессия с mfa', async () => {
    fakes.users.get(2).twoFactorMode = 'required';
    const client = new Client(app.base).asPending({ id: 2, role: 'employee' }, 'enroll');
    const start = await client.post('/enroll/start');
    assert.equal(start.status, 200);
    assert.equal(start.body.purpose, 'bind');
    assert.equal(start.body.thumbprint, null);

    const res = await client.post('/enroll/confirm', { challengeId: start.body.challengeId, signature: sign(newCert) });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.user.id, 2);
    assert.equal(res.body.user.certPem, undefined);
    assert.equal(res.body.status.enabled, true);
    assert.equal(res.body.status.required, true);

    const stored = fakes.users.get(2);
    assert.equal(stored.twoFactorEnabled, true);
    assert.equal(stored.certThumbprint, newInfo.thumbprint);
    assert.equal(decodeJwt(client.jar.get('token')).mfa, true);
    assert.equal(client.jar.has('mfa_pending'), false);
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.bind' && e.result === 'success' && e.by === 'self'));
  });

  it('стадии не смешиваются: cookie привязки не даёт входа по ключу и наоборот', async () => {
    const enroll = new Client(app.base).asPending({ id: 2, role: 'employee' }, 'enroll');
    assert.equal((await enroll.post('/start')).body.code, 'MFA_SESSION_EXPIRED');
    const mfa = new Client(app.base).asPending({ id: 3, role: 'teacher' }, 'mfa');
    assert.equal((await mfa.post('/enroll/start')).body.code, 'MFA_SESSION_EXPIRED');
  });

  it('ключ уже привязан (например, администратором) → 409 TWOFA_ALREADY_BOUND', async () => {
    const client = new Client(app.base).asPending({ id: 3, role: 'teacher' }, 'enroll');
    const res = await client.post('/enroll/start');
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'TWOFA_ALREADY_BOUND');
  });

  it('чужой сертификат при привязке → 409 CERT_IN_USE', async () => {
    const client = new Client(app.base).asPending({ id: 2, role: 'employee' }, 'enroll');
    const start = await client.post('/enroll/start');
    const res = await client.post('/enroll/confirm', { challengeId: start.body.challengeId, signature: sign(keyCert) });
    assert.equal(res.body.code, 'CERT_IN_USE');
    assert.equal(fakes.users.get(2).twoFactorEnabled, false);
  });

  it('при обязательном входе свой ключ отвязать нельзя', async () => {
    fakes.rolePolicies.teacher = true;
    const client = new Client(app.base).asSession({ id: 3, role: 'teacher' }, { mfa: true });
    const res = await client.post('/unbind', { currentPassword: 'pw' });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'TWOFA_REQUIRED');
    assert.equal(fakes.users.get(3).twoFactorEnabled, true);
  });
});

describe('2FA: управление администратором', () => {
  let fakes;
  let app;
  let admin;

  beforeEach(async () => {
    fakes = createFakes();
    seed(fakes);
    app = await startApp(fakes.deps);
    admin = new Client(app.base).asSession({ id: 1, role: 'admin' });
  });

  afterEach(() => app.close());

  it('политика ролей: чтение и включение для сотрудников с записью в аудит', async () => {
    assert.deepEqual((await admin.get('/admin/policy')).body.roles, { admin: false, employee: false, teacher: false });
    const res = await admin.put('/admin/policy', { role: 'employee', required: true });
    assert.equal(res.status, 200);
    assert.equal(res.body.roles.employee, true);
    assert.equal(fakes.rolePolicies.employee, true);
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.policy' && e.scope === 'role' && e.role === 'employee' && e.required === true));
  });

  it('администратор без ключа не может сделать ключ обязательным для своей роли', async () => {
    const res = await admin.put('/admin/policy', { role: 'admin', required: true });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'SELF_LOCKOUT');
    assert.equal(fakes.rolePolicies.admin, false);
  });

  it('некорректная политика → 400, не администратор → 403', async () => {
    assert.equal((await admin.put('/admin/policy', { role: 'recipient', required: true })).status, 400);
    assert.equal((await admin.put('/admin/policy', { role: 'employee', required: 'yes' })).status, 400);
    const employee = new Client(app.base).asSession({ id: 2, role: 'employee' });
    assert.equal((await employee.get('/admin/policy')).status, 403);
    assert.equal((await employee.put('/users/3/mode', { mode: 'required' })).status, 403);
  });

  it('личная настройка: обязателен / исключение, с проверками', async () => {
    const res = await admin.put('/users/2/mode', { mode: 'required' });
    assert.equal(res.status, 200);
    assert.equal(res.body.twoFactorMode, 'required');
    assert.equal(res.body.twoFactorRequired, true);
    assert.equal(fakes.users.get(2).twoFactorMode, 'required');

    assert.equal((await admin.put('/users/2/mode', { mode: 'always' })).status, 400);
    assert.equal((await admin.put('/users/4/mode', { mode: 'required' })).body.code, 'NOT_STAFF');
    assert.equal((await admin.put('/users/999/mode', { mode: 'required' })).status, 404);
    assert.equal((await admin.put('/users/1/mode', { mode: 'required' })).body.code, 'SELF_LOCKOUT');
  });

  it('проверка файла сертификата: реквизиты, издатель, статус цепочки', async () => {
    const res = await admin.post('/users/2/certificate/check', { certificate: b64(newCert.der) });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.subject, 'Сидорова Мария Олеговна');
    assert.equal(res.body.surname, 'Сидорова');
    assert.equal(res.body.issuer, 'Тестовый УЦ');
    assert.equal(res.body.thumbprint, newInfo.thumbprint);
    assert.equal(res.body.chainOk, true);
    assert.equal(res.body.canBind, true);
    assert.equal(fakes.users.get(2).twoFactorEnabled, false, 'проверка ничего не сохраняет');
  });

  it('файл в формате PEM тоже принимается', async () => {
    const res = await admin.post('/users/2/certificate/check', { certificate: b64(toPem(newCert.der)) });
    assert.equal(res.status, 200);
    assert.equal(res.body.thumbprint, newInfo.thumbprint);
  });

  it('проверка показывает проблемы: мусор, чужой ключ, просрочка, отзыв', async () => {
    assert.equal((await admin.post('/users/2/certificate/check', { certificate: b64('просто текст') })).body.code, 'BAD_CERTIFICATE');

    const inUse = await admin.post('/users/2/certificate/check', { certificate: b64(keyCert.der) });
    assert.equal(inUse.body.inUseBy, 'Иванова Анна');
    assert.equal(inUse.body.canBind, false);

    const old = makeCertificate({ serial: '01010101', notAfter: new Date(Date.now() - 86400000) });
    const calls = fakes.verifier.certCalls.length;
    const expired = await admin.post('/users/2/certificate/check', { certificate: b64(old.der) });
    assert.equal(expired.body.expired, true);
    assert.equal(expired.body.canBind, false);
    assert.equal(fakes.verifier.certCalls.length, calls, 'просроченный не отправляется в CSP');

    fakes.verifier.certResult = { ok: false, code: 'CERT_REVOKED' };
    const revoked = await admin.post('/users/2/certificate/check', { certificate: b64(newCert.der) });
    assert.equal(revoked.body.chainOk, false);
    assert.equal(revoked.body.chainCode, 'CERT_REVOKED');
    assert.match(revoked.body.chainMessage, /отозван/);
  });

  it('привязка по файлу: ключ сохранён, аудит «администратор», старая сессия сотрудника требует ключ', async () => {
    const employee = new Client(app.base).asSession({ id: 2, role: 'employee' });
    assert.equal((await employee.get('/status')).status, 200);

    const res = await admin.post('/users/2/certificate', { certificate: b64(newCert.der) });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.twoFactorEnabled, true);
    assert.equal(res.body.certThumbprint, newInfo.thumbprint);
    assert.equal(res.body.certSubject, 'Сидорова Мария Олеговна');

    const stored = fakes.users.get(2);
    assert.equal(stored.twoFactorEnabled, true);
    assert.match(stored.certPem, /BEGIN CERTIFICATE/);
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.bind' && e.by === 'admin' && e.userId === 2));

    assert.equal((await employee.get('/status')).body.code, 'MFA_REQUIRED');
  });

  it('привязка по файлу отклоняется: отозван → 422, чужой → 409, CRL недоступен → 503', async () => {
    fakes.verifier.certResult = { ok: false, code: 'CERT_REVOKED' };
    const revoked = await admin.post('/users/2/certificate', { certificate: b64(newCert.der) });
    assert.equal(revoked.status, 422);
    assert.equal(revoked.body.code, 'CERT_REVOKED');

    fakes.verifier.certResult = { ok: true };
    const inUse = await admin.post('/users/2/certificate', { certificate: b64(keyCert.der) });
    assert.equal(inUse.status, 409);

    fakes.verifier.certResult = { ok: false, code: 'REVOCATION_UNAVAILABLE' };
    const offline = await admin.post('/users/2/certificate', { certificate: b64(newCert.der) });
    assert.equal(offline.status, 503);

    assert.equal(fakes.users.get(2).twoFactorEnabled, false);
    assert.ok(fakes.auditLog.some((e) => e.action === '2fa.bind' && e.result === 'fail' && e.by === 'admin' && e.reason === 'CERT_REVOKED'));
  });

  it('привязка по файлу и сброс доступны только администратору и только для сотрудников', async () => {
    const employee = new Client(app.base).asSession({ id: 2, role: 'employee' });
    assert.equal((await employee.post('/users/3/certificate', { certificate: b64(newCert.der) })).status, 403);
    assert.equal((await admin.post('/users/4/certificate', { certificate: b64(newCert.der) })).body.code, 'NOT_STAFF');

    const reset = await admin.post('/users/3/reset');
    assert.equal(reset.status, 200);
    assert.equal(reset.body.twoFactorEnabled, false);
  });
});

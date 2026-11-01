import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { installCadespluginMock } from './cadespluginMock.js';
import { makeCertificate } from '../helpers/asn1.js';

const fixture = JSON.parse(fs.readFileSync(new URL('../fixtures/twoFactor.json', import.meta.url), 'utf8'));
const CSRF = crypto.randomBytes(32).toString('base64url');

const json = (route, status, body, headers = {}) =>
  route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });

const readBody = (req) => (req.postData() ? JSON.parse(req.postData()) : null);

test('обязательный ключ: после пароля сотрудник привязывает выбранный сертификат и входит', async ({ page }) => {
  const user = { id: 9, email: 'emp@test.local', role: 'employee' };
  const api = { requests: [], challenge: null, authed: false };
  await page.addInitScript(installCadespluginMock, { certs: [fixture.other, fixture.bound], signature: fixture.signature });
  await page.route('**/api/**', (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api\/v1/, '');
    api.requests.push({ method: req.method(), path, body: readBody(req) });
    if (path === '/auth/csrf') return json(route, 200, { csrfToken: CSRF }, { 'set-cookie': `csrf_token=${CSRF}; Path=/; SameSite=Strict` });
    if (path === '/auth/me') return api.authed ? json(route, 200, user) : json(route, 401, {});
    if (path === '/auth/login') return json(route, 200, { enrollRequired: true });
    if (path === '/auth/2fa/enroll/start') {
      api.challenge = {
        challengeId: crypto.randomUUID(), purpose: 'bind', nonce: crypto.randomBytes(32).toString('base64'),
        thumbprint: null, ttlSeconds: 180
      };
      return json(route, 200, api.challenge);
    }
    if (path === '/auth/2fa/enroll/confirm') {
      api.authed = true;
      return json(route, 200, { user, status: { enabled: true, required: true } });
    }
    return json(route, 200, req.method() === 'GET' ? [] : {});
  });

  await page.goto('/');
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill('пароль');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByRole('heading', { name: 'Привяжите ключ' })).toBeVisible();
  await expect(page.getByText(fixture.bound.subject)).toBeVisible();
  await expect(page.getByText(fixture.other.subject)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Подписать и привязать' })).toBeDisabled();

  await page.getByText(fixture.bound.subject).click();
  await page.getByRole('button', { name: 'Подписать и привязать' }).click();
  await expect(page.locator('.sidebar-teacher')).toBeVisible();

  const calls = await page.evaluate(() => window.__cadesMock.calls);
  expect(calls).toHaveLength(1);
  expect(calls[0].thumbprint).toBe(fixture.bound.thumbprint);
  expect(calls[0].content).toBe(api.challenge.nonce);
  const confirm = api.requests.find((r) => r.path === '/auth/2fa/enroll/confirm');
  expect(confirm.body).toEqual({ challengeId: api.challenge.challengeId, signature: fixture.signature });
});

const ADMIN = { id: 1, email: 'admin@test.local', role: 'admin', lastName: 'Админов', firstName: 'Олег' };

const staffUsers = () => [
  { ...ADMIN, twoFactorEnabled: false, twoFactorMode: 'inherit' },
  { id: 2, email: 't@test.local', role: 'teacher', lastName: 'Иванова', firstName: 'Анна', twoFactorEnabled: false, twoFactorMode: 'inherit' },
  {
    id: 3, email: 'e@test.local', role: 'employee', lastName: 'Петров', firstName: 'Пётр', twoFactorEnabled: true,
    twoFactorMode: 'inherit', certSubject: fixture.other.subject, certThumbprint: fixture.other.thumbprint,
    certValidTo: fixture.other.validTo, twoFactorBoundAt: '2026-10-01T09:00:00.000Z'
  },
  { id: 4, email: 'r@test.local', role: 'recipient', lastName: 'Реабилитант', firstName: 'Тест', twoFactorEnabled: false, twoFactorMode: 'inherit' }
];

async function mockAdminApi(page, { policyResponse } = {}) {
  const api = { requests: [], roles: { admin: false, employee: false, teacher: false } };
  await page.route('**/api/**', (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api\/v1/, '');
    const body = readBody(req);
    api.requests.push({ method: req.method(), path, body });
    if (path === '/auth/csrf') return json(route, 200, { csrfToken: CSRF }, { 'set-cookie': `csrf_token=${CSRF}; Path=/; SameSite=Strict` });
    if (path === '/auth/me') return json(route, 200, ADMIN);
    if (path === '/users') return json(route, 200, staffUsers());
    if (path === '/auth/2fa/admin/policy' && req.method() === 'GET') return json(route, 200, { roles: api.roles });
    if (path === '/auth/2fa/admin/policy' && req.method() === 'PUT') {
      if (policyResponse) return json(route, policyResponse.status, policyResponse.body);
      api.roles = { ...api.roles, [body.role]: body.required };
      return json(route, 200, { roles: api.roles });
    }
    if (path === '/auth/2fa/users/2/mode') {
      return json(route, 200, { id: 2, twoFactorEnabled: false, twoFactorMode: body.mode, twoFactorRequired: body.mode === 'required' });
    }
    if (path === '/auth/2fa/users/2/certificate/check') {
      return json(route, 200, {
        thumbprint: fixture.bound.thumbprint, subject: 'Иванова Анна Сергеевна', surname: 'Иванова', issuer: 'Тестовый УЦ',
        validFrom: '2026-01-15T00:00:00.000Z', validTo: fixture.bound.validTo, expired: false, inUseBy: null,
        sameAsCurrent: false, chainOk: true, chainCode: null, chainMessage: null, canBind: true
      });
    }
    if (path === '/auth/2fa/users/2/certificate') {
      return json(route, 200, {
        id: 2, twoFactorEnabled: true, twoFactorMode: 'inherit', twoFactorRequired: false,
        certThumbprint: fixture.bound.thumbprint, certSubject: 'Иванова Анна Сергеевна',
        certValidTo: fixture.bound.validTo, twoFactorBoundAt: new Date().toISOString()
      });
    }
    return json(route, 200, req.method() === 'GET' ? [] : {});
  });
  return api;
}

const row = (page, email) => page.locator('tbody tr', { hasText: email });

test('админка: колонка «Ключ ЭП» и обязательность для роли', async ({ page }) => {
  const api = await mockAdminApi(page);
  await page.goto('/#/admin-users');

  await expect(row(page, 't@test.local').locator('.key-chip')).toHaveText('Нет');
  await expect(row(page, 'e@test.local').locator('.key-chip')).toHaveText('Привязан');
  await expect(row(page, 'e@test.local').locator('.key-note')).toHaveText('до 15.01.2036');
  await expect(row(page, 'r@test.local').locator('.key-none')).toHaveText('—');
  await expect(row(page, 'r@test.local').getByRole('button', { name: 'Ключ ЭП' })).toHaveCount(0);

  await page.locator('.tfp-role', { hasText: 'Преподаватели' }).locator('input').check();
  await expect.poll(() => api.requests.find((r) => r.method === 'PUT' && r.path === '/auth/2fa/admin/policy')?.body)
    .toEqual({ role: 'teacher', required: true });
  await expect(row(page, 't@test.local').locator('.key-chip')).toHaveText('Нужен ключ');
});

test('админка: защита от самоблокировки — галочка возвращается, причина показана', async ({ page }) => {
  await mockAdminApi(page, {
    policyResponse: {
      status: 409,
      body: { code: 'SELF_LOCKOUT', message: 'Сначала привяжите ключ себе: после этого изменения без ключа вы не сможете войти.' }
    }
  });
  await page.goto('/#/admin-users');
  const box = page.locator('.tfp-role', { hasText: 'Администраторы' }).locator('input');
  await box.check();
  await expect(page.getByText(/Сначала привяжите ключ себе/)).toBeVisible();
  await expect(box).not.toBeChecked();
});

test('админка: привязка по файлу сертификата и личная настройка', async ({ page }) => {
  const api = await mockAdminApi(page);
  await page.goto('/#/admin-users');

  await row(page, 't@test.local').getByRole('button', { name: 'Ключ ЭП' }).click();
  await expect(page.getByRole('heading', { name: 'Ключ ЭП: Иванова Анна' })).toBeVisible();
  await expect(page.getByText('Ключ не привязан.')).toBeVisible();

  await page.locator('#km-mode').selectOption('exempt');
  await expect.poll(() => api.requests.find((r) => r.path === '/auth/2fa/users/2/mode')?.body).toEqual({ mode: 'exempt' });

  const cer = makeCertificate({ serial: '0A1B2C3D' }).der;
  await page.locator('#km-file').setInputFiles({ name: 'ivanova.cer', mimeType: 'application/pkix-cert', buffer: cer });
  await expect(page.getByText('Цепочка до доверенного УЦ построена, сертификат не отозван')).toBeVisible();
  const check = api.requests.find((r) => r.path === '/auth/2fa/users/2/certificate/check');
  expect(Buffer.from(check.body.certificate, 'base64').equals(cer)).toBe(true);

  await page.getByRole('button', { name: 'Привязать этот сертификат' }).click();
  await expect(page.locator('.km-dl dd', { hasText: 'Иванова Анна Сергеевна' }).first()).toBeVisible();
  const bind = api.requests.find((r) => r.path === '/auth/2fa/users/2/certificate');
  expect(bind.body.certificate).toBe(check.body.certificate);

  await page.getByRole('button', { name: 'Закрыть' }).click();
  await expect(row(page, 't@test.local').locator('.key-chip')).toHaveText('Привязан');
});

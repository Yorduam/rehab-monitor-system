import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { installCadespluginMock } from './cadespluginMock.js';

const fixture = JSON.parse(fs.readFileSync(new URL('../fixtures/twoFactor.json', import.meta.url), 'utf8'));

const USER = { id: 7, email: 'teacher@test.local', role: 'teacher', firstName: 'Анна', lastName: 'Иванова' };
const CSRF = crypto.randomBytes(32).toString('base64url');

const json = (route, status, body, headers = {}) =>
  route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });

async function mockApi(page, { ttlSeconds = 180, verify } = {}) {
  const api = { requests: [], challenges: [], authed: false };
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api\/v1/, '');
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    api.requests.push({ method: req.method(), path, body, headers: req.headers() });

    if (path === '/auth/csrf') {
      return json(route, 200, { csrfToken: CSRF }, { 'set-cookie': `csrf_token=${CSRF}; Path=/; SameSite=Strict` });
    }
    if (path === '/auth/me') return api.authed ? json(route, 200, USER) : json(route, 401, { message: 'Unauthorized' });
    if (path === '/auth/login') return json(route, 200, { mfaRequired: true });
    if (path === '/auth/logout') return json(route, 200, { message: 'Logged out' });
    if (path === '/auth/2fa/start') {
      const challenge = {
        challengeId: crypto.randomUUID(),
        purpose: 'login',
        nonce: crypto.randomBytes(32).toString('base64'),
        thumbprint: fixture.bound.thumbprint,
        subject: fixture.bound.subject,
        validTo: fixture.bound.validTo,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
        ttlSeconds
      };
      api.challenges.push(challenge);
      return json(route, 200, challenge);
    }
    if (path === '/auth/2fa/verify') {
      const verdict = verify
        ? verify(body, api)
        : (body?.signature === fixture.signature && body?.challengeId === api.challenges.at(-1)?.challengeId
          ? { status: 200, body: { user: USER } }
          : { status: 401, body: { code: 'SIGNATURE_INVALID', message: 'Подпись не прошла проверку.' } });
      if (verdict.status === 200) api.authed = true;
      return json(route, verdict.status, verdict.body);
    }
    return json(route, 200, req.method() === 'GET' ? [] : {});
  });
  return api;
}

async function login(page) {
  await page.goto('/');
  await page.locator('#login-email').fill(USER.email);
  await page.locator('#login-password').fill('секретный-пароль');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page.getByRole('heading', { name: 'Подтвердите вход' })).toBeVisible();
}

const withPlugin = (page, opts) => page.addInitScript(installCadespluginMock, {
  certs: [fixture.other, fixture.bound],
  signature: fixture.signature,
  ...opts
});

test('успешный вход: подписывается nonce сервера сертификатом, который назвал сервер', async ({ page }) => {
  await withPlugin(page);
  const api = await mockApi(page);
  await login(page);

  await expect(page.getByText(fixture.bound.subject)).toBeVisible();
  await expect(page.getByText(/Код действует ещё \d:\d\d/)).toBeVisible();
  await page.getByRole('button', { name: 'Подписать и войти' }).click();

  await expect(page.locator('.sidebar-teacher')).toBeVisible();
  await expect(page.locator('#login-email')).toHaveCount(0);

  const calls = await page.evaluate(() => window.__cadesMock.calls);
  expect(calls).toHaveLength(1);
  expect(calls[0].thumbprint).toBe(fixture.bound.thumbprint);
  expect(calls[0].content).toBe(api.challenges[0].nonce);
  expect(calls[0].detached).toBe(true);

  const verify = api.requests.find((r) => r.path === '/auth/2fa/verify');
  expect(verify.body).toEqual({ challengeId: api.challenges[0].challengeId, signature: fixture.signature });
  expect(verify.headers['x-csrf-token']).toBe(CSRF);
});

test('на токене нет привязанного сертификата: подписать чужим нельзя', async ({ page }) => {
  await withPlugin(page, { certs: [fixture.other] });
  const api = await mockApi(page);
  await login(page);

  await expect(page.getByText(/Другим сертификатом войти нельзя/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Подписать и войти' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Проверить снова' })).toBeVisible();
  expect(await page.evaluate(() => window.__cadesMock.calls.length)).toBe(0);
  expect(api.requests.some((r) => r.path === '/auth/2fa/verify')).toBe(false);

  await page.evaluate((bound) => window.__cadesMock.certs.push(bound), fixture.bound);
  await page.getByRole('button', { name: 'Проверить снова' }).click();
  await expect(page.getByRole('button', { name: 'Подписать и войти' })).toBeEnabled();
});

test('пользователь отменил подпись в окне КриптоПро', async ({ page }) => {
  await withPlugin(page, { signError: 'Действие было отменено пользователем. (0x8010006E)' });
  const api = await mockApi(page);
  await login(page);

  await page.getByRole('button', { name: 'Подписать и войти' }).click();
  await expect(page.getByText('Подпись отменена.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Подписать и войти' })).toBeEnabled();
  expect(api.requests.some((r) => r.path === '/auth/2fa/verify')).toBe(false);
});

test('неверный PIN-код', async ({ page }) => {
  await withPlugin(page, { signError: 'Указан неправильный PIN-код. (0x8010006B)' });
  await mockApi(page);
  await login(page);

  await page.getByRole('button', { name: 'Подписать и войти' }).click();
  await expect(page.getByText(/Неверный PIN-код токена/)).toBeVisible();
});

test('время на подпись истекло: кнопка повтора запрашивает новый код', async ({ page }) => {
  await withPlugin(page);
  const api = await mockApi(page, { ttlSeconds: 2 });
  await login(page);

  await expect(page.getByText('Время на подпись истекло')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Получить новый код' }).click();
  await expect.poll(() => api.challenges.length).toBe(2);
  expect(await page.evaluate(() => window.__cadesMock.calls.length)).toBe(0);
});

test('сервер отклонил подпись: отозванный сертификат', async ({ page }) => {
  await withPlugin(page);
  await mockApi(page, {
    verify: () => ({ status: 401, body: { code: 'CERT_REVOKED', message: 'Сертификат отозван удостоверяющим центром.' } })
  });
  await login(page);

  await page.getByRole('button', { name: 'Подписать и войти' }).click();
  await expect(page.getByText('Сертификат отозван удостоверяющим центром.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Получить новый код' })).toBeVisible();
  await expect(page.locator('.sidebar-teacher')).toHaveCount(0);
});

test('плагин не установлен', async ({ page }) => {
  await withPlugin(page, { pluginMissing: true });
  await mockApi(page);
  await login(page);

  await expect(page.getByText(/Не найден КриптоПро ЭЦП Browser plug-in/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Подписать и войти' })).toBeDisabled();
});

test('nonce и подпись не попадают в localStorage, sessionStorage и консоль', async ({ page }) => {
  const console = [];
  page.on('console', (msg) => console.push(msg.text()));
  await withPlugin(page);
  const api = await mockApi(page);
  await login(page);
  await page.getByRole('button', { name: 'Подписать и войти' }).click();
  await expect(page.locator('.sidebar-teacher')).toBeVisible();

  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  const nonce = api.challenges[0].nonce;
  const sig = fixture.signature.slice(0, 40);
  expect(storage.includes(nonce) || storage.includes(sig)).toBe(false);
  expect(console.some((line) => line.includes(nonce) || line.includes(sig))).toBe(false);
});

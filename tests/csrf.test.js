import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import { once } from 'node:events';
import { csrfProtection, ensureCsrfToken } from '../middleware/csrf.js';

describe('CSRF на всех изменяющих запросах', () => {
  let server;
  let base;
  const token = crypto.randomBytes(32).toString('base64url');

  before(async () => {
    process.env.FRONTEND_URL = 'https://erp.example.ru';
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.get('/api/csrf', (req, res) => res.json({ csrfToken: ensureCsrfToken(req, res) }));
    app.use('/api', csrfProtection);
    app.all('/api/thing', (req, res) => res.json({ ok: true, method: req.method }));
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(() => new Promise((resolve) => server.close(resolve)));

  const call = (method, { cookie = token, header = token, origin } = {}) => fetch(`${base}/api/thing`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: `csrf_token=${cookie}` } : {}),
      ...(header ? { 'X-CSRF-Token': header } : {}),
      ...(origin ? { Origin: origin } : {})
    },
    body: ['GET', 'HEAD'].includes(method) ? undefined : '{}'
  }).then(async (r) => ({ status: r.status, body: method === 'HEAD' ? null : await r.json() }));

  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    it(`${method} без токена → 403, с токеном → 200`, async () => {
      const denied = await call(method, { header: null });
      assert.equal(denied.status, 403);
      assert.equal(denied.body.code, 'CSRF_FAILED');
      assert.equal((await call(method)).status, 200);
    });
  }

  it('GET и HEAD токен не требуют', async () => {
    assert.equal((await call('GET', { cookie: null, header: null })).status, 200);
    assert.equal((await call('HEAD', { cookie: null, header: null })).status, 200);
  });

  it('токен в заголовке должен совпасть с cookie', async () => {
    const other = crypto.randomBytes(32).toString('base64url');
    assert.equal((await call('POST', { header: other })).status, 403);
    assert.equal((await call('POST', { cookie: null })).status, 403);
    assert.equal((await call('POST', { cookie: 'short', header: 'short' })).status, 403);
  });

  it('Origin: свой сайт и FRONTEND_URL пропускаются, чужой — нет', async () => {
    assert.equal((await call('POST', { origin: base })).status, 200);
    assert.equal((await call('POST', { origin: 'https://erp.example.ru' })).status, 200);
    assert.equal((await call('POST', { origin: 'https://evil.example' })).status, 403);
  });

  it('в production localhost-Origin не считается своим', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      assert.equal((await call('POST', { origin: 'http://localhost:3000' })).status, 403);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it('выдача токена: cookie читается фронтендом и переиспользуется', async () => {
    const r = await fetch(`${base}/api/csrf`, { headers: { Cookie: `csrf_token=${token}` } });
    const cookie = r.headers.getSetCookie()[0];
    assert.match(cookie, new RegExp(`^csrf_token=${token};`));
    assert.doesNotMatch(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
    assert.equal((await r.json()).csrfToken, token);
  });
});

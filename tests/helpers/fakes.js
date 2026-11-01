import crypto from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import { once } from 'node:events';
import { createTwoFactorRouter } from '../../routes/twoFactor.js';
import { makeAuthMiddleware } from '../../middleware/sessionAuth.js';
import { issuePending, issueSession } from '../../services/session.js';
import { emptyRolePolicies, isRequiredFor } from '../../services/twoFactorRules.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-2fa-only';
process.env.NODE_ENV = 'test';

const clone = (v) => (v == null ? v : structuredClone(v));

export function createFakes() {
  const clock = { t: Date.now() };
  const users = new Map();
  const challenges = new Map();
  const auditLog = [];

  const usersRepo = {
    findById: async (id) => clone(users.get(Number(id)) ?? null),
    findByThumbprint: async (tp) => clone([...users.values()].find((u) => u.certThumbprint === tp) ?? null),
    update: async (id, patch) => {
      Object.assign(users.get(Number(id)), clone(patch));
    }
  };

  const challengesRepo = {
    create: async (data) => {
      challenges.set(data.id, clone(data));
      return clone(data);
    },
    findById: async (id) => clone(challenges.get(id) ?? null),
    expireActive: async (userId, purpose) => {
      for (const c of challenges.values()) {
        if (c.userId === userId && c.purpose === purpose && c.status === 'pending') c.status = 'expired';
      }
    },
    claim: async (id, at) => {
      const c = challenges.get(id);
      if (!c || c.status !== 'pending' || new Date(c.expiresAt) <= at) return false;
      c.status = 'used';
      c.usedAt = at;
      return true;
    },
    markFailed: async (id, reason) => {
      const c = challenges.get(id);
      if (c) Object.assign(c, { status: 'failed', failReason: reason });
    },
    markExpired: async (id) => {
      const c = challenges.get(id);
      if (c?.status === 'pending') c.status = 'expired';
    },
    cleanup: async () => ({ expired: 0, removed: 0 })
  };

  const verifier = {
    result: { ok: true },
    certResult: { ok: true },
    calls: [],
    certCalls: [],
    async verify(args) {
      this.calls.push(args);
      return typeof this.result === 'function' ? this.result(args) : this.result;
    },
    async checkCertificate(der) {
      this.certCalls.push(der);
      return this.certResult;
    }
  };

  const rolePolicies = emptyRolePolicies();
  const policy = {
    getRolePolicies: async () => ({ ...rolePolicies }),
    setRolePolicy: async (role, required) => {
      rolePolicies[role] = !!required;
    },
    isRequired: async (user) => isRequiredFor(user, rolePolicies)
  };

  const audit = async (req, action, user, details = {}) => {
    auditLog.push({ action, userId: user?.id ?? null, ip: req.ip, userAgent: req.get('user-agent'), ...details });
  };

  return {
    clock,
    users,
    challenges,
    auditLog,
    verifier,
    rolePolicies,
    deps: {
      users: usersRepo,
      challenges: challengesRepo,
      verifier,
      audit,
      policy,
      authenticate: makeAuthMiddleware((id) => usersRepo.findById(id), { requiresSecondFactor: policy.isRequired }),
      comparePassword: async (plain, hash) => hash === `hash:${plain}`,
      now: () => new Date(clock.t)
    }
  };
}

export async function startApp(deps) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/auth/2fa', createTwoFactorRouter(deps));
  app.use((err, req, res, next) => res.status(500).json({ message: err.message }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    base: `http://127.0.0.1:${server.address().port}/api/v1/auth/2fa`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

export class Client {
  constructor(base) {
    this.base = base;
    this.jar = new Map([['csrf_token', crypto.randomBytes(32).toString('base64url')]]);
    this.csrf = true;
    this.extraHeaders = {};
  }

  asPending(user, stage = 'mfa') {
    issuePending({ cookie: (name, value) => this.jar.set(name, value) }, user, stage);
    return this;
  }

  asSession(user, opts) {
    issueSession({ cookie: (name, value) => this.jar.set(name, value) }, user, opts);
    return this;
  }

  async request(method, path, body) {
    const headers = {
      'User-Agent': 'node-test',
      Cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join('; '),
      ...this.extraHeaders
    };
    if (this.csrf) headers['X-CSRF-Token'] = this.jar.get('csrf_token');
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(this.base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const setCookies = res.headers.getSetCookie();
    for (const line of setCookies) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (!value || /expires=Thu, 01 Jan 1970/i.test(line)) this.jar.delete(name);
      else this.jar.set(name, value);
    }
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null, setCookies };
  }

  post(path, body = {}) {
    return this.request('POST', path, body);
  }

  put(path, body = {}) {
    return this.request('PUT', path, body);
  }

  get(path) {
    return this.request('GET', path);
  }
}

export const decodeJwt = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));

import { Op } from '@sequelize/core';
import { User, TwoFactorChallenge, AdminAuditLog } from '../models/index.js';

export const CHALLENGE_RETENTION_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

const plain = (row) => (row ? row.get({ plain: true }) : null);

export const sequelizeUsers = {
  findById: async (id) => plain(await User.findByPk(id)),
  findByThumbprint: async (thumbprint) => plain(await User.findOne({ where: { certThumbprint: thumbprint } })),
  update: async (id, patch) => {
    await User.update(patch, { where: { id } });
  }
};

export const sequelizeChallenges = {
  create: async (data) => plain(await TwoFactorChallenge.create(data)),
  findById: async (id) => plain(await TwoFactorChallenge.findByPk(id)),
  expireActive: async (userId, purpose) => {
    await TwoFactorChallenge.update({ status: 'expired' }, { where: { userId, purpose, status: 'pending' } });
  },
  claim: async (id, at) => {
    const [count] = await TwoFactorChallenge.update(
      { status: 'used', usedAt: at },
      { where: { id, status: 'pending', expiresAt: { [Op.gt]: at } } }
    );
    return count === 1;
  },
  markFailed: async (id, reason) => {
    await TwoFactorChallenge.update({ status: 'failed', failReason: String(reason).slice(0, 40) }, { where: { id } });
  },
  markExpired: async (id) => {
    await TwoFactorChallenge.update({ status: 'expired' }, { where: { id, status: 'pending' } });
  },
  cleanup: async (at) => {
    const [expired] = await TwoFactorChallenge.update(
      { status: 'expired' },
      { where: { status: 'pending', expiresAt: { [Op.lte]: at } } }
    );
    const removed = await TwoFactorChallenge.destroy({
      where: { createdAt: { [Op.lt]: new Date(at.getTime() - CHALLENGE_RETENTION_MS) } }
    });
    return { expired, removed };
  }
};

const nameOf = (u) =>
  ([u?.lastName, u?.firstName].filter(Boolean).join(' ').trim() || u?.email || '').slice(0, 150);

export async function auditTwoFactor(req, action, user, details = {}) {
  const actor = req.user || user;
  const level = details.result === 'fail' ? 'warn' : 'info';
  req.log?.[level]({ twoFactor: { action, userId: user?.id ?? null, ...details } }, '2FA');
  try {
    await AdminAuditLog.create({
      actorId: actor?.id ?? null,
      actorRole: actor?.role ?? null,
      actorName: nameOf(actor),
      targetUserId: user?.id ?? null,
      targetName: nameOf(user),
      action,
      details,
      ip: String(req.ip || '').slice(0, 64),
      userAgent: String(req.get?.('user-agent') || '').slice(0, 255),
      createdAt: new Date()
    });
  } catch (err) {
    req.log?.error({ err }, 'не удалось записать событие 2FA в журнал');
  }
}

export function startChallengeCleanup({ challenges = sequelizeChallenges, logger, intervalMs = CLEANUP_INTERVAL_MS } = {}) {
  const tick = async () => {
    try {
      const { expired, removed } = await challenges.cleanup(new Date());
      if (expired || removed) logger?.info({ expired, removed }, '2FA: очистка одноразовых кодов');
    } catch (err) {
      logger?.error({ err }, '2FA: очистка одноразовых кодов не удалась');
    }
  };
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  setTimeout(tick, 5000).unref();
  return () => clearInterval(timer);
}

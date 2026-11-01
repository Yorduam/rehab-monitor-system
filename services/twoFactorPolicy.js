import { TwoFactorRolePolicy } from '../models/index.js';
import { TWO_FACTOR_ROLES, emptyRolePolicies, isRequiredFor } from './twoFactorRules.js';

const CACHE_MS = 30 * 1000;
let cache = null;
let cachedAt = 0;

export async function getRolePolicies() {
  if (cache && Date.now() - cachedAt < CACHE_MS) return { ...cache };
  const rows = await TwoFactorRolePolicy.findAll();
  const next = emptyRolePolicies();
  for (const row of rows) {
    if (TWO_FACTOR_ROLES.includes(row.role)) next[row.role] = !!row.required;
  }
  cache = next;
  cachedAt = Date.now();
  return { ...next };
}

export async function setRolePolicy(role, required, actorId) {
  await TwoFactorRolePolicy.upsert({ role, required: !!required, updatedBy: actorId ?? null, updatedAt: new Date() });
  cache = null;
}

export const isTwoFactorRequired = async (user) => isRequiredFor(user, await getRolePolicies());

export const sequelizePolicy = {
  getRolePolicies,
  setRolePolicy,
  isRequired: isTwoFactorRequired
};

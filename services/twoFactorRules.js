export const TWO_FACTOR_ROLES = ['admin', 'employee', 'teacher'];
export const TWO_FACTOR_MODES = ['inherit', 'required', 'exempt'];

export const emptyRolePolicies = () => Object.fromEntries(TWO_FACTOR_ROLES.map((role) => [role, false]));

export function isRequiredFor(user, rolePolicies) {
  if (!user || !TWO_FACTOR_ROLES.includes(user.role)) return false;
  const mode = TWO_FACTOR_MODES.includes(user.twoFactorMode) ? user.twoFactorMode : 'inherit';
  if (mode === 'required') return true;
  if (mode === 'exempt') return false;
  return !!rolePolicies?.[user.role];
}

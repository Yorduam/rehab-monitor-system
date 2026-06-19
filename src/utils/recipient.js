

export function fullName(r) {
  if (!r) return '';
  return [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ');
}

export function shortName(r) {
  if (!r) return '';
  const last = r.lastName || '';
  const fi = r.firstName ? `${r.firstName[0]}.` : '';
  const mi = r.middleName ? `${r.middleName[0]}.` : '';
  return [last, fi, mi].filter(Boolean).join(' ');
}

export function initials(r) {
  if (!r) return '';

  if (typeof r === 'string') {
    return r.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }
  return [r.lastName?.[0], r.firstName?.[0]].filter(Boolean).join('').toUpperCase();
}

export function recipientAge(r) {
  const birth = r?.birthDate;
  if (!birth) return null;
  const b = new Date(birth);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

export const STATUS_LABELS = {
  draft: 'Черновик',
  active: 'Активен',
  archived: 'В архиве'
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || '—';
}

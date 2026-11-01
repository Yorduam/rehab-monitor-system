export function trustProxySetting(value = process.env.TRUST_PROXY) {
  const v = String(value ?? '').trim();
  if (!v) return process.env.NODE_ENV === 'production' ? 'loopback' : false;
  if (v === 'false') return false;
  if (/^\d+$/.test(v)) return Number(v);
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

export function requireHttps(req, res, next) {
  if (process.env.NODE_ENV !== 'production' || req.secure) return next();
  req.log?.warn({ url: req.originalUrl, ip: req.ip }, 'запрос по HTTP отклонён');
  return res.status(403).json({
    code: 'HTTPS_REQUIRED',
    message: 'Работа с системой возможна только по защищённому соединению (HTTPS).'
  });
}

export const MAX_SCAN_BYTES = 15 * 1024 * 1024;
export const MAX_SCAN_MB = Math.round(MAX_SCAN_BYTES / (1024 * 1024));
export const MAX_SCANS_PER_REQUEST = 12;

export const ALLOWED_SCAN_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const HUMAN_TYPES = 'PDF, JPG, PNG или WEBP';

const SIGNATURES = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }
];

const startsWith = (buf, bytes) =>
  buf.length >= bytes.length && bytes.every((b, i) => buf[i] === b);

const isWebp = (buf) =>
  buf.length >= 12 &&
  buf.toString('ascii', 0, 4) === 'RIFF' &&
  buf.toString('ascii', 8, 12) === 'WEBP';

export const sniffMime = (buffer) => {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return null;
  for (const sig of SIGNATURES) {
    if (startsWith(buffer, sig.bytes)) return sig.mime;
  }
  if (isWebp(buffer)) return 'image/webp';
  return null;
};

export const readScan = (scan, label = 'Файл') => {
  const base64 = scan?.base64;
  if (typeof base64 !== 'string' || !base64) {
    return { error: `${label}: файл не передан` };
  }

  const approxBytes = Math.floor((base64.length * 3) / 4);
  if (approxBytes > MAX_SCAN_BYTES) {
    return { error: `${label}: больше ${MAX_SCAN_MB} МБ — выберите файл меньшего размера` };
  }

  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch (e) {
    return { error: `${label}: файл не удалось прочитать` };
  }
  if (!buffer.length) return { error: `${label}: файл пустой` };
  if (buffer.length > MAX_SCAN_BYTES) {
    return { error: `${label}: больше ${MAX_SCAN_MB} МБ — выберите файл меньшего размера` };
  }

  const real = sniffMime(buffer);
  if (!real) {
    return { error: `${label}: это не ${HUMAN_TYPES}. Загрузите скан или фотографию документа.` };
  }
  if (!ALLOWED_SCAN_MIME.includes(real)) {
    return { error: `${label}: такой тип файла не принимается. Нужен ${HUMAN_TYPES}.` };
  }

  return { buffer, mimeType: real };
};

export const sendScanFile = (res, { mimeType, originalName, data }) => {
  const safeType = ALLOWED_SCAN_MIME.includes(mimeType) ? mimeType : 'application/octet-stream';
  const inline = safeType !== 'application/octet-stream';
  const name = encodeURIComponent(originalName || 'файл');

  res.setHeader('Content-Type', safeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${name}"; filename*=UTF-8''${name}`
  );
  res.send(data);
};

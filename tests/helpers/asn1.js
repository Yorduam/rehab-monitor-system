import crypto from 'node:crypto';

const encodeLength = (n) => {
  if (n < 0x80) return Buffer.from([n]);
  const bytes = [];
  for (let v = n; v > 0; v = Math.floor(v / 256)) bytes.unshift(v & 0xff);
  return Buffer.from([0x80 | bytes.length, ...bytes]);
};

export const tlv = (tag, ...parts) => {
  const body = Buffer.concat(parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p))));
  return Buffer.concat([Buffer.from([tag]), encodeLength(body.length), body]);
};

export const seq = (...parts) => tlv(0x30, ...parts);
export const set = (...parts) => tlv(0x31, ...parts);
export const ctx = (n, ...parts) => tlv(0xa0 + n, ...parts);
export const int = (hex) => tlv(0x02, Buffer.from(hex, 'hex'));
export const octet = (buf) => tlv(0x04, buf);
export const utf8 = (s) => tlv(0x0c, Buffer.from(s, 'utf8'));
export const bitString = (buf) => tlv(0x03, Buffer.concat([Buffer.from([0]), buf]));

export const oid = (dotted) => {
  const [a, b, ...rest] = dotted.split('.').map(Number);
  const bytes = [a * 40 + b];
  for (const n of rest) {
    const chunk = [n & 0x7f];
    for (let v = Math.floor(n / 128); v > 0; v = Math.floor(v / 128)) chunk.unshift((v & 0x7f) | 0x80);
    bytes.push(...chunk);
  }
  return tlv(0x06, Buffer.from(bytes));
};

const pad = (n) => String(n).padStart(2, '0');
export const utcTime = (d) => tlv(0x17, Buffer.from(
  `${pad(d.getUTCFullYear() % 100)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
  `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`,
  'latin1'
));

export const dn = (pairs) => seq(...pairs.map(([o, v]) => set(seq(oid(o), utf8(v)))));

const GOST_SIGN = '1.2.643.7.1.1.3.2';
const GOST_KEY = '1.2.643.7.1.1.1.1';
const GOST_HASH = '1.2.643.7.1.1.2.2';

export function makeCertificate({
  serial = '0A1B2C3D',
  issuer = 'Тестовый УЦ',
  sn = 'Иванова',
  g = 'Анна Сергеевна',
  cn = 'Иванова Анна Сергеевна',
  notBefore = new Date(Date.now() - 30 * 86400000),
  notAfter = new Date(Date.now() + 335 * 86400000)
} = {}) {
  const alg = seq(oid(GOST_SIGN));
  const tbs = seq(
    ctx(0, int('02')),
    int(serial),
    alg,
    dn([['2.5.4.3', issuer]]),
    seq(utcTime(notBefore), utcTime(notAfter)),
    dn([['2.5.4.4', sn], ['2.5.4.42', g], ['2.5.4.3', cn]]),
    seq(seq(oid(GOST_KEY), seq(oid('1.2.643.7.1.2.1.1.1'), oid(GOST_HASH))), bitString(octet(crypto.randomBytes(64))))
  );
  return { der: seq(tbs, alg, bitString(crypto.randomBytes(64))), serial, issuer };
}

export function makeSignedData({ cert, signer = cert, detached = true, includeCert = true, content = Buffer.alloc(32) }) {
  const signerInfo = seq(
    int('01'),
    seq(dn([['2.5.4.3', signer.issuer]]), int(signer.serial)),
    seq(oid(GOST_HASH)),
    seq(oid(GOST_KEY)),
    octet(crypto.randomBytes(64))
  );
  const encap = detached
    ? seq(oid('1.2.840.113549.1.7.1'))
    : seq(oid('1.2.840.113549.1.7.1'), ctx(0, octet(content)));
  const signedData = seq(
    int('01'),
    set(seq(oid(GOST_HASH))),
    encap,
    ...(includeCert ? [ctx(0, cert.der)] : []),
    set(signerInfo)
  );
  return seq(oid('1.2.840.113549.1.7.2'), ctx(0, signedData));
}

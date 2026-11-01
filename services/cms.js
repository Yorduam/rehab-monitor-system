import crypto from 'node:crypto';

export const MAX_SIGNATURE_BYTES = 64 * 1024;

const OID_SIGNED_DATA = '1.2.840.113549.1.7.2';
const OID_CN = '2.5.4.3';
const OID_SN = '2.5.4.4';
const OID_G = '2.5.4.42';

export class CmsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CmsError';
  }
}

function readTlv(buf, offset) {
  if (offset + 2 > buf.length) throw new CmsError('обрезанная структура ASN.1');
  const tag = buf[offset];
  if ((tag & 0x1f) === 0x1f) throw new CmsError('многобайтовые теги не поддерживаются');
  let len = buf[offset + 1];
  let header = 2;
  if (len === 0x80) throw new CmsError('неопределённая длина (BER) не поддерживается');
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n > 4 || offset + 2 + n > buf.length) throw new CmsError('некорректная длина ASN.1');
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + buf[offset + 2 + i];
    header += n;
  }
  const start = offset + header;
  const end = start + len;
  if (end > buf.length) throw new CmsError('длина ASN.1 выходит за границы');
  return { tag, start, end, offset, constructed: (tag & 0x20) !== 0 };
}

function children(buf, node) {
  const out = [];
  let pos = node.start;
  while (pos < node.end) {
    const child = readTlv(buf, pos);
    out.push(child);
    pos = child.end;
  }
  if (pos !== node.end) throw new CmsError('лишние байты в структуре ASN.1');
  return out;
}

const raw = (buf, node) => buf.subarray(node.offset, node.end);
const body = (buf, node) => buf.subarray(node.start, node.end);

function expectTag(node, tag, what) {
  if (!node || node.tag !== tag) throw new CmsError(`ожидался ${what}`);
  return node;
}

function decodeOid(bytes) {
  if (!bytes.length) throw new CmsError('пустой OID');
  const parts = [];
  let value = 0;
  for (const b of bytes) {
    value = value * 128 + (b & 0x7f);
    if (!(b & 0x80)) {
      parts.push(value);
      value = 0;
    }
  }
  const first = parts.shift();
  const head = first < 80 ? [Math.floor(first / 40), first % 40] : [2, first - 80];
  return [...head, ...parts].join('.');
}

function decodeString(buf, node) {
  const bytes = body(buf, node);
  switch (node.tag) {
    case 0x0c: return bytes.toString('utf8');
    case 0x13: case 0x16: case 0x12: return bytes.toString('latin1');
    case 0x14: return bytes.toString('latin1');
    case 0x1e: {
      const swapped = Buffer.from(bytes);
      swapped.swap16();
      return swapped.toString('utf16le');
    }
    default: return bytes.toString('utf8');
  }
}

function decodeTime(buf, node) {
  const s = body(buf, node).toString('latin1');
  let m;
  if (node.tag === 0x17 && (m = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(s))) {
    const yy = Number(m[1]);
    return new Date(Date.UTC(yy < 50 ? 2000 + yy : 1900 + yy, m[2] - 1, m[3], m[4], m[5], m[6]));
  }
  if (node.tag === 0x18 && (m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(s))) {
    return new Date(Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6]));
  }
  throw new CmsError('некорректная дата в сертификате');
}

function parseName(buf, node) {
  const attrs = {};
  for (const rdn of children(buf, expectTag(node, 0x30, 'Name'))) {
    for (const atv of children(buf, expectTag(rdn, 0x31, 'RDN'))) {
      const [type, value] = children(buf, expectTag(atv, 0x30, 'AttributeTypeAndValue'));
      const oid = decodeOid(body(buf, expectTag(type, 0x06, 'OID атрибута')));
      if (!(oid in attrs)) attrs[oid] = decodeString(buf, value);
    }
  }
  return attrs;
}

export function describeSubject(attrs) {
  const fio = [attrs[OID_SN], attrs[OID_G]].filter(Boolean).join(' ').trim();
  return (fio || attrs[OID_CN] || '').slice(0, 255);
}

export function parseCertificate(der) {
  const buf = Buffer.isBuffer(der) ? der : Buffer.from(der);
  const cert = expectTag(readTlv(buf, 0), 0x30, 'Certificate');
  if (cert.end !== buf.length) throw new CmsError('лишние байты после сертификата');
  const [tbs] = children(buf, cert);
  const fields = children(buf, expectTag(tbs, 0x30, 'TBSCertificate'));
  let i = 0;
  if (fields[i]?.tag === 0xa0) i++;
  const serial = expectTag(fields[i++], 0x02, 'serialNumber');
  i++;
  const issuer = expectTag(fields[i++], 0x30, 'issuer');
  const validity = children(buf, expectTag(fields[i++], 0x30, 'validity'));
  const subject = expectTag(fields[i++], 0x30, 'subject');
  if (validity.length !== 2) throw new CmsError('некорректный срок действия');
  const subjectAttrs = parseName(buf, subject);
  const issuerAttrs = parseName(buf, issuer);
  return {
    der: buf,
    thumbprint: crypto.createHash('sha1').update(buf).digest('hex').toUpperCase(),
    serialHex: body(buf, serial).toString('hex').replace(/^(00)+(?=.)/, '').toUpperCase(),
    issuerDer: raw(buf, issuer),
    issuer: (issuerAttrs[OID_CN] || '').slice(0, 255),
    notBefore: decodeTime(buf, validity[0]),
    notAfter: decodeTime(buf, validity[1]),
    subject: describeSubject(subjectAttrs),
    surname: subjectAttrs[OID_SN] || '',
    subjectAttrs
  };
}

const PEM_CERT_RE = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/;

export function decodeCertificateInput(input) {
  if (typeof input !== 'string') throw new CmsError('сертификат должен быть строкой Base64');
  const compact = input.replace(/\s+/g, '');
  if (!compact || compact.length > Math.ceil(MAX_SIGNATURE_BYTES / 3) * 4) {
    throw new CmsError('файл сертификата пустой или слишком большой');
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact) || compact.length % 4 !== 0) {
    throw new CmsError('файл сертификата не в формате Base64');
  }
  const buf = Buffer.from(compact, 'base64');
  const pem = PEM_CERT_RE.exec(buf.toString('latin1'));
  return pem ? fromPem(pem[0]) : buf;
}

function parseSignerId(buf, node) {
  if (node.tag === 0x30) {
    const [issuer, serial] = children(buf, node);
    return {
      issuerDer: raw(buf, expectTag(issuer, 0x30, 'issuer подписанта')),
      serialHex: body(buf, expectTag(serial, 0x02, 'serial подписанта')).toString('hex').replace(/^(00)+(?=.)/, '').toUpperCase()
    };
  }
  if (node.tag === 0x80) return { ski: body(buf, node).toString('hex').toUpperCase() };
  throw new CmsError('неизвестный идентификатор подписанта');
}

export function decodeSignature(input) {
  if (typeof input !== 'string') throw new CmsError('подпись должна быть строкой Base64');
  const compact = input.replace(/-----(BEGIN|END) [A-Z0-9 ]+-----/g, '').replace(/\s+/g, '');
  if (!compact || compact.length > Math.ceil(MAX_SIGNATURE_BYTES / 3) * 4) {
    throw new CmsError('подпись пустая или слишком большая');
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact) || compact.length % 4 !== 0) {
    throw new CmsError('подпись не в формате Base64');
  }
  return Buffer.from(compact, 'base64');
}

export function parseSignedData(input) {
  const buf = Buffer.isBuffer(input) ? input : decodeSignature(input);
  const info = expectTag(readTlv(buf, 0), 0x30, 'ContentInfo');
  if (info.end !== buf.length) throw new CmsError('лишние байты после подписи');
  const [type, wrapped] = children(buf, info);
  if (decodeOid(body(buf, expectTag(type, 0x06, 'contentType'))) !== OID_SIGNED_DATA) {
    throw new CmsError('это не подпись PKCS#7 SignedData');
  }
  const [signedData] = children(buf, expectTag(wrapped, 0xa0, 'содержимое ContentInfo'));
  const parts = children(buf, expectTag(signedData, 0x30, 'SignedData'));
  let i = 2;
  const encap = children(buf, expectTag(parts[i++], 0x30, 'encapContentInfo'));
  const detached = encap.length === 1;

  const certificates = [];
  if (parts[i]?.tag === 0xa0) {
    for (const c of children(buf, parts[i++])) {
      if (c.tag === 0x30) certificates.push(parseCertificate(raw(buf, c)));
    }
  }
  if (parts[i]?.tag === 0xa1) i++;
  const signerSet = children(buf, expectTag(parts[i], 0x31, 'signerInfos'));
  const signers = signerSet.map((s) => {
    const [, sid] = children(buf, expectTag(s, 0x30, 'SignerInfo'));
    return parseSignerId(buf, sid);
  });
  return { der: buf, detached, certificates, signers };
}

export function signerCertificate(cms) {
  if (cms.signers.length !== 1) throw new CmsError('ожидается ровно одна подпись');
  const sid = cms.signers[0];
  if (sid.ski) throw new CmsError('подписант указан через SubjectKeyIdentifier — такой формат не поддерживается');
  const cert = cms.certificates.find((c) => c.serialHex === sid.serialHex && c.issuerDer.equals(sid.issuerDer));
  if (!cert) throw new CmsError('в подписи нет сертификата подписанта');
  return cert;
}

export const signerMatches = (cms, cert) =>
  cms.signers.length === 1 &&
  cms.signers[0].serialHex === cert.serialHex &&
  !!cms.signers[0].issuerDer?.equals(cert.issuerDer);

export const toPem = (der) =>
  `-----BEGIN CERTIFICATE-----\n${Buffer.from(der).toString('base64').match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----\n`;

export const fromPem = (pem) =>
  Buffer.from(String(pem).replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, ''), 'base64');

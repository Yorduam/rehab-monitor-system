import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeCertificate, makeSignedData } from '../helpers/asn1.js';
import { parseCertificate } from '../../services/cms.js';

const dir = path.dirname(fileURLToPath(import.meta.url));

const bound = makeCertificate({
  serial: '0A1B2C3D',
  sn: 'Иванова',
  g: 'Анна Сергеевна',
  cn: 'Иванова Анна Сергеевна',
  notBefore: new Date('2026-01-15T00:00:00Z'),
  notAfter: new Date('2036-01-15T00:00:00Z')
});
const other = makeCertificate({
  serial: '7F7F7F7F',
  sn: 'Петров',
  g: 'Пётр Петрович',
  cn: 'Петров Пётр Петрович',
  notBefore: new Date('2026-01-15T00:00:00Z'),
  notAfter: new Date('2036-01-15T00:00:00Z')
});

const b = parseCertificate(bound.der);
const o = parseCertificate(other.der);

const fixture = {
  bound: { thumbprint: b.thumbprint, subject: b.subject, validTo: b.notAfter.toISOString(), issuer: 'Тестовый УЦ' },
  other: { thumbprint: o.thumbprint, subject: o.subject, validTo: o.notAfter.toISOString(), issuer: 'Тестовый УЦ' },
  signature: makeSignedData({ cert: bound }).toString('base64')
};

fs.writeFileSync(path.join(dir, 'twoFactor.json'), JSON.stringify(fixture, null, 2) + '\n', 'utf8');
console.log('tests/fixtures/twoFactor.json:', b.thumbprint, fixture.signature.length, 'символов подписи');

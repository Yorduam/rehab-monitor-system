import 'dotenv/config';
import fs from 'node:fs';
import { createCadescomVerifier } from '../services/cryptoProVerifier.js';
import { parseCertificate, fromPem } from '../services/cms.js';

const verifier = createCadescomVerifier();

const about = await verifier.about();
if (!about.ok) {
  console.log('✗ КриптоПро для проверки подписи недоступен:', JSON.stringify(about.detail));
  console.log('  Нужны КриптоПро CSP 5.0 R2+ и КриптоПро ЭЦП Browser plug-in на этом сервере.');
  process.exit(1);
}
console.log(`✓ CAdESCOM доступен: плагин ${about.plugin}, CSP ${about.csp || 'версия не определена'}`);
console.log(`  проверка отзыва: ${process.env.TWOFA_REVOCATION === 'offline' ? 'offline (только локальные CRL)' : 'online (CRL/OCSP УЦ)'}`);

const file = process.argv[2];
if (!file) {
  console.log('Чтобы проверить цепочку и отзыв: node scripts/check2faServer.js путь\\к\\сертификату.cer');
  process.exit(0);
}

const raw = fs.readFileSync(file);
const der = raw.toString('latin1').includes('BEGIN CERTIFICATE') ? fromPem(raw.toString('latin1')) : raw;
const cert = parseCertificate(der);
console.log(`Сертификат: ${cert.subject || '—'}, отпечаток ${cert.thumbprint}, до ${cert.notAfter.toLocaleDateString('ru-RU')}`);

const res = await verifier.checkCertificate(der);
if (res.ok) {
  console.log('✓ цепочка до доверенного корня построена, сертификат не отозван');
  process.exit(0);
}
console.log(`✗ ${res.code}`, JSON.stringify(res.detail || {}));
process.exit(1);

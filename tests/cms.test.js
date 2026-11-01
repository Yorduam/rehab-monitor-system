import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  parseSignedData, signerCertificate, signerMatches, parseCertificate, toPem, fromPem, CmsError
} from '../services/cms.js';
import { chainVerdict, hresultVerdict } from '../services/cryptoProVerifier.js';
import { makeCertificate, makeSignedData } from './helpers/asn1.js';

describe('разбор PKCS#7', () => {
  const cert = makeCertificate();

  it('достаёт сертификат подписанта и его реквизиты', () => {
    const cms = parseSignedData(makeSignedData({ cert }).toString('base64'));
    assert.equal(cms.detached, true);
    const signer = signerCertificate(cms);
    assert.equal(signer.thumbprint, crypto.createHash('sha1').update(cert.der).digest('hex').toUpperCase());
    assert.equal(signer.subject, 'Иванова Анна Сергеевна');
    assert.equal(signer.serialHex, '0A1B2C3D');
    assert.ok(signer.notAfter > new Date());
    assert.ok(signerMatches(cms, parseCertificate(cert.der)));
  });

  it('отличает прикреплённую подпись от откреплённой', () => {
    const cms = parseSignedData(makeSignedData({ cert, detached: false }));
    assert.equal(cms.detached, false);
  });

  it('не путает подписанта с другим сертификатом', () => {
    const other = makeCertificate({ serial: '11223344' });
    const cms = parseSignedData(makeSignedData({ cert }));
    assert.equal(signerMatches(cms, parseCertificate(other.der)), false);
  });

  it('принимает Base64 с переносами строк и PEM-обёрткой', () => {
    const b64 = makeSignedData({ cert }).toString('base64').match(/.{1,64}/g).join('\r\n');
    assert.doesNotThrow(() => parseSignedData(`-----BEGIN PKCS7-----\n${b64}\n-----END PKCS7-----`));
  });

  it('отклоняет мусор, обрезанные и слишком большие данные', () => {
    assert.throws(() => parseSignedData('не base64!'), CmsError);
    assert.throws(() => parseSignedData('MIIBAAAA'), CmsError);
    const full = makeSignedData({ cert });
    assert.throws(() => parseSignedData(full.subarray(0, full.length - 10).toString('base64')), CmsError);
    assert.throws(() => parseSignedData('A'.repeat(200 * 1024)), CmsError);
    assert.throws(() => parseSignedData(42), CmsError);
  });

  it('PEM туда и обратно не меняет сертификат', () => {
    assert.ok(fromPem(toPem(cert.der)).equals(cert.der));
  });
});

describe('коды ошибок CSP', () => {
  it('статусы цепочки', () => {
    assert.equal(chainVerdict(true, []), null);
    assert.equal(chainVerdict(true, ['NoError']), null);
    assert.equal(chainVerdict(false, ['Revoked', 'RevocationStatusUnknown']), 'CERT_REVOKED');
    assert.equal(chainVerdict(false, ['NotTimeValid']), 'CERT_EXPIRED');
    assert.equal(chainVerdict(false, ['RevocationStatusUnknown', 'OfflineRevocation']), 'REVOCATION_UNAVAILABLE');
    assert.equal(chainVerdict(false, ['UntrustedRoot']), 'CERT_UNTRUSTED');
    assert.equal(chainVerdict(false, ['PartialChain']), 'CERT_UNTRUSTED');
  });

  it('HRESULT от VerifyCades', () => {
    assert.equal(hresultVerdict('signature', '0x80092010'), 'CERT_REVOKED');
    assert.equal(hresultVerdict('signature', '0x800b0101'), 'CERT_EXPIRED');
    assert.equal(hresultVerdict('signature', '0x80092013'), 'REVOCATION_UNAVAILABLE');
    assert.equal(hresultVerdict('signature', '0x800B010A'), 'CERT_UNTRUSTED');
    assert.equal(hresultVerdict('signature', '0x80091007'), 'SIGNATURE_INVALID');
    assert.equal(hresultVerdict('com', '0x80040154'), 'CSP_UNAVAILABLE');
    assert.equal(hresultVerdict('com', '0x12345678'), 'CSP_UNAVAILABLE');
  });
});

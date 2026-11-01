import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cryptoPro', 'verify.ps1');
const MAX_OUTPUT = 64 * 1024;

const HRESULT_CODES = new Map([
  ['0x80092010', 'CERT_REVOKED'],
  ['0x800B0101', 'CERT_EXPIRED'],
  ['0x80092012', 'REVOCATION_UNAVAILABLE'],
  ['0x80092013', 'REVOCATION_UNAVAILABLE'],
  ['0x800B0109', 'CERT_UNTRUSTED'],
  ['0x800B010A', 'CERT_UNTRUSTED'],
  ['0x800B010D', 'CERT_UNTRUSTED'],
  ['0x800B0111', 'CERT_UNTRUSTED'],
  ['0x800B0112', 'CERT_UNTRUSTED'],
  ['0x80040154', 'CSP_UNAVAILABLE'],
  ['0x800401F3', 'CSP_UNAVAILABLE'],
  ['0x8007007E', 'CSP_UNAVAILABLE']
]);

const CHAIN_RULES = [
  [['Revoked'], 'CERT_REVOKED'],
  [['NotTimeValid'], 'CERT_EXPIRED'],
  [['RevocationStatusUnknown', 'OfflineRevocation'], 'REVOCATION_UNAVAILABLE']
];

export function chainVerdict(valid, statuses = []) {
  const problems = statuses.filter((s) => s && s !== 'NoError');
  if (valid && !problems.length) return null;
  for (const [flags, code] of CHAIN_RULES) {
    if (problems.some((s) => flags.includes(s))) return code;
  }
  return 'CERT_UNTRUSTED';
}

export const hresultVerdict = (stage, hresult) =>
  HRESULT_CODES.get(String(hresult || '').toUpperCase().replace('0X', '0x')) ||
  (stage === 'com' ? 'CSP_UNAVAILABLE' : 'SIGNATURE_INVALID');

function createGate(max) {
  let active = 0;
  const queue = [];
  const release = () => {
    active--;
    const next = queue.shift();
    if (next) next();
  };
  return (task) => new Promise((resolve, reject) => {
    const start = () => {
      active++;
      Promise.resolve().then(task).then(resolve, reject).finally(release);
    };
    if (active < max) start();
    else queue.push(start);
  });
}

export function createCadescomVerifier({
  powershell = process.env.TWOFA_POWERSHELL || 'powershell.exe',
  revocation = process.env.TWOFA_REVOCATION === 'offline' ? 'offline' : 'online',
  timeoutMs = Number(process.env.TWOFA_VERIFY_TIMEOUT_MS) || 25000,
  urlTimeoutSec = 10,
  maxParallel = 4,
  logger = null
} = {}) {
  const encoded = Buffer.from(fs.readFileSync(SCRIPT_PATH, 'utf8'), 'utf16le').toString('base64');
  const gate = createGate(maxParallel);

  const run = (payload) => gate(() => new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve({ ok: false, stage: 'com', hresult: null, platform: process.platform });
      return;
    }
    let out = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const child = spawn(
      powershell,
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const timer = setTimeout(() => {
      child.kill();
      finish({ ok: false, stage: 'timeout' });
    }, timeoutMs);
    child.on('error', (err) => finish({ ok: false, stage: 'spawn', message: err.code || err.message }));
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      out += chunk;
      if (out.length > MAX_OUTPUT) child.kill();
    });
    child.on('close', () => {
      try {
        finish(JSON.parse(out.trim()));
      } catch {
        finish({ ok: false, stage: 'output' });
      }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify({ ...payload, revocation, timeoutSec: urlTimeoutSec }));
  }));

  const unavailable = (res) => ({
    ok: false,
    code: 'CSP_UNAVAILABLE',
    detail: { stage: res.stage, hresult: res.hresult ?? null, platform: res.platform ?? null, message: res.message ?? null }
  });

  return {
    name: 'cadescom',

    async verify({ content, signature, certificate, expectedThumbprint }) {
      const res = await run({ mode: 'verify', content, signature, certificate });
      if (!res.ok) {
        if (['timeout', 'spawn', 'output', 'input'].includes(res.stage)) return unavailable(res);
        const code = res.stage === 'signers' ? 'SIGNATURE_INVALID' : hresultVerdict(res.stage, res.hresult);
        return { ok: false, code, detail: { stage: res.stage, hresult: res.hresult ?? null } };
      }
      const signer = String(res.signerThumbprint || '').toUpperCase();
      if (!signer || signer !== String(expectedThumbprint).toUpperCase()) {
        return { ok: false, code: 'CERT_MISMATCH', detail: { stage: 'signer' } };
      }
      const chainCode = chainVerdict(res.chainValid, res.chainStatus);
      if (chainCode) return { ok: false, code: chainCode, detail: { stage: 'chain', chainStatus: res.chainStatus } };
      return { ok: true };
    },

    async checkCertificate(der) {
      const res = await run({ mode: 'cert', certificate: Buffer.from(der).toString('base64') });
      if (!res.ok) return unavailable(res);
      const code = chainVerdict(res.chainValid, res.chainStatus);
      return code
        ? { ok: false, code, detail: { chainStatus: res.chainStatus } }
        : { ok: true, detail: { chainStatus: res.chainStatus } };
    },

    async about() {
      const res = await run({ mode: 'about' });
      if (!res.ok) return unavailable(res);
      logger?.info?.({ plugin: res.plugin, csp: res.csp }, 'КриптоПро для проверки 2FA');
      return { ok: true, plugin: res.plugin, csp: res.csp };
    }
  };
}

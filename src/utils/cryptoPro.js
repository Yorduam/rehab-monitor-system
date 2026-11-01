const PLUGIN_TIMEOUT_MS = 15000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NONCE_RE = /^[A-Za-z0-9+/]{43}=$/;
const THUMB_RE = /^[0-9A-F]{40}$/;

const MESSAGES = {
  PLUGIN_MISSING: 'Не найден КриптоПро ЭЦП Browser plug-in. Установите плагин и расширение для браузера, затем обновите страницу.',
  CANCELLED: 'Подпись отменена.',
  WRONG_PIN: 'Неверный PIN-код токена. Повторите и введите PIN внимательно — после нескольких ошибок токен заблокируется.',
  PIN_LOCKED: 'PIN-код токена заблокирован. Обратитесь к администратору.',
  TOKEN_MISSING: 'Токен не найден. Вставьте флешку с ключом и нажмите «Проверить снова».',
  CERT_NOT_FOUND: 'На этом компьютере не найден сертификат, привязанный к учётной записи. Вставьте нужный токен.',
  BAD_CHALLENGE: 'Сервер прислал некорректный запрос на подпись. Обновите страницу.',
  SIGN_FAILED: 'Не удалось подписать. Повторите попытку.'
};

const HRESULT_CODES = [
  [['0x8010006E', '0x800704C7'], 'CANCELLED'],
  [['0x8010006B'], 'WRONG_PIN'],
  [['0x8010006C'], 'PIN_LOCKED'],
  [['0x80090016', '0x8010000C', '0x80100069', '0x8010002E', '0x80100017'], 'TOKEN_MISSING'],
  [['0x80092004'], 'CERT_NOT_FOUND']
];

export class CryptoProError extends Error {
  constructor(code, detail = '') {
    super(MESSAGES[code] || MESSAGES.SIGN_FAILED);
    this.name = 'CryptoProError';
    this.code = code;
    this.detail = detail;
  }
}

const messageOf = (err) => String(err?.message ?? err ?? '');

export function toCryptoProError(err, fallback = 'SIGN_FAILED') {
  if (err instanceof CryptoProError) return err;
  const text = messageOf(err);
  const hresult = (text.match(/0x[0-9A-F]{8}/i)?.[0] || '').toUpperCase().replace('0X', '0x');
  for (const [codes, code] of HRESULT_CODES) {
    if (codes.includes(hresult)) return new CryptoProError(code, hresult);
  }
  if (/плагин недоступен|истекло время ожидания загрузки плагина|не создаются обь?ъекты/i.test(text)) {
    return new CryptoProError('PLUGIN_MISSING');
  }
  if (/отмен/i.test(text)) return new CryptoProError('CANCELLED', hresult);
  return new CryptoProError(fallback, hresult);
}

let apiPromise = null;

function loadApi() {
  if (!apiPromise) {
    if (typeof window !== 'undefined' && !window.cadesplugin_load_timeout) {
      window.cadesplugin_load_timeout = PLUGIN_TIMEOUT_MS;
    }
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Истекло время ожидания загрузки плагина')), PLUGIN_TIMEOUT_MS + 2000);
    });
    apiPromise = Promise.race([
      import('crypto-pro-cadesplugin').then((m) => (m.default || m)()),
      timeout
    ]).catch((err) => {
      apiPromise = null;
      throw toCryptoProError(err, 'PLUGIN_MISSING');
    });
  }
  return apiPromise;
}

const unquote = (v) => v.trim().replace(/^"(.*)"$/s, '$1').replace(/""/g, '"');

export function parseDistinguishedName(dn) {
  const out = {};
  const re = /(?:^|,\s*)([A-Za-zА-Яа-я0-9. ]+?)=("(?:[^"]|"")*"|[^,]*)/g;
  let m;
  while ((m = re.exec(String(dn || ''))) !== null) {
    const key = m[1].trim().toUpperCase();
    if (!(key in out)) out[key] = unquote(m[2]);
  }
  return out;
}

const describeSubject = (dn) => {
  const p = parseDistinguishedName(dn);
  return [p.SN, p.G].filter(Boolean).join(' ').trim() || p.CN || '';
};

const mediaOf = (container) => {
  const m = /^\\\\\.\\([^\\]+)\\/.exec(String(container || ''));
  return m ? m[1] : '';
};

async function readMedia(privateKey) {
  try {
    const container = await privateKey?.UniqueContainerName;
    return mediaOf(container);
  } catch {
    return '';
  }
}

async function readCertificates(api) {
  let list;
  try {
    list = await api.getCertsList();
  } catch (err) {
    if (/нет (доступных )?сертификатов/i.test(messageOf(err))) return [];
    throw toCryptoProError(err, 'SIGN_FAILED');
  }
  return Promise.all(list.map(async (c) => ({
    thumbprint: String(c.thumbprint || '').toUpperCase(),
    subject: describeSubject(c.subjectInfo),
    issuer: parseDistinguishedName(c.issuerInfo).CN || '',
    validFrom: c.validPeriod?.from ? new Date(c.validPeriod.from).toISOString() : null,
    validTo: c.validPeriod?.to ? new Date(c.validPeriod.to).toISOString() : null,
    media: await readMedia(c.privateKey)
  })));
}

export async function checkPlugin() {
  const api = await loadApi();
  try {
    const about = await api.about();
    const version = await about?.Version;
    return { ok: true, version: version ? String(version) : '' };
  } catch (err) {
    throw toCryptoProError(err, 'PLUGIN_MISSING');
  }
}

export async function listCertificates() {
  return readCertificates(await loadApi());
}

export async function signChallenge(challenge, { thumbprint } = {}) {
  const valid = challenge && typeof challenge === 'object' &&
    UUID_RE.test(String(challenge.challengeId || '')) &&
    NONCE_RE.test(String(challenge.nonce || ''));
  if (!valid) throw new CryptoProError('BAD_CHALLENGE');

  const target = String(challenge.purpose === 'login' ? challenge.thumbprint : thumbprint || '').toUpperCase();
  if (!['login', 'bind'].includes(challenge.purpose) || !THUMB_RE.test(target)) {
    throw new CryptoProError('BAD_CHALLENGE');
  }

  const api = await loadApi();
  const certs = await readCertificates(api);
  if (!certs.some((c) => c.thumbprint === target)) {
    throw new CryptoProError(challenge.purpose === 'login' ? 'CERT_NOT_FOUND' : 'TOKEN_MISSING');
  }

  let signature;
  try {
    signature = await api.signBase64(target, challenge.nonce, true);
  } catch (err) {
    throw toCryptoProError(err, 'SIGN_FAILED');
  }
  if (typeof signature !== 'string' || !signature.trim()) throw new CryptoProError('SIGN_FAILED');
  return signature.replace(/\s+/g, '');
}


const WEIGHTS = [7, 3, 1];

const TO_DIGIT = {
  O: '0', Q: '0', D: '0', U: '0',
  I: '1', L: '1', T: '1', J: '1',
  Z: '2',
  A: '4',
  S: '5',
  G: '6', C: '6',
  B: '8',
  P: '9'
};

function charValue(ch) {
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55;
  if (ch === '<') return 0;
  return -1;
}

export function mrzCheckDigit(chunk) {
  let sum = 0;
  for (let i = 0; i < chunk.length; i += 1) {
    const v = charValue(chunk[i]);
    if (v < 0) return -1;
    sum += v * WEIGHTS[i % 3];
  }
  return sum % 10;
}

function normalizeField(chunk) {
  let out = '';
  for (const ch of chunk) {
    if ((ch >= '0' && ch <= '9') || ch === '<') out += ch;
    else if (TO_DIGIT[ch]) out += TO_DIGIT[ch];
    else return null;
  }
  return out;
}

function chunkOk(chunk, cd) {
  return chunk !== null && cd !== null && /^\d$/.test(cd) && mrzCheckDigit(chunk) === Number(cd);
}

const TO_LETTER = { 0: 'O', 1: 'I', 2: 'Z', 5: 'S', 6: 'G', 8: 'B' };

function looksRus(chunk) {
  return [...chunk].map((ch) => TO_LETTER[ch] || ch).join('') === 'RUS';
}

function* mrzWindows(line) {
  if (line.length < 13) return;
  if (line.length <= 44) { yield line; return; }
  for (let i = 0; i + 44 <= line.length; i += 1) {
    const win = line.slice(i, i + 44);
    if (looksRus(win.slice(10, 13))) yield win;
  }
}

function isoFromYymmdd(yymmdd, notAfter) {
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  const limit = notAfter || new Date();
  for (const century of [2000, 1900]) {
    const year = century + yy;
    const d = new Date(Date.UTC(year, mm - 1, dd));
    const real = d.getUTCFullYear() === year && d.getUTCMonth() === mm - 1 && d.getUTCDate() === dd;
    if (real && d <= limit) {
      return `${String(year).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
  }
  return null;
}

export function parseMrz(rawText, options = {}) {
  const notAfter = options.notAfter || new Date();
  const lines = String(rawText || '')
    .toUpperCase()
    .split(/[\r\n]+/)
    .map((l) => l.replace(/[^0-9A-Z<]/g, ''));

  const candidates = [];
  for (const raw of lines) for (const win of mrzWindows(raw)) candidates.push(win);

  for (const line of candidates) {
    if (!looksRus(line.slice(10, 13))) continue;

    const numberField = normalizeField(line.slice(0, 9));
    const birthField = normalizeField(line.slice(13, 19));
    const optField = normalizeField(line.slice(28, 42));

    const numberOk = chunkOk(numberField, line[9]) && /^\d{9}$/.test(numberField);
    const birthOk = /^[MF<]$/.test(line[20])
      && chunkOk(birthField, line[19]) && /^\d{6}$/.test(birthField);
    const optOk = line.length === 44 && chunkOk(optField, line[42]);
    if (!numberOk && !birthOk && !optOk) continue;

    const out = { docSeries: null, docNumber: null, birthDate: null, docDate: null, deptCode: null };

    if (numberOk) out.docNumber = numberField.slice(3, 9);
    if (numberOk && optOk && /^\d$/.test(optField[0])) {
      out.docSeries = numberField.slice(0, 3) + optField[0];
    }
    if (birthOk) out.birthDate = isoFromYymmdd(birthField, notAfter);
    if (optOk) {
      const issue = optField.slice(1, 7);
      if (/^\d{6}$/.test(issue)) out.docDate = isoFromYymmdd(issue, notAfter);
      const dept = optField.slice(7, 13);
      if (/^\d{6}$/.test(dept)) out.deptCode = `${dept.slice(0, 3)}-${dept.slice(3)}`;
    }

    if (Object.values(out).some((v) => v)) return out;
  }

  return null;
}

const SNILS_SHAPE = /(?<!\d)\d{3}[ -]?\d{3}[ -]?\d{3}[ -]?\d{2}(?!\d)/g;

export function parseSnils(rawText) {
  for (const raw of String(rawText || '').match(SNILS_SHAPE) || []) {
    const n = raw.replace(/\D/g, '');
    if (snilsChecksumOk(n)) {
      return `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6, 9)} ${n.slice(9, 11)}`;
    }
  }
  return null;
}

export function snilsChecksumOk(digits) {
  if (!/^\d{11}$/.test(digits)) return false;

  const body = digits.slice(0, 9);
  if (Number(body) <= 1001998) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(body[i]) * (9 - i);

  let control = sum;
  if (sum > 101) control = sum % 101;
  if (control >= 100) control = 0;

  return control === Number(digits.slice(9, 11));
}

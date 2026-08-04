import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'documents');

const TEMPLATE_MAP = {
  pdn:   { minor: 'pd_consent_minor.docx',    adult: 'pd_consent_adult.docx',    ext: 'docx' },
  photo: { minor: 'photo_consent_minor.docx', adult: 'photo_consent_adult.docx', ext: 'docx' },
  diag:  { minor: 'diagnostics_minor.docx',   adult: 'diagnostics_adult.docx',   ext: 'docx' },
};

const OUT_BASENAME = {
  pdn:   'Согласие_на_обработку_ПДн',
  photo: 'Согласие_на_фото_видео',
  diag:  'Заявление_на_диагностику',
};

const CONTENT_TYPE = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const INVALIDITY_LABELS = {
  child: 'Ребёнок-инвалид',
  '1': 'I группа',
  '2': 'II группа',
  '3': 'III группа',
  none: 'нет',
};

const RELATION_INSTR = {
  'Сын': 'сыном',
  'Дочь': 'дочерью',
  'Подопечный': 'подопечным',
  'Подопечная': 'подопечной',
};

function xmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fmtDate(v) {
  if (!v) return '';
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  return s;
}

function joinName(...parts) {
  return parts.map((x) => (x || '').trim()).filter(Boolean).join(' ');
}

function relationInstr(v) {
  return RELATION_INSTR[v] || (v || '');
}

function composeDoc({ series, num, date, issuer, code }) {
  const parts = [];
  const sn = [series, num].map((x) => (x || '').trim()).filter(Boolean).join(' ');
  if (sn) parts.push(sn);
  if (date) parts.push('выдан ' + fmtDate(date));
  if (issuer) parts.push(String(issuer).trim());
  if (code) parts.push('код ' + String(code).trim());
  return parts.join(', ');
}

export function ageFromBirth(birth) {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function buildTokens(form = {}, isMinor) {
  const repFullName = joinName(form.lrLast, form.lrFirst, form.lrMid);
  const rehFullName = joinName(form.rLast, form.rFirst, form.rMid);
  const repPhone = form.lrPhone || '';
  const rehRegAddress = form.rAddrReg || '';
  const rehFactAddress = form.rAddrSame ? (form.rAddrReg || '') : (form.rAddrFact || '');
  const disabilityLabel = INVALIDITY_LABELS[form.rInvalidity] || '';

  const repPassport = composeDoc({
    series: form.lrPassSeries, num: form.lrPassNum, date: form.lrPassDate,
    issuer: form.lrPassIssuer, code: form.lrPassCode,
  });
  const rehDoc = composeDoc({
    series: form.rDocSeries, num: form.rDocNum, date: form.rDocDate, issuer: form.rDocIssuer,
  });

  const word = {
    repFullName,
    rehFullName,
    repPassport,
    rehPassport: rehDoc,
    rehDoc,
    repAddress: form.lrAddress || '',
    repPhone,
    rehPhone: repPhone,
    rehRegAddress,
    rehBirthDate: fmtDate(form.rBirth),
    rehRelation: relationInstr(form.rDocRelation),
  };

  const excel = isMinor
    ? {
        fullNameParent: repFullName,
        passportSerialParent: form.lrPassSeries || '',
        passportNumberParent: form.lrPassNum || '',
        passportWhoParent: form.lrPassIssuer || '',
        passportDateParent: fmtDate(form.lrPassDate),
        passportCodeParent: form.lrPassCode || '',
        passportRegistrationParent: form.lrAddress || '',
        telephoneParent: repPhone,
      }
    : {
        fullNameParent: rehFullName,
        passportSerialParent: form.rDocSeries || '',
        passportNumberParent: form.rDocNum || '',
        passportWhoParent: form.rDocIssuer || '',
        passportDateParent: fmtDate(form.rDocDate),
        passportCodeParent: '',
        passportRegistrationParent: rehRegAddress,
        telephoneParent: repPhone,
      };

  const excelCommon = {
    fullName: rehFullName,
    birthDate: fmtDate(form.rBirth),
    passportSerial: form.rDocSeries || '',
    passportNumber: form.rDocNum || '',
    passportWho: form.rDocIssuer || '',
    passportRegistration: rehRegAddress,
    address: rehFactAddress,
    disabledGroup: disabilityLabel,
  };

  return { ...word, ...excel, ...excelCommon };
}

function fillTemplate(buf, tokens) {
  const zip = new PizZip(buf);
  const entries = zip.file(/\.xml$/);
  for (const entry of entries) {
    let content = entry.asText();
    if (content.indexOf('${') === -1) continue;
    for (const [key, value] of Object.entries(tokens)) {
      const token = '${' + key + '}';
      if (content.indexOf(token) !== -1) {
        content = content.split(token).join(xmlEscape(value));
      }
    }
    content = content.replace(/\$\{[A-Za-z0-9_]+\}/g, '');
    zip.file(entry.name, content);
  }
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export function generateDocument(docType, form = {}) {
  const entry = TEMPLATE_MAP[docType];
  if (!entry) {
    const err = new Error('Неизвестный тип документа: ' + docType);
    err.status = 400;
    throw err;
  }

  const age = ageFromBirth(form.rBirth);
  const isMinor = age == null ? true : age < 18;

  const templateName = isMinor ? entry.minor : entry.adult;
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    const err = new Error('Шаблон не найден: ' + templateName);
    err.status = 500;
    throw err;
  }

  const tokens = buildTokens(form, isMinor);
  const buffer = fillTemplate(fs.readFileSync(templatePath), tokens);

  const last = (form.rLast || 'реабилитант').trim().replace(/\s+/g, '_') || 'реабилитант';
  const filename = `${OUT_BASENAME[docType]}_${last}.${entry.ext}`;

  return { buffer, filename, contentType: CONTENT_TYPE[entry.ext], isMinor };
}


export const DRAFT_KEY = 'addRecipientDraft';
export const DRAFT_SAVED_AT_KEY = 'addRecipientDraftSavedAt';
export const DRAFT_SERVER_ID_KEY = 'addRecipientDraftServerId';
export const DRAFT_FILES_DB = 'addRecipientDraftFiles';
export const DRAFT_FILES_STORE = 'files';

export const isFilled = (v) => (typeof v === 'string' ? v.trim().length > 0 : !!v);

const str = (v) => (typeof v === 'string' ? v : '');

export const draftPersonFields = (form) => {
  const v = form || {};

  const noRep = v.lrNone === true;

  const step1 = noRep ? [] : [
    { g: 'ФИО',               l: 'Фамилия',                         ok: isFilled(v.lrLast),               a: '#lr-last'  },
    { g: 'ФИО',               l: 'Имя',                             ok: isFilled(v.lrFirst),              a: '#lr-first' },
    { g: 'ФИО',               l: 'Кем приходится реабилитанту',     ok: isFilled(v.lrRelation),           a: '#lr-rel'   },
    { g: 'ФИО',               l: 'Телефон',                         ok: str(v.lrPhone).length === 18,     a: '#lr-phone' },
    { g: 'Паспорт',           l: 'Серия',                           ok: str(v.lrPassSeries).length === 4, a: '#lp-ser'   },
    { g: 'Паспорт',           l: 'Номер',                           ok: str(v.lrPassNum).length === 6,    a: '#lp-num'   },
    { g: 'Паспорт',           l: 'Дата выдачи',                     ok: isFilled(v.lrPassDate),           a: '#lp-dt'    },
    { g: 'Паспорт',           l: 'Код подразделения',               ok: str(v.lrPassCode).length === 7,   a: '#lp-code'  },
    { g: 'Паспорт',           l: 'Кем выдан',                       ok: isFilled(v.lrPassIssuer),         a: '#lp-iss'   },
    { g: 'Адрес регистрации', l: 'Адрес регистрации представителя', ok: isFilled(v.lrAddress),            a: '#lr-addr'  },
  ];

  const step2 = [
    { g: 'ФИО и дата рождения', l: 'Фамилия',       ok: isFilled(v.rLast),  a: '#r-last'  },
    { g: 'ФИО и дата рождения', l: 'Имя',           ok: isFilled(v.rFirst), a: '#r-first' },
    { g: 'ФИО и дата рождения', l: 'Дата рождения', ok: isFilled(v.rBirth), a: '#r-birth' },
    ...(noRep
      ? [{ g: 'ФИО и дата рождения', l: 'Телефон', ok: str(v.rPhone).length === 18, a: '#r-phone' }]
      : []),
    { g: 'Документ, удостоверяющий личность', l: 'Серия',       ok: v.rDocType === 'birth' ? isFilled(v.rDocSeries) : str(v.rDocSeries).length === 4, a: '#rd-ser' },
    { g: 'Документ, удостоверяющий личность', l: 'Номер',       ok: str(v.rDocNum).length === 6, a: '#rd-num' },
    { g: 'Документ, удостоверяющий личность', l: 'Дата выдачи', ok: isFilled(v.rDocDate),       a: '#rd-dt'  },
    { g: 'Документ, удостоверяющий личность', l: 'Кем выдан',   ok: isFilled(v.rDocIssuer),     a: '#rd-iss' },
    { g: 'Медицинские сведения', l: 'Группа инвалидности',                   ok: isFilled(v.rInvalidity),        a: '#r-invalidity'       },
    { g: 'Медицинские сведения', l: 'СНИЛС',                                 ok: str(v.rSnils).length === 14,    a: '#r-snils'            },
    { g: 'Медицинские сведения', l: 'Целевая реабилитационная группа (ЦРГ)', ok: isFilled(v.rCrg),               a: '#r-crg-trigger'      },
    { g: 'Медицинские сведения', l: 'Нозология',                             ok: (v.rNosology || []).length > 0, a: '#r-nosology-trigger' },
    { g: 'Адрес регистрации', l: 'Адрес регистрации', ok: isFilled(v.rAddrReg), a: '#r-reg' },
  ];
  if (!v.rAddrSame) {
    step2.push({ g: 'Фактическое проживание', l: 'Адрес фактического места проживания', ok: isFilled(v.rAddrFact), a: '#r-fact' });
  }

  return [step1, step2];
};

export const PERSON_STEP_LABELS = ['Законный представитель', 'Данные реабилитанта'];

export const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return saved && typeof saved === 'object' ? saved : null;
  } catch (e) {
    return null;
  }
};

export const readDraftSavedAt = () => {
  try {
    const raw = localStorage.getItem(DRAFT_SAVED_AT_KEY);
    if (!raw) return null;
    const t = Date.parse(raw);
    return Number.isFinite(t) ? new Date(t) : null;
  } catch (e) {
    return null;
  }
};

export const touchDraftSavedAt = () => {
  try { localStorage.setItem(DRAFT_SAVED_AT_KEY, new Date().toISOString()); } catch (e) {}
};

export const forgetDraftSavedAt = () => {
  try { localStorage.removeItem(DRAFT_SAVED_AT_KEY); } catch (e) {}
};

export const readDraftServerId = () => {
  try {
    const n = parseInt(localStorage.getItem(DRAFT_SERVER_ID_KEY), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (e) {
    return null;
  }
};

export const rememberDraftServerId = (id) => {
  try { localStorage.setItem(DRAFT_SERVER_ID_KEY, String(id)); } catch (e) {}
};

export const forgetDraftServerId = () => {
  try { localStorage.removeItem(DRAFT_SERVER_ID_KEY); } catch (e) {}
};

export const countDraftFiles = () => new Promise((resolve) => {
  if (typeof indexedDB === 'undefined') return resolve(0);
  let req;
  try {
    req = indexedDB.open(DRAFT_FILES_DB);
  } catch (e) {
    return resolve(0);
  }
  let created = false;
  req.onupgradeneeded = () => { created = true; };
  req.onerror = () => resolve(0);
  req.onsuccess = () => {
    const db = req.result;
    if (created || !db.objectStoreNames.contains(DRAFT_FILES_STORE)) {
      try { db.close(); } catch (e) {}
      try { indexedDB.deleteDatabase(DRAFT_FILES_DB); } catch (e) {}
      return resolve(0);
    }
    try {
      const tx = db.transaction(DRAFT_FILES_STORE, 'readonly');
      const count = tx.objectStore(DRAFT_FILES_STORE).count();
      count.onsuccess = () => { resolve(count.result || 0); db.close(); };
      count.onerror = () => { resolve(0); db.close(); };
    } catch (e) {
      db.close();
      resolve(0);
    }
  };
});

export const summarizeDraft = (draft, fileCount = 0) => {
  if (!draft) return null;

  const steps = draftPersonFields(draft).map((list, i) => {
    const missing = list.filter((x) => !x.ok);
    return {
      step: i + 1,
      label: PERSON_STEP_LABELS[i],
      total: list.length,
      done: list.length - missing.length,
      missing
    };
  });

  const total = steps.reduce((n, s) => n + s.total, 0);
  const done = steps.reduce((n, s) => n + s.done, 0);
  if (!done && !fileCount) return null;

  const name = [draft.rLast, draft.rFirst, draft.rMid].filter(isFilled).join(' ').trim();
  const repName = [draft.lrLast, draft.lrFirst].filter(isFilled).join(' ').trim();

  return {
    name,
    repName,
    fileCount,
    done,
    total,
    pct: total ? Math.round((done / total) * 100) : 0,
    steps: steps.filter((s) => s.missing.length > 0),
    complete: done === total
  };
};

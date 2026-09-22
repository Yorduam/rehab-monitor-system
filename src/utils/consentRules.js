export const POSITIVE_VERDICTS = ['recommended', 'trial'];

export const CATEGORY_LABELS = {
  minor: 'до 14 лет',
  teen: '14–17 лет',
  adult: '18 лет и старше',
  ward: '18+ · недееспособен'
};

export const STAGE_LABELS = {
  diag: 'диагностика',
  rehab: 'курс реабилитации'
};

const SIGNER_LABELS = {
  parent: 'подписывает законный представитель',
  self: 'подписывает сам реабилитант',
  ward: 'подписывает представитель недееспособного'
};

const KIND_TITLES = {
  pd: 'Согласие на обработку персональных данных',
  photo: 'Согласие на фото- и видеосъёмку'
};

const SIGNERS_BY_CATEGORY = {
  minor: ['parent'],
  teen: ['parent', 'self'],
  adult: ['self'],
  ward: ['ward']
};

const KINDS_BY_STAGE = {
  diag: ['pd'],
  rehab: ['pd', 'photo']
};

const templateKey = (stage, kind, signer) => (kind === 'pd' ? `pd-${stage}-${signer}` : `photo-${signer}`);

export const CONSENT_DOCS = Object.entries(KINDS_BY_STAGE).flatMap(([stage, kinds]) =>
  kinds.flatMap((kind) =>
    ['parent', 'self', 'ward'].map((signer) => {
      const key = templateKey(stage, kind, signer);
      return {
        key,
        code: `signed-${key}`,
        stage,
        kind,
        signer,
        title: KIND_TITLES[kind],
        signerLabel: SIGNER_LABELS[signer]
      };
    })
  )
);

export const CONSENT_BY_CODE = new Map(CONSENT_DOCS.map((d) => [d.code, d]));
export const CONSENT_BY_KEY = new Map(CONSENT_DOCS.map((d) => [d.key, d]));

export const LEGACY_CONSENTS = { 'signed-pdn': 'pd', 'signed-photo': 'photo' };
export const GUARDIANSHIP_CODE = 'guardianship';

export const CONSENT_SCAN_CODES = [
  ...CONSENT_DOCS.map((d) => d.code),
  ...Object.keys(LEGACY_CONSENTS),
  GUARDIANSHIP_CODE
];

export const isConsentCode = (code) => CONSENT_SCAN_CODES.includes(code);

export function ageAt(birthDate, at = new Date()) {
  if (!birthDate) return null;
  const birth = new Date(`${String(birthDate).slice(0, 10)}T00:00:00`);
  const ref = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) return null;
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

export function categoryOf(age, legalCapacity) {
  if (age == null || age < 14) return 'minor';
  if (age < 18) return 'teen';
  return legalCapacity === 'incapable' ? 'ward' : 'adult';
}

export const stageOf = (verdict) => (POSITIVE_VERDICTS.includes(verdict) ? 'rehab' : 'diag');

export const packageDocs = (stage, category) =>
  (KINDS_BY_STAGE[stage] || []).flatMap((kind) =>
    (SIGNERS_BY_CATEGORY[category] || []).map((signer) => CONSENT_BY_KEY.get(templateKey(stage, kind, signer)))
  );

const categoryAtUpload = (birthDate, uploadedAt, fallback) => {
  const age = uploadedAt ? ageAt(birthDate, uploadedAt) : null;
  if (age == null) return fallback;
  if (age < 14) return 'minor';
  if (age < 18) return 'teen';
  return 'adult';
};

export function buildConsentState({ birthDate, legalCapacity, verdict, scans = [], now = new Date() }) {
  const age = ageAt(birthDate, now);
  const category = categoryOf(age, legalCapacity);
  const stage = stageOf(verdict);

  const latest = new Map();
  for (const scan of scans) {
    if (!scan?.code) continue;
    const prev = latest.get(scan.code);
    if (!prev || new Date(scan.uploadedAt || 0) > new Date(prev.uploadedAt || 0)) latest.set(scan.code, scan);
  }

  const uploadedIn = (scan) => categoryAtUpload(birthDate, scan.uploadedAt, category);
  const legacyUsed = new Set();

  const items = packageDocs(stage, category).map((doc) => {
    const scan = latest.get(doc.code) || null;
    let legacy = null;
    if (!scan) {
      for (const [code, kind] of Object.entries(LEGACY_CONSENTS)) {
        const candidate = latest.get(code);
        if (candidate && kind === doc.kind && uploadedIn(candidate) === category) {
          legacy = { code, scan: candidate };
          legacyUsed.add(code);
          break;
        }
      }
    }
    const source = scan || legacy?.scan || null;
    return {
      key: doc.key,
      code: doc.code,
      kind: doc.kind,
      stage: doc.stage,
      signer: doc.signer,
      title: doc.title,
      signerLabel: doc.signerLabel,
      done: !!source,
      scanId: source?.id ?? null,
      scanCode: scan ? doc.code : (legacy?.code || null),
      uploadedAt: source?.uploadedAt ?? null,
      legacy: !!legacy,
      blank: doc.key
    };
  });

  if (category === 'ward') {
    const scan = latest.get(GUARDIANSHIP_CODE) || null;
    items.push({
      key: null,
      code: GUARDIANSHIP_CODE,
      kind: 'authority',
      stage,
      signer: 'ward',
      title: 'Документ о полномочиях представителя',
      signerLabel: 'копия решения суда или акта органа опеки',
      done: !!scan,
      scanId: scan?.id ?? null,
      scanCode: scan ? GUARDIANSHIP_CODE : null,
      uploadedAt: scan?.uploadedAt ?? null,
      legacy: false,
      blank: null
    });
  }

  const inUse = new Set(items.map((i) => i.code));
  const previous = [];
  for (const [code, scan] of latest) {
    if (inUse.has(code) || legacyUsed.has(code)) continue;
    const doc = CONSENT_BY_CODE.get(code);
    if (doc) {
      const period = doc.signer === 'ward' ? 'ward' : uploadedIn(scan);
      previous.push({
        code,
        title: doc.title,
        signerLabel: doc.signerLabel,
        category: period,
        stage: doc.stage,
        period: `${CATEGORY_LABELS[period]} · ${STAGE_LABELS[doc.stage]}`,
        scanId: scan.id,
        uploadedAt: scan.uploadedAt ?? null,
        legacy: false
      });
    } else if (LEGACY_CONSENTS[code]) {
      const period = uploadedIn(scan);
      previous.push({
        code,
        title: KIND_TITLES[LEGACY_CONSENTS[code]],
        signerLabel: period === 'adult' ? 'подписал сам реабилитант' : 'подписал законный представитель',
        category: period,
        period: `прежняя форма · ${CATEGORY_LABELS[period]}`,
        scanId: scan.id,
        uploadedAt: scan.uploadedAt ?? null,
        legacy: true
      });
    } else if (code === GUARDIANSHIP_CODE) {
      previous.push({
        code,
        title: 'Документ о полномочиях представителя',
        signerLabel: 'копия решения суда или акта органа опеки',
        category: 'ward',
        period: 'сейчас не требуется',
        scanId: scan.id,
        uploadedAt: scan.uploadedAt ?? null,
        legacy: false
      });
    }
  }
  previous.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

  const missing = items.filter((i) => !i.done);
  const earlier = new Set(previous.map((p) => p.category));
  for (const item of items) {
    if (!item.done || !item.uploadedAt) continue;
    earlier.add(item.signer === 'ward' ? 'ward' : categoryAtUpload(birthDate, item.uploadedAt, category));
  }
  let notice = null;
  if (missing.length) {
    if (category === 'teen' && earlier.has('minor')) {
      notice = 'Реабилитанту исполнилось 14 лет — нужен новый пакет согласий';
    } else if (category === 'adult' && (earlier.has('minor') || earlier.has('teen'))) {
      notice = 'Реабилитанту исполнилось 18 лет — нужен новый пакет согласий';
    } else if (category === 'ward' && [...earlier].some((c) => c !== 'ward')) {
      notice = 'Реабилитант признан недееспособным — согласия подписывает законный представитель';
    } else if (stage === 'rehab' && previous.some((p) => p.stage === 'diag')) {
      notice = 'Выдано положительное заключение — нужны согласия на курс реабилитации';
    }
  }

  return {
    age,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    stage,
    stageLabel: STAGE_LABELS[stage],
    items,
    done: items.length - missing.length,
    total: items.length,
    complete: missing.length === 0,
    missing: missing.map((i) => `${i.title} (${i.signerLabel})`),
    previous,
    notice
  };
}

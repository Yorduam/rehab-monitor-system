
const SEP = '\n';

export const splitDiagnoses = (value) => {
  if (Array.isArray(value)) return value.map((s) => String(s || '').trim()).filter(Boolean);
  return String(value || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const joinDiagnoses = (list) => splitDiagnoses(list).join(SEP);

export const formatDiagnoses = (value, sep = ', ') => splitDiagnoses(value).join(sep);

export const toDiagnosisFields = (value) => {
  const list = splitDiagnoses(value);
  return list.length ? list : [''];
};

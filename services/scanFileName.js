
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');

const clean = (value) => String(value ?? '')
  .replace(/[\\/]+/g, '-')
  .replace(/[:*?"<>|]/g, '')
  .replace(CONTROL_CHARS, '')
  .replace(/_/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const two = (n) => String(n).padStart(2, '0');

const stamp = (date) => {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return {
    day: `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`,
    time: `${two(d.getHours())}-${two(d.getMinutes())}-${two(d.getSeconds())}`
  };
};

const extensionOf = (originalName) => {
  const m = String(originalName || '').match(/\.([A-Za-z0-9]{1,10})$/);
  return m ? `.${m[1].toLowerCase()}` : '';
};

const MAX_LENGTH = 255;

export const buildScanFileName = ({
  recipientId, lastName, firstName, middleName,
  docTypeName, originalName, uploadedAt
}) => {
  const fio = clean([lastName, firstName, middleName].filter(Boolean).join(' ')) || 'Без имени';
  const doc = clean(docTypeName) || 'Документ';
  const { day, time } = stamp(uploadedAt);
  const ext = extensionOf(originalName);

  const tail = `${day}_${time}${ext}`;
  const assemble = (f, d) => `${recipientId}_${f}_${d}_${tail}`;


  let docPart = doc;
  let overflow = assemble(fio, docPart).length - MAX_LENGTH;
  if (overflow > 0) docPart = docPart.slice(0, Math.max(1, docPart.length - overflow)).trim();

  let fioPart = fio;
  overflow = assemble(fioPart, docPart).length - MAX_LENGTH;
  if (overflow > 0) fioPart = fioPart.slice(0, Math.max(1, fioPart.length - overflow)).trim();

  return assemble(fioPart, docPart);
};

export default buildScanFileName;

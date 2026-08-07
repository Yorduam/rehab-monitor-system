// Имя скана в базе.
//
// Раньше сюда клали имя файла как есть с компьютера оператора, и в базе
// оказывались три десятка сканов «Гусь.jfif» и «channels4_profile.jpg» — по
// имени было не понять ни чей это документ, ни какой именно. Теперь при
// загрузке имя собирается заново.
//
// Формат:  ID_ФИО реабилитанта_Название документа_Дата_Время.расширение
// Пример:  26_Иванов Иван Иванович_Справка МСЭ_2026-08-06_22-15-43.jpg
//
// ID стоит первым нарочно: при выгрузке папки файлы одного ребёнка встают
// рядом сами собой.

// Управляющие символы: в именах файлов недопустимы, а попасть могут из
// кривого имени, пришедшего с чужого сканера.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');

// Между частями имени — подчёркивание, внутри части — пробелы. Поэтому из
// самих частей подчёркивание убираем, иначе граница между ФИО и названием
// документа перестанет читаться.
//
// Windows запрещает в именах файлов \ / : * ? " < > | и управляющие символы.
// Косую черту меняем на дефис, а не выбрасываем: иначе «ЕЖД / выписка из
// домовой книги» превратилось бы в «ЕЖД  выписка из домовой книги».
const clean = (value) => String(value ?? '')
  .replace(/[\\/]+/g, '-')
  .replace(/[:*?"<>|]/g, '')
  .replace(CONTROL_CHARS, '')
  .replace(/_/g, '-')
  .replace(/\s+/g, ' ')
  .trim();

const two = (n) => String(n).padStart(2, '0');

// Дата и время местные, а не UTC. С UTC вечерняя загрузка уезжала бы на
// предыдущий день, и оператор не нашёл бы файл по дате, когда его принесли.
// Двоеточие в имени файла запрещено, поэтому время через дефис.
const stamp = (date) => {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return {
    day: `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`,
    time: `${two(d.getHours())}-${two(d.getMinutes())}-${two(d.getSeconds())}`
  };
};

// Расширение берём из исходного имени: без него файл не откроется ни в
// браузере, ни в проводнике.
const extensionOf = (originalName) => {
  const m = String(originalName || '').match(/\.([A-Za-z0-9]{1,10})$/);
  return m ? `.${m[1].toLowerCase()}` : '';
};

const MAX_LENGTH = 255;   // ширина колонки RecipientScanDocs.originalName

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

  // Длиннее колонки имя быть не может — иначе запись просто не сохранится.
  // Режем по очереди, от менее ценного к более ценному.

  // Сначала название документа: его можно укоротить без потери смысла, тип
  // всё равно продублирован в docType.
  let docPart = doc;
  let overflow = assemble(fio, docPart).length - MAX_LENGTH;
  if (overflow > 0) docPart = docPart.slice(0, Math.max(1, docPart.length - overflow)).trim();

  // Если и этого не хватило — режем ФИО. На практике сюда не попасть: нужно
  // ФИО длиной в две сотни символов. Но упереться в предел колонки нельзя.
  let fioPart = fio;
  overflow = assemble(fioPart, docPart).length - MAX_LENGTH;
  if (overflow > 0) fioPart = fioPart.slice(0, Math.max(1, fioPart.length - overflow)).trim();

  return assemble(fioPart, docPart);
};

export default buildScanFileName;

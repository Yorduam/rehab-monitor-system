// Снимает дамп текущей БД и АВТОМАТИЧЕСКИ приводит регистр имён таблиц к тому,
// что задан в моделях (models/*.js -> tableName). Нужно потому, что на Windows
// MySQL хранит имена таблиц в нижнем регистре (lower_case_table_names=1) и в
// дамп они попадают строчными; на регистрозависимом сервере (Linux) такой дамп
// ломается — код обращается к `CRG`/`Recipients`, а таблица создана как `crg`.
//
// Скрипт:
//   1) читает models/*.js и собирает карту  lower(tableName) -> tableName;
//   2) вызывает mysqldump (данные, блобы, процедуры, события; без GTID);
//   3) переписывает имена таблиц в дампе под регистр из моделей;
//   4) сохраняет готовый к переносу .sql.
//
// Запуск:   node scripts/exportDump.js [путь_к_выходному_файлу.sql]
// Пароль берётся из .env (DB_PASSWORD) и передаётся через MYSQL_PWD, не в argv.
// Путь к mysqldump можно задать переменной окружения MYSQLDUMP_PATH.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 1) Карта имён таблиц из моделей:  lower(tableName) -> точный tableName.
function collectTableNameMap() {
  const modelsDir = path.join(root, 'models');
  const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.js') && f !== 'index.js');
  const map = new Map();
  const re = /tableName\s*:\s*['"]([^'"]+)['"]/g;
  for (const f of files) {
    const src = fs.readFileSync(path.join(modelsDir, f), 'utf8');
    let m;
    while ((m = re.exec(src)) !== null) map.set(m[1].toLowerCase(), m[1]);
  }
  return map;
}

// 2) Ищем mysqldump: переменная окружения -> типовые пути установки MySQL -> PATH.
function resolveMysqldump() {
  if (process.env.MYSQLDUMP_PATH && fs.existsSync(process.env.MYSQLDUMP_PATH)) {
    return process.env.MYSQLDUMP_PATH;
  }
  const base = 'C:/Program Files/MySQL';
  try {
    for (const d of fs.readdirSync(base)) {
      const p = path.join(base, d, 'bin', 'mysqldump.exe');
      if (fs.existsSync(p)) return p;
    }
  } catch { /* каталога может не быть — не Windows/другая установка */ }
  return 'mysqldump'; // расчёт на то, что он в PATH
}

function run() {
  const dbName = process.env.DB_NAME;
  if (!dbName) throw new Error('DB_NAME не задан в .env');

  const map = collectTableNameMap();
  if (!map.size) throw new Error('Не удалось собрать имена таблиц из models/*.js');

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const outArg = process.argv[2];
  const out = path.resolve(root, outArg || path.join('Database', `erpdb_dump_${today}.sql`));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const bin = resolveMysqldump();
  const args = [
    `--host=${process.env.DB_HOST || 'localhost'}`,
    `--port=${process.env.DB_PORT || 3306}`,
    `--user=${process.env.DB_USER || 'root'}`,
    '--single-transaction', '--hex-blob', '--routines', '--events',
    '--set-gtid-purged=OFF',
    '--databases', dbName,
  ];

  console.log(`mysqldump: ${bin}`);
  let sql = execFileSync(bin, args, {
    env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || '' },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 512, // до 512 МБ на всякий случай
  });

  // 3) Переписываем имена таблиц под регистр из моделей. Заменяем ТОЛЬКО целые
  // токены в обратных кавычках `имя`, поэтому пересечений с колонками/данными нет.
  // Сортируем по длине по убыванию — доп. страховка от совпадения префиксов.
  const entries = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
  const changed = [];
  for (const [lower, proper] of entries) {
    if (lower === proper) continue;
    const token = '`' + lower + '`';
    if (sql.includes(token)) {
      sql = sql.split(token).join('`' + proper + '`');
      changed.push(`${lower} -> ${proper}`);
    }
  }

  fs.writeFileSync(out, sql, 'utf8');

  console.log(`\nДамп сохранён: ${out}`);
  console.log(`Таблиц в карте моделей: ${map.size}`);
  console.log(`Переименовано под код: ${changed.length}`);
  for (const c of changed) console.log('  ' + c);
}

run();

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

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
  } catch { }
  return 'mysqldump';
}

function verify(sql, map) {
  const found = [...sql.matchAll(/^CREATE TABLE `([^`]+)`/gm)].map((m) => m[1]);
  const problems = [];

  const unknown = found.filter((t) => !map.has(t.toLowerCase()));
  if (unknown.length) {
    problems.push(
      `нет модели в models/ для таблиц: ${unknown.join(', ')}. ` +
      'Регистр таких имён выправить нечем — заведите модель или добавьте имя вручную.'
    );
  }

  const wrong = found.filter((t) => {
    const proper = map.get(t.toLowerCase());
    return proper && proper !== t;
  });
  if (wrong.length) problems.push(`неверный регистр в CREATE TABLE: ${wrong.join(', ')}`);

  for (const [lower, proper] of map) {
    if (lower === proper) continue;
    if (sql.includes('`' + lower + '`')) {
      problems.push(`в тексте осталось \`${lower}\` вместо \`${proper}\``);
    }
  }

  return { found, problems };
}

function run() {
  const dbName = process.env.DB_NAME;
  if (!dbName) throw new Error('DB_NAME не задан в .env');

  const map = collectTableNameMap();
  if (!map.size) throw new Error('Не удалось собрать имена таблиц из models/*.js');

  const today = new Date().toISOString().slice(0, 10);
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
    maxBuffer: 1024 * 1024 * 512,
  });

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

  const { found, problems } = verify(sql, map);
  if (problems.length) {
    console.error('\nДамп НЕ сохранён — проблемы с регистром имён таблиц:');
    for (const p of problems) console.error('  ! ' + p);
    process.exit(1);
  }

  fs.writeFileSync(out, sql, 'utf8');

  console.log(`\nДамп сохранён: ${out}`);
  console.log(`Таблиц в карте моделей: ${map.size}`);
  console.log(`Таблиц в дампе: ${found.length}`);
  console.log(`Переименовано под код: ${changed.length}`);
  for (const c of changed) console.log('  ' + c);
  console.log('Проверка регистра пройдена: все имена совпадают с models/*.js.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  run();
}

export { verify, collectTableNameMap };

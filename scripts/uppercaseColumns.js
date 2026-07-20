// Переименовывает ВСЕ имена колонок во ВСЕХ таблицах текущей БД в ВЕРХНИЙ
// регистр. Данные и значения (ENUM, DEFAULT) не трогаются — только имена.
// Таблицы не затрагиваются (MySQL при lower_case_table_names=1 хранит их
// в нижнем регистре — переименовать по регистру невозможно).
//
// Перед выполнением сохраняет ОБРАТНЫЙ скрипт rollback_uppercase_columns.sql.
// Запуск:  node scripts/uppercaseColumns.js
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const q = (id) => '`' + id.replace(/`/g, '``') + '`';

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306, multipleStatements: true
  });

  // Собираем все колонки, чьё имя не полностью в верхнем регистре (сравнение с учётом регистра).
  const [rows] = await conn.query(
    `SELECT TABLE_NAME AS t, COLUMN_NAME AS c
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND STRCMP(CAST(COLUMN_NAME AS BINARY), CAST(UPPER(COLUMN_NAME) AS BINARY)) <> 0
      ORDER BY TABLE_NAME, ORDINAL_POSITION`
  );

  if (!rows.length) {
    console.log('Все имена колонок уже в верхнем регистре — менять нечего.');
    await conn.end();
    return;
  }

  const forward = [];
  const backward = [];
  for (const { t, c } of rows) {
    const up = c.toUpperCase();
    forward.push(`ALTER TABLE ${q(t)} RENAME COLUMN ${q(c)} TO ${q(up)};`);
    backward.push(`ALTER TABLE ${q(t)} RENAME COLUMN ${q(up)} TO ${q(c)};`);
  }

  // Пишем откат (в обратном порядке на всякий случай).
  const rollbackPath = path.resolve(process.cwd(), 'rollback_uppercase_columns.sql');
  const rollbackSql =
    '-- Откат: возвращает исходный регистр имён колонок.\n' +
    '-- Применить:  mysql -u root -p erpdb < rollback_uppercase_columns.sql\n' +
    'SET FOREIGN_KEY_CHECKS=0;\n' +
    backward.slice().reverse().join('\n') + '\n' +
    'SET FOREIGN_KEY_CHECKS=1;\n';
  fs.writeFileSync(rollbackPath, rollbackSql, 'utf8');
  console.log(`Откат сохранён: ${rollbackPath}`);
  console.log(`Всего колонок к переименованию: ${forward.length}\n`);

  // Выполняем.
  await conn.query('SET FOREIGN_KEY_CHECKS=0');
  let ok = 0;
  const failures = [];
  for (let i = 0; i < forward.length; i++) {
    try {
      await conn.query(forward[i]);
      ok++;
    } catch (e) {
      failures.push({ sql: forward[i], err: `${e.code || ''} ${e.message}` });
    }
  }
  await conn.query('SET FOREIGN_KEY_CHECKS=1');

  console.log(`Переименовано: ${ok}/${forward.length}`);
  if (failures.length) {
    console.log(`\nОшибки (${failures.length}):`);
    for (const f of failures) console.log('  FAIL:', f.sql, '->', f.err);
  }

  // Короткая проверка результата.
  const [left] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND STRCMP(CAST(COLUMN_NAME AS BINARY), CAST(UPPER(COLUMN_NAME) AS BINARY)) <> 0`
  );
  console.log(`\nОсталось колонок не в верхнем регистре: ${left[0].n}`);

  await conn.end();
}

run().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });

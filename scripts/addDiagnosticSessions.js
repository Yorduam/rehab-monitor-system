// Одноразовая миграция под модуль «Диагностика: назначение датой + разбор
// заявок специалистами + заключение».
//
//   1) CREATE TABLE DiagnosticSessions   — заявка на диагностику (только дата).
//   2) CREATE TABLE DiagnosticConclusions — итоговое заключение по заявке.
//   3) ALTER TABLE Users                 — canConclude, canViewAllResults.
//   4) ALTER TABLE DiagnosticAssignments — diagnosticSessionId (ссылка на заявку).
//
// Сервер работает без sequelize.sync(), поэтому схему меняем вручную.
// Скрипт идемпотентен: проверяет наличие таблицы/столбца перед изменением.
//
// Запуск:  node scripts/addDiagnosticSessions.js
import { sequelize } from '../models/index.js';

async function tableExists(table) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table`,
    { replacements: { table } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function addColumn(table, column, ddl) {
  if (await columnExists(table, column)) {
    console.log(`  = ${table}.${column} уже есть`);
    return;
  }
  await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  console.log(`  ✓ ${table}.${column} добавлен`);
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    // ---- 1) Заявки на диагностику -------------------------------------------
    if (await tableExists('DiagnosticSessions')) {
      console.log('  = таблица DiagnosticSessions уже есть');
    } else {
      await sequelize.query(`
        CREATE TABLE \`DiagnosticSessions\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`recipientId\` INT NOT NULL,
          \`date\` DATE NOT NULL,
          \`status\` VARCHAR(20) NOT NULL DEFAULT 'open',
          \`note\` TEXT NULL,
          \`createdBy\` INT NULL,
          \`closedAt\` DATETIME NULL DEFAULT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_ds_recipient\` (\`recipientId\`),
          KEY \`idx_ds_date\` (\`date\`),
          KEY \`idx_ds_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✓ таблица DiagnosticSessions создана');
    }

    // ---- 2) Заключения -------------------------------------------------------
    if (await tableExists('DiagnosticConclusions')) {
      console.log('  = таблица DiagnosticConclusions уже есть');
    } else {
      await sequelize.query(`
        CREATE TABLE \`DiagnosticConclusions\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`sessionId\` INT NOT NULL,
          \`recipientId\` INT NOT NULL,
          \`summary\` TEXT NOT NULL,
          \`recommendations\` TEXT NULL,
          \`authorId\` INT NULL,
          \`issuedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uniq_dc_session\` (\`sessionId\`),
          KEY \`idx_dc_recipient\` (\`recipientId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✓ таблица DiagnosticConclusions создана');
    }

    // ---- 3) Права специалистов ----------------------------------------------
    await addColumn('Users', 'canConclude', '`canConclude` TINYINT(1) NOT NULL DEFAULT 0');
    await addColumn('Users', 'canViewAllResults', '`canViewAllResults` TINYINT(1) NOT NULL DEFAULT 0');

    // ---- 4) Связь назначения с заявкой --------------------------------------
    await addColumn('DiagnosticAssignments', 'diagnosticSessionId', '`diagnosticSessionId` INT NULL DEFAULT NULL');

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

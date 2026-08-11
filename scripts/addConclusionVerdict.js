import { sequelize } from '../models/index.js';

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    if (await columnExists('DiagnosticConclusions', 'verdict')) {
      console.log('  = DiagnosticConclusions.verdict уже есть');
    } else {
      await sequelize.query(
        'ALTER TABLE `DiagnosticConclusions` ADD COLUMN `verdict` VARCHAR(20) NULL DEFAULT NULL AFTER `recipientId`'
      );
      console.log('  ✓ DiagnosticConclusions.verdict добавлен');
    }

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

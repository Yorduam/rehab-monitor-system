import { sequelize } from '../models/index.js';

async function columnIsNullable(table, column) {
  const [rows] = await sequelize.query(
    `SELECT IS_NULLABLE AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  if (!rows?.length) throw new Error(`нет колонки ${table}.${column}`);
  return String(rows[0].n).toUpperCase() === 'YES';
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    if (await columnIsNullable('RecipientDocVersions', 'docId')) {
      console.log('  = RecipientDocVersions.docId уже допускает NULL');
    } else {
      await sequelize.query(
        'ALTER TABLE `RecipientDocVersions` MODIFY COLUMN `docId` INT NULL DEFAULT NULL'
      );
      console.log('  ✓ RecipientDocVersions.docId теперь допускает NULL');
    }

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

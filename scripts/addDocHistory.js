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

    if (await tableExists('RecipientDocVersions')) {
      console.log('  = таблица RecipientDocVersions уже есть');
    } else {
      await sequelize.query(`
        CREATE TABLE \`RecipientDocVersions\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`docId\` INT NOT NULL,
          \`recipientId\` INT NOT NULL,
          \`snapshot\` JSON NULL,
          \`changedFields\` JSON NULL,
          \`reason\` TEXT NOT NULL,
          \`changedBy\` INT NULL,
          \`changedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_rdv_doc\` (\`docId\`),
          KEY \`idx_rdv_recipient\` (\`recipientId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('  ✓ таблица RecipientDocVersions создана');
    }

    await addColumn('RecipientScanDocs', 'uploadedBy', '`uploadedBy` INT NULL DEFAULT NULL');
    await addColumn('RecipientScanDocs', 'uploadedAt', '`uploadedAt` DATETIME NULL DEFAULT NULL');
    await addColumn('RecipientScanDocs', 'updateReason', '`updateReason` VARCHAR(500) NULL DEFAULT NULL');
    await addColumn('RecipientScanDocs', 'replacesScanId', '`replacesScanId` INT NULL DEFAULT NULL');
    await addColumn('RecipientScanDocs', 'isCurrent', '`isCurrent` TINYINT(1) NOT NULL DEFAULT 1');

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

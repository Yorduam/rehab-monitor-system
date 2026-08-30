import { sequelize } from '../models/index.js';

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

    await addColumn('RecipientDocs', 'district', '`district` VARCHAR(64) NULL DEFAULT NULL');
    await addColumn('RecipientDocs', 'area', '`area` VARCHAR(120) NULL DEFAULT NULL');

    await addColumn('LegalRepresentatives', 'relation', '`relation` VARCHAR(64) NULL DEFAULT NULL');

    await addColumn('RecipientScanDocs', 'issuedAt', '`issuedAt` DATE NULL DEFAULT NULL');
    await addColumn('RecipientScanDocs', 'validUntil', '`validUntil` DATE NULL DEFAULT NULL');
    await addColumn('RecipientScanDocs', 'perpetual', '`perpetual` TINYINT(1) NOT NULL DEFAULT 0');

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

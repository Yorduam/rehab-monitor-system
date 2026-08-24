import { sequelize } from '../models/index.js';

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function addTimeColumn(column, after) {
  if (await columnExists('DiagnosticSessions', column)) {
    console.log(`  = ${column} already exists`);
    return;
  }
  await sequelize.query(
    `ALTER TABLE \`DiagnosticSessions\` ADD COLUMN \`${column}\` TIME NULL AFTER \`${after}\``
  );
  console.log(`  ✓ ${column} added`);
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating DiagnosticSessions...');

    await addTimeColumn('reservedFrom', 'date');
    await addTimeColumn('reservedTo', 'reservedFrom');

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

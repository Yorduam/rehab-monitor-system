import { sequelize } from '../models/index.js';

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

const COLUMNS = [
  ['failedLoginCount', 'INT NOT NULL DEFAULT 0'],
  ['lockedUntil', 'DATETIME NULL DEFAULT NULL']
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating Users...');

    for (const [name, definition] of COLUMNS) {
      if (await columnExists('Users', name)) {
        console.log(`  = ${name} already exists`);
      } else {
        await sequelize.query(`ALTER TABLE \`Users\` ADD COLUMN \`${name}\` ${definition}`);
        console.log(`  ✓ ${name} added`);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

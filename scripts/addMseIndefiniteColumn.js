import { sequelize } from '../models/index.js';

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function columnIsNullable(table, column) {
  const [rows] = await sequelize.query(
    `SELECT IS_NULLABLE AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return String(rows?.[0]?.n || '').toUpperCase() === 'YES';
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating RecipientDocs...');

    if (await columnIsNullable('RecipientDocs', 'mseValidDate')) {
      console.log('  = mseValidDate already nullable');
    } else {
      await sequelize.query('ALTER TABLE `RecipientDocs` MODIFY `mseValidDate` DATE NULL');
      console.log('  ✓ mseValidDate set to NULL-able');
    }

    if (await columnExists('RecipientDocs', 'mseIndefinite')) {
      console.log('  = mseIndefinite already exists');
    } else {
      await sequelize.query(
        'ALTER TABLE `RecipientDocs` ADD COLUMN `mseIndefinite` TINYINT(1) NOT NULL DEFAULT 0'
      );
      console.log('  ✓ mseIndefinite added');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

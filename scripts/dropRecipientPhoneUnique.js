import { sequelize } from '../models/index.js';

async function indexExists(table, index) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :index`,
    { replacements: { table, index } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating Recipients...');

    if (await indexExists('Recipients', 're_telephone')) {
      await sequelize.query('ALTER TABLE `Recipients` DROP INDEX `re_telephone`');
      console.log('  ✓ re_telephone dropped');
    } else {
      console.log('  = re_telephone already absent');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

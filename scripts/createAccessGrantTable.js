import { sequelize } from '../models/index.js';

async function tableExists(table) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table`,
    { replacements: { table } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function indexExists(table, index) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :index`,
    { replacements: { table, index } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

const INDEXES = [
  ['ag_unique', 'UNIQUE', '(`userId`, `recipientId`, `category`)'],
  ['ag_user_expires', '', '(`userId`, `expiresAt`)']
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating AccessGrants...');

    if (await tableExists('AccessGrants')) {
      console.log('  = AccessGrants already exists');
    } else {
      await sequelize.query(
        'CREATE TABLE `AccessGrants` (' +
        '  `id` INT NOT NULL AUTO_INCREMENT,' +
        '  `userId` INT NOT NULL,' +
        '  `recipientId` INT NOT NULL,' +
        "  `category` ENUM('passport','scans','contacts','medical') NOT NULL," +
        '  `reasonCode` VARCHAR(64) NULL,' +
        '  `expiresAt` DATETIME NOT NULL,' +
        '  `createdAt` DATETIME NOT NULL,' +
        '  PRIMARY KEY (`id`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'
      );
      console.log('  ✓ AccessGrants created');
    }

    for (const [name, kind, columns] of INDEXES) {
      if (await indexExists('AccessGrants', name)) {
        console.log(`  = ${name} already exists`);
      } else {
        await sequelize.query(`ALTER TABLE \`AccessGrants\` ADD ${kind} INDEX \`${name}\` ${columns}`);
        console.log(`  ✓ ${name} created`);
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

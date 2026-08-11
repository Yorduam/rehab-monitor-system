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

const TABLES = [
  {
    name: 'RecipientDrafts',
    ddl:
      'CREATE TABLE `RecipientDrafts` (' +
      '  `id` INT NOT NULL AUTO_INCREMENT,' +
      '  `lastName` VARCHAR(50) NULL,' +
      '  `firstName` VARCHAR(50) NULL,' +
      '  `middleName` VARCHAR(50) NULL,' +
      '  `birthDate` DATE NULL,' +
      '  `repName` VARCHAR(150) NULL,' +
      '  `payload` JSON NOT NULL,' +
      '  `createdBy` INT NULL,' +
      '  `createdByName` VARCHAR(150) NULL,' +
      '  `updatedBy` INT NULL,' +
      '  `updatedByName` VARCHAR(150) NULL,' +
      '  `createdAt` DATETIME NOT NULL,' +
      '  `updatedAt` DATETIME NOT NULL,' +
      '  PRIMARY KEY (`id`)' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    indexes: [
      ['rd_updated', '(`updatedAt`)'],
      ['rd_author', '(`createdBy`)']
    ]
  },
  {
    name: 'RecipientDraftScans',
    ddl:
      'CREATE TABLE `RecipientDraftScans` (' +
      '  `id` INT NOT NULL AUTO_INCREMENT,' +
      '  `draftId` INT NOT NULL,' +
      '  `docKey` VARCHAR(50) NOT NULL,' +
      '  `originalName` VARCHAR(255) NOT NULL,' +
      '  `mimeType` VARCHAR(100) NOT NULL,' +
      '  `sizeBytes` BIGINT UNSIGNED NOT NULL,' +
      '  `fileData` LONGBLOB NULL,' +
      '  `uploadedBy` INT NULL,' +
      '  `uploadedAt` DATETIME NULL,' +
      '  PRIMARY KEY (`id`),' +
      '  CONSTRAINT `rds_draft` FOREIGN KEY (`draftId`) REFERENCES `RecipientDrafts` (`id`) ON DELETE CASCADE' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    indexes: [
      ['rds_draft_key', '(`draftId`, `docKey`)']
    ]
  }
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating draft tables...');

    for (const t of TABLES) {
      if (await tableExists(t.name)) {
        console.log(`  = ${t.name} already exists`);
      } else {
        await sequelize.query(t.ddl);
        console.log(`  ✓ ${t.name} created`);
      }

      for (const [name, columns] of t.indexes) {
        if (await indexExists(t.name, name)) {
          console.log(`    = ${name} already exists`);
        } else {
          await sequelize.query(`ALTER TABLE \`${t.name}\` ADD INDEX \`${name}\` ${columns}`);
          console.log(`    ✓ ${name} created`);
        }
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

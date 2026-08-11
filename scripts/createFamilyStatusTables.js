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
    name: 'FamilyStatuses',
    ddl:
      'CREATE TABLE `FamilyStatuses` (' +
      '  `id` INT NOT NULL AUTO_INCREMENT,' +
      '  `code` VARCHAR(40) NOT NULL,' +
      '  `name` VARCHAR(100) NOT NULL,' +
      '  `hint` VARCHAR(255) NULL,' +
      '  `groupKey` VARCHAR(30) NULL,' +
      '  `sortOrder` INT NOT NULL DEFAULT 0,' +
      '  `isActive` TINYINT(1) NOT NULL DEFAULT 1,' +
      '  PRIMARY KEY (`id`),' +
      '  UNIQUE KEY `fs_code` (`code`)' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    indexes: [
      ['fs_active_order', '(`isActive`, `sortOrder`)']
    ]
  },
  {
    name: 'LegalRepFamilyStatuses',
    ddl:
      'CREATE TABLE `LegalRepFamilyStatuses` (' +
      '  `representativeId` INT NOT NULL,' +
      '  `statusId` INT NOT NULL,' +
      '  `setBy` INT NULL,' +
      '  `setAt` DATETIME NULL,' +
      '  PRIMARY KEY (`representativeId`, `statusId`),' +
      '  CONSTRAINT `lrfs_rep` FOREIGN KEY (`representativeId`)' +
      '    REFERENCES `LegalRepresentatives` (`id`) ON DELETE CASCADE,' +
      '  CONSTRAINT `lrfs_status` FOREIGN KEY (`statusId`)' +
      '    REFERENCES `FamilyStatuses` (`id`) ON DELETE RESTRICT' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci',
    indexes: [
      ['lrfs_status_idx', '(`statusId`)']
    ]
  }
];

const SEED = [
  { code: 'full',        name: 'Полная семья',              groupKey: 'composition', sortOrder: 10, hint: 'Ребёнка воспитывают оба родителя' },
  { code: 'single',      name: 'Неполная семья',            groupKey: 'composition', sortOrder: 20, hint: 'Ребёнка воспитывает один родитель' },
  { code: 'guardian',    name: 'Опекунская семья',          groupKey: 'composition', sortOrder: 30, hint: 'Ребёнок под опекой или попечительством' },
  { code: 'foster',      name: 'Приёмная семья',            groupKey: 'composition', sortOrder: 40, hint: 'Ребёнок принят в семью по договору' },

  { code: 'many_kids',   name: 'Многодетная семья',         groupKey: null, sortOrder: 50,  hint: 'Трое и более несовершеннолетних детей' },
  { code: 'low_income',  name: 'Малоимущая семья',          groupKey: null, sortOrder: 60,  hint: 'Доход на человека ниже прожиточного минимума' },
  { code: 'svo',         name: 'Участник СВО в семье',      groupKey: null, sortOrder: 70,  hint: 'Член семьи — участник специальной военной операции' },
  { code: 'disabled',    name: 'В семье есть инвалид',      groupKey: null, sortOrder: 80,  hint: 'Инвалидность у родителя, брата или сестры' },
  { code: 'breadwinner', name: 'Потеря кормильца',          groupKey: null, sortOrder: 90,  hint: 'Семья получает пенсию по случаю потери кормильца' },
  { code: 'sop',         name: 'Социально опасное положение', groupKey: null, sortOrder: 100, hint: 'Семья на учёте как находящаяся в СОП' },
  { code: 'migrant',     name: 'Беженцы, переселенцы',      groupKey: null, sortOrder: 110, hint: 'Статус беженца или вынужденного переселенца' }
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating family status tables...');

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

    console.log('Seeding dictionary...');
    let added = 0;
    for (const s of SEED) {
      const [rows] = await sequelize.query(
        'SELECT id FROM `FamilyStatuses` WHERE `code` = :code',
        { replacements: { code: s.code } }
      );
      if (rows.length) {
        console.log(`    = ${s.code} (${s.name})`);
        continue;
      }
      await sequelize.query(
        'INSERT INTO `FamilyStatuses` (`code`, `name`, `hint`, `groupKey`, `sortOrder`, `isActive`)' +
        ' VALUES (:code, :name, :hint, :groupKey, :sortOrder, 1)',
        { replacements: { hint: null, groupKey: null, ...s } }
      );
      added++;
      console.log(`    ✓ ${s.code} (${s.name})`);
    }
    console.log(`Dictionary: ${SEED.length} total, ${added} added.`);

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

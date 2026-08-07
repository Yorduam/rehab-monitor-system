// Одноразовая миграция: заводит таблицу AccessLogs — журнал обращений к
// персональным данным (кто, когда, чьи данные, какой категории, с какой
// причиной).
//
// До этого журнала в проекте не было вовсе: pino писал HTTP-запросы в консоль,
// они нигде не сохранялись и не содержали, кто именно совершил действие.
//
// Сервер работает без sequelize.sync(), поэтому таблицу создаём явно.
// Внешних ключей нарочно нет: запись о доступе должна пережить удаление и
// пользователя, и реабилитанта — иначе удаление карточки стирало бы след того,
// кто её смотрел.
//
// Скрипт идемпотентен: и таблица, и каждый индекс проверяются перед созданием.
//
// Запуск:  node scripts/createAccessLogTable.js
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
  ['al_user_time', '(`userId`, `createdAt`)'],
  ['al_recipient_time', '(`recipientId`, `createdAt`)'],
  ['al_time', '(`createdAt`)']
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating AccessLogs...');

    if (await tableExists('AccessLogs')) {
      console.log('  = AccessLogs already exists');
    } else {
      await sequelize.query(
        'CREATE TABLE `AccessLogs` (' +
        '  `id` INT NOT NULL AUTO_INCREMENT,' +
        '  `userId` INT NULL,' +
        '  `userRole` VARCHAR(32) NULL,' +
        '  `recipientId` INT NULL,' +
        "  `category` ENUM('passport','scans','contacts','medical') NOT NULL," +
        "  `action` ENUM('view','download','denied') NOT NULL," +
        '  `reasonCode` VARCHAR(64) NULL,' +
        '  `reasonText` VARCHAR(500) NULL,' +
        '  `scanId` INT NULL,' +
        '  `ip` VARCHAR(64) NULL,' +
        '  `userAgent` VARCHAR(255) NULL,' +
        '  `createdAt` DATETIME NOT NULL,' +
        '  PRIMARY KEY (`id`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'
      );
      console.log('  ✓ AccessLogs created');
    }

    for (const [name, columns] of INDEXES) {
      if (await indexExists('AccessLogs', name)) {
        console.log(`  = ${name} already exists`);
      } else {
        await sequelize.query(`ALTER TABLE \`AccessLogs\` ADD INDEX \`${name}\` ${columns}`);
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

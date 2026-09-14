import { sequelize } from '../models/index.js';

const DDL = `
CREATE TABLE IF NOT EXISTS \`AdminAuditLogs\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`actorId\` INT NULL,
  \`actorRole\` VARCHAR(32) NULL,
  \`actorName\` VARCHAR(150) NULL,
  \`targetUserId\` INT NULL,
  \`targetName\` VARCHAR(150) NULL,
  \`action\` ENUM('user.create','user.delete','role.change','password.reset','password.change','email.change','rights.change') NOT NULL,
  \`details\` JSON NULL,
  \`ip\` VARCHAR(64) NULL,
  \`userAgent\` VARCHAR(255) NULL,
  \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`aal_actor_time\` (\`actorId\`, \`createdAt\`),
  KEY \`aal_target_time\` (\`targetUserId\`, \`createdAt\`),
  KEY \`aal_time\` (\`createdAt\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Создаём AdminAuditLogs...');
    await sequelize.query(DDL);
    const [rows] = await sequelize.query('SELECT COUNT(*) AS c FROM `AdminAuditLogs`');
    console.log(`  ✓ таблица на месте, записей: ${rows?.[0]?.c ?? 0}`);
    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

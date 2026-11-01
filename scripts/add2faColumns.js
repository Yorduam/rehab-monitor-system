import { sequelize } from '../models/index.js';

const scalar = async (sql, replacements) => {
  const [rows] = await sequelize.query(sql, { replacements });
  return rows?.[0] ? Object.values(rows[0])[0] : null;
};

const columnExists = async (table, column) => Number(await scalar(
  `SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
  { table, column }
)) > 0;

const indexExists = async (table, index) => Number(await scalar(
  `SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :index`,
  { table, index }
)) > 0;

const USER_COLUMNS = [
  ['twoFactorEnabled', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['twoFactorMode', "ENUM('inherit','required','exempt') NOT NULL DEFAULT 'inherit'"],
  ['certThumbprint', 'CHAR(40) NULL DEFAULT NULL'],
  ['certPem', 'TEXT NULL'],
  ['certSubject', 'VARCHAR(255) NULL DEFAULT NULL'],
  ['certValidTo', 'DATETIME NULL DEFAULT NULL'],
  ['twoFactorBoundAt', 'DATETIME NULL DEFAULT NULL']
];

const AUDIT_ACTIONS = [
  'user.create', 'user.delete', 'role.change', 'password.reset',
  'password.change', 'email.change', 'rights.change',
  '2fa.start', '2fa.verify', '2fa.bind', '2fa.unbind', '2fa.policy'
];

const POLICIES_DDL = `
CREATE TABLE IF NOT EXISTS \`TwoFactorRolePolicies\` (
  \`role\` VARCHAR(32) NOT NULL,
  \`required\` TINYINT(1) NOT NULL DEFAULT 0,
  \`updatedBy\` INT NULL,
  \`updatedAt\` DATETIME NULL,
  PRIMARY KEY (\`role\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

const challengesDdl = (userIdType) => `
CREATE TABLE IF NOT EXISTS \`TwoFactorChallenges\` (
  \`id\` CHAR(36) NOT NULL,
  \`userId\` ${userIdType} NOT NULL,
  \`purpose\` ENUM('login','bind') NOT NULL,
  \`nonce\` CHAR(44) NOT NULL,
  \`thumbprint\` CHAR(40) NULL,
  \`status\` ENUM('pending','used','failed','expired') NOT NULL DEFAULT 'pending',
  \`failReason\` VARCHAR(40) NULL,
  \`ip\` VARCHAR(64) NULL,
  \`userAgent\` VARCHAR(255) NULL,
  \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`expiresAt\` DATETIME NOT NULL,
  \`usedAt\` DATETIME NULL,
  PRIMARY KEY (\`id\`),
  KEY \`tfc_user_purpose_status\` (\`userId\`, \`purpose\`, \`status\`),
  KEY \`tfc_created\` (\`createdAt\`),
  KEY \`tfc_status_expires\` (\`status\`, \`expiresAt\`),
  CONSTRAINT \`tfc_user_fk\` FOREIGN KEY (\`userId\`) REFERENCES \`Users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Миграция 2FA...');

    for (const [name, definition] of USER_COLUMNS) {
      if (await columnExists('Users', name)) {
        console.log(`  = Users.${name} уже есть`);
      } else {
        await sequelize.query(`ALTER TABLE \`Users\` ADD COLUMN \`${name}\` ${definition}`);
        console.log(`  ✓ Users.${name} добавлен`);
      }
    }

    if (await indexExists('Users', 'users_cert_thumbprint')) {
      console.log('  = индекс users_cert_thumbprint уже есть');
    } else {
      await sequelize.query('ALTER TABLE `Users` ADD UNIQUE KEY `users_cert_thumbprint` (`certThumbprint`)');
      console.log('  ✓ уникальный индекс users_cert_thumbprint создан');
    }

    const userIdType = String(await scalar(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'id'`
    ) || 'INT').toUpperCase();
    await sequelize.query(challengesDdl(userIdType));
    console.log(`  ✓ таблица TwoFactorChallenges на месте (userId ${userIdType})`);

    await sequelize.query(POLICIES_DDL);
    console.log('  ✓ таблица TwoFactorRolePolicies на месте');

    const actionType = String(await scalar(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'AdminAuditLogs' AND COLUMN_NAME = 'action'`
    ) || '');
    const missing = AUDIT_ACTIONS.filter((a) => !actionType.includes(`'${a}'`));
    if (!actionType) {
      console.log('  ! AdminAuditLogs не найдена — сначала node scripts/createAdminAuditLogTable.js');
    } else if (missing.length) {
      const existing = [...actionType.matchAll(/'([^']*)'/g)].map((m) => m[1]);
      const list = [...new Set([...existing, ...AUDIT_ACTIONS])].map((a) => `'${a}'`).join(',');
      await sequelize.query(`ALTER TABLE \`AdminAuditLogs\` MODIFY COLUMN \`action\` ENUM(${list}) NOT NULL`);
      console.log(`  ✓ AdminAuditLogs.action: добавлены ${missing.join(', ')}`);
    } else {
      console.log('  = AdminAuditLogs.action уже содержит действия 2FA');
    }

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

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
    console.log('DB connected.');

    if (await columnExists('DiagnosticSessions', 'kind')) {
      console.log('  = DiagnosticSessions.kind уже есть');
    } else {
      await sequelize.query(
        "ALTER TABLE `DiagnosticSessions` ADD COLUMN `kind` VARCHAR(10) NOT NULL DEFAULT 'primary' AFTER `recipientId`"
      );
      console.log('  ✓ DiagnosticSessions.kind добавлен');
    }

    const [fixed] = await sequelize.query(
      "UPDATE `DiagnosticSessions` SET `kind` = 'primary' WHERE `kind` IS NULL OR `kind` = ''"
    );
    console.log(`  ✓ существующие заявки помечены как первичные (затронуто: ${fixed?.affectedRows ?? 0})`);

    for (const column of ['startTime', 'endTime']) {
      if (await columnIsNullable('DiagnosticAssignments', column)) {
        console.log(`  = DiagnosticAssignments.${column} уже допускает NULL`);
      } else {
        await sequelize.query(
          `ALTER TABLE \`DiagnosticAssignments\` MODIFY COLUMN \`${column}\` TIME NULL DEFAULT NULL`
        );
        console.log(`  ✓ DiagnosticAssignments.${column} переведён в NULL`);
      }
    }

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

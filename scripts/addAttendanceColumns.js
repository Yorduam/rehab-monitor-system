// Одноразовая миграция: добавляет столбцы отметки посещения в таблицу Recipients.
//   attendanceStatus ENUM('present','absent','left') NULL
//   attendanceDate   DATE NULL
// Сервер работает без sequelize.sync(), поэтому колонки добавляем вручную.
// Скрипт идемпотентен: проверяет наличие столбца перед ALTER.
//
// Запуск:  node scripts/addAttendanceColumns.js
import { sequelize } from '../models/index.js';

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating Recipients...');

    if (await columnExists('Recipients', 'attendanceStatus')) {
      console.log('  = attendanceStatus already exists');
    } else {
      await sequelize.query(
        "ALTER TABLE `Recipients` ADD COLUMN `attendanceStatus` ENUM('present','absent','left') NULL DEFAULT NULL"
      );
      console.log('  ✓ attendanceStatus added');
    }

    if (await columnExists('Recipients', 'attendanceDate')) {
      console.log('  = attendanceDate already exists');
    } else {
      await sequelize.query(
        "ALTER TABLE `Recipients` ADD COLUMN `attendanceDate` DATE NULL DEFAULT NULL"
      );
      console.log('  ✓ attendanceDate added');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

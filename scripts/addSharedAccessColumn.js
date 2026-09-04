import { sequelize } from '../models/index.js';

async function hasColumn(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return Number(rows?.[0]?.n || 0) > 0;
}

const COLUMNS = [
  ['canFillForOthers', 'TINYINT(1) NOT NULL DEFAULT 0']
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    for (const [column, type] of COLUMNS) {
      if (await hasColumn('Users', column)) {
        console.log(`  = Users.${column} уже есть`);
        continue;
      }
      await sequelize.query(`ALTER TABLE \`Users\` ADD COLUMN \`${column}\` ${type}`);
      console.log(`  ✓ Users.${column} добавлена`);
    }

    const [[stat]] = await sequelize.query(
      "SELECT COUNT(*) AS total, SUM(`canFillForOthers` = 1) AS shared FROM `Users` WHERE `role` = 'teacher'"
    );
    console.log(`Преподавателей: ${stat.total}, с общим доступом: ${stat.shared || 0}`);

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

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
  ['createdAt', 'DATETIME NULL DEFAULT NULL'],
  ['createdBy', 'INT NULL DEFAULT NULL']
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    for (const [column, type] of COLUMNS) {
      if (await hasColumn('Recipients', column)) {
        console.log(`  = Recipients.${column} уже есть`);
        continue;
      }
      await sequelize.query(`ALTER TABLE \`Recipients\` ADD COLUMN \`${column}\` ${type}`);
      console.log(`  ✓ Recipients.${column} добавлена`);
    }

    const [[stat]] = await sequelize.query(
      'SELECT COUNT(*) AS total, SUM(`createdAt` IS NULL) AS blank FROM `Recipients`'
    );
    console.log(`Карточек всего: ${stat.total}, без даты создания: ${stat.blank}`);

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

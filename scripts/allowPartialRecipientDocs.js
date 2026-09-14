import { sequelize } from '../models/index.js';

const COLUMNS = [
  ['DOCSERIES', 'VARCHAR(16)'],
  ['DOCNUMBER', 'VARCHAR(16)'],
  ['DOCISSUER', 'VARCHAR(255)'],
  ['DOCISSUERDATE', 'DATE'],
  ['SNILS', 'CHAR(14)'],
  ['MSEISSUEDATE', 'DATE'],
  ['REGADDRESS', 'VARCHAR(500)'],
  ['FACTADDRESS', 'VARCHAR(500)'],
  ['EDUCATIONPLACE', 'VARCHAR(255)'],
  ['SPECIALNOTE', 'TEXT']
];

async function isNullable(table, column) {
  const [rows] = await sequelize.query(
    `SELECT IS_NULLABLE AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  if (!rows?.length) return null;
  return String(rows[0].n || '').toUpperCase() === 'YES';
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Миграция RecipientDocs — разрешаем неполные анкеты...');

    for (const [column, type] of COLUMNS) {
      const nullable = await isNullable('RecipientDocs', column);
      if (nullable === null) {
        console.log(`  ! колонки ${column} нет — пропущено`);
        continue;
      }
      if (nullable) {
        console.log(`  = ${column} уже допускает NULL`);
        continue;
      }
      await sequelize.query(`ALTER TABLE \`RecipientDocs\` MODIFY \`${column}\` ${type} NULL`);
      console.log(`  ✓ ${column} → NULL`);
    }

    const [res] = await sequelize.query(
      "UPDATE `RecipientDocs` SET `SNILS` = NULL WHERE `SNILS` IS NOT NULL AND TRIM(`SNILS`) = ''"
    );
    console.log(`  ✓ пустые СНИЛС переведены в NULL (затронуто строк: ${res?.affectedRows ?? 0})`);

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

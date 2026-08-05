// Одноразовая миграция: снимает UNIQUE с Recipients.TELEPHONE (индекс re_telephone).
// В карточку реабилитанта пишется контактный телефон законного представителя, а у
// одного опекуна законно бывает несколько подопечных — двое детей одного родителя
// делят один номер. Уникальность здесь ломала регистрацию второго ребёнка.
// Телефон не является идентификатором реабилитанта: за это отвечают СНИЛС и
// серия+номер документа, и обе проверки остаются на месте.
// Сервер работает без sequelize.sync(), поэтому индекс снимаем вручную.
// Скрипт идемпотентен: проверяет наличие индекса перед ALTER.
//
// Запуск:  node scripts/dropRecipientPhoneUnique.js
import { sequelize } from '../models/index.js';

async function indexExists(table, index) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :index`,
    { replacements: { table, index } }
  );
  return Number(rows?.[0]?.c || 0) > 0;
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Migrating Recipients...');

    if (await indexExists('Recipients', 're_telephone')) {
      await sequelize.query('ALTER TABLE `Recipients` DROP INDEX `re_telephone`');
      console.log('  ✓ re_telephone dropped');
    } else {
      console.log('  = re_telephone already absent');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

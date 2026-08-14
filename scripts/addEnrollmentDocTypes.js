import { sequelize, DocType } from '../models/index.js';

const ROWS = [
  { code: 'signed-contract', name: 'Подписанный договор оказания услуг' },
  { code: 'signed-enroll',   name: 'Подписанное заявление о зачислении на курс' },
  { code: 'signed-plan',     name: 'Подписанный индивидуальный план' }
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    for (const row of ROWS) {
      const existing = await DocType.findOne({ where: { code: row.code } });
      if (existing) {
        console.log(`  = ${row.code} уже есть (id=${existing.id})`);
        continue;
      }
      const created = await DocType.create({
        code: row.code,
        name: row.name,
        category: 'signed',
        isRequired: false,
        appliesTo: 'both'
      });
      console.log(`  ✓ ${row.code} добавлен (id=${created.id})`);
    }

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

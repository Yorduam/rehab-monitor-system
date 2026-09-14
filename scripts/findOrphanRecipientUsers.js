import { sequelize } from '../models/index.js';

const DO_DELETE = process.argv.includes('--delete');

async function run() {
  try {
    await sequelize.authenticate();

    const [users] = await sequelize.query(`
      SELECT u.ID, u.EMAIL
      FROM users u
      LEFT JOIN Recipients r ON r.USERID = u.ID
      WHERE u.ROLE = 'recipient' AND r.ID IS NULL
      ORDER BY u.ID
    `);

    const [reps] = await sequelize.query(`
      SELECT lr.ID, lr.LASTNAME, lr.FIRSTNAME, lr.TELEPHONE
      FROM LegalRepresentatives lr
      LEFT JOIN Recipients r ON r.REPRESENTATIVEID = lr.ID
      WHERE r.ID IS NULL
      ORDER BY lr.ID
    `);

    console.log(`Учётные записи recipient без карточки: ${users.length}`);
    for (const u of users) console.log(`  #${u.ID}  ${u.EMAIL}`);

    console.log(`\nЗаконные представители без единого ребёнка: ${reps.length}`);
    for (const r of reps) {
      console.log(`  #${r.ID}  ${[r.LASTNAME, r.FIRSTNAME].filter(Boolean).join(' ')}  ${r.TELEPHONE || ''}`);
    }

    if (!DO_DELETE) {
      console.log('\nНичего не удалено. Запустите с ключом --delete, чтобы убрать перечисленное.');
      process.exit(0);
    }

    await sequelize.transaction(async (t) => {
      if (users.length) {
        await sequelize.query('DELETE FROM users WHERE ID IN (:ids)', {
          replacements: { ids: users.map((u) => u.ID) }, transaction: t
        });
      }
      if (reps.length) {
        const ids = reps.map((r) => r.ID);
        await sequelize.query('DELETE FROM LegalRepFamilyStatus WHERE representativeId IN (:ids)', {
          replacements: { ids }, transaction: t
        });
        await sequelize.query('DELETE FROM LegalRepresentatives WHERE ID IN (:ids)', {
          replacements: { ids }, transaction: t
        });
      }
    });

    console.log(`\nУдалено: учётных записей ${users.length}, представителей ${reps.length}.`);
    process.exit(0);
  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
}

run();

// Одноразовая миграция данных: для «старых» направлений на диагностику
// (записи ReResult, созданные до того, как POST /diagnostics стал заводить
// событие в расписании) добавляет соответствующий ScheduleEvent.
//
// Зачем: вкладка «Реабилитанты» у преподавателя показывает только тех, у кого
// есть ScheduleEvent с этим специалистом. Раньше назначение диагностики
// создавало только ReResult — и реабилитант не появлялся в расписании.
//
// Обрабатываем только активные направления (published = false).
// Скрипт идемпотентен: если событие на дату/специалиста/реабилитанта уже есть —
// пропускаем.
//
// Запуск:  node scripts/backfillDiagnosticEvents.js
import { sequelize, ReResult, ScheduleEvent } from '../models/index.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Backfilling diagnostic schedule events...');

    const referrals = await ReResult.findAll({ where: { published: false } });
    console.log(`  active referrals (published=false): ${referrals.length}`);

    let created = 0;
    let skipped = 0;

    for (const r of referrals) {
      const idRecipient = r.idRecipient;
      const idSpecialist = r.idSpecialist;
      const idDirection = r.idDirection ?? null;
      const date = r.date;

      if (!idRecipient || !idSpecialist || !date) {
        skipped++;
        continue;
      }

      const existing = await ScheduleEvent.findOne({
        where: {
          specialistUserId: idSpecialist,
          recipientId: idRecipient,
          date,
          type: 'diagnostic'
        }
      });
      if (existing) {
        skipped++;
        continue;
      }

      await ScheduleEvent.create({
        specialistUserId: idSpecialist,
        recipientId: idRecipient,
        directionId: idDirection,
        type: 'diagnostic',
        title: 'Диагностика',
        date,
        startTime: '09:00:00',
        endTime: '09:30:00',
        status: 'scheduled',
        createdBy: idSpecialist
      });
      created++;
      console.log(`  ✓ event for recipient ${idRecipient} / specialist ${idSpecialist} / ${date}`);
    }

    console.log(`Done. created=${created}, skipped=${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

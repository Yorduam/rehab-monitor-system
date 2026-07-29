// Разовая починка данных: карточки, заведённые мастером до фикса, навсегда
// оставались в статусе 'draft' — мастер жёстко слал status:'draft', а перевести
// карточку в 'active' было нечем. Теперь черновик блокирует назначение
// диагностики (services/recipientReadiness.js), поэтому старые карточки надо
// поднять до 'active'.
//
// Поднимаем только те, у которых маршрут реально заполнен целиком: анкета,
// медкарта, представитель, документы, все обязательные сканы и непросроченные
// сроки. Неполные карточки осознанно оставляем черновиками.
//
// Идемпотентно: повторный запуск ничего не меняет.
//   node scripts/fixDraftRecipients.js          — только показать
//   node scripts/fixDraftRecipients.js --yes    — применить
import 'dotenv/config';
import { Recipient } from '../models/index.js';
import { getRecipientReadiness } from '../services/recipientReadiness.js';

const apply = process.argv.includes('--yes');

const drafts = await Recipient.findAll({ where: { status: 'draft' }, order: [['id', 'ASC']] });
if (!drafts.length) {
  console.log('Черновиков нет — делать нечего.');
  process.exit(0);
}

console.log(`Черновиков: ${drafts.length}${apply ? '' : '  (пробный прогон, для записи добавьте --yes)'}`);

let promoted = 0;
for (const r of drafts) {
  const rd = await getRecipientReadiness(r.id);
  const name = [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ');
  if (!rd.route.complete) {
    const gaps = rd.route.steps.filter((s) => !s.done).map((s) => s.label).join(', ');
    console.log(`  #${r.id} ${name} — остаётся черновиком (не заполнено: ${gaps})`);
    continue;
  }
  console.log(`  #${r.id} ${name} — маршрут заполнен, draft -> active`);
  if (apply) {
    await r.update({ status: 'active' });
    promoted += 1;
  }
}

console.log(apply ? `Переведено в active: ${promoted}` : 'Ничего не записано.');
process.exit(0);

// Одноразовая миграция: переименовывает уже загруженные сканы под тот же формат,
// который теперь применяется при загрузке новых (services/scanFileName.js):
//
//     ID_ФИО реабилитанта_Название документа_Дата_Время.расширение
//
// До этого в originalName писалось имя файла как есть с компьютера оператора,
// поэтому в базе лежали десятки сканов «Гусь.jfif» и «channels4_profile.jpg» —
// по имени было не понять ни чей документ, ни какой.
//
// Меняются ТОЛЬКО имена. Сами файлы (fileData), контрольные суммы, привязки и
// история версий не трогаются вовсе.
//
// Скрипт идемпотентен: имя собирается из данных, которые уже лежат в строке
// (recipId, docType, uploadedAt), поэтому повторный запуск даёт тот же результат
// и ничего не меняет. Расширение берётся из текущего имени, а оно после первого
// прогона остаётся прежним — пересчёт устойчив.
//
// Запуск:
//   node scripts/renameExistingScans.js          — показать, что изменится
//   node scripts/renameExistingScans.js --apply  — записать изменения
import { sequelize, RecipientScanDoc, Recipient, DocType } from '../models/index.js';
import { buildScanFileName } from '../services/scanFileName.js';

const apply = process.argv.includes('--apply');

async function run() {
  try {
    await sequelize.authenticate();
    console.log(`DB connected. Режим: ${apply ? 'ЗАПИСЬ (--apply)' : 'просмотр без изменений'}\n`);

    const docTypes = await DocType.findAll();
    const typeById = new Map(docTypes.map((d) => [d.id, d.name]));

    const recipients = await Recipient.findAll({
      attributes: ['id', 'lastName', 'firstName', 'middleName']
    });
    const recipById = new Map(recipients.map((r) => [r.id, r]));

    // fileData исключаем нарочно: там лежат сами файлы, и без этого выборка
    // затянула бы в память всё содержимое сканов разом.
    const scans = await RecipientScanDoc.findAll({
      attributes: { exclude: ['fileData'] },
      order: [['id', 'ASC']]
    });

    let renamed = 0;
    let unchanged = 0;
    const skipped = [];

    for (const scan of scans) {
      const recipient = recipById.get(scan.recipId);
      if (!recipient) {
        skipped.push(`id=${scan.id}: реабилитант ${scan.recipId} не найден`);
        continue;
      }
      // Без даты загрузки имя пришлось бы штамповать сегодняшним числом — это
      // была бы неправда, да и повторный запуск давал бы каждый раз новое имя.
      if (!scan.uploadedAt) {
        skipped.push(`id=${scan.id}: не заполнена дата загрузки`);
        continue;
      }

      const next = buildScanFileName({
        recipientId: recipient.id,
        lastName: recipient.lastName,
        firstName: recipient.firstName,
        middleName: recipient.middleName,
        docTypeName: typeById.get(scan.docType),
        originalName: scan.originalName,
        uploadedAt: scan.uploadedAt
      });

      if (next === scan.originalName) {
        unchanged += 1;
        continue;
      }

      console.log(`  id=${scan.id}`);
      console.log(`    было:  ${scan.originalName}`);
      console.log(`    стало: ${next}`);
      if (apply) await scan.update({ originalName: next });
      renamed += 1;
    }

    console.log('');
    console.log(`Всего сканов:        ${scans.length}`);
    console.log(`${apply ? 'Переименовано:      ' : 'Будет переименовано:'} ${renamed}`);
    console.log(`Уже в новом формате: ${unchanged}`);
    if (skipped.length) {
      console.log(`Пропущено:           ${skipped.length}`);
      for (const s of skipped) console.log(`  ! ${s}`);
    }
    if (!apply && renamed) {
      console.log('\nНичего не записано. Для записи: node scripts/renameExistingScans.js --apply');
    }

    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

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

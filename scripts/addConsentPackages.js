import { sequelize } from '../models/index.js';

async function hasColumn(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column`,
    { replacements: { table, column } }
  );
  return Number(rows?.[0]?.n || 0) > 0;
}

async function tableExists(table) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table`,
    { replacements: { table } }
  );
  return Number(rows?.[0]?.n || 0) > 0;
}

const RECIPIENT_COLUMNS = [
  ['legalCapacity', "ENUM('capable','incapable') NOT NULL DEFAULT 'capable'"],
  ['guardianBasis', 'VARCHAR(500) NULL DEFAULT NULL']
];

const DOC_TYPES = [
  ['signed-pd-diag-parent', 'Согласие на ПДн · диагностика · от законного представителя несовершеннолетнего', 'signed', 'representative'],
  ['signed-pd-diag-self', 'Согласие на ПДн · диагностика · от реабилитанта с 14 лет', 'signed', 'rehabilitant'],
  ['signed-pd-diag-ward', 'Согласие на ПДн · диагностика · от представителя недееспособного', 'signed', 'representative'],
  ['signed-pd-rehab-parent', 'Согласие на ПДн · курс · от законного представителя несовершеннолетнего', 'signed', 'representative'],
  ['signed-pd-rehab-self', 'Согласие на ПДн · курс · от реабилитанта с 14 лет', 'signed', 'rehabilitant'],
  ['signed-pd-rehab-ward', 'Согласие на ПДн · курс · от представителя недееспособного', 'signed', 'representative'],
  ['signed-photo-parent', 'Согласие на фото/видео · от законного представителя несовершеннолетнего', 'signed', 'representative'],
  ['signed-photo-self', 'Согласие на фото/видео · от реабилитанта с 14 лет', 'signed', 'rehabilitant'],
  ['signed-photo-ward', 'Согласие на фото/видео · от представителя недееспособного', 'signed', 'representative'],
  ['guardianship', 'Документ о полномочиях законного представителя (решение суда, акт опеки)', 'scan', 'representative']
];

const LEGACY_NAMES = [
  ['signed-pdn', 'Согласие на обработку ПДн (прежняя форма)'],
  ['signed-photo', 'Согласие на фото/видео (прежняя форма)']
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    for (const [column, type] of RECIPIENT_COLUMNS) {
      if (await hasColumn('Recipients', column)) {
        console.log(`  = Recipients.${column} уже есть`);
        continue;
      }
      await sequelize.query(`ALTER TABLE \`Recipients\` ADD COLUMN \`${column}\` ${type}`);
      console.log(`  ✓ Recipients.${column} добавлена`);
    }

    if (await tableExists('RepresentativeReleases')) {
      console.log('  = RepresentativeReleases уже есть');
    } else {
      await sequelize.query(
        'CREATE TABLE `RepresentativeReleases` (' +
        '  `id` INT NOT NULL AUTO_INCREMENT,' +
        '  `recipientId` INT NOT NULL,' +
        '  `representativeId` INT NOT NULL,' +
        '  `relation` VARCHAR(50) NULL,' +
        '  `releasedAt` DATETIME NOT NULL,' +
        '  `releasedBy` INT NULL,' +
        '  `reason` VARCHAR(500) NOT NULL,' +
        '  PRIMARY KEY (`id`),' +
        '  KEY `rr_recipient` (`recipientId`),' +
        '  KEY `rr_representative` (`representativeId`),' +
        '  CONSTRAINT `rr_recipient_fk` FOREIGN KEY (`recipientId`) REFERENCES `Recipients` (`ID`) ON DELETE CASCADE,' +
        '  CONSTRAINT `rr_representative_fk` FOREIGN KEY (`representativeId`) REFERENCES `LegalRepresentatives` (`ID`) ON DELETE RESTRICT' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'
      );
      console.log('  ✓ RepresentativeReleases создана');
    }

    for (const [code, name, category, appliesTo] of DOC_TYPES) {
      const [[found]] = await sequelize.query('SELECT `id` FROM `DocType` WHERE `code` = :code', { replacements: { code } });
      if (found) {
        console.log(`  = DocType ${code} уже есть`);
        continue;
      }
      await sequelize.query(
        'INSERT INTO `DocType` (`code`, `name`, `category`, `isRequired`, `appliesTo`) VALUES (:code, :name, :category, 0, :appliesTo)',
        { replacements: { code, name, category, appliesTo } }
      );
      console.log(`  ✓ DocType ${code} добавлен`);
    }

    for (const [code, name] of LEGACY_NAMES) {
      await sequelize.query('UPDATE `DocType` SET `name` = :name WHERE `code` = :code', { replacements: { code, name } });
      console.log(`  ✓ DocType ${code} → «${name}»`);
    }

    console.log('Готово.');
    process.exit(0);
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  }
}

run();

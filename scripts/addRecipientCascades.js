import sequelize from '../config/database.js';

const q = (sql, opt) => sequelize.query(sql, opt).then(([r]) => r);

async function fkOf(table, column) {
  const rows = await q(`
    SELECT k.CONSTRAINT_NAME AS name, r.DELETE_RULE AS rule
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.REFERENTIAL_CONSTRAINTS r
      ON r.CONSTRAINT_NAME = k.CONSTRAINT_NAME AND r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
    WHERE k.CONSTRAINT_SCHEMA = DATABASE()
      AND k.TABLE_NAME = '${table}' AND k.COLUMN_NAME = '${column}'
      AND k.REFERENCED_TABLE_NAME = 'Recipients'`);
  return rows[0] || null;
}

async function orphans(table) {
  const rows = await q(`
    SELECT COUNT(*) AS n FROM ${table} t
    LEFT JOIN Recipients r ON r.id = t.recipientId
    WHERE t.recipientId IS NOT NULL AND r.id IS NULL`);
  return Number(rows[0].n);
}

const TARGETS = [
  ['DiagnosticSessions', 'fk_diagnosticsessions_recipient'],
  ['DiagnosticConclusions', 'fk_diagnosticconclusions_recipient'],
  ['ScheduleEvents', 'fk_scheduleevents_recipient']
];

for (const [table, name] of TARGETS) {
  const left = await orphans(table);
  if (left) {
    console.log(`✗ ${table}: ${left} строк ссылаются на несуществующие карточки — ключ не поставить, сначала почистите`);
    process.exit(1);
  }
}

for (const [table, name] of TARGETS) {
  const cur = await fkOf(table, 'recipientId');
  if (cur && cur.rule === 'CASCADE') {
    console.log(`= ${table}: каскад уже стоит (${cur.name})`);
    continue;
  }
  if (cur) {
    await sequelize.query(`ALTER TABLE ${table} DROP FOREIGN KEY ${cur.name}`);
    console.log(`- ${table}: снят старый ключ ${cur.name} (был ON DELETE ${cur.rule})`);
  }
  await sequelize.query(`
    ALTER TABLE ${table}
    ADD CONSTRAINT ${name} FOREIGN KEY (recipientId) REFERENCES Recipients(id) ON DELETE CASCADE`);
  console.log(`+ ${table}: ${name} ON DELETE CASCADE`);
}

console.log('\nготово');
process.exit(0);

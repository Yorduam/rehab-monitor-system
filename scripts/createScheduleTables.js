// Одноразовый скрипт создания таблиц модуля «Расписание и Диагностика».
// Сервер использует sequelize.authenticate() (без sync), поэтому новые
// таблицы создаём здесь вручную через Model.sync() — существующие таблицы
// не затрагиваются (sync без force = CREATE TABLE IF NOT EXISTS).
//
// Запуск:  node scripts/createScheduleTables.js
import { sequelize, ScheduleEvent, DiagnosticAssignment } from '../models/index.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected. Creating tables...');
    await DiagnosticAssignment.sync();
    console.log('  ✓ DiagnosticAssignments');
    await ScheduleEvent.sync();
    console.log('  ✓ ScheduleEvents');
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
}

run();

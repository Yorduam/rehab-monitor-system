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

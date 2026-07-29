import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

// Заявка на диагностику. Ресепшн (сотрудник) назначает диагностику ТОЛЬКО датой:
// он не знает, кто из специалистов сегодня работает, и не выбирает ни направление,
// ни время. Специалисты сами разбирают такие заявки из общего пула
// (см. POST /schedule/sessions/:id/claim), создавая себе DiagnosticAssignment.
//
// status:
//   'open'        — заявка создана, её ещё никто не взял;
//   'in_progress' — хотя бы один специалист взял реабилитанта себе;
//   'completed'   — выдано заключение;
//   'cancelled'   — заявка отменена.
const DiagnosticSession = sequelize.define('DiagnosticSession', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  // Дата проведения — единственное, что задаёт ресепшн.
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open' },
  // Пожелание/контекст от ресепшна для специалистов.
  note: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  closedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'DiagnosticSessions',
  timestamps: true
});

export default DiagnosticSession;

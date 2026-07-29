import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

// Итоговое заключение по комплексной диагностике.
// Выдать его может НЕ любой специалист, а только тот, кому администратор
// выставил флаг User.canConclude (плюс сам администратор). Это отдельная
// сущность, а не поле сессии, чтобы хранить автора, дату и историю правок.
const DiagnosticConclusion = sequelize.define('DiagnosticConclusion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sessionId: { type: DataTypes.INTEGER, allowNull: false },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  // Решение по итогам диагностики — то, что на карточке диагностики
  // («Сводное заключение», этап 04) выбирается тремя вариантами.
  // Раньше этого поля не было: вердикт существовал только как подсветка
  // кнопки в вёрстке и нигде не сохранялся, поэтому у администратора и у
  // специалиста заключение выглядело по-разному. Допустимые значения —
  // recommended | trial | rejected; null = вердикт ещё не выставлен
  // (старые заключения, выданные из «Расписания» до этой правки).
  verdict: { type: DataTypes.STRING(20), allowNull: true },
  // Итог по результатам всех специалистов.
  summary: { type: DataTypes.TEXT, allowNull: false },
  // Рекомендации по маршруту реабилитации.
  recommendations: { type: DataTypes.TEXT, allowNull: true },
  authorId: { type: DataTypes.INTEGER, allowNull: true },
  issuedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'DiagnosticConclusions',
  timestamps: true
});

export default DiagnosticConclusion;

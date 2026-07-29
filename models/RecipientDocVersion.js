import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

// История изменений анкетных документов реабилитанта (RecipientDocs).
// Перед каждым обновлением RecipientDoc сюда пишется снимок ПРЕЖНИХ значений,
// поэтому старые данные не теряются. Обязательные поля аудита:
//   reason    — причина обновления (обязательна, задаётся пользователем),
//   changedBy — кто обновил (Users.id),
//   changedAt — когда обновил.
// changedFields — список полей, которые реально изменились (для краткого показа).
const RecipientDocVersion = sequelize.define('RecipientDocVersion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  docId: { type: DataTypes.INTEGER, allowNull: false },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  // Полный снимок предыдущей версии строки RecipientDocs.
  snapshot: { type: DataTypes.JSON, allowNull: true },
  changedFields: { type: DataTypes.JSON, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: false },
  changedBy: { type: DataTypes.INTEGER, allowNull: true },
  changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'RecipientDocVersions',
  timestamps: false
});

export default RecipientDocVersion;

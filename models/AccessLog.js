import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

// Журнал обращений к персональным данным.
//
// До этого «логи» проекта были выводом pino в консоль: они не сохранялись
// нигде, пропадали вместе с окном сервера и не содержали, кто именно совершил
// действие. Отвечать на вопрос «кто и зачем смотрел паспорт Иванова» было
// нечем. Эта таблица заводится именно под такой вопрос.
//
// Роль пишем рядом с userId нарочно: роль пользователя со временем меняют, а
// журнал должен сохранять положение дел на момент действия, а не на сегодня.
const AccessLog = sequelize.define('AccessLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  userId: { type: DataTypes.INTEGER, allowNull: true },
  userRole: { type: DataTypes.STRING(32), allowNull: true },

  // Чьи данные смотрели. null допустим: бывают обращения не к конкретной
  // карточке, а к списку.
  recipientId: { type: DataTypes.INTEGER, allowNull: true },

  // Категория данных. Совпадает с тем, что закрыто кнопкой в интерфейсе.
  category: {
    type: DataTypes.ENUM('passport', 'scans', 'contacts', 'medical'),
    allowNull: false
  },

  // Просмотр на экране и скачивание файла — разные по весу действия, и в
  // журнале они должны различаться.
  action: {
    type: DataTypes.ENUM('view', 'download', 'denied'),
    allowNull: false
  },

  // Причина. У администратора её не спрашивают, поэтому поля пустые —
  // сама запись о доступе при этом всё равно создаётся.
  reasonCode: { type: DataTypes.STRING(64), allowNull: true },
  reasonText: { type: DataTypes.STRING(500), allowNull: true },

  // Конкретный файл, если открывали именно скан.
  scanId: { type: DataTypes.INTEGER, allowNull: true },

  ip: { type: DataTypes.STRING(64), allowNull: true },
  userAgent: { type: DataTypes.STRING(255), allowNull: true },

  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'AccessLogs',
  timestamps: false,
  indexes: [
    // Три типовых вопроса к журналу: что смотрел этот сотрудник, кто смотрел
    // этого ребёнка, что происходило за такой-то период.
    { name: 'al_user_time', fields: ['userId', 'createdAt'] },
    { name: 'al_recipient_time', fields: ['recipientId', 'createdAt'] },
    { name: 'al_time', fields: ['createdAt'] }
  ]
});

export default AccessLog;

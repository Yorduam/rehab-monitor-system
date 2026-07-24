import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const Recipient = sequelize.define('Recipient', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  firstName: { type: DataTypes.STRING(50), allowNull: false },
  middleName: { type: DataTypes.STRING(50), allowNull: false },
  lastName: { type: DataTypes.STRING(50), allowNull: false },
  birthDate: { type: DataTypes.DATEONLY, allowNull: true },
  email: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  telephone: { type: DataTypes.STRING(20), allowNull: false, unique: true },

  photo: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
    get() {
      const v = this.getDataValue('photo');
      return v == null ? v : v.toString('utf8');
    }
  },
  representativeId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('draft', 'active', 'archived'), defaultValue: 'active' },
  disableGroup: {
    type: DataTypes.ENUM('Ребенок-инвалид', 'I группа', 'II группа', 'III группа', 'Нет'),
    defaultValue: 'Нет'
  },
  diagnosis: { type: DataTypes.STRING(255), allowNull: false },
  nozology: { type: DataTypes.INTEGER, allowNull: false },
  groupId: { type: DataTypes.INTEGER, allowNull: true },
  CRGMain: { type: DataTypes.INTEGER, allowNull: false },

  // Отметка посещения «на день», которую ставит преподаватель на вкладке
  // «Реабилитанты». Именно статус 'present' открывает реабилитанта на вкладке
  // «Диагностика» (при наличии направления). attendanceDate ограничивает
  // действие отметки одним днём — назавтра она считается неактуальной.
  attendanceStatus: { type: DataTypes.ENUM('present', 'absent', 'left'), allowNull: true, defaultValue: null },
  attendanceDate: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: null }
}, {
  tableName: 'Recipients',
  timestamps: false
});

export default Recipient;

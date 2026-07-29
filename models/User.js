import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'employee', 'recipient'), defaultValue: 'recipient' },
  firstName: { type: DataTypes.STRING(100), allowNull: true },
  lastName: { type: DataTypes.STRING(100), allowNull: true },
  // Контактный телефон (актуально в первую очередь для преподавателей/специалистов).
  phone: { type: DataTypes.STRING(20), allowNull: true },
  // Номер кабинета (актуально в первую очередь для преподавателей/специалистов).
  cabinet: { type: DataTypes.STRING(10), allowNull: true },
  // Проф. ориентированность преподавателя (ссылка на Direction). Заполняется только для роли teacher.
  directionId: { type: DataTypes.INTEGER, allowNull: true },
  // Право выдать итоговое заключение по комплексной диагностике.
  // Есть не у всех специалистов — выдаётся администратором точечно.
  canConclude: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  // Право видеть заполненные блоки ДРУГИХ специалистов (не только свой).
  // Некоторым специалистам это нужно для корректной оценки, остальным — нет.
  canViewAllResults: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  // Отображаемое имя. Пользователь одновременно куратор и специалист —
  // это имя показывается там, где раньше было Specialist.fullName.
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      const name = [this.lastName, this.firstName].filter(Boolean).join(' ').trim();
      return name || this.getDataValue('email') || '';
    }
  }
}, {
  tableName: 'Users',
  timestamps: false
});

export default User;

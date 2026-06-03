import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const Diagnostic = sequelize.define('Diagnostic', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING },
  recipientId: { type: DataTypes.INTEGER },
  date: { type: DataTypes.DATEONLY },
  time: { type: DataTypes.STRING(10) },
  specialist: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('planned', 'done'), defaultValue: 'planned' },
  type: { type: DataTypes.STRING(50), defaultValue: 'diagnostic' }   // добавлено
});

export default Diagnostic;
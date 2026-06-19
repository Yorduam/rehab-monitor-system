import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const CRGRecipientSec = sequelize.define('CRGRecipientSec', {
  idRecipient: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  idCRGDesc: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true }
}, {
  tableName: 'CRGRecipientSec',
  timestamps: false
});

export default CRGRecipientSec;

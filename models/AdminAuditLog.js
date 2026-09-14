import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  actorId: { type: DataTypes.INTEGER, allowNull: true },
  actorRole: { type: DataTypes.STRING(32), allowNull: true },
  actorName: { type: DataTypes.STRING(150), allowNull: true },

  targetUserId: { type: DataTypes.INTEGER, allowNull: true },
  targetName: { type: DataTypes.STRING(150), allowNull: true },

  action: {
    type: DataTypes.ENUM(
      'user.create', 'user.delete', 'role.change', 'password.reset',
      'password.change', 'email.change', 'rights.change'
    ),
    allowNull: false
  },

  details: { type: DataTypes.JSON, allowNull: true },

  ip: { type: DataTypes.STRING(64), allowNull: true },
  userAgent: { type: DataTypes.STRING(255), allowNull: true },

  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'AdminAuditLogs',
  timestamps: false,
  indexes: [
    { name: 'aal_actor_time', fields: ['actorId', 'createdAt'] },
    { name: 'aal_target_time', fields: ['targetUserId', 'createdAt'] },
    { name: 'aal_time', fields: ['createdAt'] }
  ]
});

export default AdminAuditLog;

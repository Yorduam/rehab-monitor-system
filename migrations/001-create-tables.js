import { DataTypes } from '@sequelize/core';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recipients', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      fullName: { type: DataTypes.STRING(255), allowNull: false },
      age: { type: DataTypes.INTEGER },
      diagnosis: { type: DataTypes.STRING(255) },
      groupId: { type: DataTypes.INTEGER, references: { model: 'groups', key: 'id' }, onDelete: 'SET NULL' },
      photo: { type: DataTypes.STRING(255) },
      contacts: { type: DataTypes.STRING(255) },
      legalRepresentative: { type: DataTypes.STRING(255) },
      aggressionLevel: { type: DataTypes.INTEGER, defaultValue: 1 },
      showAggression: { type: DataTypes.BOOLEAN, defaultValue: true },
      aggressionNote: { type: DataTypes.STRING(255) },
      completionStatus: { type: DataTypes.ENUM('in_progress', 'completed'), defaultValue: 'in_progress' },
      attendance: { type: DataTypes.INTEGER, defaultValue: 0 },
      commScore: { type: DataTypes.INTEGER, defaultValue: 0 },
      groupScore: { type: DataTypes.INTEGER, defaultValue: 0 },
      creativityScore: { type: DataTypes.INTEGER, defaultValue: 0 },
      selfScore: { type: DataTypes.INTEGER, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex('recipients', ['fullName']);
    await queryInterface.addIndex('recipients', ['groupId']);
    await queryInterface.addIndex('recipients', ['diagnosis']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('recipients');
  }
};
import { Op } from '@sequelize/core';
import { sequelize } from '../config/database.js';   // теперь работает
import Recipient from '../models/Recipient.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { NotFoundError, ValidationError } from '../exceptions/AppError.js';
import { createRecipientSchema, updateRecipientSchema } from '../validations/recipientValidation.js';


export class RecipientService {
  async findAll({ page = 1, limit = 15, search, diagnosis, groupId }) {
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.fullName = { [Op.like]: `%${search}%` };
    if (diagnosis && diagnosis !== 'all') where.diagnosis = diagnosis;
    if (groupId) where.groupId = groupId;

    const { count, rows } = await Recipient.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        { model: Group, as: 'group', include: [{ model: User, as: 'curator', attributes: ['id', 'fullName'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return { data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  }

  async findById(id) {
    const recipient = await Recipient.findByPk(id, {
      include: [{ model: Group, as: 'group', include: [{ model: User, as: 'curator', attributes: ['id', 'fullName'] }] }]
    });
    if (!recipient) throw new NotFoundError('Recipient');
    return recipient;
  }

  async create(data) {
    const { error, value } = createRecipientSchema.validate(data);
    if (error) throw new ValidationError(error.details[0].message);

    const transaction = await sequelize.transaction();
    try {
      const recipient = await Recipient.create({
        ...value,
        attendance: 0,
        commScore: 0,
        groupScore: 0,
        creativityScore: 0,
        selfScore: 0,
        status: 'active'
      }, { transaction });
      await transaction.commit();
      return this.findById(recipient.id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async update(id, data) {
    const { error, value } = updateRecipientSchema.validate(data);
    if (error) throw new ValidationError(error.details[0].message);

    const recipient = await Recipient.findByPk(id);
    if (!recipient) throw new NotFoundError('Recipient');

    const transaction = await sequelize.transaction();
    try {
      await recipient.update(value, { transaction });
      await transaction.commit();
      return this.findById(id);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async delete(id) {
    const recipient = await Recipient.findByPk(id);
    if (!recipient) throw new NotFoundError('Recipient');
    await recipient.destroy();
    return { success: true };
  }
}
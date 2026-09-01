import Joi from 'joi';

export const createRecipientSchema = Joi.object({
  userId: Joi.number().integer().required(),
  firstName: Joi.string().min(1).max(50).required(),
  middleName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  birthDate: Joi.date().iso().required(),
  email: Joi.string().email().max(50).required(),
  telephone: Joi.string().max(20).required(),
  photo: Joi.string().required(),
  representativeId: Joi.number().integer().allow(null).optional(),
  status: Joi.string().valid('draft', 'active', 'archived').default('active'),
  disableGroup: Joi.string()
    .valid('Ребенок-инвалид', 'I группа', 'II группа', 'III группа', 'Нет')
    .default('Нет'),
  diagnosis: Joi.string().max(2000).required(),
  nozology: Joi.number().integer().required(),
  groupId: Joi.number().integer().required(),
  CRGMain: Joi.number().integer().required(),
  secondaryCRG: Joi.array().items(Joi.number().integer()).optional()
});

export const updateRecipientSchema = createRecipientSchema.fork(
  Object.keys(createRecipientSchema.describe().keys),
  (schema) => schema.optional()
);

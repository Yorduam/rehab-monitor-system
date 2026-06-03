import Joi from 'joi';

export const createRecipientSchema = Joi.object({
  fullName: Joi.string().min(2).max(255).required(),
  age: Joi.number().integer().min(0).max(120).optional(),
  diagnosis: Joi.string().max(255).optional(),
  groupId: Joi.number().integer().allow(null).optional(),
  photo: Joi.string().uri().optional(),
  contacts: Joi.string().max(255).optional(),
  legalRepresentative: Joi.string().max(255).optional(),
  aggressionLevel: Joi.number().integer().min(1).max(5).default(1),
  showAggression: Joi.boolean().default(true),
  aggressionNote: Joi.string().max(255).allow('', null).optional(),
  completionStatus: Joi.string().valid('in_progress', 'completed').default('in_progress')
});

export const updateRecipientSchema = createRecipientSchema.fork(
  ['fullName', 'age', 'diagnosis', 'groupId', 'photo'],
  (schema) => schema.optional()
);
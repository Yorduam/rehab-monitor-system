import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { RecipientDoc, Recipient } from '../models/index.js';

const router = express.Router();

const DOC_FIELDS = [
  'recipientId', 'docType', 'docSeries', 'docNumber', 'docIssuer', 'docIssuerDate',
  'snils', 'mseIssueDate', 'mseValidDate', 'regAddress', 'factAddress',
  'factSameReg', 'educationPlace', 'specialNote'
];

function pickFields(body) {
  const out = {};
  for (const key of DOC_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const recipient = await Recipient.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
    if (!recipient) return res.json([]);
    const docs = await RecipientDoc.findAll({ where: { recipientId: recipient.id } });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.get('/recipient/:id', authMiddleware, async (req, res, next) => {
  try {
    const docs = await RecipientDoc.findAll({ where: { recipientId: req.params.id } });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const doc = await RecipientDoc.create(pickFields(req.body));
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await RecipientDoc.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });
    await doc.update(pickFields(req.body));
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await RecipientDoc.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });
    await doc.destroy();
    res.json({ message: 'Документ удалён' });
  } catch (err) {
    next(err);
  }
});

export default router;

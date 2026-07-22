import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { RecipientDoc, Recipient } from '../models/index.js';
import { generateDocument } from '../services/documentGenerator.js';

const router = express.Router();

// Сформировать заполненный документ (согласие/заявление) из данных мастера.
// Возвращает готовый .docx/.xlsx файлом для скачивания.
router.post('/generate', authMiddleware, async (req, res, next) => {
  try {
    const { docType, form } = req.body || {};
    if (!docType || !form) {
      return res.status(400).json({ message: 'Требуются docType и form' });
    }
    const { buffer, filename, contentType } = generateDocument(docType, form);
    const ext = filename.split('.').pop();
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="document.${ext}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.send(buffer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
});

const recipientInclude = {
  model: Recipient,
  as: 'recipient',
  attributes: ['id', 'firstName', 'middleName', 'lastName']
};

// Все документы по всем реабилитантам (для админа/учителя)
router.get('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const docs = await RecipientDoc.findAll({
      include: [recipientInclude],
      order: [['id', 'DESC']]
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

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

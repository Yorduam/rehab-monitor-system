import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Document from '../models/Document.js';

const router = express.Router();

// Получить документы текущего пользователя
router.get('/my', authMiddleware, async (req, res) => {
  const docs = await Document.findAll({ where: { recipientId: req.user.id } });
  res.json(docs);
});

// Получить документы конкретного получателя
router.get('/recipient/:id', authMiddleware, async (req, res) => {
  const docs = await Document.findAll({ where: { recipientId: req.params.id } });
  res.json(docs);
});

// Создать документ (без загрузки файла – ожидается готовый URL)
router.post('/', authMiddleware, async (req, res) => {
  const { type, name, url, recipientId } = req.body;
  const doc = await Document.create({ type, name, url, recipientId });
  res.status(201).json(doc);
});

// Обновить документ
router.put('/:id', authMiddleware, async (req, res) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const { type, name, url } = req.body;
  await doc.update({ type, name, url });
  res.json(doc);
});

// Удалить документ
router.delete('/:id', authMiddleware, async (req, res) => {
  const doc = await Document.findByPk(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  await doc.destroy();
  res.json({ message: 'Deleted' });
});

export default router;
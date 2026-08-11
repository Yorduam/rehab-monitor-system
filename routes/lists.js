
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  User, ReGroup, Nozology, CRG, CRGDesc,
  Direction, DocType, LegalRepresentative, FamilyStatus
} from '../models/index.js';

const router = express.Router();

const userFullName = (u) =>
  [u.lastName, u.firstName].filter(Boolean).join(' ').trim() || u.email;

router.get('/curators', authMiddleware, async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: { role: 'teacher' },
      attributes: ['id', 'firstName', 'lastName', 'email', 'cabinet', 'phone'],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });
    res.json(teachers.map((u) => ({
      id: u.id,
      fullName: userFullName(u),
      cabinet: u.cabinet || '',
      telephone: u.phone || ''
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/groups', authMiddleware, async (req, res) => {
  try {
    const groups = await ReGroup.findAll({ attributes: ['id', 'groupName'] });
    res.json(groups.map(g => ({ id: g.id, name: g.groupName })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/nozology', authMiddleware, async (req, res) => {
  try {
    const items = await Nozology.findAll({ attributes: ['id', 'class', 'name', 'code'] });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/crg', authMiddleware, async (req, res) => {
  try {
    const items = await CRG.findAll({ attributes: ['id', 'name', 'code', 'child'] });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/crg-desc', authMiddleware, async (req, res) => {
  try {
    const where = {};
    if (req.query.categoryId) where.categoryId = parseInt(req.query.categoryId);
    const items = await CRGDesc.findAll({ where, attributes: ['id', 'categoryId', 'name', 'code'] });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/directions', authMiddleware, async (req, res) => {
  try {
    const items = await Direction.findAll({ attributes: ['id', 'name', 'profileKey'] });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/doc-types', authMiddleware, async (req, res) => {
  try {
    const items = await DocType.findAll({
      attributes: ['id', 'code', 'name', 'category', 'isRequired', 'appliesTo']
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/family-statuses', authMiddleware, async (req, res) => {
  try {
    const items = await FamilyStatus.findAll({
      where: { isActive: true },
      attributes: ['id', 'code', 'name', 'hint', 'groupKey', 'sortOrder'],
      order: [['sortOrder', 'ASC'], ['id', 'ASC']]
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/representatives', authMiddleware, async (req, res) => {
  try {
    const items = await LegalRepresentative.findAll({
      attributes: ['id', 'firstName', 'middleName', 'lastName', 'telephone', 'email']
    });
    res.json(items.map(r => ({
      id: r.id,
      firstName: r.firstName,
      middleName: r.middleName,
      lastName: r.lastName,
      fullName: [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' '),
      telephone: r.telephone,
      email: r.email
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

import express from 'express';
import { Op } from '@sequelize/core';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  User, Recipient, ReGroup, Direction, Nozology,
  ReResult, RecipientDoc, ScheduleEvent, DiagnosticAssignment,
  DiagnosticSession, DiagnosticConclusion, RecipientScanDoc, DocType,
  RecipientDraft, LegalRepresentative
} from '../models/index.js';
import { DIAGNOSTIC_BLOCKS } from '../src/utils/diagnosticBlocks.js';
import { summarizeDraft } from '../src/utils/recipientDraft.js';
import { hasGrant, loadGrants } from '../services/dataAccess.js';
import {
  ENROLL_DOCS, findPendingEnrollment,
  signedEnrollCodesFor, hasAllRequiredEnrollDocs
} from '../services/enrollmentDocs.js';

const router = express.Router();

const ENROLL_SCAN_CODES = ENROLL_DOCS.map((d) => d.scanCode);

function recipientFullName(r) {
  return [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ') || 'Без имени';
}

const userFullName = (u) =>
  u ? ([u.lastName, u.firstName].filter(Boolean).join(' ').trim() || u.email) : null;

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const minutesOf = (t) => {
  if (!t) return NaN;
  const [h, m] = String(t).split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

const hhmm = (t) => (t ? String(t).slice(0, 5) : '');

const dateOnly = (v) => {
  if (!v) return null;
  if (v instanceof Date) return localDate(v);
  return String(v).slice(0, 10);
};

router.get('/admin-stats', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const [
      usersCount, recipientsCount, groupsCount,
      resultsCount, docsCount, directionsCount, nozologyCount
    ] = await Promise.all([
      User.count(), Recipient.count(), ReGroup.count(),
      ReResult.count(), RecipientDoc.count(), Direction.count(), Nozology.count()
    ]);

    const users = await User.findAll({ attributes: ['role'], raw: true });
    const roleCounts = { admin: 0, teacher: 0, employee: 0, recipient: 0 };
    users.forEach(u => {
      if (roleCounts[u.role] != null) roleCounts[u.role] += 1;
    });

    const recipients = await Recipient.findAll({ attributes: ['status'], raw: true });
    const statusCounts = { draft: 0, active: 0, archived: 0 };
    recipients.forEach(r => {
      if (statusCounts[r.status] != null) statusCounts[r.status] += 1;
    });

    res.json({
      records: [
        { key: 'users',       label: 'Пользователи', value: usersCount },
        { key: 'recipients',  label: 'Реабилитанты', value: recipientsCount },
        { key: 'groups',      label: 'Группы',       value: groupsCount },
        { key: 'results',     label: 'Результаты',   value: resultsCount },
        { key: 'documents',   label: 'Документы',    value: docsCount },
        { key: 'directions',  label: 'Направления',  value: directionsCount },
        { key: 'nozology',    label: 'Нозологии',    value: nozologyCount }
      ],
      roles: roleCounts,
      recipientStats: {
        total: recipientsCount,
        activeCount: statusCounts.active,
        draftCount: statusCounts.draft,
        archivedCount: statusCounts.archived
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const recipients = await Recipient.findAll({ attributes: ['status'], raw: true });
    const statusCounts = { draft: 0, active: 0, archived: 0 };
    recipients.forEach(r => {
      if (statusCounts[r.status] != null) statusCounts[r.status] += 1;
    });

    const groupsCount = await ReGroup.count();
    const resultsTotal = await ReResult.count();
    const resultsPublished = await ReResult.count({ where: { published: true } });

    res.json({
      stats: {
        recipients: recipients.length,
        activeCount: statusCounts.active,
        draftCount: statusCounts.draft,
        archivedCount: statusCounts.archived,
        groups: groupsCount,
        resultsTotal,
        resultsPublished,
        resultsPending: Math.max(0, resultsTotal - resultsPublished)
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/missing-docs', authMiddleware, async (req, res, next) => {
  try {
    const recipients = await Recipient.findAll({
      attributes: ['id', 'firstName', 'middleName', 'lastName'],
      include: [{
        model: ReGroup,
        as: 'group',
        attributes: ['id', 'groupName'],
        include: [{ model: User, as: 'curatorUser', attributes: ['firstName', 'lastName', 'email'] }]
      }],
      order: [['id', 'DESC']]
    });

    const allDocs = await RecipientDoc.findAll({ attributes: ['recipientId'], raw: true });
    const countMap = {};
    allDocs.forEach(d => {
      if (d.recipientId != null) {
        countMap[d.recipientId] = (countMap[d.recipientId] || 0) + 1;
      }
    });

    const list = recipients.map(r => ({
      id: r.id,
      fullName: recipientFullName(r),
      groupName: r.group?.groupName || '—',
      curator: userFullName(r.group?.curatorUser) || '—',
      docCount: countMap[r.id] || 0
    }));

    list.sort((a, b) => a.docCount - b.docCount);
    const missingCount = list.filter(r => r.docCount === 0).length;

    res.json({ list: list.slice(0, 5), missingCount });
  } catch (err) {
    next(err);
  }
});

router.get('/diagnostics', authMiddleware, async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim().toLowerCase();

    const results = await ReResult.findAll({
      include: [
        { model: Recipient, as: 'recipient', attributes: ['id', 'firstName', 'middleName', 'lastName'] },
        { model: Direction, as: 'direction', attributes: ['id', 'name'] },
        { model: User, as: 'specialist', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['date', 'DESC']]
    });

    let enriched = results.map(r => ({
      id: r.id,
      date: r.date,
      published: r.published,
      results: r.results,
      recipientName: r.recipient ? recipientFullName(r.recipient) : 'Неизвестно',
      direction: r.direction?.name || '—',
      specialist: userFullName(r.specialist) || '—'
    }));

    if (search) {
      enriched = enriched.filter(d =>
        d.recipientName.toLowerCase().includes(search) ||
        d.direction.toLowerCase().includes(search) ||
        d.specialist.toLowerCase().includes(search)
      );
    }

    const total      = enriched.length;
    const paginated  = enriched.slice(offset, offset + limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({ data: paginated, total, page, limit, totalPages });
  } catch (err) {
    next(err);
  }
});

const eventState = (event, todayStr, nowMin) => {
  if (event.status === 'completed') return 'done';
  const day = dateOnly(event.date);
  if (day && day < todayStr) return 'past';
  if (day && day > todayStr) return 'next';
  const from = minutesOf(event.startTime);
  const to = minutesOf(event.endTime);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 'next';
  if (nowMin >= from && nowMin < to) return 'now';
  return nowMin >= to ? 'past' : 'next';
};

const progressOf = (assignment) => {
  const block = DIAGNOSTIC_BLOCKS[assignment.direction?.profileKey || ''];
  const criteria = assignment.results?.criteria || {};
  let filled = 0;
  for (const c of block?.criteria || []) {
    const v = criteria[c.id];
    if (v !== null && v !== undefined && v !== '') filled += 1;
  }
  return { filled, total: block?.criteria.length || 0 };
};

const eventTitle = (event) =>
  event.title
  || (event.recipient ? recipientFullName(event.recipient) : null)
  || event.direction?.name
  || (event.type === 'diagnostic' ? 'Диагностика' : 'Занятие');

router.get('/teacher', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), loadGrants, async (req, res, next) => {
  try {
    const me = req.user.id;
    const now = new Date();
    const today = localDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const notCancelled = { [Op.ne]: 'cancelled' };
    const recipientAttrs = ['id', 'firstName', 'middleName', 'lastName'];

    const [todayEvents, assignments, groups, eventRecipientRows, unmarked] = await Promise.all([
      ScheduleEvent.findAll({
        where: { specialistUserId: me, date: today, status: notCancelled },
        include: [
          { model: Recipient, as: 'recipient', attributes: recipientAttrs },
          { model: Direction, as: 'direction', attributes: ['id', 'name', 'profileKey'] },
          { model: DiagnosticAssignment, as: 'assignment', attributes: ['id', 'blockStatus'] }
        ],
        order: [['startTime', 'ASC']]
      }),

      DiagnosticAssignment.findAll({
        where: { specialistUserId: me, blockStatus: { [Op.ne]: 'completed' } },
        include: [
          { model: Recipient, as: 'recipient', attributes: recipientAttrs },
          { model: Direction, as: 'direction', attributes: ['id', 'name', 'profileKey'] }
        ],
        order: [['date', 'ASC'], ['startTime', 'ASC']]
      }),

      ReGroup.findAll({
        where: { curatorUserId: me },
        include: [{ model: Recipient, as: 'recipients', attributes: ['id'] }],
        order: [['groupName', 'ASC']]
      }),

      ScheduleEvent.findAll({
        where: { specialistUserId: me, status: notCancelled, recipientId: { [Op.ne]: null } },
        attributes: ['recipientId'],
        group: ['recipientId'],
        raw: true
      }),

      ScheduleEvent.findAll({
        where: {
          specialistUserId: me,
          status: 'scheduled',
          type: { [Op.ne]: 'diagnostic' },
          date: { [Op.lt]: today, [Op.gte]: localDate(new Date(now.getTime() - 14 * 86400000)) }
        },
        include: [{ model: Recipient, as: 'recipient', attributes: recipientAttrs }],
        order: [['date', 'DESC'], ['startTime', 'DESC']],
        limit: 5
      })
    ]);

    const today_ = todayEvents.filter((e) => e.type !== 'diagnostic' || e.recipient).map((e) => {
      const state = eventState(e, today, nowMin);
      return {
        id: e.id,
        type: e.type,
        title: eventTitle(e),
        recipientId: e.recipientId,
        recipientName: e.recipient ? recipientFullName(e.recipient) : null,
        directionName: e.direction?.name || null,
        startTime: hhmm(e.startTime),
        endTime: hhmm(e.endTime),
        status: e.status,
        state,
        assignmentId: e.assignmentId,
        canMark: e.type !== 'diagnostic'
      };
    });

    const pending = assignments.map((a) => {
      const day = dateOnly(a.date);
      const { filled, total } = progressOf(a);
      return {
        id: a.id,
        recipientId: a.recipientId,
        recipientName: a.recipient ? recipientFullName(a.recipient) : 'Неизвестно',
        directionName: a.direction?.name || '—',
        profileKey: a.direction?.profileKey || null,
        date: day,
        startTime: hhmm(a.startTime),
        blockStatus: a.blockStatus,
        filled,
        total,
        isToday: day === today,
        isOverdue: !!day && day < today
      };
    });
    pending.sort((a, b) => (Number(b.isOverdue) - Number(a.isOverdue)) || String(a.date).localeCompare(String(b.date)));

    const recipientIds = new Set();
    eventRecipientRows.forEach((r) => r.recipientId != null && recipientIds.add(r.recipientId));
    assignments.forEach((a) => a.recipientId != null && recipientIds.add(a.recipientId));
    groups.forEach((g) => (g.recipients || []).forEach((r) => recipientIds.add(r.id)));

    const noteRows = recipientIds.size
      ? await RecipientDoc.findAll({
        where: { recipientId: { [Op.in]: [...recipientIds] }, specialNote: { [Op.ne]: '' } },
        include: [{ model: Recipient, as: 'recipient', attributes: recipientAttrs }],
        attributes: ['id', 'recipientId', 'specialNote']
      })
      : [];

    const attention = [];

    unmarked.forEach((e) => {
      attention.push({
        kind: 'unmarked',
        eventId: e.id,
        recipientId: e.recipientId,
        name: e.recipient ? recipientFullName(e.recipient) : (e.title || 'Занятие'),
        title: `${dateOnly(e.date)} ${hhmm(e.startTime)} — занятие не отмечено`,
        text: 'Отметьте, состоялось оно или нет'
      });
    });

    noteRows.forEach((d) => {
      const open = hasGrant(req, d.recipientId, 'medical');
      attention.push({
        kind: 'note',
        recipientId: d.recipientId,
        name: d.recipient ? recipientFullName(d.recipient) : 'Реабилитант',
        title: 'особая отметка',
        text: open ? String(d.specialNote).slice(0, 200) : null,
        locked: !open
      });
    });

    const lessonsDone = today_.filter((e) => e.state === 'done').length;

    res.json({
      date: today,
      nowTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      greetingName: [req.user.lastName, req.user.firstName].filter(Boolean).join(' ').trim() || req.user.email,
      cabinet: req.user.cabinet || null,
      kpi: {
        lessonsToday: today_.length,
        lessonsDone,
        lessonsAhead: today_.length - lessonsDone,
        recipients: recipientIds.size,
        groupsCount: groups.length,
        diagPending: pending.length,
        diagDueToday: pending.filter((p) => p.isToday).length,
        diagOverdue: pending.filter((p) => p.isOverdue).length,
        attention: attention.length
      },
      today: today_,
      pending,
      attention,
      groups: groups.map((g) => ({
        id: g.id,
        name: g.groupName,
        participantsCount: (g.recipients || []).length
      }))
    });
  } catch (err) {
    next(err);
  }
});

const MS_DAY = 24 * 60 * 60 * 1000;

const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const ruDate = (v) => {
  const s = dateOnly(v);
  if (!s) return null;
  const [, m, d] = s.split('-');
  return `${parseInt(d, 10)} ${RU_MONTHS[parseInt(m, 10) - 1] || ''}`.trim();
};

const daysSince = (v, todayStr) => {
  const s = dateOnly(v);
  if (!s) return null;
  const diff = Math.round((Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${s}T00:00:00Z`)) / MS_DAY);
  return Number.isFinite(diff) ? Math.max(diff, 0) : null;
};

const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

const daysWord = (n) => `${n} ${plural(n, 'день', 'дня', 'дней')}`;

const buildTile = ({ key, title, unit, tone, empty, items, meta, action }) => {
  const sorted = [...items].sort((a, b) => (b.days ?? -1) - (a.days ?? -1));
  const oldest = sorted.find((i) => Number.isFinite(i.days));
  return {
    key,
    title,
    tone,
    empty,
    action: action || null,
    count: sorted.length,
    unit: plural(sorted.length, unit[0], unit[1], unit[2]),
    meta: sorted.length
      ? (meta ? meta(sorted) : (oldest ? `Старшей ${daysWord(oldest.days)}` : null))
      : null,
    items: sorted
  };
};

router.get('/employee-alerts', authMiddleware, roleMiddleware('admin', 'employee'), async (req, res, next) => {
  try {
    const today = localDate();
    const nameAttrs = ['id', 'firstName', 'middleName', 'lastName'];
    const named = (r) => (r ? recipientFullName(r) : 'Без имени');

    const [expiredDocs, sessions, noShows, activeRecipients, signedTypes, currentScans, conclusions, pendingEnroll] =
      await Promise.all([
        RecipientDoc.findAll({
          where: { mseValidDate: { [Op.lt]: today } },
          attributes: ['id', 'recipientId', 'mseValidDate'],
          include: [{
            model: Recipient, as: 'recipient', attributes: nameAttrs,
            required: true, where: { status: { [Op.ne]: 'archived' } }
          }]
        }),
        DiagnosticSession.findAll({
          where: { status: { [Op.in]: ['open', 'in_progress'] } },
          attributes: ['id', 'recipientId', 'date', 'status'],
          include: [
            { model: Recipient, as: 'recipient', attributes: nameAttrs, required: true },
            {
              model: DiagnosticAssignment, as: 'assignments', required: false,
              attributes: ['id', 'blockStatus', 'date', 'completedAt']
            }
          ]
        }),
        ScheduleEvent.findAll({
          where: { type: 'diagnostic', status: 'scheduled', date: { [Op.lt]: today } },
          attributes: ['id', 'recipientId', 'date', 'title'],
          include: [{ model: Recipient, as: 'recipient', attributes: nameAttrs, required: true }]
        }),
        Recipient.findAll({
          where: { status: 'active' },
          attributes: [...nameAttrs, 'groupId']
        }),
        DocType.findAll({
          where: { category: 'signed', code: { [Op.notIn]: ENROLL_SCAN_CODES } },
          attributes: ['id', 'code', 'name']
        }),
        RecipientScanDoc.findAll({
          where: { isCurrent: true },
          attributes: ['recipId', 'docType', 'uploadedAt']
        }),
        DiagnosticConclusion.findAll({ attributes: ['id', 'sessionId', 'recipientId', 'verdict', 'issuedAt'] }),
        findPendingEnrollment()
      ]);

    const expiredItems = expiredDocs.map((d) => ({
      recipientId: d.recipientId,
      name: named(d.recipient),
      days: daysSince(d.mseValidDate, today),
      note: `Справка МСЭ истекла ${ruDate(d.mseValidDate)}`
    }));

    const unclaimedItems = sessions
      .filter((s) => !(s.assignments || []).length)
      .map((s) => ({
        recipientId: s.recipientId,
        name: named(s.recipient),
        date: dateOnly(s.date),
        days: daysSince(s.date, today),
        note: `Заявка на ${ruDate(s.date)} — никто не взял`
      }));

    const noShowItems = noShows.map((e) => ({
      recipientId: e.recipientId,
      name: named(e.recipient),
      days: daysSince(e.date, today),
      note: `Диагностика ${ruDate(e.date)} не отмечена`
    }));

    const scansOf = new Map();
    const lastScanAt = new Map();
    currentScans.forEach((s) => {
      if (!s.recipId) return;
      if (!scansOf.has(s.recipId)) scansOf.set(s.recipId, new Set());
      scansOf.get(s.recipId).add(s.docType);
      const prev = lastScanAt.get(s.recipId);
      if (s.uploadedAt && (!prev || s.uploadedAt > prev)) lastScanAt.set(s.recipId, s.uploadedAt);
    });

    const signedItems = [];
    activeRecipients.forEach((r) => {
      const have = scansOf.get(r.id) || new Set();
      const missing = signedTypes.filter((t) => !have.has(t.id));
      if (!missing.length) return;
      signedItems.push({
        recipientId: r.id,
        name: recipientFullName(r),
        days: daysSince(lastScanAt.get(r.id), today),
        note: `Не загружено: ${missing.map((t) => t.name).join(', ')}`
      });
    });

    const openBlockItems = [];
    sessions.forEach((s) => {
      const blocks = s.assignments || [];
      if (!blocks.length) return;
      const open = blocks.filter((b) => b.blockStatus !== 'completed');
      if (!open.length) return;
      const ages = open.map((b) => daysSince(b.date, today)).filter(Number.isFinite);
      openBlockItems.push({
        recipientId: s.recipientId,
        name: named(s.recipient),
        days: ages.length ? Math.max(...ages) : null,
        note: `Не заполнено блоков: ${open.length} из ${blocks.length}`
      });
    });

    const concludedSessions = new Set(conclusions.map((c) => c.sessionId));
    const noConclusionItems = sessions
      .filter((s) => {
        const blocks = s.assignments || [];
        return blocks.length
          && blocks.every((b) => b.blockStatus === 'completed')
          && !concludedSessions.has(s.id);
      })
      .map((s) => {
        const done = (s.assignments || []).map((b) => b.completedAt).filter(Boolean).sort();
        const last = done.length ? done[done.length - 1] : s.date;
        return {
          recipientId: s.recipientId,
          name: named(s.recipient),
          days: daysSince(last, today),
          note: `Блоки закрыты ${ruDate(last)}, заключение не выдано`
        };
      });

    const latestConclusion = new Map();
    conclusions.forEach((c) => {
      const prev = latestConclusion.get(c.recipientId);
      if (!prev || (c.issuedAt && c.issuedAt > prev.issuedAt)) latestConclusion.set(c.recipientId, c);
    });
    const notEnrolledItems = activeRecipients
      .filter((r) => !r.groupId && latestConclusion.has(r.id) && latestConclusion.get(r.id).verdict !== 'rejected')
      .map((r) => {
        const c = latestConclusion.get(r.id);
        return {
          recipientId: r.id,
          name: recipientFullName(r),
          days: daysSince(c.issuedAt, today),
          note: `Заключение от ${ruDate(c.issuedAt)}, группа не назначена`
        };
      });

    const enrollItems = pendingEnroll.map((p) => ({
      recipientId: p.recipientId,
      name: p.name,
      days: daysSince(p.issuedAt, today),
      tab: 'enrollment',
      signedCount: p.signedCount,
      note: p.signedCount
        ? `Диагностика пройдена, ${p.verdictLabel} — подписано ${p.signedCount} из ${p.totalDocs}`
        : `Диагностика пройдена, ${p.verdictLabel} — нужно подготовить документы`
    }));

    const card = ['карточка', 'карточки', 'карточек'];
    const claim = ['заявка', 'заявки', 'заявок'];

    res.json({
      date: today,
      groups: [
        {
          key: 'enrollment',
          title: 'Диагностика завершена',
          subtitle: 'Решение положительное — можно готовить документы на зачисление',
          tone: 'sage',
          tiles: [
            buildTile({
              key: 'enroll-ready', tone: 'sage', unit: card,
              title: 'Готовы к зачислению',
              empty: 'Никто не ждёт документов на зачисление',
              action: { page: 'recipients', title: 'Реабилитанты' },
              items: enrollItems,
              meta: (list) => {
                const started = list.filter((i) => i.signedCount > 0).length;
                const waiting = `${list.length} ${plural(list.length, 'ждёт', 'ждут', 'ждут')} документов`;
                return started ? `${waiting}, у ${started} часть уже подписана` : waiting;
              }
            })
          ]
        },
        {
          key: 'urgent',
          title: 'Требует немедленного действия',
          subtitle: null,
          tone: 'rose',
          tiles: [
            buildTile({
              key: 'docs-expired', tone: 'rose', unit: card,
              title: 'Просроченные документы',
              empty: 'Нет просроченных документов',
              action: { page: 'recipients', title: 'Реабилитанты' },
              items: expiredItems
            }),
            buildTile({
              key: 'pool-unclaimed', tone: 'rose', unit: claim,
              title: 'Заявки без специалиста',
              empty: 'Все заявки разобраны',
              action: { page: 'schedule', title: 'Расписание' },
              items: unclaimedItems,
              meta: (list) => {
                const dates = list.map((i) => i.date).filter(Boolean).sort();
                return dates.length ? `Ближайшая ${ruDate(dates[0])}` : null;
              }
            }),
            buildTile({
              key: 'diag-noshow', tone: 'rose', unit: card,
              title: 'Неявки на диагностику',
              empty: 'Все диагностики отмечены',
              action: { page: 'schedule', title: 'Расписание' },
              items: noShowItems
            })
          ]
        },
        {
          key: 'stuck',
          title: 'Застряло',
          subtitle: null,
          tone: 'amber',
          tiles: [
            buildTile({
              key: 'signed-missing', tone: 'amber', unit: card,
              title: 'Подписанные не загружены',
              empty: 'Все подписанные согласия на месте',
              action: { page: 'documents', title: 'Документы' },
              items: signedItems
            }),
            buildTile({
              key: 'diag-open-blocks', tone: 'amber', unit: card,
              title: 'Блоки диагностики не заполнены',
              empty: 'Все блоки заполнены',
              action: { page: 'diagnostics', title: 'Диагностика' },
              items: openBlockItems
            }),
            buildTile({
              key: 'concl-missing', tone: 'amber', unit: card,
              title: 'Заключение не выдано',
              empty: 'Все заключения выданы',
              action: { page: 'diagnostics', title: 'Диагностика' },
              items: noConclusionItems
            }),
            buildTile({
              key: 'not-enrolled', tone: 'amber', unit: card,
              title: 'Заключение есть, группы нет',
              empty: 'Все с заключением зачислены',
              action: { page: 'groups', title: 'Группы' },
              items: notEnrolledItems
            })
          ]
        }
      ]
    });
  } catch (err) {
    next(err);
  }
});

const blockTouched = (a) => {
  if (a.blockStatus === 'completed') return true;
  const crit = a.results?.criteria;
  if (!crit || typeof crit !== 'object') return false;
  return Object.values(crit).some((v) => v !== null && v !== undefined && v !== '');
};

const NO_SHOW_GRACE_MIN = 60;

const STATUS_META = {
  enrolled:    { label: 'Зачислен',                  pill: 'pill-ok',    verdict: 'ok',   done: true  },
  recommended: { label: 'Рекомендовано к зачислению', pill: 'pill-ok',    verdict: 'ok',   done: false },
  trial:       { label: 'Пробные занятия',            pill: 'pill-wait',  verdict: 'wait', done: true  },
  rejected:    { label: 'Не рекомендовано',           pill: 'pill-stop',  verdict: 'stop', done: true  },
  noshow:      { label: 'Неявка',                     pill: 'pill-stop',  verdict: 'stop', done: false },
  running:     { label: 'Идёт диагностика',           pill: 'pill-stage', verdict: 'now',  done: false },
  waiting:     { label: 'Ожидает',                    pill: 'pill-wait',  verdict: '',     done: false }
};

const KIND_LABELS = {
  primary: 'Первичная диагностика',
  repeat: 'Повторная диагностика',
  interim: 'Промежуточная диагностика',
  final: 'Итоговая диагностика'
};

const fmtRuFull = (v) => {
  const s = dateOnly(v);
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}.${m}.${y}`;
};

const fmtRuTime = (v) => {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime())
    ? ''
    : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const sessionStartTime = (session, assignments) => {
  const times = (assignments || []).map((a) => a.startTime).filter(Boolean).sort();
  return times[0] || session.reservedFrom || null;
};

function resolveSessionStatus({ session, assignments, conclusion, signedCodes, date, today, nowMin }) {
  if (conclusion) {
    if (conclusion.verdict === 'rejected') return 'rejected';
    if (conclusion.verdict === 'trial') return 'trial';
    if (conclusion.verdict === 'recommended') {
      return hasAllRequiredEnrollDocs(signedCodes) ? 'enrolled' : 'recommended';
    }
    return 'recommended';
  }

  if (assignments.some(blockTouched)) return 'running';

  const start = minutesOf(sessionStartTime(session, assignments));
  if (date > today) return 'waiting';
  if (date < today) return 'noshow';
  if (!Number.isFinite(start)) return nowMin >= 12 * 60 ? 'noshow' : 'waiting';
  return nowMin > start + NO_SHOW_GRACE_MIN ? 'noshow' : 'waiting';
}

function sessionNote({ status, session, assignments, conclusion, signed, date, today, startTime }) {
  const done = assignments.filter((a) => a.blockStatus === 'completed').length;
  const kind = KIND_LABELS[session.kind] || 'Диагностика';

  if (status === 'enrolled') {
    return `Заключение ${fmtRuFull(conclusion.issuedAt)} · документы подписаны и загружены`;
  }
  if (status === 'recommended') {
    return signed
      ? `Заключение ${fmtRuFull(conclusion.issuedAt)} · подписано ${signed} из ${ENROLL_DOCS.length} документов`
      : `Заключение ${fmtRuFull(conclusion.issuedAt)} · документы не готовились`;
  }
  if (status === 'trial') {
    return `Заключение ${fmtRuFull(conclusion.issuedAt)} · зачисление не требуется`;
  }
  if (status === 'rejected') {
    const why = (conclusion.summary || '').trim().split(/\n/)[0];
    return why ? `Причина: ${why.slice(0, 120)}` : `Заключение ${fmtRuFull(conclusion.issuedAt)}`;
  }
  if (status === 'running') {
    return `${kind} · сдано ${done} из ${assignments.length} ${plural(assignments.length, 'направления', 'направлений', 'направлений')}`;
  }
  if (status === 'noshow') {
    const when = date === today
      ? `на ${hhmm(startTime) || 'сегодня'}`
      : `на ${fmtRuFull(date)}`;
    return `Назначено ${when} · визит не отмечен`;
  }
  return assignments.length
    ? `${kind} · ${assignments.length} ${plural(assignments.length, 'направление', 'направления', 'направлений')}`
    : `${kind} · специалисты не назначены`;
}

async function loadDayRows(date, today, nowMin) {
  const nameAttrs = ['id', 'firstName', 'middleName', 'lastName'];

  const sessions = await DiagnosticSession.findAll({
    where: { date, status: { [Op.ne]: 'cancelled' } },
    attributes: ['id', 'recipientId', 'kind', 'date', 'reservedFrom', 'reservedTo', 'status'],
    include: [
      { model: Recipient, as: 'recipient', attributes: nameAttrs, required: true },
      {
        model: DiagnosticAssignment, as: 'assignments', required: false,
        attributes: ['id', 'blockStatus', 'results', 'startTime']
      }
    ],
    order: [['reservedFrom', 'ASC'], ['id', 'ASC']]
  });
  if (!sessions.length) return [];

  const [conclusions, signedMap] = await Promise.all([
    DiagnosticConclusion.findAll({
      where: { sessionId: { [Op.in]: sessions.map((s) => s.id) } },
      attributes: ['id', 'sessionId', 'verdict', 'summary', 'issuedAt']
    }),
    signedEnrollCodesFor(sessions.map((s) => s.recipientId))
  ]);
  const conclusionOf = new Map(conclusions.map((c) => [c.sessionId, c]));

  return sessions.map((s) => {
    const assignments = s.assignments || [];
    const conclusion = conclusionOf.get(s.id) || null;
    const signedCodes = signedMap.get(s.recipientId) || new Set();
    const startTime = sessionStartTime(s, assignments);
    const startMin = minutesOf(startTime);
    const status = resolveSessionStatus({
      session: s, assignments, conclusion, signedCodes, date, today, nowMin
    });
    const meta = STATUS_META[status];
    const past = date < today
      || (date === today && Number.isFinite(startMin) && nowMin > startMin);

    return {
      sessionId: s.id,
      recipientId: s.recipientId,
      name: recipientFullName(s.recipient),
      initials: initialsOf(s.recipient),
      time: hhmm(startTime),
      status,
      statusLabel: meta.label,
      pill: meta.pill,
      verdict: meta.verdict,
      done: meta.done,
      signedCount: signedCodes.size,
      totalDocs: ENROLL_DOCS.length,
      isPast: past && status !== 'running' && status !== 'waiting',
      note: sessionNote({
        status, session: s, assignments, conclusion,
        signed: signedCodes.size, date, today, startTime
      })
    };
  });
}

router.get('/day-board', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res, next) => {
  try {
    const now = new Date();
    const today = localDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const raw = String(req.query.date || '').slice(0, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;

    const rows = await loadDayRows(date, today, nowMin);
    const d = new Date(`${date}T00:00:00`);

    res.json({
      date,
      today,
      isToday: date === today,
      label: `${RU_WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${RU_MONTHS[d.getMonth()]}`,
      title: date === today
        ? 'Записаны на сегодня'
        : `Записаны на ${RU_WEEKDAYS_ACC[d.getDay()]}, ${d.getDate()} ${RU_MONTHS[d.getMonth()]}`,
      rows,
      doneCount: rows.filter((r) => r.done).length,
      todoCount: rows.filter((r) => !r.done).length
    });
  } catch (err) {
    next(err);
  }
});

const tile = ({ key, title, tone, unit, qual, action, items }) => ({
  key,
  title,
  tone: items.length ? tone : 'zero',
  count: items.length,
  unit: plural(items.length, unit[0], unit[1], unit[2]),
  qual: items.length ? (qual ? qual(items) : null) : null,
  action: action || null,
  items: items.slice(0, 8)
});

const EXPIRY_HORIZON_DAYS = 90;

router.get('/employee-tiles', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res, next) => {
  try {
    const now = new Date();
    const today = localDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const horizon = localDate(new Date(now.getTime() + EXPIRY_HORIZON_DAYS * MS_DAY));
    const nameAttrs = ['id', 'firstName', 'middleName', 'lastName'];

    const daysLeft = (v) => {
      const s = dateOnly(v);
      if (!s) return null;
      const diff = Math.round((Date.parse(`${s}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / MS_DAY);
      return Number.isFinite(diff) ? diff : null;
    };

    const [expiringDocs, expiringScans, activeRecipients, allDocTypes, currentScans, drafts, staleSessions] =
      await Promise.all([
        RecipientDoc.findAll({
          where: {
            mseIndefinite: false,
            mseValidDate: { [Op.gte]: today, [Op.lte]: horizon }
          },
          attributes: ['id', 'recipientId', 'mseValidDate'],
          include: [{
            model: Recipient, as: 'recipient', attributes: nameAttrs,
            required: true, where: { status: { [Op.ne]: 'archived' } }
          }]
        }),
        RecipientScanDoc.findAll({
          where: {
            isCurrent: true, perpetual: false,
            validUntil: { [Op.gte]: today, [Op.lte]: horizon }
          },
          attributes: ['id', 'recipId', 'docType', 'validUntil']
        }),
        Recipient.findAll({ where: { status: 'active' }, attributes: nameAttrs }),
        DocType.findAll({ attributes: ['id', 'code', 'name', 'isRequired'] }),
        RecipientScanDoc.findAll({ where: { isCurrent: true }, attributes: ['recipId', 'docType'] }),
        RecipientDraft.findAll({
          attributes: ['id', 'lastName', 'firstName', 'middleName', 'repName', 'payload', 'createdBy', 'createdByName', 'updatedAt'],
          order: [['updatedAt', 'DESC']],
          limit: 30
        }),
        DiagnosticSession.findAll({
          where: { date: { [Op.lte]: today }, status: { [Op.ne]: 'cancelled' } },
          attributes: ['id', 'recipientId', 'kind', 'date', 'reservedFrom', 'status'],
          include: [
            { model: Recipient, as: 'recipient', attributes: nameAttrs, required: true },
            {
              model: DiagnosticAssignment, as: 'assignments', required: false,
              attributes: ['id', 'blockStatus', 'results', 'startTime']
            }
          ],
          order: [['date', 'DESC']]
        })
      ]);

    const scanTypeName = new Map((await DocType.findAll({ attributes: ['id', 'name'] })).map((t) => [t.id, t.name]));
    const recipientById = new Map(activeRecipients.map((r) => [r.id, r]));

    const expiringItems = [
      ...expiringDocs.map((d) => ({
        recipientId: d.recipientId,
        name: recipientFullName(d.recipient),
        note: `Справка МСЭ до ${fmtRuFull(d.mseValidDate)}`,
        left: daysLeft(d.mseValidDate)
      })),
      ...expiringScans
        .filter((s) => recipientById.has(s.recipId))
        .map((s) => ({
          recipientId: s.recipId,
          name: recipientFullName(recipientById.get(s.recipId)),
          note: `${scanTypeName.get(s.docType) || 'Документ'} до ${fmtRuFull(s.validUntil)}`,
          left: daysLeft(s.validUntil)
        }))
    ]
      .sort((a, b) => (a.left ?? 1e9) - (b.left ?? 1e9))
      .map((i) => ({ ...i, days: i.left == null ? null : daysWord(i.left), tab: 'documents' }));

    const haveScans = new Map();
    currentScans.forEach((s) => {
      if (!haveScans.has(s.recipId)) haveScans.set(s.recipId, new Set());
      haveScans.get(s.recipId).add(s.docType);
    });
    const scanItems = [];
    for (const r of activeRecipients) {
      const have = haveScans.get(r.id) || new Set();
      const missing = allDocTypes.filter((t) => !have.has(t.id));
      if (!missing.length) continue;
      const ordered = [...missing].sort((a, b) => Number(b.isRequired) - Number(a.isRequired));
      const shown = ordered.slice(0, 3).map((t) => t.name).join(', ');
      const restCount = ordered.length - 3;
      scanItems.push({
        recipientId: r.id,
        name: recipientFullName(r),
        note: `Не загружено: ${shown}${restCount > 0 ? ` и ещё ${restCount}` : ''}`,
        missing: missing.length,
        tab: 'documents'
      });
    }
    scanItems.sort((a, b) => b.missing - a.missing);

    const draftItems = drafts.map((d) => {
      const s = summarizeDraft(d.payload) || { done: 0, total: 0, steps: [] };
      const step = s.steps?.[0]?.step || 3;
      const who = d.createdBy === req.user.id ? 'я' : (d.createdByName || 'коллега');
      return {
        draftId: d.id,
        recipientId: null,
        name: [d.lastName, d.firstName].filter(Boolean).join(' ') || (d.repName ? `Ребёнок ${d.repName}` : 'Без имени'),
        note: `Шаг ${step} из 3 · ${s.done} из ${s.total} полей · ${who}, ${fmtRuTime(d.updatedAt)}`,
        mine: d.createdBy === req.user.id
      };
    });

    const noShowItems = [];
    for (const s of staleSessions) {
      if ((s.assignments || []).some(blockTouched)) continue;
      const day = dateOnly(s.date);
      const startTime = sessionStartTime(s, s.assignments);
      if (day === today) {
        const start = minutesOf(startTime);
        if (!Number.isFinite(start) || nowMin <= start + NO_SHOW_GRACE_MIN) continue;
      }
      const ago = daysSince(day, today);
      noShowItems.push({
        recipientId: s.recipientId,
        sessionId: s.id,
        name: recipientFullName(s.recipient),
        note: `Не пришли ${day === today ? `сегодня, ${hhmm(startTime)}` : fmtRuFull(day)}`,
        days: ago === 0 ? 'сегодня' : daysWord(ago)
      });
    }
    noShowItems.sort((a, b) => String(b.note).localeCompare(String(a.note)));

    const conclusionsOfStale = await DiagnosticConclusion.findAll({
      where: { sessionId: { [Op.in]: staleSessions.map((s) => s.id).concat(0) } },
      attributes: ['sessionId']
    });
    const concluded = new Set(conclusionsOfStale.map((c) => c.sessionId));
    const noShows = noShowItems.filter((i) => !concluded.has(i.sessionId));

    const card = ['карточка', 'карточки', 'карточек'];

    res.json({
      date: today,
      tiles: [
        tile({
          key: 'expiring', tone: 'amber', unit: card,
          title: 'Документы подходят к сроку',
          action: { page: 'documents', title: 'Документы' },
          items: expiringItems,
          qual: (list) => {
            const soonest = list.find((i) => i.left != null);
            return soonest ? `Ближайший истекает через ${daysWord(soonest.left)}` : null;
          }
        }),
        tile({
          key: 'scans', tone: 'rose', unit: card,
          title: 'Пакет сканов неполный',
          items: scanItems
        }),
        tile({
          key: 'drafts', tone: 'amber', unit: ['черновик', 'черновика', 'черновиков'],
          title: 'Незаполненные черновики',
          action: { page: 'recipients', title: 'Реабилитанты', params: { tab: 'drafts' } },
          items: draftItems,
          qual: (list) => {
            const mine = list.filter((i) => i.mine).length;
            return mine ? `${mine} из них ${plural(mine, 'мой', 'мои', 'моих')}` : 'Заведены коллегами';
          }
        }),
        tile({
          key: 'noshow', tone: 'rose', unit: ['человек', 'человека', 'человек'],
          title: 'Не пришли на диагностику',
          action: { page: 'schedule', title: 'Расписание' },
          items: noShows
        })
      ]
    });
  } catch (err) {
    next(err);
  }
});

const RU_WEEKDAYS = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
];

const RU_WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

const RU_WEEKDAYS_ACC = [
  'воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'
];

const greetingWord = (h) => {
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
};

const ageOf = (v) => {
  const s = dateOnly(v);
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  const mm = now.getMonth() + 1;
  if (mm < m || (mm === m && now.getDate() < d)) age -= 1;
  return age >= 0 && age < 150 ? age : null;
};

const initialsOf = (r) => {
  const a = (r?.lastName || '').trim()[0] || '';
  const b = (r?.firstName || '').trim()[0] || '';
  return (a + b).toUpperCase() || '—';
};

const TONES = ['sage', 'blue', 'plum', 'amber', 'teal', 'rose'];
const toneOf = (id) => TONES[Math.abs(Number(id) || 0) % TONES.length];

const withAge = (r) => {
  const age = ageOf(r?.birthDate);
  const name = r ? recipientFullName(r) : 'Без имени';
  return age == null ? name : `${name}, ${age}`;
};

const repPhone = (rep) => (rep?.telephone ? String(rep.telephone).trim() : null);

const repName = (rep) => {
  if (!rep) return null;
  const last = (rep.lastName || '').trim();
  const first = (rep.firstName || '').trim();
  if (!last && !first) return null;
  return first ? `${first[0]}. ${last}`.trim() : last;
};

const RU_MONTHS_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const RU_MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const monthKeyOf = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime())
    ? null
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const pctOf = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

const ruDecimal = (n) => String(n).replace('.', ',');

const DIRECTION_TONES = ['sage', 'amber', 'plum', 'blue', 'teal', 'rose'];

const ROLE_LABELS = {
  admin: 'Администраторы',
  teacher: 'Преподаватели',
  employee: 'Сотрудники',
  recipient: 'Реабилитанты'
};

router.get('/exec-overview', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const now = new Date();
    const today = localDate(now);

    const [
      recipients, sessions, conclusions, assignments,
      directions, users, events, expiredDocs, draftCount, pendingEnroll
    ] = await Promise.all([
      Recipient.findAll({ attributes: ['id', 'status'] }),
      DiagnosticSession.findAll({
        attributes: ['id', 'recipientId', 'date', 'status', 'createdAt'],
        include: [{ model: Recipient, as: 'recipient', attributes: ['id'], required: true }]
      }),
      DiagnosticConclusion.findAll({
        attributes: ['id', 'sessionId', 'recipientId', 'verdict', 'issuedAt'],
        include: [{ model: Recipient, as: 'recipient', attributes: ['id'], required: true }]
      }),
      DiagnosticAssignment.findAll({
        attributes: [
          'id', 'recipientId', 'directionId', 'diagnosticSessionId',
          'specialistUserId', 'blockStatus', 'date'
        ]
      }),
      Direction.findAll({ attributes: ['id', 'name', 'profileKey'] }),
      User.findAll({ attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }),
      ScheduleEvent.findAll({ attributes: ['id', 'status', 'date', 'type', 'recipientId'] }),
      RecipientDoc.findAll({
        where: { mseValidDate: { [Op.lt]: today } },
        attributes: ['id', 'recipientId']
      }),
      RecipientDraft.count(),
      findPendingEnrollment()
    ]);

    const byStatus = (s) => recipients.filter((r) => r.status === s).length;
    const activeCount = byStatus('active');

    const liveIds = new Set(recipients.map((r) => r.id));
    const liveEvents = events.filter(
      (e) => e.type !== 'diagnostic' || (e.recipientId != null && liveIds.has(e.recipientId))
    );

    const firstSession = new Map();
    for (const s of sessions) {
      if (!s.createdAt) continue;
      const ts = new Date(s.createdAt).getTime();
      const prev = firstSession.get(s.recipientId);
      if (prev == null || ts < prev) firstSession.set(s.recipientId, ts);
    }

    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKeyOf(d), label: RU_MONTHS_SHORT[d.getMonth()], intake: 0, done: 0 });
    }
    const monthIndex = new Map(months.map((m, i) => [m.key, i]));

    for (const ts of firstSession.values()) {
      const i = monthIndex.get(monthKeyOf(new Date(ts)));
      if (i !== undefined) months[i].intake += 1;
    }
    for (const c of conclusions) {
      const i = monthIndex.get(monthKeyOf(c.issuedAt));
      if (i !== undefined) months[i].done += 1;
    }
    const chartMax = Math.max(1, ...months.map((m) => Math.max(m.intake, m.done)));
    const thisMonth = months[months.length - 1];

    const sessionById = new Map(sessions.map((s) => [s.id, s]));
    const leadDays = [];
    for (const c of conclusions) {
      const s = sessionById.get(c.sessionId);
      if (!s?.createdAt || !c.issuedAt) continue;
      const diff = (new Date(c.issuedAt) - new Date(s.createdAt)) / MS_DAY;
      if (Number.isFinite(diff) && diff >= 0) leadDays.push(diff);
    }
    const avgLead = leadDays.length
      ? Math.round((leadDays.reduce((a, b) => a + b, 0) / leadDays.length) * 10) / 10
      : null;

    const doneBlocks = assignments.filter((a) => a.blockStatus === 'completed').length;
    const fillPct = pctOf(doneBlocks, assignments.length);

    const quarterAgo = new Date(now.getTime() - 90 * MS_DAY);
    const conclusionsQuarter = conclusions.filter(
      (c) => c.issuedAt && new Date(c.issuedAt) >= quarterAgo
    ).length;

    const kpi = [
      {
        key: 'active', tone: 'sage', icon: 'users',
        label: 'Активных реабилитантов',
        value: String(activeCount), unit: '',
        trendDir: thisMonth.intake > 0 ? 'up' : 'flat',
        trendText: thisMonth.intake > 0
          ? `+${thisMonth.intake} ${plural(thisMonth.intake, 'заявка', 'заявки', 'заявок')} в этом месяце`
          : 'новых заявок в этом месяце нет'
      },
      {
        key: 'conclusions', tone: 'blue', icon: 'check',
        label: 'Заключений выдано',
        value: String(conclusionsQuarter), unit: '',
        trendDir: conclusionsQuarter > 0 ? 'up' : 'flat',
        trendText: 'за последние 90 дней'
      },
      {
        key: 'lead', tone: 'plum', icon: 'chart',
        label: 'Срок до заключения',
        value: avgLead == null ? '—' : ruDecimal(avgLead),
        unit: avgLead == null ? '' : ` ${plural(Math.round(avgLead), 'день', 'дня', 'дней')}`,
        trendDir: avgLead == null ? 'flat' : (avgLead <= 14 ? 'up' : 'down'),
        trendText: avgLead == null ? 'заключений ещё не было' : 'в среднем от заявки до выдачи'
      },
      {
        key: 'fill', tone: 'amber', icon: 'clock',
        label: 'Заполненность диагностик',
        value: String(fillPct), unit: '%',
        trendDir: fillPct >= 95 ? 'up' : 'down',
        trendText: `${doneBlocks} из ${assignments.length} блоков · цель 95%`
      }
    ];

    const byDirection = new Map();
    for (const a of assignments) {
      const cur = byDirection.get(a.directionId) || { total: 0, done: 0 };
      cur.total += 1;
      if (a.blockStatus === 'completed') cur.done += 1;
      byDirection.set(a.directionId, cur);
    }
    const directionRows = directions
      .map((d, i) => {
        const s = byDirection.get(d.id) || { total: 0, done: 0 };
        return {
          id: d.id,
          name: d.name,
          done: s.done,
          total: s.total,
          pct: pctOf(s.done, s.total),
          tone: DIRECTION_TONES[i % DIRECTION_TONES.length]
        };
      })
      .sort((a, b) => b.total - a.total);

    const bySession = new Map();
    for (const a of assignments) {
      if (!a.diagnosticSessionId) continue;
      const cur = bySession.get(a.diagnosticSessionId) || { total: 0, done: 0 };
      cur.total += 1;
      if (a.blockStatus === 'completed') cur.done += 1;
      bySession.set(a.diagnosticSessionId, cur);
    }
    const concludedSessions = new Set(conclusions.map((c) => c.sessionId).filter(Boolean));
    const openSessions = sessions.filter((s) => s.status !== 'completed' && s.status !== 'cancelled');

    const waitingConclusion = openSessions.filter((s) => {
      if (concludedSessions.has(s.id)) return false;
      const b = bySession.get(s.id);
      return !!b && b.total > 0 && b.done === b.total;
    }).length;

    const unclaimed = openSessions.filter((s) => !bySession.has(s.id)).length;

    const liveSessions = sessions.filter((s) => s.status !== 'cancelled');
    const sessionsClosed = liveSessions.filter((s) => s.status === 'completed').length;
    const eventsDone = liveEvents.filter((e) => e.status === 'completed').length;
    const scores = [
      {
        key: 'sessions',
        label: 'Заявок доведено до заключения',
        value: String(pctOf(sessionsClosed, liveSessions.length)), unit: '%',
        note: `${sessionsClosed} из ${liveSessions.length} · без отменённых`
      },
      {
        key: 'events',
        label: 'Занятий проведено',
        value: String(pctOf(eventsDone, liveEvents.length)), unit: '%',
        note: `${eventsDone} из ${liveEvents.length}`
      }
    ];

    const loadMap = new Map();
    for (const a of assignments) {
      loadMap.set(a.specialistUserId, (loadMap.get(a.specialistUserId) || 0) + 1);
    }
    const maxLoad = Math.max(1, ...loadMap.values());
    const load = users
      .filter((u) => u.role === 'teacher')
      .map((u) => {
        const count = loadMap.get(u.id) || 0;
        const pct = Math.round((count / maxLoad) * 100);
        return { id: u.id, name: userFullName(u), count, pct, tone: pct >= 90 ? 'amber' : 'sage' };
      })
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count);

    const issues = [];

    for (const p of pendingEnroll.slice(0, 5)) {
      issues.push({
        key: `enroll-${p.recipientId}`, tone: 'sage',
        title: `${p.name} — диагностика завершена`,
        sub: p.signedCount
          ? `Решение: ${p.verdictLabel} · подписано ${p.signedCount} из ${p.totalDocs} документов`
          : `Решение: ${p.verdictLabel} · пора подготовить документы на зачисление`,
        action: 'recipient-details',
        actionParams: { recipientId: p.recipientId, tab: 'enrollment' }
      });
    }
    if (pendingEnroll.length > 5) {
      const rest = pendingEnroll.length - 5;
      issues.push({
        key: 'enroll-rest', tone: 'sage',
        title: `Ещё ${rest} ${plural(rest, 'реабилитант ждёт', 'реабилитанта ждут', 'реабилитантов ждут')} документов`,
        sub: 'Диагностика пройдена, решение положительное',
        action: 'recipients'
      });
    }

    const overdueBlocks = assignments.filter(
      (a) => a.blockStatus !== 'completed' && dateOnly(a.date) && dateOnly(a.date) < today
    ).length;

    if (overdueBlocks) {
      issues.push({
        key: 'blocks-overdue', tone: 'rose',
        title: `Просрочено блоков диагностики: ${overdueBlocks}`,
        sub: 'Дата приёма прошла, результат не внесён — тянет вниз заполненность',
        action: 'diagnostics'
      });
    }
    if (waitingConclusion) {
      issues.push({
        key: 'waiting-conclusion', tone: 'amber',
        title: `Ждут заключения: ${waitingConclusion}`,
        sub: 'Все блоки закрыты, заключение ещё не выдано',
        action: 'diagnostics'
      });
    }
    if (unclaimed) {
      issues.push({
        key: 'unclaimed', tone: 'amber',
        title: `Не взято в работу: ${unclaimed}`,
        sub: 'Заявка создана, но ни один специалист её не забрал',
        action: 'diagnostics'
      });
    }
    const overloaded = load.filter((t) => t.pct >= 90 && t.count > 1);
    for (const t of overloaded.slice(0, 1)) {
      issues.push({
        key: `overload-${t.id}`, tone: 'amber',
        title: `Высокая загрузка: ${t.name}`,
        sub: `${t.count} ${plural(t.count, 'блок', 'блока', 'блоков')} диагностики — стоит перераспределить`,
        action: 'schedule'
      });
    }
    if (expiredDocs.length) {
      issues.push({
        key: 'mse-expired', tone: 'rose',
        title: `Просрочено справок МСЭ: ${expiredDocs.length}`,
        sub: 'Нужно запросить у представителей новые документы',
        action: 'documents'
      });
    }
    if (draftCount) {
      issues.push({
        key: 'drafts', tone: 'blue',
        title: `Незавершённых регистраций: ${draftCount}`,
        sub: 'Черновик заведён, карточка не создана',
        action: 'recipients'
      });
    }

    const contingent = [
      { key: 'active', label: 'Активные', value: activeCount },
      { key: 'draft', label: 'Черновики', value: byStatus('draft') },
      { key: 'archived', label: 'В архиве', value: byStatus('archived') }
    ];
    const staff = Object.keys(ROLE_LABELS).map((role) => ({
      key: role,
      label: ROLE_LABELS[role],
      value: users.filter((u) => u.role === role).length
    })).filter((r) => r.value > 0);

    res.json({
      periodLabel: `${RU_MONTHS_NOM[now.getMonth()]} ${now.getFullYear()} · сводка центра`,
      updatedAt: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      date: today,
      kpi,
      chart: { months, max: chartMax },
      directions: directionRows,
      scores,
      load,
      issues,
      contingent,
      staff,
      totals: {
        recipients: recipients.length,
        sessions: sessions.length,
        conclusions: conclusions.length,
        assignments: assignments.length,
        events: events.length,
        users: users.length
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

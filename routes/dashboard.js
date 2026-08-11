import express from 'express';
import { Op } from '@sequelize/core';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  User, Recipient, ReGroup, Direction, Nozology,
  ReResult, RecipientDoc, ScheduleEvent, DiagnosticAssignment,
  DiagnosticSession, DiagnosticConclusion, RecipientScanDoc, DocType
} from '../models/index.js';
import { DIAGNOSTIC_BLOCKS } from '../src/utils/diagnosticBlocks.js';
import { hasGrant } from '../services/dataAccess.js';

const router = express.Router();

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

router.get('/teacher', authMiddleware, roleMiddleware('admin', 'employee', 'teacher'), async (req, res, next) => {
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

    const today_ = todayEvents.map((e) => {
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
      const open = hasGrant(req.user, d.recipientId, 'medical');
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

    const [expiredDocs, sessions, noShows, activeRecipients, signedTypes, currentScans, conclusions] =
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
            { model: Recipient, as: 'recipient', attributes: nameAttrs },
            {
              model: DiagnosticAssignment, as: 'assignments', required: false,
              attributes: ['id', 'blockStatus', 'date', 'completedAt']
            }
          ]
        }),
        ScheduleEvent.findAll({
          where: { type: 'diagnostic', status: 'scheduled', date: { [Op.lt]: today } },
          attributes: ['id', 'recipientId', 'date', 'title'],
          include: [{ model: Recipient, as: 'recipient', attributes: nameAttrs }]
        }),
        Recipient.findAll({
          where: { status: 'active' },
          attributes: [...nameAttrs, 'groupId']
        }),
        DocType.findAll({ where: { category: 'signed' }, attributes: ['id', 'code', 'name'] }),
        RecipientScanDoc.findAll({
          where: { isCurrent: true },
          attributes: ['recipId', 'docType', 'uploadedAt']
        }),
        DiagnosticConclusion.findAll({ attributes: ['id', 'sessionId', 'recipientId', 'verdict', 'issuedAt'] })
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
      name: e.recipient ? named(e.recipient) : (e.title || 'Без имени'),
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

    const card = ['карточка', 'карточки', 'карточек'];
    const claim = ['заявка', 'заявки', 'заявок'];

    res.json({
      date: today,
      groups: [
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
          subtitle: 'Число суток с последнего перехода по маршруту',
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

export default router;

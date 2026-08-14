<template>
  <div class="db-page">
    <div class="exec">

      <div class="greet">
        <div class="greet-row">
          <div class="greet-main">
            <div class="eyebrow">{{ ov.periodLabel || 'Сводка центра' }}</div>
            <h1>Обзор центра</h1>
          </div>
          <div class="greet-actions">
            <button class="btn btn-secondary" type="button" :disabled="loading" @click="loadOverview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {{ loading ? 'Обновляем…' : 'Обновить' }}
            </button>
            <button class="btn btn-primary" type="button" :disabled="loading" @click="exportAll">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Выгрузить сводку
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-4 kpi-grid">
        <div v-for="k in kpi" :key="k.key" class="kpi">
          <div class="k-label">
            <span class="k-icon" :class="'ic-' + k.tone" aria-hidden="true" v-html="ICONS[k.icon]"></span>
            {{ k.label }}
          </div>
          <div class="k-value">{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></div>
          <div class="k-trend" :class="k.trendDir">
            <svg v-if="k.trendDir === 'up'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
            <svg v-else-if="k.trendDir === 'down'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
            </svg>
            {{ k.trendText }}
          </div>
        </div>
      </div>

      <section class="draft">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title-sans">Незаконченная карточка</div>
            </div>
            <div class="head-end">
              <button
                v-if="draftsTotal"
                class="btn btn-secondary btn-sm"
                type="button"
                @click="openDraftsTab"
              >Все черновики · {{ draftsTotal }}</button>
            </div>
          </div>

          <div v-if="draftLoading" class="card-body">
            <div class="empty">Загрузка…</div>
          </div>

          <div v-else-if="!draft" class="card-body">
            <div class="dr-empty-t">Незаконченных карточек нет</div>
            <div class="dr-empty-s">
              Если закрыть мастер регистрации на половине, начатая карточка появится здесь — и её можно будет дозаполнить, не вводя всё заново.
              <template v-if="draftsTotal">
                У коллег такие карточки есть: {{ draftsTotal }} {{ plural(draftsTotal, 'штука', 'штуки', 'штук') }} в разделе
                <button class="p-link" type="button" @click="openDraftsTab">«Черновики»</button>.
              </template>
            </div>
          </div>

          <div v-else class="card-body dr-body">
            <div class="dr-top">
              <span class="avatar av-amber" aria-hidden="true">{{ initials(draftTitle) }}</span>
              <div class="dr-id">
                <div class="dr-name">{{ draftTitle }}</div>
                <div class="dr-sub">{{ draftSub }}</div>
              </div>
              <button class="btn btn-primary" type="button" @click="openDraftWizard">Дозаполнить карточку</button>
            </div>

            <div class="dr-progress">
              <div class="dr-bar"><span :style="{ width: draft.pct + '%' }"></span></div>
              <div class="dr-figures">
                Заполнено <b>{{ draft.done }}</b> из {{ draft.total }} {{ plural(draft.total, 'обязательного поля', 'обязательных полей', 'обязательных полей') }} на первых двух шагах
              </div>
            </div>

            <div v-if="draft.steps.length" class="dr-steps">
              <div v-for="s in draft.steps" :key="s.step" class="dr-step">
                <div class="dr-step-head">
                  <span>Шаг {{ s.step }} · {{ s.label }}</span>
                  <span class="dr-step-num">{{ s.done }} из {{ s.total }}</span>
                </div>
                <div class="dr-chips">
                  <span v-for="(m, i) in s.missing" :key="s.step + '-' + i" class="dr-chip">{{ m.l }}</span>
                </div>
              </div>
            </div>
            <div v-else class="dr-step-done">
              Личные данные заполнены полностью. Остался третий шаг мастера — сканы, пакет документов и подтверждение комплектности.
            </div>

          </div>
        </div>
      </section>

      <div class="grid grid-main-aside">
        <div class="stack">

          <div class="card">
            <div class="card-head">
              <div>
                <div class="card-title">Поступления и заключения</div>
                <div class="card-sub">По месяцам · заявка на диагностику и выданное заключение</div>
              </div>
              <div class="head-end">
                <div class="chart-legend">
                  <span class="leg"><span class="sw sw-dark" aria-hidden="true"></span>Поступило</span>
                  <span class="leg"><span class="sw sw-light" aria-hidden="true"></span>Заключений</span>
                </div>
                <button
                  class="icon-mini" type="button" title="Выгрузить в CSV"
                  aria-label="Выгрузить помесячную динамику в CSV"
                  :disabled="!chartMonths.length" @click="exportChart"
                >
                  <span v-html="ICONS.download" aria-hidden="true"></span>
                </button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="loading" class="empty">Загрузка…</div>
              <div v-else-if="!chartTotal" class="empty">За последние полгода движения не было.</div>
              <div v-else class="chart" role="img" :aria-label="chartAria">
                <div v-for="m in chartMonths" :key="m.key" class="bar-col">
                  <div class="bar-stack">
                    <div
                      v-if="m.done" class="bar light" :style="{ height: m.doneH }"
                      :title="m.label + ': заключений ' + m.done"
                    ></div>
                    <div
                      v-if="m.intake" class="bar" :style="{ height: m.intakeH }"
                      :title="m.label + ': поступило ' + m.intake"
                    ></div>
                  </div>
                  <span class="bar-x">{{ m.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <div>
                <div class="card-title">Измеримость диагностики</div>
                <div class="card-sub">Доля закрытых блоков по каждому направлению обследования</div>
              </div>
              <div class="head-end">
                <button
                  class="icon-mini" type="button" title="Выгрузить в CSV"
                  aria-label="Выгрузить диагностику по направлениям в CSV"
                  :disabled="!directions.length" @click="exportDirections"
                >
                  <span v-html="ICONS.download" aria-hidden="true"></span>
                </button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="loading" class="empty">Загрузка…</div>
              <div v-else-if="!directions.length" class="empty">Направления не заведены.</div>
              <div v-else class="prog-list">
                <div v-for="d in directions" :key="d.id" class="prog-row">
                  <span class="prog-label">{{ d.name }}</span>
                  <span class="prog-value">
                    <span v-if="d.total" class="now">{{ d.pct }}%</span>
                    <template v-if="d.total"> · {{ d.done }} из {{ d.total }}</template>
                    <template v-else>назначений не было</template>
                  </span>
                  <div class="prog-bar">
                    <span class="prog-fill" :class="d.tone" :style="{ width: d.pct + '%' }"></span>
                  </div>
                </div>
              </div>
              <div class="scores">
                <div v-for="s in scores" :key="s.key" class="score">
                  <div class="s-label">{{ s.label }}</div>
                  <div class="s-val">{{ s.value }}<small>{{ s.unit }}</small></div>
                  <div class="s-note">{{ s.note }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="stack">

          <div class="card">
            <div class="card-head">
              <div class="card-title-sans">Загрузка специалистов</div>
              <div class="head-end">
                <button
                  class="icon-mini" type="button" title="Выгрузить в CSV"
                  aria-label="Выгрузить загрузку специалистов в CSV"
                  :disabled="!load.length" @click="exportLoad"
                >
                  <span v-html="ICONS.download" aria-hidden="true"></span>
                </button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="loading" class="empty">Загрузка…</div>
              <div v-else-if="!load.length" class="empty">Диагностику пока никто не вёл.</div>
              <div v-else class="prog-list">
                <div v-for="t in load" :key="t.id" class="prog-row">
                  <span class="prog-label">{{ t.name }}</span>
                  <span class="prog-value">
                    {{ t.count }} {{ blockWord(t.count) }}
                  </span>
                  <div class="prog-bar">
                    <span class="prog-fill" :class="t.tone" :style="{ width: t.pct + '%' }"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <div class="card-title-sans">Требует решения</div>
              <div class="head-end">
                <span class="tag" :class="issues.length ? 'tag-rose' : 'tag-sage'">
                  {{ issues.length || 'Чисто' }}
                </span>
                <button
                  class="icon-mini" type="button" title="Выгрузить в CSV"
                  aria-label="Выгрузить список проблем в CSV"
                  :disabled="!issues.length" @click="exportIssues"
                >
                  <span v-html="ICONS.download" aria-hidden="true"></span>
                </button>
              </div>
            </div>
            <div class="card-body">
              <div v-if="loading" class="empty">Загрузка…</div>
              <div v-else-if="!issues.length" class="empty">Всё в порядке — открытых проблем нет.</div>
              <div v-else class="tasks">
                <div v-for="i in issues" :key="i.key" class="task">
                  <span class="task-ic" :class="'ic-' + i.tone" aria-hidden="true" v-html="ICONS.alert"></span>
                  <div class="task-main">
                    <div class="t-title">{{ i.title }}</div>
                    <div class="t-sub">{{ i.sub }}</div>
                  </div>
                  <div v-if="i.action" class="task-end">
                    <button class="btn btn-secondary btn-sm" type="button" @click="goTo(i.action, i.actionParams || {})">
                      Открыть
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <div class="card-title-sans">Отчёты</div>
            </div>
            <div class="card-body">
              <div class="mlist">
                <button
                  v-for="r in reports" :key="r.key"
                  class="mrow" type="button" :disabled="loading" @click="r.run()"
                >
                  <span class="task-ic" :class="'ic-' + r.tone" aria-hidden="true" v-html="ICONS[r.icon]"></span>
                  <span class="m-main">
                    <span class="m-name">{{ r.label }}</span>
                    <span class="m-sub">{{ r.sub }}</span>
                  </span>
                  <span class="m-go" aria-hidden="true" v-html="ICONS.download"></span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <AddRecipientWizard
      v-if="draftWizardOpen"
      @saved="onDraftSaved"
      @close="closeDraftWizard"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePageStore } from '../stores/page';
import { notify } from '../utils/toast';
import api from '../api';
import AddRecipientWizard from '../components/AddRecipientWizard.vue';
import { readDraft, readDraftSavedAt, countDraftFiles, summarizeDraft } from '../utils/recipientDraft';

const PAGE_TITLES = {
  dashboard: 'Дашборд',
  recipients: 'Реабилитанты',
  groups: 'Группы',
  diagnostics: 'Диагностика',
  progress: 'Прогресс',
  documents: 'Документы',
  schedule: 'Расписание',
  'admin-users': 'Пользователи',
  'recipient-details': 'Карточка реабилитанта'
};

const pageStore = usePageStore();
const goTo = (page, params = {}) => {
  pageStore.setPage(page, PAGE_TITLES[page] || page, params);
};

const ICONS = {
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M18 17V9M12 17v-6M6 17v-3"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};

const ov = ref({});
const loading = ref(true);

const kpi = computed(() => ov.value.kpi || []);
const directions = computed(() => ov.value.directions || []);
const scores = computed(() => ov.value.scores || []);
const load = computed(() => ov.value.load || []);
const issues = computed(() => ov.value.issues || []);

const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};
const blockWord = (n) => plural(n, 'блок', 'блока', 'блоков');

const chartMonths = computed(() => {
  const months = ov.value.chart?.months || [];
  const stackMax = Math.max(1, ...months.map((m) => m.intake + m.done));
  return months.map((m) => ({
    ...m,
    intakeH: `${Math.round((m.intake / stackMax) * 100)}%`,
    doneH: `${Math.round((m.done / stackMax) * 100)}%`
  }));
});

const chartTotal = computed(() =>
  chartMonths.value.reduce((sum, m) => sum + m.intake + m.done, 0)
);

const chartAria = computed(() => {
  const parts = chartMonths.value.map(
    (m) => `${m.label}: поступило ${m.intake}, заключений ${m.done}`
  );
  return `Помесячная динамика. ${parts.join('. ')}.`;
});

const CSV_SEP = ';';
const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /["\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const downloadCsv = (name, rows) => {
  const body = rows.map((r) => r.map(csvCell).join(CSV_SEP)).join('\r\n');
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}_${ov.value.date || 'today'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  notify(`Файл «${a.download}» выгружен`, { key: 'exec-export' });
};

const kpiRows = () => [
  ['Показатель', 'Значение', 'Комментарий'],
  ...kpi.value.map((k) => [k.label, `${k.value}${k.unit || ''}`.trim(), k.trendText])
];
const scoreRows = () => [
  ['Показатель', 'Значение', 'Основание'],
  ...scores.value.map((s) => [s.label, `${s.value}${s.unit || ''}`, s.note])
];
const chartRows = () => [
  ['Месяц', 'Поступило', 'Заключений выдано'],
  ...chartMonths.value.map((m) => [m.label, m.intake, m.done])
];
const directionRows = () => [
  ['Направление', 'Закрыто блоков', 'Всего назначено', 'Доля, %'],
  ...directions.value.map((d) => [d.name, d.done, d.total, d.pct])
];
const loadRows = () => [
  ['Специалист', 'Блоков диагностики', 'Доля от максимума, %'],
  ...load.value.map((t) => [t.name, t.count, t.pct])
];
const issueRows = () => [
  ['Проблема', 'Пояснение'],
  ...issues.value.map((i) => [i.title, i.sub])
];
const contingentRows = () => [
  ['Статус', 'Реабилитантов'],
  ...(ov.value.contingent || []).map((c) => [c.label, c.value])
];
const staffRows = () => [
  ['Роль', 'Учётных записей'],
  ...(ov.value.staff || []).map((s) => [s.label, s.value])
];

const exportChart = () => downloadCsv('поступления_и_заключения', chartRows());
const exportDirections = () => downloadCsv('диагностика_по_направлениям', directionRows());
const exportLoad = () => downloadCsv('загрузка_специалистов', loadRows());
const exportIssues = () => downloadCsv('требует_решения', issueRows());

const exportAll = () => {
  const rows = [
    ['Обзор центра'],
    ['Период', ov.value.periodLabel || ''],
    ['Выгружено', new Date().toLocaleString('ru-RU')],
    [],
    ['КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ'], ...kpiRows(),
    [],
    ['СВОДНЫЕ ДОЛИ'], ...scoreRows(),
    [],
    ['ПОСТУПЛЕНИЯ И ЗАКЛЮЧЕНИЯ ПО МЕСЯЦАМ'], ...chartRows(),
    [],
    ['ДИАГНОСТИКА ПО НАПРАВЛЕНИЯМ'], ...directionRows(),
    [],
    ['ЗАГРУЗКА СПЕЦИАЛИСТОВ'], ...loadRows(),
    [],
    ['ТРЕБУЕТ РЕШЕНИЯ'], ...issueRows(),
    [],
    ['РЕАБИЛИТАНТЫ ПО СТАТУСАМ'], ...contingentRows(),
    [],
    ['ПОЛЬЗОВАТЕЛИ ПО РОЛЯМ'], ...staffRows()
  ];
  downloadCsv('обзор_центра', rows);
};

const reports = [
  {
    key: 'all', label: 'Сводка центра', sub: 'CSV · все разделы обзора',
    tone: 'teal', icon: 'doc', run: () => exportAll()
  },
  {
    key: 'dyn', label: 'Динамика по месяцам', sub: 'CSV · поступления и заключения',
    tone: 'blue', icon: 'chart', run: () => exportChart()
  },
  {
    key: 'dir', label: 'Диагностика по направлениям', sub: 'CSV · закрытые блоки',
    tone: 'plum', icon: 'check', run: () => exportDirections()
  },
  {
    key: 'load', label: 'Загрузка специалистов', sub: 'CSV · блоки на человека',
    tone: 'sage', icon: 'users', run: () => exportLoad()
  }
];

const initials = (name) => {
  const parts = (name || '').split(' ').filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '—';
};

const draft = ref(null);
const draftSavedAt = ref(null);
const draftLoading = ref(true);
const draftWizardOpen = ref(false);
const draftsTotal = ref(0);

const loadDraftCard = async () => {
  draftLoading.value = true;
  try {
    const raw = readDraft();
    const files = raw ? await countDraftFiles() : 0;
    draft.value = summarizeDraft(raw, files);
    draftSavedAt.value = draft.value ? readDraftSavedAt() : null;
  } catch (e) {
    console.error('draft:', e);
    draft.value = null;
    draftSavedAt.value = null;
  } finally {
    draftLoading.value = false;
  }
};

const loadDraftsTotal = async () => {
  try {
    const { data } = await api.get('/recipients/drafts');
    draftsTotal.value = data.total ?? (data.data || []).length;
  } catch (e) {
    console.error('drafts:', e);
  }
};

const openDraftsTab = () => {
  pageStore.setPage('recipients', 'Реабилитанты', { tab: 'drafts' });
};

const openDraftWizard = () => { draftWizardOpen.value = true; };
const closeDraftWizard = () => {
  draftWizardOpen.value = false;
  loadDraftCard();
  loadDraftsTotal();
};
const onDraftSaved = () => {
  loadOverview();
  loadDraftsTotal();
};

const draftTitle = computed(() => {
  if (!draft.value) return '';
  if (draft.value.name) return draft.value.name;
  if (draft.value.repName) return `Ребёнок ${draft.value.repName}`;
  return 'Имя пока не введено';
});

const savedAgo = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'сохранено только что';
  if (mins < 60) return `сохранено ${mins} ${plural(mins, 'минуту', 'минуты', 'минут')} назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `сохранено ${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`;
  const days = Math.floor(hours / 24);
  return `сохранено ${days} ${plural(days, 'день', 'дня', 'дней')} назад`;
};

const draftSub = computed(() => {
  if (!draft.value) return '';
  const parts = [];
  if (draft.value.name && draft.value.repName) parts.push(`представитель — ${draft.value.repName}`);
  if (draft.value.fileCount) {
    parts.push(`${draft.value.fileCount} ${plural(draft.value.fileCount, 'скан приложен', 'скана приложено', 'сканов приложено')}`);
  }
  const ago = savedAgo(draftSavedAt.value);
  if (ago) parts.push(ago);
  return parts.join(' · ') || 'Регистрация начата, но не завершена';
});

const loadOverview = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/dashboard/exec-overview');
    ov.value = data || {};
  } catch (err) {
    console.error(err);
    notify('Не удалось загрузить обзор центра', { key: 'exec-load' });
  } finally {
    loading.value = false;
  }
};

let refreshTimer = null;

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadOverview();
  loadDraftCard();
  loadDraftsTotal();
  refreshTimer = setInterval(loadOverview, 120000);
});

onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
</style>

<style scoped>
.db-page {
  --db-canvas:       #F7F4ED;
  --db-paper:        #FFFFFF;
  --db-paper-soft:   #F3EEE4;
  --db-paper-sunken: #EDE8DD;
  --db-ink:          #1A211A;
  --db-ink-strong:   #0F140F;
  --db-ink-muted:    #4F564A;
  --db-ink-subtle:   #6E7368;
  --db-line:         #E4DECF;
  --db-line-soft:    #EFEADC;
  --db-line-strong:  #D6CFBE;

  --db-sage-900: #1E2F1E;
  --db-sage-800: #2A4129;
  --db-sage-700: #2F4A2F;
  --db-sage-500: #5F7E45;
  --db-sage-400: #8AAB6A;
  --db-sage-100: #E0EBD1;
  --db-sage-50:  #EEF4E2;

  --db-amber-700: #6F4514;
  --db-amber-500: #B07223;
  --db-amber-100: #F5E3C4;
  --db-amber-50:  #FBF1DD;

  --db-rose-700: #6E2B22;
  --db-rose-500: #B0533F;
  --db-rose-100: #F3D8CE;
  --db-rose-50:  #FAE9E0;

  --db-blue-700: #1F3D52;
  --db-blue-500: #4A7390;
  --db-blue-100: #D4E1EB;
  --db-blue-50:  #E8EFF5;

  --db-plum-700: #4C2B52;
  --db-plum-500: #845B8B;
  --db-plum-100: #E5D6E8;
  --db-plum-50:  #F2E8F5;

  --db-teal-700: #1E4A4A;
  --db-teal-500: #437A7A;
  --db-teal-100: #D0E5E5;
  --db-teal-50:  #E5F0F0;

  --db-font-serif: 'Lora', 'Times New Roman', Georgia, serif;
  --db-font-sans:  'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --db-radius-sm: 0.5rem;
  --db-radius-md: 0.75rem;
  --db-radius-lg: 1.125rem;
  --db-shadow-sm: 0 0.0625rem 0.125rem rgba(30,47,30,0.04), 0 0.0625rem 0 rgba(30,47,30,0.02);
  --db-shadow-md: 0 0.25rem 0.875rem rgba(30,47,30,0.05), 0 0.0625rem 0.125rem rgba(30,47,30,0.04);
  --db-focus-ring: 0 0 0 0.1875rem rgba(95,126,69,0.35);

  font-family: var(--db-font-sans);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--db-ink);
  animation: dbPageIn 0.4s cubic-bezier(0.2,0.7,0.2,1);
}
@keyframes dbPageIn {
  from { opacity: 0; transform: translateY(0.4rem); }
  to   { opacity: 1; transform: none; }
}

:where(.exec) button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
}
:where(.exec) svg { width: 1rem; height: 1rem; flex: none; }

.greet { margin-bottom: 1.75rem; }
.greet-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.greet-main { flex: 1 1 24rem; min-width: 0; }
.eyebrow {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-weight: 700;
  color: var(--db-ink-muted);
  margin-bottom: 0.5rem;
}
.greet h1 {
  font-family: var(--db-font-serif);
  font-size: 2.5rem;
  line-height: 1.1;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: var(--db-ink-strong);
  margin: 0 0 0.5rem;
}
.greet-actions { display: flex; gap: 0.625rem; flex-wrap: wrap; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  padding: 0.625rem 1.125rem;
  border-radius: 62.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 0.0625rem solid transparent;
  transition: background 0.16s, border-color 0.16s, color 0.16s;
  white-space: nowrap;
}
.btn:focus-visible { outline: none; box-shadow: var(--db-focus-ring); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-primary { background: var(--db-sage-800); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--db-sage-900); }
.btn-secondary {
  background: var(--db-paper);
  border-color: var(--db-line);
  color: var(--db-ink-strong);
}
.btn-secondary:hover:not(:disabled) { background: var(--db-paper-soft); }
.btn-sm { padding: 0.375rem 0.8125rem; font-size: 0.8125rem; }

.grid { display: grid; gap: 1.25rem; }
.grid-4 { grid-template-columns: repeat(4, minmax(0,1fr)); }
.grid-main-aside { grid-template-columns: minmax(0,1fr) 22rem; align-items: start; }
.stack { display: grid; gap: 1.25rem; align-content: start; min-width: 0; }
.kpi-grid { margin-bottom: 1.5rem; }

.kpi {
  background: var(--db-paper);
  border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-lg);
  padding: 1.125rem 1.25rem;
  box-shadow: var(--db-shadow-sm);
  min-width: 0;
}
.k-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--db-ink-muted);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4375rem;
}
.k-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--db-radius-sm);
  display: grid;
  place-items: center;
  flex: none;
}
.k-icon :deep(svg) { width: 0.9375rem; height: 0.9375rem; }
.k-value {
  font-family: var(--db-font-serif);
  font-size: 2rem;
  font-weight: 500;
  color: var(--db-ink-strong);
  letter-spacing: -0.025em;
  line-height: 1;
  margin-top: 0.625rem;
  font-variant-numeric: tabular-nums;
}
.k-value small {
  font-size: 1rem;
  color: var(--db-ink-muted);
  font-family: var(--db-font-sans);
  font-weight: 500;
}
.k-trend {
  font-size: 0.8125rem;
  margin-top: 0.4375rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}
.k-trend.up { color: var(--db-sage-700); }
.k-trend.down { color: var(--db-rose-700); }
.k-trend.flat { color: var(--db-ink-muted); font-weight: 400; }
.k-trend svg { width: 0.75rem; height: 0.75rem; }

.ic-sage  { background: var(--db-sage-50);  color: var(--db-sage-700); }
.ic-blue  { background: var(--db-blue-50);  color: var(--db-blue-700); }
.ic-plum  { background: var(--db-plum-50);  color: var(--db-plum-700); }
.ic-amber { background: var(--db-amber-50); color: var(--db-amber-700); }
.ic-teal  { background: var(--db-teal-50);  color: var(--db-teal-700); }
.ic-rose  { background: var(--db-rose-50);  color: var(--db-rose-700); }

.card {
  background: var(--db-paper);
  border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-lg);
  box-shadow: var(--db-shadow-sm);
  overflow: hidden;
  min-width: 0;
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.875rem;
  padding: 1.125rem 1.5rem 0.875rem;
  border-bottom: 0.0625rem solid var(--db-line-soft);
}
.head-end { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
.card-title {
  font-family: var(--db-font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--db-ink-strong);
  line-height: 1.2;
}
.card-title-sans { font-size: 1rem; font-weight: 600; color: var(--db-ink-strong); line-height: 1.2; }
.card-sub { font-size: 0.8125rem; color: var(--db-ink-muted); margin-top: 0.1875rem; }
.card-body { padding: 1.25rem 1.5rem 1.5rem; }
.empty { font-size: 0.875rem; color: var(--db-ink-subtle); padding: 0.5rem 0; }

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1875rem 0.5rem;
  border-radius: 62.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.tag-sage { background: var(--db-sage-50);  color: var(--db-sage-700); }
.tag-rose { background: var(--db-rose-50);  color: var(--db-rose-700); }

.draft { margin-bottom: 1.5rem; }

.dr-empty-t { font-size: 0.9375rem; font-weight: 600; color: var(--db-ink-strong); }
.dr-empty-s {
  font-size: 0.8125rem;
  color: var(--db-ink-subtle);
  line-height: 1.45;
  margin-top: 0.1875rem;
  max-width: 44rem;
}

.dr-body { display: grid; gap: 1rem; }
.dr-top { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.dr-id { flex: 1; min-width: 11rem; }
.dr-name { font-size: 1rem; font-weight: 600; color: var(--db-ink-strong); }
.dr-sub { font-size: 0.8125rem; color: var(--db-ink-subtle); margin-top: 0.0625rem; }

.avatar {
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 2.25rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.8125rem;
  font-weight: 600;
}
.av-amber { background: var(--db-amber-100); color: var(--db-amber-700); }

.dr-progress { display: grid; gap: 0.375rem; }
.dr-bar {
  height: 0.4375rem;
  border-radius: 62.5rem;
  background: var(--db-paper-sunken);
  overflow: hidden;
}
.dr-bar span {
  display: block;
  height: 100%;
  border-radius: 62.5rem;
  background: var(--db-amber-500);
  transition: width 0.25s ease;
}
.dr-figures { font-size: 0.8125rem; color: var(--db-ink-muted); }
.dr-figures b { font-weight: 700; color: var(--db-ink-strong); }

.dr-steps { display: grid; gap: 0.75rem; }
.dr-step-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--db-ink-strong);
  margin-bottom: 0.375rem;
}
.dr-step-num { font-weight: 500; color: var(--db-ink-subtle); white-space: nowrap; }
.dr-chips { display: flex; flex-wrap: wrap; gap: 0.3125rem; }
.dr-chip {
  font-size: 0.75rem;
  padding: 0.1875rem 0.5rem;
  border-radius: var(--db-radius-sm);
  background: var(--db-amber-50);
  color: var(--db-amber-700);
  border: 0.0625rem solid var(--db-amber-100);
}
.dr-step-done {
  font-size: 0.8125rem;
  color: var(--db-sage-700);
  background: var(--db-sage-50);
  border: 0.0625rem solid var(--db-sage-100);
  border-radius: var(--db-radius-md);
  padding: 0.625rem 0.75rem;
  line-height: 1.45;
}

.p-link {
  display: inline;
  padding: 0;
  font: inherit;
  font-weight: inherit;
  color: inherit;
  background: none;
  border: none;
  border-bottom: 0.0625rem dashed var(--db-line-strong);
  border-radius: 0.125rem;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.p-link:hover { color: var(--db-sage-700); border-bottom-color: var(--db-sage-500); }
.p-link:focus-visible { outline: none; box-shadow: var(--db-focus-ring); }

.chart { display: flex; align-items: flex-end; gap: 0.625rem; height: 11rem; padding-top: 0.5rem; }
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4375rem;
  min-width: 0;
  height: 100%;
}
.bar-stack {
  width: 100%;
  max-width: 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 1;
  min-height: 0;
}
.bar { width: 100%; border-radius: 0.25rem 0.25rem 0 0; background: var(--db-sage-500); min-height: 0.25rem; }
.bar.light { background: var(--db-sage-100); border-radius: 0.25rem 0.25rem 0 0; }
.bar.light + .bar { border-radius: 0; }
.bar-x { font-size: 0.75rem; color: var(--db-ink-muted); font-weight: 500; }
.chart-legend { display: flex; gap: 1rem; flex-wrap: wrap; }
.leg { display: inline-flex; align-items: center; gap: 0.4375rem; font-size: 0.8125rem; color: var(--db-ink-muted); }
.sw { width: 0.75rem; height: 0.75rem; border-radius: 0.1875rem; }
.sw-dark { background: var(--db-sage-500); }
.sw-light { background: var(--db-sage-100); }

.prog-list { display: flex; flex-direction: column; gap: 1.125rem; }
.prog-row { display: grid; grid-template-columns: 1fr auto; gap: 0.25rem 0.75rem; align-items: center; }
.prog-label { font-size: 0.875rem; color: var(--db-ink-strong); font-weight: 500; min-width: 0; }
.prog-value {
  font-size: 0.8125rem;
  color: var(--db-ink-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.prog-value .now { color: var(--db-sage-700); font-weight: 700; }
.prog-bar {
  grid-column: 1 / -1;
  position: relative;
  height: 0.5rem;
  background: var(--db-line-soft);
  border-radius: 62.5rem;
  overflow: hidden;
}
.prog-fill { position: absolute; inset: 0 auto 0 0; background: var(--db-sage-500); border-radius: 62.5rem; }
.prog-fill.amber { background: var(--db-amber-500); }
.prog-fill.blue  { background: var(--db-blue-500); }
.prog-fill.plum  { background: var(--db-plum-500); }
.prog-fill.teal  { background: var(--db-teal-500); }
.prog-fill.rose  { background: var(--db-rose-500); }

.scores { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.625rem; margin-top: 1.25rem; }
.score { background: var(--db-paper-soft); border-radius: var(--db-radius-md); padding: 0.75rem 0.875rem; }
.s-label { font-size: 0.75rem; color: var(--db-ink-muted); font-weight: 600; }
.s-val {
  font-family: var(--db-font-serif);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--db-ink-strong);
  line-height: 1;
  margin-top: 0.25rem;
}
.s-val small {
  font-size: 0.8125rem;
  color: var(--db-ink-muted);
  font-family: var(--db-font-sans);
  font-weight: 500;
}
.s-note { font-size: 0.75rem; color: var(--db-ink-subtle); margin-top: 0.25rem; }

.tasks { display: flex; flex-direction: column; }
.task {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 0;
  border-bottom: 0.0625rem solid var(--db-line-soft);
}
.task:last-child { border-bottom: 0; padding-bottom: 0; }
.task:first-child { padding-top: 0; }
.task-ic {
  width: 2rem;
  height: 2rem;
  border-radius: var(--db-radius-sm);
  display: grid;
  place-items: center;
  flex: none;
}
.task-ic :deep(svg) { width: 1rem; height: 1rem; }
.task-main { flex: 1; min-width: 0; }
.t-title { font-size: 0.875rem; font-weight: 600; color: var(--db-ink-strong); }
.t-sub { font-size: 0.8125rem; color: var(--db-ink-muted); margin-top: 0.125rem; }
.task-end { flex: none; }

.mlist { display: flex; flex-direction: column; }
.mrow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 0;
  border-bottom: 0.0625rem solid var(--db-line-soft);
  text-align: left;
  width: 100%;
  border-radius: var(--db-radius-sm);
  transition: background 0.16s;
}
.mrow:last-child { border-bottom: 0; padding-bottom: 0; }
.mrow:first-child { padding-top: 0; }
.mrow:hover:not(:disabled) { background: var(--db-paper-soft); }
.mrow:focus-visible { outline: none; box-shadow: var(--db-focus-ring); }
.mrow:disabled { opacity: 0.55; cursor: not-allowed; }
.m-main { flex: 1; min-width: 0; display: block; }
.m-name { font-size: 0.875rem; font-weight: 600; color: var(--db-ink-strong); display: block; }
.m-sub { font-size: 0.8125rem; color: var(--db-ink-muted); display: block; }
.m-go { color: var(--db-ink-subtle); display: grid; place-items: center; flex: none; }
.m-go :deep(svg) { width: 1rem; height: 1rem; }

.icon-mini {
  width: 1.875rem;
  height: 1.875rem;
  border-radius: var(--db-radius-sm);
  border: 0.0625rem solid var(--db-line);
  background: var(--db-paper);
  color: var(--db-ink-muted);
  display: grid;
  place-items: center;
  flex: none;
  transition: background 0.16s, color 0.16s;
}
.icon-mini:hover:not(:disabled) { background: var(--db-paper-soft); color: var(--db-ink-strong); }
.icon-mini:focus-visible { outline: none; box-shadow: var(--db-focus-ring); }
.icon-mini:disabled { opacity: 0.45; cursor: not-allowed; }
.icon-mini :deep(svg) { width: 0.9375rem; height: 0.9375rem; }

@media (max-width: 75rem) {
  .grid-main-aside { grid-template-columns: 1fr; }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 36rem) {
  .greet h1 { font-size: 2rem; }
  .grid-4 { grid-template-columns: 1fr; }
  .scores { grid-template-columns: 1fr; }
  .card-body { padding: 1rem 1rem 1.25rem; }
  .card-head { padding: 1rem 1rem 0.75rem; }
  .task { flex-wrap: wrap; }
  .task-end { width: 100%; padding-left: 2.75rem; }
  .dr-top .btn { width: 100%; }
}
</style>

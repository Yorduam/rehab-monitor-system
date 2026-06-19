<template>
  <div class="db-page">

    <div class="page-head">
      <div class="page-head-text">
        <div class="page-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          Рабочий стол
        </div>
        <h1 class="page-title">Главная</h1>
        <p class="page-sub">Сводная информация по контингенту, документам и плановым диагностикам.</p>
      </div>
      <button class="db-btn db-btn-primary" type="button" @click="showAdd = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить реабилитанта
      </button>
    </div>

    <div class="dash-top">

      <div class="db-card">
        <div class="card-head">
          <div class="ch-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="ch-body">
            <div class="ch-title">Реабилитанты</div>
            <div class="ch-sub">Текущий контингент учреждения</div>
          </div>
          <div class="ch-actions">
            <button class="db-btn db-btn-sm db-btn-secondary" type="button" @click="goTo('recipients')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
              </svg>
              Аналитика
            </button>
          </div>
        </div>

        <div class="info-body">
          <div class="info-main">

            <div class="info-ring" aria-hidden="true">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

                <circle cx="50" cy="50" r="38" fill="none" stroke="#EDE8DD" stroke-width="11"/>

                <circle
                  v-for="(seg, i) in donutSegments" :key="i"
                  cx="50" cy="50" r="38" fill="none"
                  :stroke="seg.color"
                  stroke-width="11"
                  :stroke-dasharray="seg.dasharray"
                  :stroke-dashoffset="seg.dashoffset"
                  stroke-linecap="round"
                />
              </svg>
              <div class="ring-label">
                <span class="ring-num">{{ stats.recipients }}</span>
                <span class="ring-cap">всего</span>
              </div>
            </div>

            <div class="info-kpi">
              <div class="info-kpi-title">По статусам</div>
              <div class="info-kpi-sub">Актуально на сегодня</div>
              <div v-for="row in kpiRows" :key="row.label" class="kpi-row">
                <span class="kpi-dot" :style="{ background: row.color }" aria-hidden="true"></span>
                <span class="kpi-label">{{ row.label }}</span>
                <div class="kpi-track" aria-hidden="true">
                  <div class="kpi-fill" :style="{ width: row.pct + '%', background: row.color }"></div>
                </div>
                <span class="kpi-val">{{ row.value }}</span>
              </div>
            </div>
          </div>

          <div class="info-stats">
            <div class="stat-tile green">
              <div class="st-num">{{ stats.diagDone }}</div>
              <div class="st-label">Прошли диагностику</div>
            </div>
            <div class="stat-tile amber">
              <div class="st-num">{{ stats.diagPlanned }}</div>
              <div class="st-label">Назначены на диагностику</div>
            </div>
            <div class="stat-tile blue">
              <div class="st-num">{{ stats.lessonsThisWeek }}</div>
              <div class="st-label">Занятий на этой неделе</div>
            </div>
          </div>
        </div>
      </div>

      <div class="db-card">
        <div class="card-head">
          <div class="ch-icon rose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="ch-body">
            <div class="ch-title">Документы</div>
            <div class="ch-sub">Реабилитанты с неполным пакетом</div>
          </div>
          <div class="ch-actions">
            <span v-if="missingCount > 0" class="db-badge db-badge-cancel" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ missingCount }} требуют внимания
            </span>
            <span v-else class="db-badge db-badge-active" role="status">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Всё в порядке
            </span>
          </div>
        </div>

        <ul class="docs-list" role="list" aria-label="Реабилитанты с отсутствующими документами">
          <li v-if="missingDocs.length === 0" class="docs-row">
            <div class="dr-info">
              <div class="dr-name" style="color:var(--ink-subtle)">Нет данных для отображения</div>
            </div>
          </li>
          <li v-for="r in missingDocs" :key="r.id" class="docs-row">
            <div class="dr-avatar" :class="getAvatarColor(r.fullName)" aria-hidden="true">
              {{ getInitials(r.fullName) }}
            </div>
            <div class="dr-info">
              <div class="dr-name">{{ r.fullName }}</div>
              <div class="dr-meta">{{ r.groupName !== '—' ? r.groupName : 'Без группы' }}</div>
            </div>
            <span class="dr-badge" :class="r.docCount === 0 ? 'dr-miss' : 'dr-ok'">
              <template v-if="r.docCount === 0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Нет документов
              </template>
              <template v-else>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {{ r.docCount }} {{ docWord(r.docCount) }}
              </template>
            </span>
            <button class="dr-action" type="button" :aria-label="`Документы — ${r.fullName}`"
                    @click="goTo('documents')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </li>
        </ul>

        <div class="docs-foot">
          <span class="docs-foot-note">Данные актуальны на сегодня</span>
          <button class="db-btn db-btn-sm db-btn-ghost" type="button" @click="goTo('documents')">
            Все документы
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="db-card diag-wrap">
      <div class="card-head">
        <div class="ch-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div class="ch-body">
          <div class="ch-title">Назначены на диагностику</div>
          <div class="ch-sub">Предстоящие и текущие диагностические сессии</div>
        </div>
        <div class="ch-actions">
          <button class="db-btn db-btn-sm db-btn-secondary" type="button" @click="goTo('diagnostics')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            Перейти
          </button>
          <button class="db-btn db-btn-sm db-btn-primary" type="button" @click="goTo('diagnostics')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Назначить
          </button>
        </div>
      </div>

      <div class="diag-toolbar">
        <div class="diag-search">
          <svg class="s-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="diagSearch"
            type="search"
            placeholder="Поиск по ФИО или диагностике…"
            aria-label="Поиск по реабилитантам"
          />
        </div>
        <button class="flt-chip" :class="{ active: diagStatus === 'all' }"
                type="button" @click="setDiagStatus('all')">
          Все статусы
          <span v-if="diagTotal > 0" class="fc-n" aria-hidden="true">{{ diagTotal }}</span>
        </button>
        <button class="flt-chip" :class="{ active: diagStatus === 'planned' }"
                type="button" @click="setDiagStatus('planned')">
          Запланированные
        </button>
        <button class="flt-chip" :class="{ active: diagStatus === 'done' }"
                type="button" @click="setDiagStatus('done')">
          Завершённые
        </button>
        <div class="tb-spacer"></div>
        <span class="tb-count">{{ diagTotal }} записей</span>
      </div>

      <div class="diag-scroll">
        <table class="dtbl" aria-label="Список диагностических сессий">
          <thead>
            <tr>
              <th scope="col">Реабилитант</th>
              <th scope="col">Дата посещения</th>
              <th scope="col">Диагностика</th>
              <th scope="col">Специалист</th>
              <th scope="col">Статус</th>
              <th scope="col"><span class="sr-only">Действия</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="diagLoading">
              <td colspan="6" class="empty-cell">Загрузка…</td>
            </tr>
            <tr v-else-if="diagnostics.length === 0">
              <td colspan="6" class="empty-cell">Записи не найдены</td>
            </tr>
            <template v-else>
              <tr v-for="d in diagnostics" :key="d.id">
                <td>
                  <div class="cell-person">
                    <div class="cp-av" :class="getAvatarColor(d.recipientName)" aria-hidden="true">
                      {{ getInitials(d.recipientName) }}
                    </div>
                    <div class="cp-info">
                      <span class="cp-name">{{ d.recipientName }}</span>
                      <span class="cp-meta">{{ d.groupName }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="cell-date">
                    <span class="cd-main">{{ formatDate(d.date) }}</span>
                    <span class="cd-time">{{ getDayName(d.date) }}<template v-if="d.time">, {{ d.time }}</template></span>
                  </div>
                </td>
                <td>
                  <div class="cell-diag">
                    <div class="cd-ico" :style="getDiagIconStyle(d.name)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </div>
                    <div>
                      <span class="cd-name">{{ d.name || 'Диагностика' }}</span>
                      <span class="cd-spec">{{ d.type || '—' }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="spec-name">{{ d.specialist || '—' }}</span>
                </td>
                <td>
                  <span class="db-badge" :class="getStatusBadge(d.status).cls">
                    <svg v-if="d.status === 'done'" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.5"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ getStatusBadge(d.status).label }}
                  </span>
                </td>
                <td>
                  <button class="row-action" type="button" :aria-label="`Меню — ${d.recipientName}`">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="19" cy="12" r="1"/>
                      <circle cx="5" cy="12" r="1"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="diag-foot">
        <span class="diag-foot-info">
          Показано <strong>{{ diagnostics.length }}</strong> из <strong>{{ diagTotal }}</strong> записей
        </span>
        <nav class="pagination" aria-label="Страницы таблицы">
          <button class="pg-btn" type="button" aria-label="Предыдущая страница"
                  :disabled="diagPage <= 1" @click="changeDiagPage(diagPage - 1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            v-for="p in pageButtons" :key="p"
            class="pg-btn" :class="{ active: p === diagPage }"
            type="button"
            :aria-label="`Страница ${p}`"
            :aria-current="p === diagPage ? 'page' : undefined"
            @click="changeDiagPage(p)"
          >{{ p }}</button>
          <button class="pg-btn" type="button" aria-label="Следующая страница"
                  :disabled="diagPage >= diagTotalPages" @click="changeDiagPage(diagPage + 1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </nav>
      </div>
    </div>

    <AddRecipientWizard
      v-if="showAdd"
      @close="showAdd = false; loadStats()"
    />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePageStore } from '../stores/page';
import api from '../api';
import AddRecipientWizard from '../components/AddRecipientWizard.vue';

const pageStore = usePageStore();
const goTo = (page) => {
  const titles = { recipients: 'Реабилитанты', documents: 'Документы', diagnostics: 'Диагностика' };
  pageStore.setPage(page, titles[page] || page);
};

const showAdd = ref(false);

const stats = ref({
  recipients: 0, activeCount: 0, draftCount: 0, archivedCount: 0,
  newRecipients: 0, groups: 0, diagDone: 0, diagPlanned: 0, lessonsThisWeek: 0
});

const missingDocs  = ref([]);
const missingCount = ref(0);

const diagnostics    = ref([]);
const diagTotal      = ref(0);
const diagPage       = ref(1);
const diagTotalPages = ref(1);
const diagLoading    = ref(false);
const diagSearch     = ref('');
const diagStatus     = ref('all');

const C   = 2 * Math.PI * 38;
const GAP = 2;

const donutSegments = computed(() => {
  const total    = stats.value.recipients || 0;
  const active   = stats.value.activeCount || 0;
  const draft     = stats.value.draftCount || 0;
  const archived = stats.value.archivedCount || 0;
  if (total === 0) return [];

  const raw = [
    { value: active,   color: '#5F7E45' },
    { value: draft,    color: '#B07223' },
    { value: archived, color: '#D6CFBE' }
  ].filter(s => s.value > 0);

  if (raw.length === 0) return [];

  const effectiveC      = C - raw.length * GAP;
  const INITIAL_OFFSET  = -C / 4;
  let accumulatedArc    = 0;

  return raw.map((seg, i) => {
    const arcLen    = (seg.value / total) * effectiveC;
    const dashoffset = INITIAL_OFFSET - accumulatedArc - i * GAP;
    accumulatedArc  += arcLen;
    return {
      color:     seg.color,
      dasharray: `${arcLen.toFixed(2)} ${C.toFixed(2)}`,
      dashoffset: dashoffset.toFixed(2)
    };
  });
});

const kpiRows = computed(() => {
  const total = Math.max(stats.value.recipients || 1, 1);
  return [
    { color: '#5F7E45', label: 'Активные',  value: stats.value.activeCount   || 0, pct: Math.round(((stats.value.activeCount   || 0) / total) * 100) },
    { color: '#B07223', label: 'Черновики', value: stats.value.draftCount    || 0, pct: Math.round(((stats.value.draftCount    || 0) / total) * 100) },
    { color: '#D6CFBE', label: 'В архиве',  value: stats.value.archivedCount || 0, pct: Math.round(((stats.value.archivedCount || 0) / total) * 100) }
  ];
});

const pageButtons = computed(() => {
  const total   = diagTotalPages.value;
  const current = diagPage.value;
  const start   = Math.max(1, current - 2);
  const end     = Math.min(total, start + 4);
  const btns    = [];
  for (let i = start; i <= end; i++) btns.push(i);
  return btns;
});

const AVATAR_COLORS = ['av-blue', 'av-plum', 'av-teal', 'av-amber', 'av-rose', 'av-sage'];
const getAvatarColor = (name) => {
  if (!name) return 'av-blue';
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
};
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};
const docWord = (n) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'документ';
  if ([2, 3, 4].includes(m10) && ![12, 13, 14].includes(m100)) return 'документа';
  return 'документов';
};
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
};
const getDayName = (dateStr) => {
  if (!dateStr) return '';
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return days[new Date(dateStr).getDay()] || '';
};
const getStatusBadge = (status) => {
  if (status === 'done')    return { cls: 'db-badge-done',    label: 'Завершено' };
  return                           { cls: 'db-badge-planned', label: 'Запланировано' };
};
const DIAG_ICON_STYLES = {
  психол:    { bg: 'var(--db-blue-50)',  color: 'var(--db-blue-700)' },
  логопед:   { bg: 'var(--db-teal-50)',  color: 'var(--db-teal-700)' },
  вокал:     { bg: 'var(--db-sage-50)',  color: 'var(--db-sage-700)' },
  театр:     { bg: 'var(--db-plum-50)',  color: 'var(--db-plum-700)' },
  'аф':      { bg: 'var(--db-sage-50)',  color: 'var(--db-sage-700)' },
  физ:       { bg: 'var(--db-sage-50)',  color: 'var(--db-sage-700)' },
  художеств: { bg: 'var(--db-amber-50)', color: 'var(--db-amber-700)' },
  'речев':   { bg: 'var(--db-teal-50)',  color: 'var(--db-teal-700)' }
};
const getDiagIconStyle = (name) => {
  const n = (name || '').toLowerCase();
  for (const [key, style] of Object.entries(DIAG_ICON_STYLES)) {
    if (n.includes(key)) return { background: style.bg, color: style.color };
  }
  return { background: 'var(--db-blue-50)', color: 'var(--db-blue-700)' };
};

const loadStats = async () => {
  try {
    const { data } = await api.get('/dashboard/stats');
    stats.value = { ...stats.value, ...data.stats };
  } catch (e) { console.error('stats:', e); }
};

const loadMissingDocs = async () => {
  try {
    const { data } = await api.get('/dashboard/missing-docs');
    missingDocs.value  = data.list || [];
    missingCount.value = data.missingCount || 0;
  } catch (e) { console.error('missing-docs:', e); }
};

const loadDiagnostics = async (page = 1) => {
  diagLoading.value = true;
  try {
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...(diagSearch.value ? { search: diagSearch.value } : {}),
      ...(diagStatus.value !== 'all' ? { status: diagStatus.value } : {})
    });
    const { data } = await api.get(`/dashboard/diagnostics?${params}`);
    diagnostics.value    = data.data    || [];
    diagTotal.value      = data.total   || 0;
    diagPage.value       = data.page    || 1;
    diagTotalPages.value = data.totalPages || 1;
  } catch (e) { console.error('diagnostics:', e); }
  finally { diagLoading.value = false; }
};

const setDiagStatus = (status) => {
  diagStatus.value = status;
  loadDiagnostics(1);
};
const changeDiagPage = (p) => {
  if (p < 1 || p > diagTotalPages.value) return;
  loadDiagnostics(p);
};

let searchTimer = null;
watch(diagSearch, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadDiagnostics(1), 300);
});

onMounted(() => {

  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadStats();
  loadMissingDocs();
  loadDiagnostics(1);
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
  clearTimeout(searchTimer);
});
</script>

<!-- Font import (global, loaded once) -->
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
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--db-ink);
  animation: dbPageIn 0.4s cubic-bezier(0.2,0.7,0.2,1);
}
@keyframes dbPageIn {
  from { opacity: 0; transform: translateY(0.4rem); }
  to   { opacity: 1; transform: none; }
}
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}
.page-head-text { flex: 1 1 20rem; min-width: 0; }
.page-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--db-sage-700);
  font-weight: 600;
  margin-bottom: 0.4375rem;
}
.page-eyebrow svg { width: 0.875rem; height: 0.875rem; }
.page-title {
  font-family: var(--db-font-serif);
  font-size: 1.875rem;
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--db-ink-strong);
  margin-bottom: 0.375rem;
}
.page-sub { font-size: 0.9375rem; color: var(--db-ink-muted); max-width: 44rem; line-height: 1.55; }
.db-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  min-height: 2.75rem;
  border-radius: 0.625rem;
  border: 0.0625rem solid transparent;
  font-size: 0.9375rem;
  font-weight: 500;
  font-family: var(--db-font-sans);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
  cursor: pointer;
}
.db-btn svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
.db-btn-primary  { background: var(--db-sage-900); color: #F4F8EC; border-color: var(--db-sage-900); }
.db-btn-primary:hover { background: var(--db-sage-800); border-color: var(--db-sage-800); }
.db-btn-secondary { background: var(--db-paper); color: var(--db-ink); border-color: var(--db-line-strong); }
.db-btn-secondary:hover { background: var(--db-paper-soft); border-color: var(--db-ink-muted); }
.db-btn-ghost { color: var(--db-ink-muted); }
.db-btn-ghost:hover { background: var(--db-paper-soft); color: var(--db-ink); }
.db-btn-sm { padding: 0.4375rem 0.75rem; min-height: 2.125rem; font-size: 0.875rem; }
.db-card {
  background: var(--db-paper);
  border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-lg);
  box-shadow: var(--db-shadow-sm);
  overflow: hidden;
}
.card-head {
  padding: 1.125rem 1.5rem 0.875rem;
  border-bottom: 0.0625rem solid var(--db-line-soft);
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}
.ch-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  display: grid;
  place-items: center;
  flex: 0 0 2.25rem;
  background: var(--db-sage-50);
  color: var(--db-sage-700);
}
.ch-icon.amber { background: var(--db-amber-50); color: var(--db-amber-700); }
.ch-icon.blue  { background: var(--db-blue-50);  color: var(--db-blue-700); }
.ch-icon.rose  { background: var(--db-rose-50);  color: var(--db-rose-700); }
.ch-icon svg   { width: 1.125rem; height: 1.125rem; }
.ch-body       { flex: 1; min-width: 0; }
.ch-title {
  font-family: var(--db-font-serif);
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--db-ink-strong);
  line-height: 1.2;
  margin-bottom: 0.2rem;
}
.ch-sub    { font-size: 0.875rem; color: var(--db-ink-muted); }
.ch-actions { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
.db-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  border: 0.0625rem solid transparent;
}
.db-badge svg { width: 0.6875rem; height: 0.6875rem; flex: 0 0 0.6875rem; }
.db-badge-planned { background: var(--db-blue-50);       color: var(--db-blue-700);  border-color: var(--db-blue-100); }
.db-badge-active  { background: var(--db-sage-50);       color: var(--db-sage-700);  border-color: var(--db-sage-100); }
.db-badge-done    { background: var(--db-paper-sunken);  color: var(--db-ink-muted); border-color: var(--db-line); }
.db-badge-cancel  { background: var(--db-rose-50);       color: var(--db-rose-700);  border-color: var(--db-rose-100); }
.av-blue  { background: var(--db-blue-100);  color: var(--db-blue-700);  }
.av-plum  { background: var(--db-plum-100);  color: var(--db-plum-700);  }
.av-teal  { background: var(--db-teal-100);  color: var(--db-teal-700);  }
.av-amber { background: var(--db-amber-100); color: var(--db-amber-700); }
.av-rose  { background: var(--db-rose-100);  color: var(--db-rose-700);  }
.av-sage  { background: var(--db-sage-100);  color: var(--db-sage-700);  }
.dash-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  align-items: start;
}
@media (max-width: 72rem) {
  .dash-top { grid-template-columns: 1fr; }
}
.info-body  { padding: 1.5rem 1.5rem 1.25rem; }
.info-main  { display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem; }

.info-ring  { flex: 0 0 7.5rem; width: 7.5rem; height: 7.5rem; position: relative; }
.info-ring svg {
  width: 100%; height: 100%;
  display: block;
  transform: rotate(-90deg);
}
.ring-label {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 0.0625rem;
  pointer-events: none;
}
.ring-num {
  font-family: var(--db-font-serif);
  font-size: 2.125rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--db-ink-strong);
}
.ring-cap {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 500;
  color: var(--db-ink-subtle);
}

.info-kpi        { flex: 1; min-width: 0; }
.info-kpi-title  { font-family: var(--db-font-serif); font-size: 1.0625rem; font-weight: 500; color: var(--db-ink-strong); margin-bottom: 0.125rem; }
.info-kpi-sub    { font-size: 0.8125rem; color: var(--db-ink-muted); margin-bottom: 1rem; }

.kpi-row   { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.5625rem; }
.kpi-dot   { width: 0.5rem; height: 0.5rem; border-radius: 50%; flex: 0 0 0.5rem; }
.kpi-label { font-size: 0.875rem; color: var(--db-ink-muted); flex: 1; min-width: 0; }
.kpi-track { width: 5rem; height: 0.375rem; background: var(--db-line-soft); border-radius: 999px; overflow: hidden; flex: 0 0 5rem; }
.kpi-fill  { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.2,0.7,0.2,1); }
.kpi-val   { font-size: 0.875rem; font-weight: 600; color: var(--db-ink-strong); min-width: 1.25rem; text-align: right; }

.info-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 0.0625rem solid var(--db-line-soft);
}
.stat-tile {
  background: var(--db-paper-soft);
  border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-md);
  padding: 0.875rem 0.875rem 0.75rem;
  text-align: center;
}
.stat-tile .st-num {
  font-family: var(--db-font-serif);
  font-size: 1.875rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--db-ink-strong);
  margin-bottom: 0.3125rem;
}
.stat-tile .st-label { font-size: 0.75rem; color: var(--db-ink-muted); line-height: 1.35; }
.stat-tile.green { background: var(--db-sage-50);  border-color: var(--db-sage-100);  }
.stat-tile.green .st-num { color: var(--db-sage-700); }
.stat-tile.amber { background: var(--db-amber-50); border-color: var(--db-amber-100); }
.stat-tile.amber .st-num { color: var(--db-amber-700); }
.stat-tile.blue  { background: var(--db-blue-50);  border-color: var(--db-blue-100);  }
.stat-tile.blue  .st-num { color: var(--db-blue-700); }
.docs-list { list-style: none; }
.docs-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.5rem;
  border-bottom: 0.0625rem solid var(--db-line-soft);
  transition: background 0.1s;
}
.docs-row:last-child { border-bottom: none; }
.docs-row:hover { background: var(--db-paper-soft); }
.dr-avatar {
  width: 2.25rem; height: 2.25rem;
  border-radius: 50%;
  flex: 0 0 2.25rem;
  display: grid; place-items: center;
  font-size: 0.8125rem; font-weight: 600;
}
.dr-info { flex: 1; min-width: 0; }
.dr-name { font-weight: 500; font-size: 0.9375rem; color: var(--db-ink-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dr-meta { font-size: 0.8125rem; color: var(--db-ink-muted); margin-top: 0.0625rem; }
.dr-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  flex: 0 0 auto;
  border: 0.0625rem solid transparent;
  white-space: nowrap;
}
.dr-badge svg { width: 0.75rem; height: 0.75rem; flex: 0 0 0.75rem; }
.dr-miss { background: var(--db-rose-50);  color: var(--db-rose-700);  border-color: var(--db-rose-100); }
.dr-ok   { background: var(--db-sage-50);  color: var(--db-sage-700);  border-color: var(--db-sage-100); }
.dr-action {
  width: 2rem; height: 2rem;
  display: grid; place-items: center;
  border-radius: 0.5rem;
  color: var(--db-ink-subtle);
  transition: background 0.12s, color 0.12s;
  flex: 0 0 2rem;
  cursor: pointer;
  background: none; border: none;
}
.dr-action:hover { background: var(--db-paper-sunken); color: var(--db-ink); }
.dr-action svg { width: 0.875rem; height: 0.875rem; }
.docs-foot {
  padding: 0.875rem 1.5rem;
  border-top: 0.0625rem solid var(--db-line-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.docs-foot-note { font-size: 0.8125rem; color: var(--db-ink-muted); }
.diag-wrap { margin-top: 0; }

.diag-toolbar {
  padding: 1rem 1.5rem;
  border-bottom: 0.0625rem solid var(--db-line-soft);
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}
.diag-search { position: relative; flex: 1 1 16rem; min-width: 10rem; }
.diag-search input {
  width: 100%;
  padding: 0.5625rem 0.875rem 0.5625rem 2.25rem;
  background: var(--db-paper-soft);
  border: 0.0625rem solid var(--db-line);
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  color: var(--db-ink-strong);
  min-height: 2.5rem;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  font-family: var(--db-font-sans);
  outline: none;
}
.diag-search input:focus {
  background: var(--db-paper);
  border-color: var(--db-sage-500);
  box-shadow: var(--db-focus-ring);
}
.diag-search input::placeholder { color: var(--db-ink-subtle); }
.diag-search .s-ico {
  position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
  width: 1rem; height: 1rem; color: var(--db-ink-subtle); pointer-events: none;
}

.flt-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.75rem;
  min-height: 2.5rem;
  border-radius: 0.5rem;
  border: 0.0625rem solid var(--db-line-strong);
  background: var(--db-paper);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--db-ink-muted);
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  white-space: nowrap;
  cursor: pointer;
}
.flt-chip:hover { background: var(--db-paper-soft); color: var(--db-ink); }
.flt-chip.active { background: var(--db-sage-900); color: #F4F8EC; border-color: var(--db-sage-900); }
.flt-chip .fc-n {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 1.25rem; height: 1.25rem; padding: 0 0.25rem;
  background: var(--db-sage-500); color: #fff; border-radius: 999px;
  font-size: 0.6875rem; font-weight: 700; line-height: 1;
}
.tb-spacer { flex: 1; }
.tb-count  { font-size: 0.875rem; color: var(--db-ink-muted); }

.diag-scroll { overflow-x: auto; }

table.dtbl { width: 100%; border-collapse: collapse; min-width: 42rem; }
table.dtbl thead th {
  padding: 0.75rem 1.25rem;
  text-align: left;
  background: var(--db-paper-soft);
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--db-ink-subtle);
  white-space: nowrap;
  border-bottom: 0.0625rem solid var(--db-line);
}
table.dtbl tbody tr { border-bottom: 0.0625rem solid var(--db-line-soft); transition: background 0.1s; }
table.dtbl tbody tr:last-child { border-bottom: none; }
table.dtbl tbody tr:hover { background: var(--db-paper-soft); }
table.dtbl tbody td { padding: 0.9375rem 1.25rem; font-size: 0.9375rem; vertical-align: middle; }

.empty-cell { text-align: center; padding: 2rem !important; color: var(--db-ink-subtle); }

.cell-person { display: flex; align-items: center; gap: 0.75rem; }
.cp-av { width: 2.125rem; height: 2.125rem; border-radius: 50%; flex: 0 0 2.125rem; display: grid; place-items: center; font-size: 0.75rem; font-weight: 600; }
.cp-info .cp-name { font-weight: 500; color: var(--db-ink-strong); white-space: nowrap; display: block; }
.cp-info .cp-meta { font-size: 0.8125rem; color: var(--db-ink-muted); display: block; }

.cell-date .cd-main { font-weight: 500; color: var(--db-ink-strong); white-space: nowrap; display: block; }
.cell-date .cd-time { font-size: 0.8125rem; color: var(--db-ink-muted); display: block; }

.cell-diag { display: flex; align-items: center; gap: 0.625rem; }
.cd-ico { width: 1.875rem; height: 1.875rem; border-radius: 0.5rem; display: grid; place-items: center; flex: 0 0 1.875rem; }
.cd-ico svg { width: 0.9375rem; height: 0.9375rem; }
.cd-name { font-weight: 500; color: var(--db-ink-strong); line-height: 1.3; display: block; }
.cd-spec { font-size: 0.8125rem; color: var(--db-ink-muted); display: block; }

.spec-name { font-size: 0.9375rem; font-weight: 500; color: var(--db-ink-strong); display: block; }

.row-action {
  width: 2rem; height: 2rem;
  display: grid; place-items: center;
  border-radius: 0.5rem;
  color: var(--db-ink-subtle);
  transition: background 0.12s, color 0.12s;
  cursor: pointer;
  background: none; border: none;
}
.row-action:hover { background: var(--db-paper-sunken); color: var(--db-ink); }
.row-action svg { width: 1rem; height: 1rem; }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

.diag-foot {
  padding: 0.875rem 1.5rem;
  border-top: 0.0625rem solid var(--db-line-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.diag-foot-info { font-size: 0.875rem; color: var(--db-ink-muted); }
.diag-foot-info strong { color: var(--db-ink-strong); font-weight: 600; }

.pagination { display: flex; align-items: center; gap: 0.375rem; }
.pg-btn {
  width: 2.25rem; height: 2.25rem;
  display: grid; place-items: center;
  border-radius: 0.5rem;
  font-size: 0.875rem; font-weight: 500;
  color: var(--db-ink-muted);
  transition: background 0.12s, color 0.12s;
  cursor: pointer;
  background: none; border: none;
}
.pg-btn:hover:not([disabled]) { background: var(--db-paper-soft); color: var(--db-ink); }
.pg-btn.active { background: var(--db-sage-900); color: #F4F8EC; }
.pg-btn[disabled] { opacity: 0.4; cursor: default; }
.pg-btn svg { width: 0.875rem; height: 0.875rem; }
@media (max-width: 36rem) {
  .info-main  { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
  .info-stats { grid-template-columns: 1fr 1fr; }
}
</style>

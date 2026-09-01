<template>
  <div class="rd emp-home">

    <div class="greet">
      <div class="greet-eyebrow">{{ todayLabel }}</div>
      <h1>{{ greeting }}</h1>
    </div>

    <div class="findbar">
      <label class="find-field">
        <span class="sr-only">Поиск реабилитанта по ФИО</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="searchQuery"
          class="find-input"
          type="search"
          autocomplete="off"
          placeholder="Фамилия или имя — сначала проверьте, есть ли человек в базе"
        />
      </label>
      <button type="button" class="btn btn-primary" @click="addOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        Добавить реабилитанта
      </button>
      <div v-if="searchTerm" class="find-results" aria-live="polite">
        <div v-if="searchLoading" class="empty-note">Поиск…</div>
        <div v-else-if="!searchResults.length" class="empty-note">Ничего не найдено — можно завести нового.</div>
        <button
          v-for="r in searchResults" :key="r.id"
          type="button" class="tl-row"
          @click="openRecipient(r.id)"
        >
          <span class="ava" :class="avaTone(r.id)" aria-hidden="true">{{ initials(fullName(r)) }}</span>
          <span class="tl-main">
            <span class="tl-name">{{ fullName(r) }}</span>
            <span class="tl-note">{{ formatDiagnoses(r.diagnosis) || 'Диагноз не указан' }}</span>
          </span>
          <span v-if="statusWord(r)" class="pill pill-mute">{{ statusWord(r) }}</span>
        </button>
      </div>
    </div>

    <section class="sec" ref="daySection">
      <div class="sec-head is-sticky">
        <h2 class="sec-t">{{ day.title }}</h2>
        <span v-if="dayTodo" class="sec-badge" :title="dayTodoTitle">
          <span class="sr-only">Требуют действия:</span>{{ dayTodo }}
        </span>
        <button
          type="button" class="sec-fold"
          :aria-expanded="String(dayOpen)"
          :aria-label="dayOpen ? 'Свернуть список записей' : 'Развернуть список записей'"
          @click="toggleDay"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="datenav">
          <button type="button" class="dn-btn" aria-label="Предыдущий день" @click="shiftDay(-1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="dn-label" aria-live="polite">{{ day.label }}</span>
          <button type="button" class="dn-btn" aria-label="Следующий день" @click="shiftDay(1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button type="button" class="dn-today" :disabled="day.isToday" @click="goToday">Сегодня</button>
        </div>
        <button type="button" class="sec-link" @click="goTo('schedule', 'Расписание')">
          Всё расписание
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div v-show="dayOpen" class="card">
        <div class="listbar">
          <label class="switch">
            <input v-model="hideDone" type="checkbox" />
            <span class="switch-ui" aria-hidden="true"></span>
            <span class="switch-txt">Скрыть завершённые</span>
          </label>
          <span class="listbar-note">{{ doneNote }}</span>
        </div>

        <div class="card-body day-body">
          <div v-if="dayLoading" class="empty-note">Загрузка…</div>
          <div v-else-if="dayError" class="empty-note">{{ dayError }}</div>
          <div v-else-if="!visibleRows.length" class="empty-note">
            {{ day.rows.length ? 'Все записи этого дня скрыты фильтром' : 'На этот день записей нет' }}
          </div>

          <div
            v-for="r in visibleRows" :key="r.sessionId"
            class="res with-time"
            :class="[r.verdict ? 'v-' + r.verdict : '', { 'is-past': r.isPast }]"
          >
            <span class="res-time">{{ r.time || '—' }}</span>
            <span class="ava" :class="avaTone(r.recipientId, r.verdict)" aria-hidden="true">{{ r.initials }}</span>
            <div class="res-main">
              <div class="res-name">{{ r.name }}</div>
              <div class="res-line"><span class="pill" :class="r.pill">{{ r.statusLabel }}</span></div>
              <div class="res-note">{{ r.note }}</div>
            </div>
            <div class="res-end">
              <button
                v-if="r.status === 'recommended'"
                type="button" class="btn btn-primary btn-sm"
                @click="openRecipient(r.recipientId, 'enrollment')"
              >{{ r.signedCount ? 'Продолжить документы' : 'Подготовить документы' }}</button>
              <button
                v-if="r.status === 'noshow'"
                type="button" class="btn btn-secondary btn-sm"
                @click="reschedule(r)"
              >Перенести</button>
              <button
                v-if="r.status !== 'noshow'"
                type="button" class="btn btn-secondary btn-sm"
                @click="openRecipient(r.recipientId)"
              >Открыть</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="sec" ref="docsSection">
      <div class="sec-head">
        <h2 class="sec-t">Карточки и документы</h2>
        <span v-if="docsTodo" class="sec-badge" :title="'Карточек и документов, ждущих решения: ' + docsTodo">
          <span class="sr-only">Требуют действия:</span>{{ docsTodo }}
        </span>
        <button
          type="button" class="sec-fold"
          :aria-expanded="String(docsOpen)"
          :aria-label="docsOpen ? 'Свернуть карточки и документы' : 'Развернуть карточки и документы'"
          @click="toggleDocs"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      <div v-show="docsOpen" class="tiles tiles-4" :class="{ 'has-open': openTile }">
        <div
          v-for="t in tiles" :key="t.key"
          class="tile" :class="['tone-' + t.tone, { 'is-open': openTile === t.key }]"
        >
          <button
            type="button" class="tile-face"
            :aria-expanded="String(openTile === t.key)"
            :disabled="!t.count"
            @click="toggleTile(t)"
          >
            <span class="tile-title">
              {{ t.title }}
              <svg v-if="t.count" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            <span v-if="t.qual" class="tile-qual">{{ t.qual }}</span>
            <span class="tile-num">{{ t.count }}<i>{{ t.unit }}</i></span>
          </button>

          <div v-if="openTile === t.key" class="tile-list">
            <button
              v-for="(it, i) in t.items" :key="t.key + '-' + i"
              type="button" class="tl-row"
              @click="openTileItem(t, it)"
            >
              <span class="ava" :class="tileAva(t.tone)" aria-hidden="true">{{ initials(it.name) }}</span>
              <span class="tl-main">
                <span class="tl-name">{{ it.name }}</span>
                <span class="tl-note">{{ it.note }}</span>
              </span>
              <span v-if="it.days" class="tl-days">{{ it.days }}</span>
            </button>
            <button v-if="t.action" type="button" class="tl-all" @click="goTo(t.action.page, t.action.title, t.action.params)">
              Открыть раздел «{{ t.action.title }}»
            </button>
          </div>
        </div>
      </div>
    </section>

    <AddRecipientWizard v-if="addOpen" @saved="onRecipientSaved" @close="addOpen = false" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePageStore } from '../stores/page';
import { useAuthStore } from '../stores/auth';
import api from '../api';
import { formatDiagnoses } from '../utils/diagnosisList';
import AddRecipientWizard from '../components/AddRecipientWizard.vue';

const pageStore = usePageStore();
const authStore = useAuthStore();

const goTo = (page, label, params) => pageStore.setPage(page, label || page, params || {});
const openRecipient = (id, tab) => {
  if (!id) return;
  pageStore.setPage('recipient-details', 'Карточка реабилитанта', tab ? { recipientId: id, tab } : { recipientId: id });
};

const now = new Date();
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DOW = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const todayLabel = `${DOW[now.getDay()]}, ${now.getDate()} ${MONTHS_GEN[now.getMonth()]} ${now.getFullYear()}`;
const greeting = computed(() => {
  const h = now.getHours();
  const part = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  return `${part}, ${authStore.user?.firstName || 'коллега'}`;
});

function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
const fullName = (r) => [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ') || 'Без имени';
const initials = (name) => {
  const p = (name || '').split(' ').filter(Boolean);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '—';
};
const AVA = ['', 'av-amber', 'av-cycle', 'av-rose'];
const avaTone = (id, verdict) => {
  if (verdict === 'stop') return 'av-rose';
  if (verdict === 'wait') return 'av-amber';
  if (verdict === 'ok') return 'av-cycle';
  if (verdict === 'now') return '';
  return AVA[Math.abs(Number(id) || 0) % AVA.length];
};
const tileAva = (tone) => (tone === 'rose' ? 'av-rose' : tone === 'amber' ? 'av-amber' : '');

const addOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const searchLoading = ref(false);
const searchTerm = computed(() => searchQuery.value.trim());
let searchTimer = null;

const statusWord = (r) => (r.status === 'draft' ? 'черновик' : r.status === 'archived' ? 'в архиве' : '');

watch(searchQuery, () => {
  clearTimeout(searchTimer);
  if (!searchTerm.value) { searchResults.value = []; searchLoading.value = false; return; }
  searchLoading.value = true;
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/recipients', { params: { search: searchTerm.value, limit: 6, page: 1 } });
      searchResults.value = data.data || [];
    } catch (e) {
      console.error('search:', e);
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }, 300);
});

const STICKY = 56;
let spacer = null;
let scrollAnim = 0;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

function smoothTo(y, done) {
  y = Math.max(0, y);
  const start = window.pageYOffset;
  const dist = y - start;
  if (reduceMotion() || Math.abs(dist) < 2) {
    window.scrollTo(0, y);
    if (done) done();
    return;
  }
  const t0 = performance.now();
  const dur = Math.min(450, 200 + Math.abs(dist) * 0.35);
  const id = ++scrollAnim;
  const step = (t) => {
    if (id !== scrollAnim) return;
    const p = Math.min(1, (t - t0) / dur);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    window.scrollTo(0, start + dist * e);
    if (p < 1) requestAnimationFrame(step);
    else if (done) done();
  };
  requestAnimationFrame(step);
}

async function keepScroll(mutate, target) {
  if (!spacer) { await mutate(); return; }
  const y = window.pageYOffset;
  const beforeH = document.documentElement.scrollHeight;

  await mutate();

  const afterH = document.documentElement.scrollHeight - parseFloat(spacer.style.height || 0);
  const shrink = beforeH - afterH;
  if (shrink > 0) spacer.style.height = shrink + 'px';
  window.scrollTo(0, y);

  const want = target ? target(y) : y;
  const to = Math.min(want, Math.max(0, afterH - window.innerHeight));

  smoothTo(to, () => {
    if (spacer) spacer.style.height = '0px';
    if (window.pageYOffset > maxScroll()) window.scrollTo(0, maxScroll());
  });
}

const topOf = (el) => (el ? el.getBoundingClientRect().top + window.pageYOffset - STICKY - 8 : 0);
const upTo = (el) => (y) => {
  const top = topOf(el);
  return y > top ? top : y;
};

const daySection = ref(null);
const docsSection = ref(null);

const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const dayDate = ref(isoOf(now));
const day = ref({ title: 'Записаны на сегодня', label: '', isToday: true, rows: [] });
const dayLoading = ref(true);
const dayError = ref('');
const dayOpen = ref(true);
const hideDone = ref(false);

const loadDay = async () => {
  dayLoading.value = true;
  dayError.value = '';
  try {
    const { data } = await api.get('/dashboard/day-board', { params: { date: dayDate.value } });
    day.value = {
      title: data.title,
      label: data.label,
      isToday: !!data.isToday,
      rows: Array.isArray(data.rows) ? data.rows : []
    };
  } catch (e) {
    dayError.value = e?.response?.data?.message || 'Не удалось загрузить записи дня';
    day.value = { ...day.value, rows: [] };
  } finally {
    dayLoading.value = false;
  }
};

const visibleRows = computed(() =>
  hideDone.value ? day.value.rows.filter((r) => !r.done) : day.value.rows
);

const doneRows = computed(() => day.value.rows.filter((r) => r.done));
const doneNote = computed(() => {
  const n = doneRows.value.length;
  if (!n) return 'Завершённых записей нет';
  return hideDone.value ? `Скрыто записей: ${n}` : `Завершено и без задач: ${n}`;
});

const dayTodo = computed(() => day.value.rows.filter((r) => !r.done).length);
const dayTodoTitle = computed(() =>
  dayTodo.value === 1 ? 'Одна запись ждёт действия' : `Записей, ждущих действия: ${dayTodo.value}`
);

const shiftDay = (delta) => {
  const d = new Date(`${dayDate.value}T00:00:00`);
  d.setDate(d.getDate() + delta);
  dayDate.value = isoOf(d);
  keepScroll(loadDay, upTo(daySection.value));
};
const goToday = () => {
  if (day.value.isToday) return;
  dayDate.value = isoOf(new Date());
  keepScroll(loadDay, upTo(daySection.value));
};

const toggleDay = () => {
  const wasOpen = dayOpen.value;
  keepScroll(() => { dayOpen.value = !wasOpen; }, (y) => (wasOpen ? upTo(daySection.value)(y) : y));
};

watch(hideDone, () => keepScroll(() => {}, upTo(daySection.value)));

const reschedule = (row) => {
  goTo('schedule', 'Расписание', { recipientId: row.recipientId, sessionId: row.sessionId });
};

const tiles = ref([]);
const docsOpen = ref(true);
const openTile = ref('');

const docsTodo = computed(() => tiles.value.reduce((n, t) => n + (t.count || 0), 0));

const loadTiles = async () => {
  try {
    const { data } = await api.get('/dashboard/employee-tiles');
    tiles.value = Array.isArray(data?.tiles) ? data.tiles : [];
  } catch (e) {
    console.error('employee-tiles:', e);
    tiles.value = [];
  }
};

const toggleTile = (t) => {
  if (!t.count) return;
  const wasOpen = openTile.value === t.key;
  keepScroll(() => { openTile.value = wasOpen ? '' : t.key; }, (y) => y);
};

const toggleDocs = () => {
  const wasOpen = docsOpen.value;
  keepScroll(() => { docsOpen.value = !wasOpen; }, (y) => (wasOpen ? upTo(docsSection.value)(y) : y));
};

const openTileItem = (t, it) => {
  if (it.recipientId) openRecipient(it.recipientId, it.tab);
  else if (t.action) goTo(t.action.page, t.action.title, t.action.params);
};

const onRecipientSaved = () => {
  addOpen.value = false;
  loadDay();
  loadTiles();
};

const onKeydown = (e) => {
  if (e.key === 'Escape' && searchTerm.value) searchQuery.value = '';
};

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F3EEE4');
  spacer = document.createElement('div');
  spacer.setAttribute('aria-hidden', 'true');
  spacer.style.cssText = 'height:0;pointer-events:none;';
  document.body.appendChild(spacer);
  window.addEventListener('keydown', onKeydown);
  loadDay();
  loadTiles();
});

onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
  clearTimeout(searchTimer);
  scrollAnim += 1;
  window.removeEventListener('keydown', onKeydown);
  if (spacer) { spacer.remove(); spacer = null; }
});
</script>

<style scoped>
.emp-home{
  --font-serif:'Lora','Times New Roman',Georgia,serif;
  --font-sans:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;

  --paper:#FFFFFF;
  --paper-soft:#F3EEE4;
  --paper-sunken:#EDE8DD;
  --ink:#1A211A;
  --ink-strong:#0F140F;
  --ink-muted:#454C40;
  --ink-subtle:#4A5044;
  --line:#E4DECF;
  --line-soft:#EFEADC;
  --line-strong:#D6CFBE;

  --action:#1E2F1E;
  --action-hover:#2A4129;
  --action-ink:#F4F8EC;

  --cycle:#453A2C;
  --cycle-tint:#F0E9DC;
  --cycle-line:#DDD2BE;

  --stage:#144A63;
  --stage-tint:#E6EEF3;
  --stage-line:#C3D6E1;

  --sage-700:#2F4A2F;
  --sage-500:#5F7E45;
  --sage-100:#E0EBD1;
  --sage-50:#EEF4E2;
  --amber-700:#6F4514;
  --amber-100:#F5E3C4;
  --amber-50:#FBF1DD;
  --rose-700:#6E2B22;
  --rose-500:#B0533F;
  --rose-100:#F3D8CE;
  --rose-50:#FAE9E0;

  --radius-sm:.5rem; --radius-md:.75rem; --radius-lg:1.125rem;
  --shadow-sm:0 .0625rem .125rem rgba(30,47,30,.05);
  --shadow-md:0 .25rem .875rem rgba(30,47,30,.06),0 .0625rem .125rem rgba(30,47,30,.04);

  --bleed-l:1.75rem;
  --bleed-r:1.75rem;

  font-family:var(--font-sans);
  color:var(--ink);
  line-height:1.55;
}
.emp-home :deep(*),
.emp-home :deep(*::before),
.emp-home :deep(*::after){box-sizing:border-box;}

.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
:focus-visible{outline:.1875rem solid var(--stage);outline-offset:.125rem;border-radius:.25rem;}

.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:.4375rem;
  padding:.625rem 1rem;min-height:2.75rem;border-radius:.625rem;
  font-size:.9375rem;font-weight:500;border:.0625rem solid transparent;
  cursor:pointer;white-space:nowrap;text-decoration:none;font-family:var(--font-sans);
  transition:background .15s,border-color .15s,color .15s;
}
.btn svg{width:1rem;height:1rem;flex:0 0 1rem;}
.btn-primary{background:var(--action);color:var(--action-ink);border-color:var(--action);}
.btn-primary:hover{background:var(--action-hover);border-color:var(--action-hover);}
.btn-secondary{background:var(--paper);color:var(--ink);border-color:var(--line-strong);}
.btn-secondary:hover{background:var(--paper-soft);border-color:var(--ink-muted);}
.btn:disabled{opacity:.55;cursor:not-allowed;}
.btn-sm{min-height:2.25rem;padding:.375rem .75rem;font-size:.8125rem;}

.card{background:var(--paper);border:.0625rem solid var(--line);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);overflow:hidden;}
.card-body{padding:1.125rem 1.25rem 1.25rem;}

.pill{display:inline-flex;align-items:center;gap:.3125rem;font-size:.75rem;font-weight:700;padding:.1875rem .5625rem;border-radius:62.5rem;white-space:nowrap;}
.pill-ok{background:var(--sage-100);color:var(--sage-700);}
.pill-wait{background:var(--amber-50);color:var(--amber-700);border:.0625rem solid var(--amber-100);}
.pill-stop{background:var(--rose-50);color:var(--rose-700);border:.0625rem solid var(--rose-100);}
.pill-stage{background:var(--cycle-tint);color:var(--cycle);border:.0625rem solid var(--cycle-line);}
.pill-mute{background:var(--paper-soft);color:var(--ink-muted);}

.ava{
  flex:0 0 2.25rem;width:2.25rem;height:2.25rem;border-radius:50%;
  display:grid;place-items:center;font-size:.75rem;font-weight:600;
  background:var(--sage-100);color:var(--sage-700);
}
.ava.av-amber{background:var(--amber-100);color:var(--amber-700);}
.ava.av-rose{background:var(--rose-100);color:var(--rose-700);}
.ava.av-cycle{background:var(--cycle-tint);color:var(--cycle);}

.empty-note{padding:1.25rem;text-align:center;color:var(--ink-muted);font-size:.9375rem;}

.greet{margin-bottom:1.25rem;}
.greet-eyebrow{font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;font-weight:600;color:var(--ink-muted);}
.greet h1{font-family:var(--font-serif);font-size:1.875rem;font-weight:500;letter-spacing:-.02em;color:var(--ink-strong);margin:.25rem 0 0;line-height:1.15;}

.findbar{
  display:flex;gap:.625rem;flex-wrap:wrap;align-items:center;
  padding:.75rem;margin-bottom:1.5rem;
  background:var(--paper);border:.0625rem solid var(--line);
  border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);
}
.find-field{
  flex:1 1 20rem;display:flex;align-items:center;gap:.5rem;min-width:0;
  padding:.5rem .75rem;min-height:2.75rem;
  border:.0625rem solid var(--line-strong);border-radius:var(--radius-md);background:var(--paper);
}
.find-field:focus-within{border-color:var(--stage);box-shadow:0 0 0 .1875rem var(--stage-line);}
.find-field svg{width:1.0625rem;height:1.0625rem;flex:0 0 1.0625rem;color:var(--ink-muted);}
.find-input{flex:1;min-width:0;border:none;outline:none;background:none;font-size:1rem;color:var(--ink-strong);font-family:var(--font-sans);}
.find-results{flex:1 1 100%;border-top:.0625rem solid var(--line-soft);padding-top:.375rem;}

.sec{margin-bottom:1.75rem;}
.sec-head{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;margin-bottom:.875rem;}
.sec-t{font-family:var(--font-serif);font-size:1.375rem;font-weight:600;color:var(--ink-strong);margin:0;line-height:1.2;}
.sec-link{
  display:inline-flex;align-items:center;gap:.3125rem;
  background:none;border:none;padding:.375rem .5rem;border-radius:.5rem;
  font-size:.875rem;font-weight:600;color:var(--sage-700);cursor:pointer;
}
.sec-link:hover{background:var(--sage-50);color:var(--action);}
.sec-link svg{width:.875rem;height:.875rem;}
.sec-badge{
  display:inline-flex;align-items:center;justify-content:center;
  min-width:1.75rem;height:1.75rem;padding:0 .5rem;
  font-size:.875rem;font-weight:700;
  color:var(--amber-700);background:var(--amber-50);
  border:.0625rem solid var(--amber-100);border-radius:62.5rem;
}
.sec-fold{
  display:inline-flex;align-items:center;justify-content:center;
  width:2.5rem;height:2.5rem;flex:0 0 2.5rem;
  border:.0625rem solid var(--stage-line);border-radius:.625rem;
  background:var(--stage-tint);color:var(--stage);cursor:pointer;
}
.sec-fold svg{width:1.0625rem;height:1.0625rem;transition:transform .15s;}
.sec-fold[aria-expanded="false"] svg{transform:rotate(-90deg);}
.sec-fold:hover{background:#D8E5ED;border-color:var(--stage);}

.sec-head.is-sticky{
  position:sticky;top:4rem;z-index:40;
  padding:.625rem var(--bleed-r) .625rem var(--bleed-l);
  margin:0 calc(-1 * var(--bleed-r)) .875rem calc(-1 * var(--bleed-l));
  background:var(--paper-soft);
  border-bottom:.0625rem solid var(--line);
}

.datenav{display:flex;align-items:center;gap:.25rem;margin-left:auto;flex-wrap:nowrap;}
.dn-btn{
  display:inline-flex;align-items:center;justify-content:center;
  width:2.5rem;height:2.5rem;flex:0 0 2.5rem;
  border:.0625rem solid var(--line-strong);border-radius:.625rem;
  background:var(--paper);color:var(--ink-muted);cursor:pointer;
}
.dn-btn svg{width:1.0625rem;height:1.0625rem;}
.dn-btn:hover{background:var(--paper-soft);color:var(--action);border-color:var(--ink-muted);}
.dn-label{
  min-width:8.5rem;text-align:center;padding:0 .5rem;
  font-size:.9375rem;font-weight:600;color:var(--ink-strong);white-space:nowrap;
}
.dn-today{
  min-height:2.5rem;padding:.4375rem .875rem;margin-left:.25rem;
  border:.0625rem solid var(--line-strong);border-radius:.625rem;
  background:var(--paper);font-size:.875rem;font-weight:600;color:var(--action);cursor:pointer;white-space:nowrap;
}
.dn-today:hover{background:var(--paper-soft);border-color:var(--ink-muted);}
.dn-btn:disabled,.dn-today:disabled{opacity:.45;cursor:not-allowed;}

.listbar{
  display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap;
  padding:.625rem 1rem;border-bottom:.0625rem solid var(--line-soft);background:#FBF9F5;
}
.listbar-note{font-size:.8125rem;color:var(--ink-subtle);}
.switch{display:inline-flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.875rem;font-weight:600;color:var(--ink-strong);}
.switch input{position:absolute;opacity:0;width:0;height:0;}
.switch-ui{
  position:relative;flex:0 0 2.5rem;width:2.5rem;height:1.4375rem;border-radius:62.5rem;
  background:var(--paper-sunken);border:.0625rem solid var(--line-strong);transition:background .15s,border-color .15s;
}
.switch-ui::after{
  content:"";position:absolute;top:.125rem;left:.125rem;width:1.0625rem;height:1.0625rem;
  border-radius:50%;background:var(--paper);box-shadow:var(--shadow-sm);transition:transform .15s;
}
.switch input:checked + .switch-ui{background:var(--action);border-color:var(--action);}
.switch input:checked + .switch-ui::after{transform:translateX(1.0625rem);}
.switch input:focus-visible + .switch-ui{outline:.1875rem solid var(--stage);outline-offset:.125rem;}

.day-body{padding:.375rem .625rem .625rem;}

.res{
  display:grid;grid-template-columns:auto minmax(0,1fr) auto;
  gap:.375rem .875rem;align-items:center;
  padding:.875rem .75rem;border-bottom:.0625rem solid var(--line-soft);
  border-left:.1875rem solid transparent;border-radius:var(--radius-sm);
}
.res:last-child{border-bottom:none;}
.res:hover{background:#FBF9F5;}
.res.v-ok{border-left-color:var(--sage-500);}
.res.v-wait{border-left-color:var(--amber-700);}
.res.v-stop{border-left-color:var(--rose-500);}
.res.v-now{border-left-color:var(--stage);background:var(--stage-tint);}
.res.v-now:hover{background:#DCE8EF;}
.res.with-time{grid-template-columns:3.25rem auto minmax(0,1fr) auto;}
.res-time{font-family:var(--font-serif);font-size:1.125rem;font-weight:600;color:var(--ink-strong);}
.res.v-now .res-time{color:var(--stage);}
.res-main{min-width:0;}
.res-name{font-size:.9375rem;font-weight:600;color:var(--ink-strong);}
.res.is-past .res-name,
.res.is-past .res-time{color:var(--ink-subtle);font-weight:500;}
.res-line{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:.1875rem;}
.res-note{display:block;margin-top:.25rem;font-size:.8125rem;color:var(--ink-muted);line-height:1.4;}
.res-end{display:flex;gap:.375rem;flex-wrap:wrap;justify-content:flex-end;}

.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.875rem;align-items:stretch;grid-auto-rows:1fr;}
.tiles.has-open{align-items:start;grid-auto-rows:auto;}
.tiles-4{grid-template-columns:repeat(4,minmax(0,1fr));}

.tile{
  display:flex;flex-direction:column;
  background:var(--paper);border:.0625rem solid var(--line);
  border-left:.25rem solid var(--line-strong);
  border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);overflow:hidden;
}
.tile.is-open{box-shadow:var(--shadow-md);}
.tile-face{
  display:flex;flex-direction:column;gap:.1875rem;width:100%;flex:1 0 auto;
  padding:1rem 1.125rem 1.125rem;cursor:pointer;min-height:7.5rem;
  border:none;background:none;text-align:left;font:inherit;color:inherit;
}
.tile-face:hover:not(:disabled){background:#FBF9F5;}
.tile-face:disabled{cursor:default;}
.tile-face:focus-visible{outline:.1875rem solid var(--stage);outline-offset:-.1875rem;}
.tile-title{display:flex;align-items:center;gap:.375rem;font-size:.9375rem;font-weight:600;color:var(--ink-strong);}
.tile-title svg{width:.9375rem;height:.9375rem;flex:0 0 .9375rem;color:var(--ink-muted);transition:transform .15s;}
.tile.is-open .tile-title svg{transform:rotate(180deg);}
.tile-qual{font-size:.8125rem;color:var(--ink-muted);line-height:1.35;}
.tile-num{
  margin-top:auto;padding-top:.625rem;
  font-family:var(--font-serif);font-size:2.5rem;font-weight:600;line-height:1;color:var(--ink-strong);
  display:flex;align-items:baseline;gap:.4375rem;
}
.tile-num i{font-family:var(--font-sans);font-size:.8125rem;font-style:normal;font-weight:500;color:var(--ink-muted);}
.tile.tone-sage{border-left-color:var(--sage-500);}
.tile.tone-amber{border-left-color:var(--amber-700);}
.tile.tone-rose{border-left-color:var(--rose-500);}
.tile.tone-stage{border-left-color:var(--stage);}
.tile.tone-zero{border-left-color:var(--line-strong);}
.tile.tone-zero .tile-num{color:var(--ink-subtle);}

.tile-list{border-top:.0625rem solid var(--line-soft);padding:.375rem .625rem .625rem;}
.tl-row{
  display:flex;align-items:center;gap:.625rem;width:100%;
  padding:.5rem;border:none;background:none;border-radius:var(--radius-md);
  text-align:left;cursor:pointer;font:inherit;color:inherit;
}
.tl-row:hover{background:var(--paper-soft);}
.tl-main{flex:1;min-width:0;}
.tl-name{display:block;font-size:.875rem;font-weight:600;color:var(--ink-strong);}
.tl-note{display:block;font-size:.8125rem;color:var(--ink-muted);}
.tl-days{font-size:.8125rem;font-weight:600;color:var(--amber-700);white-space:nowrap;}
.tl-all{
  display:block;width:100%;padding:.5rem;margin-top:.25rem;
  border:none;border-top:.0625rem solid var(--line-soft);background:none;
  font-size:.8125rem;font-weight:600;color:var(--sage-700);cursor:pointer;border-radius:0 0 .5rem .5rem;
}
.tl-all:hover{background:var(--sage-50);}

@media (max-width:64rem){
  .tiles,.tiles-4{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:48rem){
  .res{grid-template-columns:auto minmax(0,1fr);}
  .res.with-time{grid-template-columns:2.75rem auto minmax(0,1fr);}
  .res-end{grid-column:1/-1;justify-content:flex-start;}
  .res-end .btn{flex:1 1 auto;}
}
@media (max-width:37.5rem){
  .tiles,.tiles-4{grid-template-columns:1fr;}
  .datenav{margin-left:0;width:100%;}
  .dn-label{flex:1;min-width:0;}
}
@media (max-width:30rem){
  .res .ava{display:none;}
  .res.with-time{grid-template-columns:2.75rem minmax(0,1fr);}
  .res{padding:.75rem .5rem;}
}

@media (max-width:768px){
  .emp-home{
    --bleed-l:max(.875rem, var(--safe-left, 0px));
    --bleed-r:max(.875rem, var(--safe-right, 0px));
  }
  .greet h1{font-size:1.5rem;}
  .sec-head.is-sticky{
    top:calc(56px + var(--safe-top, 0px));
  }
  .findbar{padding:.625rem;}
  .card-body{padding:1rem;}
  .sec-t{font-size:1.1875rem;}
  .tile-num{font-size:2rem;}

  .btn,
  .btn-sm,
  .sec-link,
  .tl-all,
  .dn-today{min-height:var(--tap, 2.75rem);}
  .sec-fold,
  .dn-btn{
    width:var(--tap, 2.75rem);height:var(--tap, 2.75rem);
    flex:0 0 var(--tap, 2.75rem);
  }
  .switch{min-height:var(--tap, 2.75rem);flex:1 1 100%;}
  .listbar{padding:.5rem .75rem;}
  .listbar-note{flex:1 1 100%;}
}
@media (max-width:480px){
  .emp-home{
    --bleed-l:max(.75rem, var(--safe-left, 0px));
    --bleed-r:max(.75rem, var(--safe-right, 0px));
  }
}
@media (hover:none){
  .res:hover{background:none;}
  .res.v-now:hover{background:var(--stage-tint);}
  .tile-face:hover:not(:disabled){background:none;}
  .tl-row:hover{background:none;}
}
@media (prefers-reduced-motion:reduce){
  .emp-home :deep(*){animation-duration:.01ms!important;transition-duration:.01ms!important;}
}
</style>

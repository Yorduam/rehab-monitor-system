<template>
  <div class="sch-page">
    <header class="sch-header">
      <div>
        <h1 class="sch-title">Расписание</h1>
        <p class="sch-sub">Диагностика и занятия. Кликните событие, чтобы открыть карточку.</p>
      </div>
      <button class="sch-add" @click="openCreate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {{ canAssign ? 'Назначить / событие' : 'Добавить занятие' }}
      </button>
    </header>

    <div class="sch-toolbar">
      <div class="sch-tabs">
        <button class="sch-tab" :class="{ active: tab === 'day' }" @click="tab = 'day'">Дневное расписание</button>
        <button class="sch-tab" :class="{ active: tab === 'week' }" @click="tab = 'week'">Недельный календарь</button>
        <button class="sch-tab" :class="{ active: tab === 'pool' }" @click="switchToPool">
          Заявки на диагностику
          <span v-if="poolBadge" class="sch-tab-badge">{{ poolBadge }}</span>
        </button>
      </div>
      <div class="sch-nav" v-if="tab !== 'pool'">
        <button class="sch-nav-btn" @click="shift(-1)" aria-label="Назад">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="sch-today" @click="goToday">Сегодня</button>
        <button class="sch-nav-btn" @click="shift(1)" aria-label="Вперёд">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <span class="sch-range">{{ rangeLabel }}</span>
      </div>
    </div>

    <div class="sch-legend">
      <span class="sch-leg"><i class="sch-swatch sch-swatch--diag"></i>Диагностика</span>
      <span class="sch-leg"><i class="sch-swatch sch-swatch--lesson"></i>Занятие</span>
      <span class="sch-leg"><i class="sch-swatch sch-swatch--done"></i>Завершено</span>
    </div>

    <div v-if="loading" class="sch-loading"><div class="sch-spinner"></div></div>

    <div v-else-if="tab === 'day'" class="sch-day card">
      <div class="sch-day-head">
        <div class="sch-day-title">{{ dayLabel }}</div>
        <div class="sch-day-count">{{ dayEvents.length }} событ.</div>
      </div>
      <div v-if="dayEvents.length === 0" class="sch-empty">На этот день событий нет.</div>
      <div class="sch-timeline" :style="{ height: gridHeight + 'px' }">
        <div class="sch-slots">
          <div
            v-for="s in slots"
            :key="s.min"
            class="sch-slot"
            :class="{ 'sch-slot--hour': s.isHour }"
            :style="{ height: slotHeight + 'px' }"
            @click="onSlotClick(s)"
          >
            <span class="sch-slot-time" v-if="s.isHour">{{ s.label }}</span>
          </div>
        </div>
        <div v-if="nowOffset !== null" class="sch-now" :style="{ top: nowOffset + 'px' }"><span></span></div>
        <div class="sch-events">
          <button
            v-for="ev in dayEvents"
            :key="ev.id"
            class="sch-ev"
            :class="evClass(ev)"
            :style="evStyle(ev)"
            @click="onEventClick(ev)"
          >
            <span class="sch-ev-time">{{ hhmm(ev.startTime) }}–{{ hhmm(ev.endTime) }}</span>
            <span class="sch-ev-title">{{ evTitle(ev) }}</span>
            <span class="sch-ev-sub" v-if="ev.type === 'diagnostic'">{{ evSubtitle(ev) }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'pool'" class="sch-pool">
      <p class="sch-pool-lead">
        <template v-if="canClaim">
          Заявки создаёт ресепшн — только датой. Возьмите реабилитанта себе:
          направление подставится из вашего профиля, время вы выбираете сами.
        </template>
        <template v-else>
          Заявки на диагностику, которые сейчас разбирают специалисты.
        </template>
      </p>

      <div v-if="!myProfile && canClaim" class="sch-pool-warn">
        В вашей учётной записи не указана профессиональная ориентированность —
        брать реабилитантов на диагностику нельзя. Обратитесь к администратору.
      </div>

      <div v-if="poolLoading" class="sch-loading"><div class="sch-spinner"></div></div>
      <div v-else-if="!pool.length" class="sch-empty card">Свободных заявок на диагностику нет.</div>

      <div v-else class="sch-pool-list">
        <article v-for="s in pool" :key="s.id" class="sch-pcard card" :class="{ 'is-mine': s.claimedByMe }">
          <div class="sch-pcard-head">
            <div class="sch-pcard-id">
              <h3 class="sch-pcard-name">{{ s.recipient ? fullName(s.recipient) : 'Реабилитант #' + s.recipientId }}</h3>
              <div class="sch-pcard-meta">
                <span class="sch-pcard-date">{{ formatDate(String(s.date).slice(0, 10)) }}</span>
                <span class="sch-pdot" aria-hidden="true">·</span>
                <span :class="['sch-pstatus', s.status]">{{ statusLabel(s.status) }}</span>
                <template v-if="s.authorName">
                  <span class="sch-pdot" aria-hidden="true">·</span>
                  <span>заявку создал(а) {{ s.authorName }}</span>
                </template>
              </div>
            </div>
            <span class="sch-pcount">{{ s.completed }} / {{ s.total }}</span>
          </div>

          <p v-if="s.note" class="sch-pnote">{{ s.note }}</p>

          <div v-if="s.blocks.length" class="sch-pblocks">
            <span
              v-for="b in s.blocks"
              :key="b.id"
              class="sch-pblock"
              :class="{ done: b.blockStatus === 'completed', mine: b.isMine }"
            >
              <span class="sch-pblock-ico">{{ b.blockStatus === 'completed' ? '✓' : '…' }}</span>
              <span class="sch-pblock-txt">
                {{ blockProfile(b) }} · {{ b.specialistName || '—' }}
                <template v-if="b.startTime">, {{ hhmm(b.startTime) }}–{{ hhmm(b.endTime) }}</template>
              </span>
            </span>
          </div>
          <p v-else class="sch-pempty">Никто ещё не взял этого реабилитанта.</p>

          <div class="sch-pcard-foot">
            <button v-if="canOpenBoard(s)" class="dm-btn dm-btn--ghost" @click="openBoard(s.id)">
              Доска диагностики
            </button>
            <button
              v-if="canClaim && !s.claimedByMe"
              class="dm-btn dm-btn--primary"
              :disabled="!myProfile"
              @click="openClaim(s)"
            >
              Взять себе
            </button>
            <span v-else-if="s.claimedByMe" class="sch-ptaken">Вы уже взяли этого реабилитанта</span>
          </div>
        </article>
      </div>
    </div>

    <div v-else class="sch-week card">
      <div class="sch-week-grid">
        <div class="sch-corner"></div>
        <div
          v-for="d in weekDays"
          :key="d.ymd"
          class="sch-wday"
          :class="{ 'sch-wday--today': d.ymd === todayYmd }"
        >
          <div class="sch-wday-name">{{ d.name }}</div>
          <div class="sch-wday-num">{{ d.dayNum }}</div>
        </div>

        <div class="sch-wgutter">
          <div v-for="h in hours" :key="h" class="sch-whour" :style="{ height: slotHeight * 2 + 'px' }">
            <span>{{ pad(h) }}:00</span>
          </div>
        </div>
        <div
          v-for="d in weekDays"
          :key="'col-' + d.ymd"
          class="sch-wcol"
          :style="{ height: gridHeight + 'px' }"
        >
          <div
            v-for="h in hours"
            :key="'line-' + h"
            class="sch-wline"
            :style="{ height: slotHeight * 2 + 'px' }"
          ></div>
          <button
            v-for="ev in eventsForDay(d.ymd)"
            :key="ev.id"
            class="sch-wev"
            :class="evClass(ev)"
            :style="evStyle(ev)"
            @click="onEventClick(ev)"
          >
            <span class="sch-wev-time">{{ hhmm(ev.startTime) }}</span>
            <span class="sch-wev-title">{{ evTitle(ev) }}</span>
          </button>
        </div>
      </div>
    </div>

    <DiagnosticFillModal
      v-if="fillAssignmentId"
      :assignment-id="fillAssignmentId"
      @close="fillAssignmentId = null"
      @updated="onFillUpdated"
    />

    <DiagnosticBoardModal
      v-if="boardSessionId"
      :session-id="boardSessionId"
      @close="boardSessionId = null"
      @open-block="onBoardOpenBlock"
      @changed="refreshAll"
    />

    <div v-if="claimSession" class="sch-overlay" @click.self="closeClaim">
      <div class="sch-create" role="dialog" aria-modal="true">
        <div class="sch-detail-head">
          <h3>Взять на диагностику</h3>
          <button class="dm-x" @click="closeClaim" aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="sch-create-body">
          <div class="sch-claim-info">
            <div class="sch-detail-row">
              <span>Реабилитант</span>
              <b>{{ claimSession.recipient ? fullName(claimSession.recipient) : '#' + claimSession.recipientId }}</b>
            </div>
            <div class="sch-detail-row">
              <span>Дата</span><b>{{ formatDate(String(claimSession.date).slice(0, 10)) }}</b>
            </div>
            <div class="sch-detail-row">
              <span>Ваше направление</span><b>{{ myProfile || 'не указано' }}</b>
            </div>
          </div>
          <p class="sch-claim-hint">
            Направление берётся из вашего профиля — выберите только удобное вам время.
          </p>
          <div class="sch-field-row">
            <label class="sch-field">
              <span>Начало</span>
              <input type="time" v-model="claimForm.startTime" step="900" class="sch-input" />
            </label>
            <label class="sch-field">
              <span>Окончание</span>
              <input type="time" v-model="claimForm.endTime" step="900" class="sch-input" />
            </label>
          </div>
          <p v-if="claimError" class="sch-error">{{ claimError }}</p>
        </div>
        <div class="sch-detail-foot">
          <button class="dm-btn dm-btn--ghost" @click="closeClaim">Отмена</button>
          <button class="dm-btn dm-btn--primary" :disabled="claiming" @click="submitClaim">
            {{ claiming ? 'Берём…' : 'Взять себе' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="detailEvent" class="sch-overlay" @click.self="detailEvent = null">
      <div class="sch-detail" role="dialog" aria-modal="true">
        <div class="sch-detail-head">
          <div>
            <span class="sch-detail-kicker" :class="detailEvent.type === 'diagnostic' ? 'is-diag' : 'is-lesson'">
              {{ detailEvent.type === 'diagnostic' ? 'Диагностика' : 'Занятие' }}
            </span>
            <h3>{{ evTitle(detailEvent) }}</h3>
          </div>
          <button class="dm-x" @click="detailEvent = null" aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="sch-detail-body">
          <div class="sch-detail-row"><span>Дата</span><b>{{ formatDate(detailEvent.date) }}</b></div>
          <div class="sch-detail-row"><span>Время</span><b>{{ hhmm(detailEvent.startTime) }}–{{ hhmm(detailEvent.endTime) }}</b></div>
          <div class="sch-detail-row" v-if="detailEvent.recipient"><span>Реабилитант</span><b>{{ fullName(detailEvent.recipient) }}</b></div>
          <div class="sch-detail-row" v-if="detailEvent.specialist"><span>Специалист</span><b>{{ specialistName(detailEvent.specialist) }}</b></div>
          <div class="sch-detail-row" v-if="detailEvent.specialist?.cabinet"><span>Кабинет</span><b>{{ detailEvent.specialist.cabinet }}</b></div>
          <div class="sch-detail-row" v-if="detailEvent.specialist?.phone"><span>Телефон</span><b>{{ detailEvent.specialist.phone }}</b></div>
        </div>
        <div class="sch-detail-foot">
          <button v-if="canDelete(detailEvent)" class="dm-btn dm-btn--danger" @click="deleteEvent(detailEvent)">Удалить событие</button>
          <button class="dm-btn dm-btn--ghost" @click="detailEvent = null">Закрыть</button>
        </div>
      </div>
    </div>

    <div v-if="createOpen" class="sch-overlay" @click.self="createOpen = false">
      <div class="sch-create" role="dialog" aria-modal="true">
        <div class="sch-detail-head">
          <h3>{{ createMode === 'assignment' ? 'Назначить диагностику' : 'Добавить занятие' }}</h3>
          <button class="dm-x" @click="createOpen = false" aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="sch-create-body">
          <div v-if="canAssign" class="sch-mode">
            <button class="sch-mode-btn" :class="{ active: createMode === 'assignment' }" @click="createMode = 'assignment'">Диагностика</button>
            <button class="sch-mode-btn" :class="{ active: createMode === 'lesson' }" @click="createMode = 'lesson'">Занятие</button>
          </div>

          <template v-if="createMode === 'assignment'">
            <p class="sch-assign-hint">
              Диагностика назначается только датой. Направление и специалиста
              выбирать не нужно — заявка попадёт во вкладку «Заявки на диагностику»,
              и специалисты возьмут реабилитанта сами.
            </p>
            <label class="sch-field">
              <span>Реабилитант</span>
              <select v-model="form.recipientId" class="sch-input">
                <option :value="null" disabled>Выберите…</option>
                <option v-for="r in recipients" :key="r.id" :value="r.id">{{ fullName(r) }}</option>
              </select>
            </label>
          </template>

          <template v-else>
            <label class="sch-field">
              <span>Название</span>
              <input v-model="form.title" class="sch-input" placeholder="Например: Групповое занятие" />
            </label>
            <label class="sch-field">
              <span>Реабилитант (необязательно)</span>
              <select v-model="form.recipientId" class="sch-input">
                <option :value="null">—</option>
                <option v-for="r in recipients" :key="r.id" :value="r.id">{{ fullName(r) }}</option>
              </select>
            </label>
            <label v-if="canAssign" class="sch-field">
              <span>Специалист</span>
              <select v-model="form.specialistUserId" class="sch-input">
                <option :value="null" disabled>Выберите…</option>
                <option v-for="s in specialists" :key="s.id" :value="s.id">{{ specialistName(s) }}</option>
              </select>
            </label>
          </template>

          <div class="sch-field-row">
            <label class="sch-field">
              <span>Дата</span>
              <input type="date" v-model="form.date" :min="createMode === 'assignment' ? todayYmd : null" class="sch-input" />
            </label>
            <template v-if="createMode !== 'assignment'">
              <label class="sch-field">
                <span>Начало</span>
                <input type="time" v-model="form.startTime" step="900" class="sch-input" />
              </label>
              <label class="sch-field">
                <span>Окончание</span>
                <input type="time" v-model="form.endTime" step="900" class="sch-input" />
              </label>
            </template>
          </div>

          <label v-if="createMode === 'assignment'" class="sch-field">
            <span>Комментарий для специалистов (необязательно)</span>
            <textarea v-model="form.comment" rows="2" class="sch-input"></textarea>
          </label>

          <p v-if="createError" class="sch-error">{{ createError }}</p>
        </div>
        <div class="sch-detail-foot">
          <button class="dm-btn dm-btn--ghost" @click="createOpen = false">Отмена</button>
          <button class="dm-btn dm-btn--primary" :disabled="submitting" @click="submitCreate">
            {{ submitting ? 'Сохранение…' : (createMode === 'assignment' ? 'Назначить' : 'Добавить') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { fullName } from '../utils/recipient';
import { notifySaved } from '../utils/toast';
import { PROFILE_LABELS } from '../utils/diagnosticBlocks';
import DiagnosticFillModal from '../components/DiagnosticFillModal.vue';
import DiagnosticBoardModal from '../components/DiagnosticBoardModal.vue';

const authStore = useAuthStore();
const canAssign = computed(() => authStore.isAdmin || authStore.isEmployee);
const canClaim = computed(() => authStore.isTeacher);

const DAY_START = 8;
const DAY_END = 20;
const slotHeight = 46;
const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
const slots = computed(() => {
  const out = [];
  for (let m = DAY_START * 60; m < DAY_END * 60; m += 30) {
    out.push({ min: m, isHour: m % 60 === 0, label: `${pad(Math.floor(m / 60))}:00` });
  }
  return out;
});
const gridHeight = (DAY_END - DAY_START) * 2 * slotHeight;

const tab = ref('day');
const loading = ref(false);
const events = ref([]);
const currentDate = ref(toYmd(new Date()));
const todayYmd = toYmd(new Date());

const fillAssignmentId = ref(null);
const boardSessionId = ref(null);
const detailEvent = ref(null);

const pool = ref([]);
const poolLoading = ref(false);
const claimSession = ref(null);
const claiming = ref(false);
const claimError = ref('');
const claimForm = reactive({ startTime: '09:00', endTime: '09:30' });

const createOpen = ref(false);
const createMode = ref('assignment');
const submitting = ref(false);
const createError = ref('');
const recipients = ref([]);
const directions = ref([]);
const specialists = ref([]);
const form = reactive({
  recipientId: null, directionId: null, specialistUserId: null,
  title: '', date: currentDate.value, startTime: '09:00', endTime: '09:30', comment: ''
});

function pad(n) { return String(n).padStart(2, '0'); }
function toYmd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fromYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function hhmm(t) { return t ? String(t).slice(0, 5) : ''; }
function humanDate(v) {
  const [y, m, d] = String(v || '').split('-');
  return y && m && d ? `${d}.${m}.${y}` : String(v || '');
}
function toMin(t) { const [h, m] = String(t).split(':'); return parseInt(h, 10) * 60 + parseInt(m, 10); }

const WEEK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEK_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function mondayOf(ymd) {
  const d = fromYmd(ymd);
  const wd = d.getDay();
  const diff = wd === 0 ? -6 : 1 - wd;
  d.setDate(d.getDate() + diff);
  return d;
}
const weekDays = computed(() => {
  const mon = mondayOf(currentDate.value);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return { ymd: toYmd(d), name: WEEK[i], dayNum: d.getDate() };
  });
});
const dayLabel = computed(() => {
  const d = fromYmd(currentDate.value);
  const wd = d.getDay(); const idx = wd === 0 ? 6 : wd - 1;
  return `${WEEK_FULL[idx]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
});
const rangeLabel = computed(() => {
  if (tab.value === 'day') return formatDate(currentDate.value);
  const days = weekDays.value;
  const a = fromYmd(days[0].ymd), b = fromYmd(days[6].ymd);
  return `${a.getDate()} ${MONTHS[a.getMonth()]} — ${b.getDate()} ${MONTHS[b.getMonth()]}`;
});
function formatDate(ymd) {
  const d = fromYmd(ymd);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const nowTick = ref(Date.now());
let nowTimer = null;
const nowOffset = computed(() => {
  nowTick.value;
  if (currentDate.value !== todayYmd) return null;
  const now = new Date();
  const min = now.getHours() * 60 + now.getMinutes();
  if (min < DAY_START * 60 || min > DAY_END * 60) return null;
  return (min - DAY_START * 60) / 30 * slotHeight;
});

const dayEvents = computed(() => eventsForDay(currentDate.value));
function eventsForDay(ymd) {
  return events.value
    .filter(e => String(e.date) === ymd)
    .slice()
    .sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
}

async function loadEvents() {
  loading.value = true;
  try {
    const days = weekDays.value;
    const from = days[0].ymd, to = days[6].ymd;
    const { data } = await api.get('/schedule/events', { params: { from, to } });
    events.value = data;
  } catch (err) {
    console.error(err);
    events.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadPool() {
  poolLoading.value = true;
  try {
    const { data } = await api.get('/schedule/pool');
    pool.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
    pool.value = [];
  } finally {
    poolLoading.value = false;
  }
}

const poolBadge = computed(() => {
  if (!pool.value.length) return 0;
  if (canClaim.value) return pool.value.filter((s) => !s.claimedByMe).length;
  return pool.value.length;
});

const myProfile = computed(() => {
  const id = authStore.user?.directionId;
  if (!id) return '';
  const d = directions.value.find((x) => x.id === id);
  return d ? directionLabel(d) : 'ваш профиль';
});

function statusLabel(s) {
  return { open: 'свободна', in_progress: 'в работе', completed: 'завершена', cancelled: 'отменена' }[s] || s;
}

function blockProfile(b) {
  return PROFILE_LABELS[b.profileKey] || b.direction?.name || 'Направление';
}

function canOpenBoard(s) {
  return canAssign.value || s.claimedByMe || s.canViewAll || s.canConclude;
}

async function switchToPool() {
  tab.value = 'pool';
  if (!directions.value.length) await loadDirections();
  await loadPool();
}

async function loadDirections() {
  try {
    const { data } = await api.get('/lists/directions');
    directions.value = data || [];
  } catch (err) {
    console.error(err);
  }
}

function openClaim(s) {
  claimError.value = '';
  claimForm.startTime = '09:00';
  claimForm.endTime = '09:30';
  claimSession.value = s;
}
function closeClaim() {
  if (claiming.value) return;
  claimSession.value = null;
}
async function submitClaim() {
  if (!claimSession.value || claiming.value) return;
  claimError.value = '';
  if (!claimForm.startTime || !claimForm.endTime) { claimError.value = 'Укажите время.'; return; }
  if (toMin(claimForm.endTime) <= toMin(claimForm.startTime)) {
    claimError.value = 'Окончание должно быть позже начала.'; return;
  }
  claiming.value = true;
  try {
    const { data } = await api.post(`/schedule/sessions/${claimSession.value.id}/claim`, {
      startTime: claimForm.startTime,
      endTime: claimForm.endTime
    });
    claimSession.value = null;
    await refreshAll();
    notifySaved('Реабилитант взят в работу, время занятия сохранено');
    if (data?.assignmentId) fillAssignmentId.value = data.assignmentId;
  } catch (err) {
    claimError.value = err.response?.data?.message || 'Не удалось взять реабилитанта.';
  } finally {
    claiming.value = false;
  }
}

function openBoard(id) { boardSessionId.value = id; }
function onBoardOpenBlock(assignmentId) {
  boardSessionId.value = null;
  fillAssignmentId.value = assignmentId;
}
async function onFillUpdated() { await refreshAll(); }

async function refreshAll() {
  await loadEvents();
  if (tab.value === 'pool' || pool.value.length) await loadPool();
}

function evStyle(ev) {
  const startMin = Math.max(toMin(ev.startTime), DAY_START * 60);
  const endMin = Math.min(toMin(ev.endTime), DAY_END * 60);
  const top = (startMin - DAY_START * 60) / 30 * slotHeight;
  const height = Math.max((endMin - startMin) / 30 * slotHeight, 26);
  return { top: top + 'px', height: (height - 4) + 'px' };
}
function evClass(ev) {
  return {
    'is-diag': ev.type === 'diagnostic',
    'is-lesson': ev.type === 'lesson',
    'is-done': ev.status === 'completed'
  };
}
function evTitle(ev) {
  if (ev.type === 'diagnostic') return ev.recipient ? fullName(ev.recipient) : 'Диагностика';
  return ev.title || 'Занятие';
}
function evSubtitle(ev) {
  const pk = ev.direction?.profileKey;
  return PROFILE_LABELS[pk] || ev.direction?.name || 'Диагностика';
}

function onEventClick(ev) {
  if (ev.type === 'diagnostic' && ev.assignmentId) {
    fillAssignmentId.value = ev.assignmentId;
  } else {
    detailEvent.value = ev;
  }
}
function onSlotClick(s) {
  if (!canCreate.value) return;
  const start = `${pad(Math.floor(s.min / 60))}:${pad(s.min % 60)}`;
  const endMin = s.min + 30;
  form.date = currentDate.value;
  form.startTime = start;
  form.endTime = `${pad(Math.floor(endMin / 60))}:${pad(endMin % 60)}`;
  openCreate();
}
const canCreate = computed(() => canAssign.value || authStore.isTeacher);

function shift(dir) {
  const d = fromYmd(currentDate.value);
  d.setDate(d.getDate() + dir * (tab.value === 'day' ? 1 : 7));
  currentDate.value = toYmd(d);
  loadEvents();
}
function goToday() { currentDate.value = todayYmd; loadEvents(); }

function canDelete(ev) {
  return canAssign.value || (authStore.isTeacher && ev.specialistUserId === authStore.user?.id);
}
async function deleteEvent(ev) {
  if (!confirm('Удалить это событие из расписания?')) return;
  try {
    await api.delete(`/schedule/events/${ev.id}`);
    detailEvent.value = null;
    await loadEvents();
  } catch (err) {
    alert(err.response?.data?.message || 'Не удалось удалить');
  }
}

function directionLabel(d) { return PROFILE_LABELS[d.profileKey] || d.name; }
function specialistName(s) {
  const n = [s.lastName, s.firstName].filter(Boolean).join(' ');
  return n || s.email || 'Специалист';
}

async function openCreate() {
  createError.value = '';
  createMode.value = canAssign.value ? 'assignment' : 'lesson';
  if (!form.date) form.date = currentDate.value;
  createOpen.value = true;
  if (!recipients.value.length || !directions.value.length) await loadRefs();
}
async function loadRefs() {
  try {
    const [recRes, dirRes, spRes] = await Promise.all([
      api.get('/recipients', { params: { page: 1, limit: 200 } }),
      api.get('/lists/directions'),
      canAssign.value ? api.get('/schedule/specialists') : Promise.resolve({ data: [] })
    ]);
    recipients.value = recRes.data.data || recRes.data || [];
    directions.value = dirRes.data || [];
    specialists.value = spRes.data || [];
  } catch (err) {
    console.error(err);
  }
}
async function submitCreate() {
  createError.value = '';
  if (!form.date) { createError.value = 'Укажите дату.'; return; }
  submitting.value = true;
  try {
    if (createMode.value === 'assignment') {
      if (!form.recipientId) {
        createError.value = 'Выберите реабилитанта.'; submitting.value = false; return;
      }
      const { data: session } = await api.post('/schedule/sessions', {
        recipientId: form.recipientId,
        date: form.date,
        note: form.comment || null
      });
      const when = session?.date || form.date;
      createOpen.value = false;
      resetForm();
      await switchToPool();
      notifySaved(`Диагностика назначена на дату — ${humanDate(when)}`);
      return;
    }

    if (!form.startTime || !form.endTime) { createError.value = 'Укажите время.'; submitting.value = false; return; }
    if (toMin(form.endTime) <= toMin(form.startTime)) {
      createError.value = 'Окончание должно быть позже начала.'; submitting.value = false; return;
    }
    const body = {
      title: form.title || 'Занятие', recipientId: form.recipientId || null,
      date: form.date, startTime: form.startTime, endTime: form.endTime
    };
    if (canAssign.value && form.specialistUserId) body.specialistUserId = form.specialistUserId;
    await api.post('/schedule/events', body);

    createOpen.value = false;
    resetForm();
    await loadEvents();
    notifySaved(`Занятие «${body.title}» сохранено в расписании`);
  } catch (err) {
    const d = err.response?.data;
    createError.value = d?.blockers?.length
      ? d.blockers.map((b) => b.message).join('; ')
      : (d?.message || 'Не удалось сохранить.');
  } finally {
    submitting.value = false;
  }
}
function resetForm() {
  form.recipientId = null; form.directionId = null; form.specialistUserId = null;
  form.title = ''; form.comment = ''; form.startTime = '09:00'; form.endTime = '09:30';
}

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadEvents();
  loadDirections();
  loadPool();
  nowTimer = setInterval(() => { nowTick.value = Date.now(); }, 60000);
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
  if (nowTimer) clearInterval(nowTimer);
});
</script>

<style scoped>
.sch-page { font-family: 'Inter', system-ui, sans-serif; color: #131713; }

.sch-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.sch-title { font-family: 'Lora', Georgia, serif; font-weight: 600; font-size: 1.9rem; line-height: 1.15; color: #0F140F; margin: 0; }
.sch-sub { color: #4F564A; font-size: 0.95rem; margin: 0.35rem 0 0; }
.sch-add {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: #2F4A2F; color: #fff; border: none; border-radius: 0.7rem;
  padding: 0.6rem 1rem; font-weight: 600; font-size: 0.88rem; cursor: pointer;
  font-family: inherit; transition: background 0.15s, transform 0.15s;
}
.sch-add:hover { background: #24391F; transform: translateY(-1px); }

.sch-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.85rem; flex-wrap: wrap; }
.sch-tabs { display: inline-flex; background: #F3EEE4; border: 1px solid #E4DECF; border-radius: 0.7rem; padding: 0.2rem; gap: 0.2rem; }
.sch-tab { border: none; background: none; padding: 0.45rem 0.9rem; border-radius: 0.55rem; font-size: 0.85rem; font-weight: 600; color: #6E7368; cursor: pointer; font-family: inherit; }
.sch-tab.active { background: #FFFFFF; color: #2F4A2F; box-shadow: 0 1px 3px rgba(17,34,17,0.08); }
.sch-tab-badge {
  display: inline-grid; place-items: center; min-width: 1.15rem; height: 1.15rem;
  margin-left: 0.35rem; padding: 0 0.28rem; border-radius: 999px;
  background: #B0533F; color: #fff; font-size: 0.68rem; font-weight: 700;
}

.sch-pool { display: flex; flex-direction: column; gap: 0.9rem; }
.sch-pool-lead { margin: 0; color: #4F564A; font-size: 0.9rem; line-height: 1.5; max-width: 62ch; }
.sch-pool-warn {
  padding: 0.7rem 0.9rem; border-radius: 0.7rem;
  background: #FAE9E0; border: 1px solid #EFC9B8; color: #8A3A28; font-size: 0.85rem;
}
.sch-pool-list { display: grid; gap: 0.85rem; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
.sch-pcard { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.65rem; }
.sch-pcard.is-mine { border-left: 3px solid #5F7E45; }
.sch-pcard-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
.sch-pcard-name { font-family: 'Lora', Georgia, serif; font-size: 1.05rem; font-weight: 600; color: #0F140F; margin: 0; }
.sch-pcard-meta { margin-top: 0.25rem; font-size: 0.78rem; color: #6E7368; display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; }
.sch-pcard-date { font-weight: 600; color: #4F564A; }
.sch-pdot { color: #C4BFB2; }
.sch-pstatus { font-weight: 600; }
.sch-pstatus.open { color: #B97718; }
.sch-pstatus.in_progress { color: #2F4A2F; }
.sch-pstatus.completed { color: #6E7368; }
.sch-pcount {
  flex-shrink: 0; font-size: 0.76rem; font-weight: 700; color: #4F564A;
  background: #F3EEE4; border: 1px solid #E4DECF; border-radius: 999px; padding: 0.2rem 0.55rem;
}
.sch-pnote {
  margin: 0; padding: 0.5rem 0.65rem; border-radius: 0.55rem;
  background: #FBF9F3; border: 1px dashed #E4DECF; color: #4F564A;
  font-size: 0.83rem; line-height: 1.45;
}
.sch-pblocks { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.sch-pblock {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.76rem; padding: 0.26rem 0.55rem; border-radius: 999px;
  background: #F3EEE4; border: 1px solid #E4DECF; color: #4F564A;
}
.sch-pblock.done { background: #E0EBD1; border-color: #CBDDB4; color: #234623; }
.sch-pblock.mine { font-weight: 600; border-color: #5F7E45; }
.sch-pblock-ico { font-weight: 700; }
.sch-pempty { margin: 0; font-size: 0.83rem; color: #8A8F82; font-style: italic; }
.sch-pcard-foot { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-top: auto; padding-top: 0.35rem; }
.sch-ptaken { font-size: 0.8rem; color: #2F4A2F; font-weight: 600; }

.sch-claim-info { display: grid; gap: 0.3rem; margin-bottom: 0.6rem; }
.sch-claim-hint { margin: 0 0 0.6rem; font-size: 0.82rem; color: #6E7368; line-height: 1.45; }
.sch-assign-hint {
  margin: 0 0 0.35rem; padding: 0.6rem 0.7rem; border-radius: 0.6rem;
  background: #EEF4E2; border: 1px dashed #CBDDB4; color: #2F4A2F;
  font-size: 0.82rem; line-height: 1.45;
}

.sch-nav { display: inline-flex; align-items: center; gap: 0.4rem; }
.sch-nav-btn { width: 2rem; height: 2rem; display: grid; place-items: center; border: 1px solid #D6CFBE; background: #fff; border-radius: 0.55rem; color: #4F564A; cursor: pointer; }
.sch-nav-btn:hover { border-color: #5F7E45; color: #2F4A2F; }
.sch-today { border: 1px solid #D6CFBE; background: #fff; border-radius: 0.55rem; padding: 0.4rem 0.75rem; font-size: 0.83rem; font-weight: 600; color: #4F564A; cursor: pointer; font-family: inherit; }
.sch-today:hover { border-color: #5F7E45; color: #2F4A2F; }
.sch-range { font-size: 0.9rem; color: #4F564A; font-weight: 500; margin-left: 0.35rem; }

.sch-legend { display: flex; gap: 1.1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.sch-leg { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #4F564A; }
.sch-swatch { width: 0.85rem; height: 0.85rem; border-radius: 0.28rem; display: inline-block; }
.sch-swatch--diag { background: #B0533F; }
.sch-swatch--lesson { background: #3E6D99; }
.sch-swatch--done { background: #3F6E3F; }

.card { background: #FFFFFF; border: 1px solid #E4DECF; border-radius: 1.1rem; overflow: hidden; }

.sch-loading { text-align: center; padding: 3rem; }
.sch-spinner { width: 40px; height: 40px; margin: 0 auto; border: 4px solid rgba(95,126,69,0.2); border-top-color: #3F6E3F; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.sch-day-head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.35rem; border-bottom: 1px solid #EFEADC; }
.sch-day-title { font-family: 'Lora', Georgia, serif; font-weight: 600; font-size: 1.1rem; color: #0F140F; }
.sch-day-count { font-size: 0.8rem; color: #6E7368; }
.sch-empty { padding: 1.5rem 1.35rem; color: #6E7368; font-size: 0.9rem; }

.sch-timeline { position: relative; padding: 0.5rem 1.35rem 1rem 0; }
.sch-slots { position: relative; margin-left: 4.2rem; border-left: 1px solid #EFEADC; }
.sch-slot { position: relative; border-bottom: 1px dashed #F1ECE0; cursor: pointer; }
.sch-slot--hour { border-bottom: 1px solid #EFEADC; }
.sch-slot:hover { background: #FBF9F3; }
.sch-slot-time { position: absolute; left: -4rem; top: -0.55rem; font-size: 0.72rem; color: #8A8F82; width: 3.5rem; text-align: right; }

.sch-events { position: absolute; top: 0.5rem; left: 5.55rem; right: 1.35rem; bottom: 1rem; pointer-events: none; }
.sch-ev {
  position: absolute; left: 0; right: 0; pointer-events: auto;
  display: flex; flex-direction: column; gap: 0.1rem; text-align: left;
  border: 1px solid transparent; border-left-width: 4px; border-radius: 0.55rem;
  padding: 0.35rem 0.6rem; cursor: pointer; overflow: hidden;
  font-family: inherit; transition: transform 0.12s, box-shadow 0.12s;
}
.sch-ev:hover { transform: translateX(2px); box-shadow: 0 4px 12px rgba(17,34,17,0.12); }
.sch-ev-time { font-size: 0.7rem; font-weight: 600; opacity: 0.85; }
.sch-ev-title { font-size: 0.85rem; font-weight: 600; line-height: 1.2; }
.sch-ev-sub { font-size: 0.72rem; opacity: 0.8; }

.sch-ev.is-diag { background: #FAE9E0; border-color: #E7BBA9; border-left-color: #B0533F; color: #7A3324; }
.sch-ev.is-lesson { background: #E4EEF6; border-color: #B9D2E6; border-left-color: #3E6D99; color: #1F4568; }
.sch-ev.is-done { background: #E0EBD1; border-color: #C0D4A6; border-left-color: #3F6E3F; color: #234623; }

.sch-now { position: absolute; left: 5.55rem; right: 1.35rem; height: 0; border-top: 2px solid #B0533F; z-index: 5; }
.sch-now span { position: absolute; left: -5px; top: -5px; width: 9px; height: 9px; border-radius: 50%; background: #B0533F; }

.sch-week { padding: 0; }
.sch-week-grid {
  display: grid;
  grid-template-columns: 3.5rem repeat(7, 1fr);
  grid-auto-rows: min-content;
}
.sch-corner { border-bottom: 1px solid #EFEADC; border-right: 1px solid #EFEADC; }
.sch-wday { text-align: center; padding: 0.6rem 0.25rem; border-bottom: 1px solid #EFEADC; border-right: 1px solid #F1ECE0; }
.sch-wday--today { background: #EEF4E2; }
.sch-wday-name { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6E7368; font-weight: 600; }
.sch-wday-num { font-family: 'Lora', Georgia, serif; font-size: 1.15rem; color: #0F140F; }
.sch-wday--today .sch-wday-num { color: #2F4A2F; }

.sch-wgutter { border-right: 1px solid #EFEADC; }
.sch-whour { position: relative; }
.sch-whour span { position: absolute; top: -0.55rem; right: 0.35rem; font-size: 0.68rem; color: #8A8F82; }
.sch-wcol { position: relative; border-right: 1px solid #F1ECE0; }
.sch-wline { border-bottom: 1px solid #F4EFE4; }
.sch-wev {
  position: absolute; left: 3px; right: 3px;
  display: flex; flex-direction: column; text-align: left; overflow: hidden;
  border: 1px solid transparent; border-left-width: 3px; border-radius: 0.4rem;
  padding: 0.2rem 0.35rem; cursor: pointer; font-family: inherit;
  transition: transform 0.12s, box-shadow 0.12s;
}
.sch-wev:hover { box-shadow: 0 4px 12px rgba(17,34,17,0.14); z-index: 6; }
.sch-wev-time { font-size: 0.62rem; font-weight: 700; opacity: 0.85; }
.sch-wev-title { font-size: 0.72rem; font-weight: 600; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sch-wev.is-diag { background: #FAE9E0; border-color: #E7BBA9; border-left-color: #B0533F; color: #7A3324; }
.sch-wev.is-lesson { background: #E4EEF6; border-color: #B9D2E6; border-left-color: #3E6D99; color: #1F4568; }
.sch-wev.is-done { background: #E0EBD1; border-color: #C0D4A6; border-left-color: #3F6E3F; color: #234623; }

.sch-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(17,34,17,0.45); display: flex; align-items: flex-start; justify-content: center; padding: 2.5rem 1rem; overflow-y: auto; }
.sch-detail, .sch-create { background: #F7F4ED; width: 100%; max-width: 460px; border-radius: 1.1rem; border: 1px solid #E4DECF; box-shadow: 0 24px 60px rgba(17,34,17,0.28); overflow: hidden; }
.sch-create { max-width: 540px; }
.sch-detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.15rem 1.35rem; background: #fff; border-bottom: 1px solid #EFEADC; }
.sch-detail-head h3 { font-family: 'Lora', Georgia, serif; font-size: 1.2rem; color: #0F140F; margin: 0.2rem 0 0; }
.sch-detail-kicker { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; }
.sch-detail-kicker.is-diag { color: #B0533F; }
.sch-detail-kicker.is-lesson { color: #3E6D99; }
.dm-x { background: none; border: none; color: #6E7368; cursor: pointer; padding: 0.3rem; border-radius: 0.5rem; flex-shrink: 0; }
.dm-x:hover { background: #F3EEE4; color: #131713; }
.sch-detail-body { padding: 1.15rem 1.35rem; }
.sch-detail-row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.45rem 0; border-bottom: 1px solid #EFEADC; font-size: 0.9rem; }
.sch-detail-row:last-child { border-bottom: none; }
.sch-detail-row span { color: #6E7368; }
.sch-detail-row b { color: #131713; }
.sch-detail-foot { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.35rem; background: #fff; border-top: 1px solid #EFEADC; flex-wrap: wrap; }

.sch-create-body { padding: 1.15rem 1.35rem; display: flex; flex-direction: column; gap: 0.8rem; }
.sch-mode { display: inline-flex; background: #F3EEE4; border: 1px solid #E4DECF; border-radius: 0.6rem; padding: 0.2rem; gap: 0.2rem; align-self: flex-start; }
.sch-mode-btn { border: none; background: none; padding: 0.4rem 0.9rem; border-radius: 0.45rem; font-size: 0.82rem; font-weight: 600; color: #6E7368; cursor: pointer; font-family: inherit; }
.sch-mode-btn.active { background: #fff; color: #2F4A2F; box-shadow: 0 1px 3px rgba(17,34,17,0.08); }
.sch-field { display: flex; flex-direction: column; gap: 0.3rem; }
.sch-field > span { font-size: 0.78rem; font-weight: 600; color: #4F564A; }
.sch-field-row { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 0.6rem; }
.sch-input { border: 1px solid #D6CFBE; border-radius: 0.55rem; padding: 0.5rem 0.65rem; font-family: inherit; font-size: 0.88rem; color: #131713; background: #FBF9F3; width: 100%; }
.sch-input:focus { outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95,126,69,0.18); }
textarea.sch-input { resize: vertical; }
.sch-error { color: #B0533F; font-size: 0.83rem; margin: 0; }

.dm-btn { padding: 0.55rem 1rem; border-radius: 0.65rem; font-weight: 600; font-size: 0.86rem; cursor: pointer; border: 1px solid transparent; font-family: inherit; transition: background 0.14s, transform 0.14s; }
.dm-btn:disabled { opacity: 0.6; cursor: default; }
.dm-btn--ghost { background: transparent; border-color: #D6CFBE; color: #4F564A; }
.dm-btn--ghost:hover { background: #F3EEE4; }
.dm-btn--primary { background: #2F4A2F; color: #fff; }
.dm-btn--primary:hover:not(:disabled) { background: #24391F; transform: translateY(-1px); }
.dm-btn--danger { background: #FAE9E0; border-color: #E7BBA9; color: #8A3A28; }
.dm-btn--danger:hover { background: #F5DBCE; }

@media (max-width: 640px) {
  .sch-field-row { grid-template-columns: 1fr; }
  .sch-week-grid { grid-template-columns: 2.5rem repeat(7, minmax(64px, 1fr)); overflow-x: auto; }
}
</style>

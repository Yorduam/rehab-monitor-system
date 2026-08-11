<template>
  <div class="teach-dash">

    <div class="greet">
      <div class="eyebrow">{{ todayLabel }}</div>
      <h1>{{ greetPart }}, <span class="accent">{{ greetName }}</span></h1>
      <p class="lede">{{ ledeText }}</p>
    </div>

    <div v-if="error" class="err-bar" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>{{ error }}</span>
      <button type="button" class="err-x" aria-label="Скрыть" @click="error = ''">×</button>
    </div>

    <div class="grid grid-4 kpi-row">
      <div class="kpi">
        <div class="k-label">
          <span class="k-icon ic-sage" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg></span>
          Занятий сегодня
        </div>
        <div class="k-value">{{ kpi.lessonsToday }}</div>
        <div class="k-trend flat">
          <template v-if="kpi.lessonsToday">{{ kpi.lessonsDone }} проведено · {{ kpi.lessonsAhead }} впереди</template>
          <template v-else>расписание на сегодня пусто</template>
        </div>
      </div>

      <div class="kpi">
        <div class="k-label">
          <span class="k-icon ic-blue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></span>
          Реабилитантов
        </div>
        <div class="k-value">{{ kpi.recipients }}</div>
        <div class="k-trend flat">
          <template v-if="kpi.groupsCount">в {{ kpi.groupsCount }} {{ plural(kpi.groupsCount, 'группе', 'группах', 'группах') }}</template>
          <template v-else-if="kpi.recipients">групп пока нет</template>
          <template v-else>вас ещё ни на кого не назначили</template>
        </div>
      </div>

      <div class="kpi">
        <div class="k-label">
          <span class="k-icon ic-amber" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
          Диагностик ждёт
        </div>
        <div class="k-value">{{ kpi.diagPending }}</div>
        <div v-if="kpi.diagOverdue" class="k-trend down">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          просрочено {{ kpi.diagOverdue }}
        </div>
        <div v-else-if="kpi.diagDueToday" class="k-trend down">{{ kpi.diagDueToday }} со сроком сегодня</div>
        <div v-else class="k-trend flat">{{ kpi.diagPending ? 'сроки не горят' : 'всё заполнено' }}</div>
      </div>

      <div class="kpi">
        <div class="k-label">
          <span class="k-icon ic-rose" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
          Требуют внимания
        </div>
        <div class="k-value">{{ kpi.attention }}</div>
        <div class="k-trend" :class="kpi.attention ? 'down' : 'flat'">
          {{ kpi.attention ? 'неотмеченные занятия и сигналы' : 'ничего не висит' }}
        </div>
      </div>
    </div>

    <div class="grid grid-main-aside">
      <div class="stack">

        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Сегодня</div>
              <div class="card-sub">Ваши занятия и отметка о проведении</div>
            </div>
            <span v-if="events.length" class="dot-tag"><span class="d" aria-hidden="true"></span>Сейчас {{ nowTime }}</span>
          </div>
          <div class="card-body">
            <div v-if="loading" class="empty-note">Загружаем…</div>
            <div v-else-if="!events.length" class="empty-note">
              На сегодня занятий нет.<br>
              Как только вам поставят занятие или диагностику, они появятся здесь — вместе с кнопкой отметки.
            </div>
            <div v-else class="timeline">
              <div v-for="ev in events" :key="ev.id" class="tl-item">
                <div class="tl-time">{{ ev.startTime }}<div class="to">до {{ ev.endTime }}</div></div>
                <div class="tl-body">
                  <div class="tl-rail" :class="ev.state === 'done' ? 'done' : (ev.state === 'now' ? 'now' : '')">
                    <div class="tl-name">
                      {{ eventKind(ev) }}
                      <template v-if="ev.recipientId">
                        —
                        <button class="p-link" type="button" @click="openRecipient(ev.recipientId)">{{ ev.recipientName }}</button>
                      </template>
                    </div>
                    <div class="tl-sub">
                      <span v-if="cabinet">Каб. {{ cabinet }}</span>
                      <span v-if="ev.directionName">{{ ev.directionName }}</span>
                      <span v-if="ev.state === 'past'" class="warn">Время прошло, отметки нет</span>
                    </div>
                    <div class="tl-actions">
                      <span v-if="ev.state === 'done'" class="tag tag-sage">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        Проведено
                      </span>
                      <button
                        v-if="ev.canMark && ev.state === 'done'"
                        class="btn btn-ghost btn-sm" type="button"
                        :disabled="marking === ev.id"
                        @click="mark(ev.id, 'scheduled')"
                      >Снять отметку</button>
                      <button
                        v-else-if="ev.canMark"
                        class="btn btn-primary btn-sm" type="button"
                        :disabled="marking === ev.id"
                        @click="mark(ev.id, 'completed')"
                      >{{ marking === ev.id ? 'Отмечаем…' : 'Отметить проведённым' }}</button>
                      <button
                        v-if="ev.assignmentId"
                        class="btn btn-secondary btn-sm" type="button"
                        @click="openFill(ev.assignmentId)"
                      >Заполнить блок</button>
                      <button
                        v-if="ev.recipientId"
                        class="btn btn-secondary btn-sm" type="button"
                        @click="openRecipient(ev.recipientId)"
                      >Карточка</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Диагностики к заполнению</div>
              <div class="card-sub">Внесите результаты по вашему профилю</div>
            </div>
            <button class="card-link" type="button" @click="goTo('diagnostics', 'Диагностика')">Все диагностики</button>
          </div>
          <div class="card-body">
            <div v-if="loading" class="empty-note">Загружаем…</div>
            <div v-else-if="!pending.length" class="empty-note">
              Незаполненных блоков нет — всё, что вам назначали, закрыто.
            </div>
            <div v-else class="tasks">
              <div v-for="p in pending" :key="p.id" class="task">
                <span class="task-ic" :class="p.isOverdue || p.isToday ? 'ic-amber' : 'ic-blue'" aria-hidden="true">
                  <svg v-if="p.isOverdue || p.isToday" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6"/></svg>
                </span>
                <div class="task-main">
                  <div class="t-title">
                    <button class="p-link" type="button" @click="openRecipient(p.recipientId)">{{ p.recipientName }}</button>
                    · {{ p.directionName }}
                  </div>
                  <div class="t-sub">
                    <span v-if="p.isOverdue" class="due">Просрочено, срок {{ dayLabel(p.date) }}</span>
                    <span v-else-if="p.isToday" class="due">Срок сегодня</span>
                    <span v-else>Срок {{ dayLabel(p.date) }}</span>
                    · {{ progressLabel(p) }}
                  </div>
                </div>
                <div class="task-end">
                  <button
                    class="btn btn-sm" :class="p.filled ? 'btn-secondary' : 'btn-primary'"
                    type="button" @click="openFill(p.id)"
                  >{{ p.filled ? 'Продолжить' : 'Заполнить' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <aside class="stack">

        <div class="card" :class="{ attn: attention.length }">
          <div class="card-head"><div class="card-title-sans">Требуют внимания</div></div>
          <div class="card-body">
            <div v-if="loading" class="empty-note">Загружаем…</div>
            <div v-else-if="!attention.length" class="empty-note">Ничего не висит.</div>
            <div v-else class="tasks">
              <div v-for="(a, i) in attention" :key="a.kind + '-' + (a.eventId || a.recipientId || i)" class="task">
                <span class="task-ic" :class="a.kind === 'unmarked' ? 'ic-rose' : 'ic-amber'" aria-hidden="true">
                  <svg v-if="a.kind === 'unmarked'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </span>
                <div class="task-main">
                  <div class="t-title">
                    <button v-if="a.recipientId" class="p-link" type="button" @click="openRecipient(a.recipientId)">{{ a.name }}</button>
                    <span v-else>{{ a.name }}</span>
                    <template v-if="a.kind === 'note'">
                      —
                      <span class="flag-warn lvl-amber" tabindex="0" :aria-describedby="a.text ? ('tf-' + i) : null">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Особая отметка
                        <span v-if="a.text" class="flag-tip" :id="'tf-' + i" role="tooltip">{{ a.text }}</span>
                      </span>
                    </template>
                    <template v-else> — {{ a.title }}</template>
                  </div>
                  <div class="t-sub">
                    <template v-if="a.kind === 'note'">
                      <template v-if="a.locked">Текст закрыт — откройте карточку и укажите причину</template>
                      <template v-else>Учтите при подготовке занятия</template>
                    </template>
                    <template v-else>{{ a.text }}</template>
                  </div>
                </div>
                <div v-if="a.kind === 'unmarked'" class="task-end">
                  <button
                    class="btn btn-secondary btn-sm" type="button"
                    :disabled="marking === a.eventId"
                    @click="mark(a.eventId, 'completed')"
                  >Провёл</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><div class="card-title-sans">Мои группы</div></div>
          <div class="card-body">
            <div v-if="loading" class="empty-note">Загружаем…</div>
            <div v-else-if="!groups.length" class="empty-note">
              Групп под вашим кураторством пока нет.
            </div>
            <div v-else class="mlist">
              <div v-for="g in groups" :key="g.id" class="mrow">
                <span class="avatar" :class="avatarClass(g.id)" aria-hidden="true">{{ groupInitial(g.name) }}</span>
                <div class="m-main">
                  <div class="m-name">{{ g.name }}</div>
                  <div class="m-sub">
                    {{ g.participantsCount }}
                    {{ plural(g.participantsCount, 'реабилитант', 'реабилитанта', 'реабилитантов') }}
                  </div>
                </div>
                <div class="m-actions">
                  <button class="btn btn-secondary btn-sm" type="button" @click="goTo('groups', 'Группы')">Открыть</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </aside>
    </div>

    <DiagnosticFillModal
      v-if="fillAssignmentId"
      :assignment-id="fillAssignmentId"
      @close="fillAssignmentId = null"
      @updated="onFillUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { usePageStore } from '../stores/page';
import { notifySaved } from '../utils/toast';
import DiagnosticFillModal from '../components/DiagnosticFillModal.vue';

const authStore = useAuthStore();
const pageStore = usePageStore();

const DOW = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const now = new Date();
const todayLabel = `${DOW[now.getDay()]}, ${now.getDate()} ${MONTHS_GEN[now.getMonth()]}`;
const greetPart = now.getHours() < 6 ? 'Доброй ночи'
  : now.getHours() < 12 ? 'Доброе утро'
    : now.getHours() < 18 ? 'Добрый день' : 'Добрый вечер';
const greetName = computed(() => authStore.user?.firstName || authStore.user?.fullName || 'коллега');

function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

const dayLabel = (iso) => {
  if (!iso) return '—';
  const [, m, d] = String(iso).split('-');
  const month = MONTHS_GEN[parseInt(m, 10) - 1];
  return month ? `${parseInt(d, 10)} ${month}` : iso;
};

const AV = ['av-sage', 'av-blue', 'av-amber', 'av-plum', 'av-teal', 'av-rose'];
const avatarClass = (id) => AV[Math.abs(Number(id) || 0) % AV.length];
const groupInitial = (name) => (String(name || '?').replace(/[«»"'\s]/g, '').charAt(0) || '?').toUpperCase();

const loading = ref(true);
const error = ref('');
const marking = ref(null);
const fillAssignmentId = ref(null);

const nowTime = ref('');
const CLOCK_MS = 30 * 1000;
const REFRESH_MS = 5 * 60 * 1000;
let clockTimer = null;
let refreshTimer = null;
const tickClock = () => {
  const d = new Date();
  nowTime.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const cabinet = ref('');
const events = ref([]);
const pending = ref([]);
const attention = ref([]);
const groups = ref([]);
const kpi = ref({
  lessonsToday: 0, lessonsDone: 0, lessonsAhead: 0,
  recipients: 0, groupsCount: 0,
  diagPending: 0, diagDueToday: 0, diagOverdue: 0, attention: 0
});

const eventKind = (ev) => {
  if (ev.type === 'diagnostic') return 'Диагностика';
  if (ev.recipientId) return ev.directionName || 'Индивидуальное занятие';
  return ev.title || 'Занятие';
};

const progressLabel = (p) => {
  if (!p.total) return p.blockStatus === 'assigned' ? 'не начато' : 'в работе';
  if (!p.filled) return `не начато, ${p.total} ${plural(p.total, 'поле', 'поля', 'полей')}`;
  return `заполнено ${p.filled} из ${p.total} ${plural(p.total, 'поля', 'полей', 'полей')}`;
};

const ledeText = computed(() => {
  if (loading.value) return 'Собираем ваш день…';
  const parts = [];
  const n = kpi.value.lessonsToday;
  parts.push(n
    ? `Сегодня ${n} ${plural(n, 'занятие', 'занятия', 'занятий')}.`
    : 'На сегодня занятий не назначено.');
  const r = kpi.value.recipients;
  if (r) parts.push(`Вы ведёте ${r} ${plural(r, 'реабилитанта', 'реабилитантов', 'реабилитантов')}.`);
  const d = kpi.value.diagPending;
  parts.push(d
    ? `${d} ${plural(d, 'диагностика ждёт', 'диагностики ждут', 'диагностик ждут')} заполнения.`
    : 'Диагностики заполнены.');
  return parts.join(' ');
});

const load = async () => {
  try {
    const { data } = await api.get('/dashboard/teacher');
    cabinet.value = data.cabinet || '';
    events.value = data.today || [];
    pending.value = data.pending || [];
    attention.value = data.attention || [];
    groups.value = data.groups || [];
    kpi.value = { ...kpi.value, ...(data.kpi || {}) };
    error.value = '';
  } catch (e) {
    console.error('teacherDashboard:', e);
    error.value = 'Не удалось загрузить данные. Обновите страницу.';
  } finally {
    loading.value = false;
  }
};

const mark = async (eventId, status) => {
  if (!eventId || marking.value) return;
  marking.value = eventId;
  try {
    await api.patch(`/schedule/events/${eventId}`, { status });
    notifySaved(status === 'completed' ? 'Занятие отмечено как проведённое' : 'Отметка снята');
    await load();
  } catch (e) {
    console.error('markEvent:', e);
    error.value = e?.response?.data?.message || 'Не удалось сохранить отметку';
  } finally {
    marking.value = null;
  }
};

const openFill = (assignmentId) => { fillAssignmentId.value = assignmentId; };
const onFillUpdated = () => { load(); };

const goTo = (page, title) => pageStore.setPage(page, title || page, {});
const openRecipient = (id) => {
  if (id) pageStore.setPage('recipient-details', 'Карточка реабилитанта', { recipientId: id });
};

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  tickClock();
  clockTimer = setInterval(tickClock, CLOCK_MS);
  refreshTimer = setInterval(load, REFRESH_MS);
  load();
});
onUnmounted(() => {
  clearInterval(clockTimer);
  clearInterval(refreshTimer);
  document.documentElement.style.removeProperty('--bg-app');
});
</script>

<style scoped>
.teach-dash {
  --font-serif: 'Lora', 'Times New Roman', Georgia, serif;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --fs-11: 0.6875rem; --fs-12: 0.75rem;   --fs-13: 0.8125rem;
  --fs-14: 0.875rem;  --fs-15: 0.9375rem; --fs-16: 1rem;
  --fs-18: 1.125rem;  --fs-20: 1.25rem;   --fs-24: 1.5rem;
  --fs-28: 1.75rem;   --fs-32: 2rem;      --fs-40: 2.5rem;

  --space-1: 0.25rem; --space-2: 0.5rem;  --space-3: 0.75rem;
  --space-4: 1rem;    --space-5: 1.25rem; --space-6: 1.5rem;
  --space-8: 2rem;
  --tap-min: 2.75rem;

  --canvas: #F7F4ED;
  --paper: #FFFFFF;
  --paper-soft: #F2ECDF;
  --paper-sunken: #E8E1D0;

  --ink: #131713;
  --ink-strong: #0A0D0A;
  --ink-muted: #3A4036;
  --ink-subtle: #4F5749;

  --line: #D6CFBE;
  --line-soft: #E4DECF;
  --line-strong: #B8AF9A;

  --sage-900: #112211; --sage-800: #1B331B; --sage-700: #234623;
  --sage-500: #3F6E3F; --sage-100: #D6E4BE; --sage-50: #EBF2D8;
  --amber-700: #6B3E0E; --amber-500: #B97718; --amber-100: #F2DCB1; --amber-50: #FBF0D6;
  --rose-700: #6B2519;  --rose-500: #B14B39;  --rose-100: #EDCABE;  --rose-50: #F8E2D7;
  --blue-700: #1F3E55;  --blue-500: #41698A;  --blue-100: #C8D7E3;  --blue-50: #E0EAF1;
  --plum-700: #4C2B52;  --plum-500: #845B8B;  --plum-100: #E5D6E8;  --plum-50: #F2E8F5;
  --teal-700: #1E4A4A;  --teal-500: #437A7A;  --teal-100: #D0E5E5;  --teal-50: #E5F0F0;

  --r-sm: 0.375rem; --r-md: 0.625rem; --r-lg: 1rem; --r-xl: 1.375rem;
  --shadow-sm: 0 1px 2px rgba(17,34,17,0.04), 0 1px 0 rgba(17,34,17,0.03);
  --shadow-md: 0 0.25rem 0.875rem rgba(17,34,17,0.06), 0 1px 2px rgba(17,34,17,0.04);
  --shadow-lg: 0 0.75rem 2.5rem rgba(17,34,17,0.09), 0 2px 6px rgba(17,34,17,0.04);
  --focus-ring: 0 0 0 0.1875rem rgba(63,110,63,0.9);

  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--fs-15);
  line-height: 1.55;
  animation: teachIn 0.4s cubic-bezier(0.2,0.7,0.2,1);
}
@keyframes teachIn { from { opacity: 0; transform: translateY(0.5rem); } to { opacity: 1; transform: none; } }

.teach-dash button { cursor: pointer; }
.teach-dash button:disabled { cursor: default; opacity: 0.6; }

.greet { margin-bottom: var(--space-6); }
.greet .eyebrow { font-size: var(--fs-13); color: var(--ink-muted); font-weight: 500; letter-spacing: 0.01em; }
.greet h1 {
  font-family: var(--font-serif); font-weight: 600; letter-spacing: -0.025em;
  color: var(--ink-strong); line-height: 1.06; font-size: var(--fs-40); margin-top: 0.125rem;
}
.greet h1 .accent { color: var(--sage-700); }
.greet .lede { font-size: var(--fs-16); color: var(--ink-muted); margin-top: var(--space-2); max-width: 46rem; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4375rem;
  min-height: var(--tap-min); padding: 0.6875rem 1.125rem; border-radius: 0.625rem;
  font-family: inherit; font-size: var(--fs-15); font-weight: 500; white-space: nowrap;
  border: 0.0625rem solid transparent; transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.btn svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
.btn-primary { background: var(--sage-900); color: #F4F8EC; border-color: var(--sage-900); }
.btn-primary:not(:disabled):hover { background: var(--sage-700); border-color: var(--sage-700); }
.btn-secondary { background: var(--paper); color: var(--ink-strong); border-color: var(--line-strong); }
.btn-secondary:not(:disabled):hover { background: var(--paper-soft); border-color: var(--ink-muted); }
.btn-ghost { background: none; color: var(--ink-muted); border-color: transparent; }
.btn-ghost:not(:disabled):hover { background: var(--paper-soft); color: var(--ink-strong); }
.btn-sm { min-height: 2.25rem; padding: 0.4375rem 0.75rem; font-size: var(--fs-14); }
.btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }

.grid { display: grid; gap: var(--space-5); align-items: start; }
.grid-4 { grid-template-columns: repeat(4, minmax(0,1fr)); }
.grid-main-aside { grid-template-columns: minmax(0,1fr) 22rem; }
.stack { display: grid; gap: var(--space-5); align-content: start; min-width: 0; }
.kpi-row { margin-bottom: var(--space-6); }

.kpi {
  background: var(--paper); border: 0.0625rem solid var(--line);
  border-radius: var(--r-lg); padding: 1.125rem 1.25rem; box-shadow: var(--shadow-sm);
}
.kpi .k-label {
  font-size: var(--fs-12); text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--ink-muted); font-weight: 600;
  display: flex; align-items: center; gap: 0.4375rem;
}
.kpi .k-icon { width: 1.75rem; height: 1.75rem; flex: 0 0 1.75rem; border-radius: var(--r-sm); display: grid; place-items: center; }
.kpi .k-icon svg { width: 0.9375rem; height: 0.9375rem; }
.kpi .k-value {
  font-family: var(--font-serif); font-size: var(--fs-32); font-weight: 500;
  color: var(--ink-strong); letter-spacing: -0.025em; line-height: 1;
  margin-top: 0.625rem; font-variant-numeric: tabular-nums;
}
.kpi .k-trend { font-size: var(--fs-13); margin-top: 0.4375rem; display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 500; }
.k-trend.down { color: var(--rose-700); }
.k-trend.flat { color: var(--ink-muted); font-weight: 400; }
.k-trend svg { width: 0.75rem; height: 0.75rem; }

.card {
  background: var(--paper); border: 0.0625rem solid var(--line);
  border-radius: var(--r-lg); box-shadow: var(--shadow-sm); overflow: hidden;
}
.card.attn { border-left: 0.25rem solid var(--rose-500); }
.card-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.875rem;
  padding: 1.125rem 1.5rem 0.875rem; border-bottom: 0.0625rem solid var(--line-soft);
}
.card-title { font-family: var(--font-serif); font-size: var(--fs-20); font-weight: 600; letter-spacing: -0.015em; color: var(--ink-strong); line-height: 1.2; }
.card-title-sans { font-size: var(--fs-16); font-weight: 600; color: var(--ink-strong); line-height: 1.2; }
.card-sub { font-size: var(--fs-14); color: var(--ink-muted); margin-top: 0.25rem; }
.card-link {
  font-family: inherit; font-size: var(--fs-14); font-weight: 500; color: var(--sage-700);
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.25rem 0.4375rem; margin: -0.25rem -0.4375rem;
  border-radius: var(--r-sm); background: none; border: none; transition: background 0.15s;
}
.card-link:hover { background: var(--sage-50); }
.card-body { padding: 1.25rem 1.5rem 1.5rem; }

.empty-note { padding: 1.25rem 0; text-align: center; color: var(--ink-subtle); font-size: var(--fs-14); line-height: 1.5; }

.err-bar {
  display: flex; align-items: center; gap: 0.5rem;
  margin-bottom: var(--space-5); padding: 0.6875rem 0.875rem;
  background: var(--rose-50); border: 0.0625rem solid var(--rose-100);
  border-left: 0.25rem solid var(--rose-500); border-radius: var(--r-md);
  color: var(--rose-700); font-size: var(--fs-14);
}
.err-bar svg { width: 1rem; height: 1rem; flex: 0 0 1rem; }
.err-bar span { flex: 1; min-width: 0; }
.err-x { background: none; border: none; color: inherit; font-size: var(--fs-20); line-height: 1; padding: 0 0.25rem; }

.dot-tag { display: inline-flex; align-items: center; gap: 0.4375rem; font-size: var(--fs-13); font-weight: 600; color: var(--sage-700); white-space: nowrap; }
.dot-tag .d { width: 0.4375rem; height: 0.4375rem; flex: 0 0 0.4375rem; border-radius: 50%; background: var(--sage-500); box-shadow: 0 0 0 0.1875rem var(--sage-100); }

.tag { display: inline-flex; align-items: center; gap: 0.3125rem; font-size: var(--fs-13); padding: 0.1875rem 0.625rem; border-radius: 62.5rem; font-weight: 500; white-space: nowrap; }
.tag svg { width: 0.75rem; height: 0.75rem; flex: 0 0 0.75rem; }
.tag-sage { background: var(--sage-50); color: var(--sage-700); }

.timeline { display: flex; flex-direction: column; }
.tl-item { display: grid; grid-template-columns: 4rem 1fr; gap: 0.875rem; padding: 0.875rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.tl-item:last-child { border-bottom: 0; padding-bottom: 0; }
.tl-item:first-child { padding-top: 0; }
.tl-time { font-size: var(--fs-14); font-weight: 600; color: var(--ink-strong); font-variant-numeric: tabular-nums; }
.tl-time .to { font-size: var(--fs-12); font-weight: 400; color: var(--ink-subtle); margin-top: 0.0625rem; }
.tl-body { min-width: 0; }
.tl-rail { position: relative; padding-left: 1.125rem; }
.tl-rail::before { content: ''; position: absolute; left: 0.3125rem; top: 0.375rem; bottom: -0.875rem; width: 0.125rem; background: var(--line); }
.tl-item:last-child .tl-rail::before { display: none; }
.tl-rail::after { content: ''; position: absolute; left: 0; top: 0.25rem; width: 0.75rem; height: 0.75rem; border-radius: 50%; background: var(--paper); border: 0.1875rem solid var(--sage-500); }
.tl-rail.done::after { background: var(--sage-500); }
.tl-rail.now::after { border-color: var(--amber-500); box-shadow: 0 0 0 0.25rem var(--amber-100); }
.tl-name { font-size: var(--fs-15); font-weight: 600; color: var(--ink-strong); }
.tl-sub { font-size: var(--fs-13); color: var(--ink-muted); margin-top: 0.125rem; display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; }
.tl-sub .warn { color: var(--amber-700); font-weight: 600; }
.tl-actions { margin-top: 0.5rem; display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }

.tasks { display: flex; flex-direction: column; }
.task { display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.task:last-child { border-bottom: 0; padding-bottom: 0; }
.task:first-child { padding-top: 0; }
.task-ic { width: 2.375rem; height: 2.375rem; flex: 0 0 2.375rem; border-radius: var(--r-md); display: grid; place-items: center; }
.task-ic svg { width: 1.125rem; height: 1.125rem; }
.ic-amber { background: var(--amber-50); color: var(--amber-700); }
.ic-rose { background: var(--rose-50); color: var(--rose-700); }
.ic-blue { background: var(--blue-50); color: var(--blue-700); }
.ic-sage { background: var(--sage-50); color: var(--sage-700); }
.task-main { flex: 1; min-width: 0; }
.task-main .t-title { font-size: var(--fs-15); font-weight: 600; color: var(--ink-strong); }
.task-main .t-sub { font-size: var(--fs-13); color: var(--ink-muted); margin-top: 0.0625rem; }
.task-main .t-sub .due { color: var(--rose-700); font-weight: 600; }
.task-end { flex: 0 0 auto; }

.mlist { display: flex; flex-direction: column; }
.mrow { display: flex; align-items: center; gap: 0.75rem; padding: 0.6875rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.mrow:last-child { border-bottom: 0; padding-bottom: 0; }
.mrow:first-child { padding-top: 0; }
.avatar { width: 2.25rem; height: 2.25rem; flex: 0 0 2.25rem; border-radius: 50%; display: grid; place-items: center; font-size: var(--fs-13); font-weight: 600; }
.av-amber { background: var(--amber-100); color: var(--amber-700); }
.av-blue  { background: var(--blue-100);  color: var(--blue-700); }
.av-plum  { background: var(--plum-100);  color: var(--plum-700); }
.av-sage  { background: var(--sage-100);  color: var(--sage-700); }
.av-teal  { background: var(--teal-100);  color: var(--teal-700); }
.av-rose  { background: var(--rose-100);  color: var(--rose-700); }
.mrow .m-main { flex: 1; min-width: 0; }
.mrow .m-name { font-size: var(--fs-14); font-weight: 600; color: var(--ink-strong); }
.mrow .m-sub { font-size: var(--fs-12); color: var(--ink-muted); margin-top: 0.0625rem; }
.m-actions { flex: 0 0 auto; margin-left: auto; }

.p-link {
  display: inline; padding: 0; font: inherit; font-weight: inherit; color: inherit;
  background: none; border: none; border-bottom: 0.0625rem dashed var(--line-strong);
  border-radius: 0.125rem; transition: color 0.15s, border-color 0.15s;
}
.p-link:hover { color: var(--sage-700); border-bottom-color: var(--sage-500); }
.p-link:focus-visible { outline: none; box-shadow: var(--focus-ring); }

.flag-warn {
  position: relative; display: inline-flex; align-items: center; gap: 0.25rem;
  font-size: var(--fs-12); font-weight: 700; white-space: nowrap;
  color: var(--amber-700); background: var(--amber-50); border: 0.0625rem solid var(--amber-100);
  padding: 0.0625rem 0.5rem; border-radius: 62.5rem; cursor: help; max-width: 100%;
}
.flag-warn svg { width: 0.75rem; height: 0.75rem; flex: 0 0 0.75rem; }
.flag-warn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.flag-tip {
  position: absolute; bottom: calc(100% + 0.5rem); left: 0; z-index: 30;
  width: max-content; max-width: 18rem; white-space: normal;
  background: var(--ink-strong); color: #F4F3EE;
  font-size: var(--fs-13); font-weight: 400; line-height: 1.45;
  padding: 0.625rem 0.75rem; border-radius: var(--r-md); box-shadow: var(--shadow-lg);
  opacity: 0; pointer-events: none; transform: translateY(0.25rem);
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.flag-tip::after { content: ''; position: absolute; top: 100%; left: 0.875rem; border: 0.375rem solid transparent; border-top-color: var(--ink-strong); }
.flag-warn:hover .flag-tip, .flag-warn:focus-visible .flag-tip, .flag-warn:focus-within .flag-tip { opacity: 1; transform: none; }

@media (max-width: 75rem) {
  .grid-main-aside { grid-template-columns: 1fr; }
  .grid-4 { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (max-width: 56.25rem) {
  .card-head { flex-wrap: wrap; }
}
@media (max-width: 36rem) {
  .greet h1 { font-size: var(--fs-32); }
  .grid-4 { grid-template-columns: 1fr; }
  .card-head, .card-body { padding-left: 1.125rem; padding-right: 1.125rem; }
  .tl-item { grid-template-columns: 3.25rem 1fr; gap: 0.625rem; }
  .task { flex-wrap: wrap; }
  .task-end { width: 100%; padding-left: 3.25rem; }
  .task-end .btn { width: 100%; }
}
</style>

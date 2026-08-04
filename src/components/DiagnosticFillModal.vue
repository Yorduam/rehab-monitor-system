<template>
  <div class="dm-overlay" @click.self="close">
    <div class="dm-modal" role="dialog" aria-modal="true">
      <div class="dm-head">
        <div class="dm-head-main">
          <span class="dm-kicker">Диагностика</span>
          <h2 class="dm-title">{{ recipientName }}</h2>
          <p class="dm-meta" v-if="assignment">
            {{ blockLabel }} · {{ formatDate(assignment.date) }} · {{ hhmm(assignment.startTime) }}–{{ hhmm(assignment.endTime) }}
          </p>
        </div>
        <button class="dm-x" @click="close" aria-label="Закрыть">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div v-if="loading" class="dm-loading"><div class="dm-spinner"></div></div>

      <template v-else-if="assignment">
        <div class="dm-body">
          <div class="dm-session" v-if="session && session.siblings.length > 1">
            <div class="dm-session-head">
              <div class="dm-session-label">Этапы комплексной диагностики</div>
              <span class="dm-live" title="Обновляется автоматически">
                <i class="dm-live-dot" aria-hidden="true"></i>онлайн
              </span>
            </div>
            <div class="dm-session-blocks">
              <button
                v-for="b in session.siblings"
                :key="b.id"
                type="button"
                class="dm-chip"
                :class="{
                  'dm-chip--me': b.id === assignment.id,
                  'dm-chip--done': b.blockStatus === 'completed',
                  'dm-chip--open': openSibling === b.id
                }"
                :disabled="b.id === assignment.id"
                @click="toggleSibling(b)"
              >
                <svg v-if="b.resultsHidden" class="dm-lock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                {{ specialtyName(b) }}
                <span class="dm-chip-state">{{ b.blockStatus === 'completed' ? '✓' : '…' }}</span>
              </button>
            </div>

            <div v-if="activeSibling" class="dm-peer">
              <div class="dm-peer-head">
                <span class="dm-peer-name">{{ specialtyName(activeSibling) }}</span>
                <span class="dm-peer-who">{{ activeSibling.specialistName || 'Специалист' }}</span>
              </div>
              <div v-if="activeSibling.resultsHidden" class="dm-peer-lock">
                Результаты этого специалиста вам не видны — право на просмотр
                результатов других педагогов выдаёт администратор.
              </div>
              <template v-else>
                <div v-if="peerCriteria.length" class="dm-peer-crits">
                  <div v-for="c in peerCriteria" :key="c.id" class="dm-peer-crit">
                    <span class="dm-peer-crit-label">{{ c.label }}</span>
                    <span class="dm-peer-scale">
                      <i v-for="s in SCALE" :key="s.value" class="dm-peer-tick" :class="{ on: c.value === s.value }">{{ s.short }}</i>
                    </span>
                  </div>
                </div>
                <p v-else class="dm-peer-blank">Специалист ещё не внёс оценки.</p>
                <p v-if="peerComment" class="dm-peer-comment">{{ peerComment }}</p>
              </template>
            </div>

            <div v-if="session.fullyCompleted" class="dm-fully">
              Диагностика полностью завершена всеми специалистами.
            </div>
          </div>

          <div v-if="hideOwnBlock" class="dm-notice dm-notice--info">
            Заполнение — во вкладке <strong>«Диагностика»</strong>. Здесь показан ход этапов.
          </div>

          <div v-else-if="!data.canEdit" class="dm-notice dm-notice--lock">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Это блок другого специалиста. Вы можете просматривать, но редактировать может только назначенный специалист.
          </div>
          <div v-else-if="assignment.blockStatus === 'completed'" class="dm-notice dm-notice--done">
            Этап завершён. Чтобы внести изменения — верните его в работу.
          </div>

          <div v-if="!hideOwnBlock" class="dm-block" :style="{ '--accent': blockAccent }">
            <div class="dm-block-head">
              <span class="dm-block-dot"></span>
              <span class="dm-block-name">{{ blockLabel }}</span>
              <span class="dm-block-avg" v-if="avg !== null">Средний балл: {{ avg }}</span>
            </div>

            <div v-if="block" class="dm-criteria">
              <div v-for="c in block.criteria" :key="c.id" class="dm-crit">
                <div class="dm-crit-label">{{ c.label }}</div>
                <div class="dm-scale" role="radiogroup" :aria-label="c.label">
                  <button
                    v-for="s in SCALE"
                    :key="s.value"
                    type="button"
                    class="dm-tick"
                    :class="{ 'dm-tick--active': form.criteria[c.id] === s.value }"
                    :disabled="!editable"
                    :title="s.label"
                    @click="setScore(c.id, s.value)"
                  >{{ s.short }}</button>
                </div>
              </div>
            </div>
            <div v-else class="dm-nb">Для этого профиля нет настроенного блока.</div>

            <div class="dm-scale-legend">0 — не проявляется · 4 — сформировано</div>

            <label class="dm-comment-label">Комментарий специалиста</label>
            <textarea
              class="dm-comment"
              v-model="form.comment"
              :disabled="!editable"
              rows="3"
              placeholder="Наблюдения, рекомендации…"
            ></textarea>
          </div>
        </div>

        <div class="dm-foot">
          <div class="dm-foot-status">
            <span class="dm-status-pill" :class="statusClass">{{ statusLabel }}</span>
          </div>
          <div class="dm-foot-actions">
            <button class="dm-btn dm-btn--ghost" @click="close">Закрыть</button>
            <template v-if="data.canEdit && !hideOwnBlock">
              <template v-if="assignment.blockStatus === 'completed'">
                <button class="dm-btn dm-btn--secondary" :disabled="saving" @click="reopen">Вернуть в работу</button>
              </template>
              <template v-else>
                <button class="dm-btn dm-btn--secondary" :disabled="saving" @click="saveDraft">Сохранить черновик</button>
                <button class="dm-btn dm-btn--primary" :disabled="saving" @click="completeStage">Завершить свой этап</button>
              </template>
            </template>
          </div>
        </div>
      </template>

      <div v-else class="dm-loading"><p>Не удалось загрузить назначение.</p></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { fullName } from '../utils/recipient';
import { SCALE, getBlock, profileLabel, averageScore } from '../utils/diagnosticBlocks';

const authStore = useAuthStore();
const hideOwnBlock = computed(() => authStore.isTeacher);

const POLL_MS = 15000;

const props = defineProps({
  assignmentId: { type: [Number, String], required: true }
});
const emit = defineEmits(['close', 'updated']);

const loading = ref(true);
const saving = ref(false);
const data = reactive({ canEdit: false });
const assignment = ref(null);
const session = ref(null);
const form = reactive({ criteria: {}, comment: '' });
const openSibling = ref(null);
let poller = null;

const profileKey = computed(() => assignment.value?.direction?.profileKey || '');
const block = computed(() => getBlock(profileKey.value));
const blockLabel = computed(() => block.value?.label || assignment.value?.direction?.name || profileLabel(profileKey.value));
const blockAccent = computed(() => block.value?.accent || '#3F6E3F');
const recipientName = computed(() => assignment.value?.recipient ? fullName(assignment.value.recipient) : 'Реабилитант');
const avg = computed(() => averageScore(form));
const editable = computed(() => data.canEdit && assignment.value?.blockStatus !== 'completed');

const statusLabel = computed(() => {
  const s = assignment.value?.blockStatus;
  if (s === 'completed') return 'Этап завершён';
  return 'В работе';
});
const statusClass = computed(() => assignment.value?.blockStatus === 'completed' ? 'is-done' : 'is-progress');

const activeSibling = computed(() =>
  session.value?.siblings?.find((b) => b.id === openSibling.value) || null
);
const peerCriteria = computed(() => {
  const b = activeSibling.value;
  if (!b || b.resultsHidden) return [];
  const schema = getBlock(b.profileKey || b.direction?.profileKey);
  if (!schema) return [];
  const stored = b.results?.criteria || {};
  const rows = schema.criteria.map((c) => ({
    id: c.id,
    label: c.label,
    value: stored[c.id] === undefined ? null : stored[c.id]
  }));
  return rows.some((r) => r.value !== null && r.value !== '') ? rows : [];
});
const peerComment = computed(() => {
  const b = activeSibling.value;
  if (!b || b.resultsHidden) return '';
  return b.results?.comment || b.comment || '';
});
const toggleSibling = (b) => {
  if (b.id === assignment.value?.id) return;
  openSibling.value = openSibling.value === b.id ? null : b.id;
};

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const { data: res } = await api.get(`/schedule/assignments/${props.assignmentId}`);
    assignment.value = res.assignment;
    session.value = res.session;
    data.canEdit = res.canEdit;
    if (silent) return;
    const stored = res.assignment.results || {};
    const criteria = {};
    (block.value?.criteria || []).forEach(c => {
      const v = stored.criteria ? stored.criteria[c.id] : undefined;
      criteria[c.id] = (v === undefined ? null : v);
    });
    form.criteria = criteria;
    form.comment = stored.comment || res.assignment.comment || '';
  } catch (err) {
    console.error(err);
    if (!silent) assignment.value = null;
  } finally {
    if (!silent) loading.value = false;
  }
};

const setScore = (critId, val) => {
  if (!editable.value) return;
  form.criteria[critId] = form.criteria[critId] === val ? null : val;
};

const payload = () => ({ results: { criteria: { ...form.criteria }, comment: form.comment }, comment: form.comment });

const saveDraft = async () => {
  saving.value = true;
  try {
    await api.patch(`/schedule/assignments/${props.assignmentId}`, payload());
    emit('updated');
    await load();
  } catch (err) {
    alert(err.response?.data?.message || 'Не удалось сохранить');
  } finally {
    saving.value = false;
  }
};

const completeStage = async () => {
  saving.value = true;
  try {
    const { data: res } = await api.post(`/schedule/assignments/${props.assignmentId}/complete`, payload());
    assignment.value = res.assignment;
    session.value = res.session;
    emit('updated');
  } catch (err) {
    alert(err.response?.data?.message || 'Не удалось завершить этап');
  } finally {
    saving.value = false;
  }
};

const reopen = async () => {
  saving.value = true;
  try {
    const { data: res } = await api.post(`/schedule/assignments/${props.assignmentId}/reopen`);
    assignment.value = res.assignment;
    session.value = res.session;
    emit('updated');
  } catch (err) {
    alert(err.response?.data?.message || 'Не удалось изменить статус');
  } finally {
    saving.value = false;
  }
};

const specialtyName = (b) => {
  const pk = b.profileKey || b.direction?.profileKey;
  return getBlock(pk)?.label || b.direction?.name || profileLabel(pk);
};

const close = () => emit('close');

const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const formatDate = (d) => {
  if (!d) return '';
  const [y, m, day] = String(d).split('-');
  return `${parseInt(day, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
};

onMounted(async () => {
  await load();
  poller = setInterval(() => {
    if (!saving.value) load(true);
  }, POLL_MS);
});
onUnmounted(() => { if (poller) clearInterval(poller); });
</script>

<style scoped>
.dm-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(17, 34, 17, 0.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 2.5rem 1rem; overflow-y: auto;
  font-family: 'Inter', system-ui, sans-serif;
}
.dm-modal {
  background: #F7F4ED;
  width: 100%; max-width: 620px;
  border-radius: 1.1rem;
  border: 1px solid #E4DECF;
  box-shadow: 0 24px 60px rgba(17,34,17,0.28);
  overflow: hidden;
}
.dm-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; padding: 1.25rem 1.4rem 1.1rem;
  background: #FFFFFF; border-bottom: 1px solid #EFEADC;
}
.dm-kicker {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em;
  color: #B0533F; font-weight: 600;
}
.dm-title {
  font-family: 'Lora', Georgia, serif; font-size: 1.35rem;
  color: #0F140F; margin: 0.2rem 0 0.15rem;
}
.dm-meta { font-size: 0.85rem; color: #6E7368; margin: 0; }
.dm-x {
  background: none; border: none; color: #6E7368; cursor: pointer;
  padding: 0.3rem; border-radius: 0.5rem; flex-shrink: 0;
}
.dm-x:hover { background: #F3EEE4; color: #131713; }

.dm-loading { padding: 3rem; text-align: center; color: #4F564A; }
.dm-spinner {
  width: 36px; height: 36px; margin: 0 auto;
  border: 4px solid rgba(95,126,69,0.2); border-top-color: #3F6E3F;
  border-radius: 50%; animation: dmspin 0.8s linear infinite;
}
@keyframes dmspin { to { transform: rotate(360deg); } }

.dm-body { padding: 1.25rem 1.4rem; }

.dm-session {
  background: #FFFFFF; border: 1px solid #E4DECF; border-radius: 0.85rem;
  padding: 0.85rem 1rem; margin-bottom: 1.1rem;
}
.dm-session-label {
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;
  color: #6E7368; font-weight: 600; margin-bottom: 0.55rem;
}
.dm-session-head { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; }
.dm-live { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.68rem; color: #8A8F82; margin-bottom: 0.55rem; }
.dm-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #5F7E45; animation: dmPulse 1.8s ease-in-out infinite; }
@keyframes dmPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }

.dm-session-blocks { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.dm-chip {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.78rem; padding: 0.28rem 0.6rem; border-radius: 999px;
  background: #F3EEE4; color: #4F564A; border: 1px solid #E4DECF;
  font-family: inherit; cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.dm-chip:disabled { cursor: default; }
.dm-chip:not(:disabled):hover { border-color: #5F7E45; }
.dm-chip--me { background: #EEF4E2; color: #2F4A2F; border-color: #CBDDB4; font-weight: 600; }
.dm-chip--done { background: #E0EBD1; color: #234623; }
.dm-chip--open { border-color: #5F7E45; box-shadow: 0 0 0 2px rgba(95,126,69,0.18); }
.dm-lock { opacity: 0.6; }
.dm-chip-state { font-weight: 700; }

.dm-peer {
  margin-top: 0.75rem; padding: 0.75rem 0.85rem;
  border: 1px solid #E4DECF; border-radius: 0.7rem; background: #FBF9F3;
}
.dm-peer-head { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.55rem; flex-wrap: wrap; }
.dm-peer-name { font-weight: 600; font-size: 0.88rem; color: #0F140F; }
.dm-peer-who { font-size: 0.76rem; color: #6E7368; }
.dm-peer-lock {
  padding: 0.5rem 0.65rem; border-radius: 0.5rem;
  background: #FAE9E0; color: #8A3A28; font-size: 0.8rem; line-height: 1.45;
}
.dm-peer-crits { display: flex; flex-direction: column; gap: 0.35rem; }
.dm-peer-crit { display: flex; align-items: center; justify-content: space-between; gap: 0.7rem; flex-wrap: wrap; }
.dm-peer-crit-label { font-size: 0.82rem; color: #131713; flex: 1; min-width: 120px; }
.dm-peer-scale { display: inline-flex; gap: 0.2rem; }
.dm-peer-tick {
  width: 1.45rem; height: 1.45rem; display: grid; place-items: center;
  border-radius: 0.38rem; border: 1px solid #E4DECF; background: #fff;
  color: #B4B0A4; font-size: 0.73rem; font-weight: 600; font-style: normal;
}
.dm-peer-tick.on { background: #5F7E45; border-color: #5F7E45; color: #fff; }
.dm-peer-blank { margin: 0; font-size: 0.81rem; color: #8A8F82; font-style: italic; }
.dm-peer-comment {
  margin: 0.55rem 0 0; padding: 0.5rem 0.65rem; border-radius: 0.5rem;
  background: #fff; border: 1px solid #EFEADC;
  font-size: 0.82rem; color: #4F564A; line-height: 1.5; white-space: pre-wrap;
}
.dm-fully {
  margin-top: 0.7rem; padding: 0.55rem 0.7rem; border-radius: 0.6rem;
  background: #E0EBD1; color: #234623; font-size: 0.82rem; font-weight: 500;
}

.dm-notice {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 0.85rem; border-radius: 0.7rem; margin-bottom: 1rem;
  font-size: 0.83rem;
}
.dm-notice--lock { background: #FAE9E0; color: #8A3A28; }
.dm-notice--done { background: #F3EEE4; color: #4F564A; }
.dm-notice--info { background: #ECF1E7; color: #3F6E3F; }

.dm-block {
  background: #FFFFFF; border: 1px solid #E4DECF; border-radius: 0.9rem;
  padding: 1.05rem 1.1rem; border-left: 4px solid var(--accent);
}
.dm-block-head { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.9rem; }
.dm-block-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); }
.dm-block-name { font-family: 'Lora', Georgia, serif; font-size: 1.05rem; color: #0F140F; font-weight: 600; }
.dm-block-avg { margin-left: auto; font-size: 0.78rem; color: #6E7368; }

.dm-criteria { display: flex; flex-direction: column; gap: 0.7rem; }
.dm-crit {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  flex-wrap: wrap;
}
.dm-crit-label { font-size: 0.9rem; color: #131713; flex: 1; min-width: 140px; }
.dm-scale { display: inline-flex; gap: 0.3rem; }
.dm-tick {
  width: 2.1rem; height: 2.1rem; border-radius: 0.55rem;
  border: 1px solid #D6CFBE; background: #FBF9F3; color: #4F564A;
  font-weight: 600; font-size: 0.9rem; cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s, transform 0.12s;
}
.dm-tick:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
.dm-tick--active {
  background: var(--accent); color: #FFFFFF; border-color: var(--accent);
}
.dm-tick:disabled { cursor: default; opacity: 0.75; }
.dm-scale-legend { margin-top: 0.7rem; font-size: 0.72rem; color: #8A8F82; }

.dm-comment-label {
  display: block; margin: 1rem 0 0.4rem;
  font-size: 0.78rem; font-weight: 600; color: #4F564A;
}
.dm-comment {
  width: 100%; border: 1px solid #D6CFBE; border-radius: 0.6rem;
  padding: 0.6rem 0.75rem; font-family: inherit; font-size: 0.88rem;
  color: #131713; background: #FBF9F3; resize: vertical;
}
.dm-comment:focus { outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95,126,69,0.18); }
.dm-comment:disabled { background: #F3EEE4; color: #6E7368; }
.dm-nb { color: #6E7368; font-size: 0.85rem; }

.dm-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1rem 1.4rem; background: #FFFFFF; border-top: 1px solid #EFEADC;
  flex-wrap: wrap;
}
.dm-status-pill {
  font-size: 0.78rem; font-weight: 600; padding: 0.3rem 0.7rem; border-radius: 999px;
}
.dm-status-pill.is-done { background: #E0EBD1; color: #234623; }
.dm-status-pill.is-progress { background: #F3EEE4; color: #4F564A; }
.dm-foot-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.dm-btn {
  padding: 0.55rem 1rem; border-radius: 0.65rem; font-weight: 600;
  font-size: 0.86rem; cursor: pointer; border: 1px solid transparent;
  font-family: inherit; transition: background 0.14s, transform 0.14s;
}
.dm-btn:disabled { opacity: 0.6; cursor: default; }
.dm-btn--ghost { background: transparent; border-color: #D6CFBE; color: #4F564A; }
.dm-btn--ghost:hover { background: #F3EEE4; }
.dm-btn--secondary { background: #F3EEE4; border-color: #D6CFBE; color: #131713; }
.dm-btn--secondary:hover:not(:disabled) { background: #E9E2D3; }
.dm-btn--primary { background: #2F4A2F; color: #FFFFFF; }
.dm-btn--primary:hover:not(:disabled) { background: #24391F; transform: translateY(-1px); }
</style>

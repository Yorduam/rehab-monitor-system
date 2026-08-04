<template>
  <div class="db-overlay" @click.self="close">
    <div class="db-modal" role="dialog" aria-modal="true">

      <div class="db-head">
        <div class="db-head-main">
          <span class="db-kicker">Доска диагностики</span>
          <h2 class="db-title">{{ recipientName }}</h2>
          <p class="db-meta" v-if="session">
            {{ formatDate(String(session.date).slice(0, 10)) }} ·
            <span :class="['db-status', session.status]">{{ statusLabel(session.status) }}</span>
            <template v-if="session.authorName"> · заявку создал(а) {{ session.authorName }}</template>
          </p>
        </div>
        <div class="db-head-side">
          <span v-if="live" class="db-live" title="Данные обновляются автоматически">
            <i class="db-live-dot" aria-hidden="true"></i>в реальном времени
          </span>
          <button class="db-x" @click="close" aria-label="Закрыть">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div v-if="loading" class="db-loading"><div class="db-spinner"></div></div>

      <template v-else-if="session">
        <div class="db-body">

          <p v-if="session.note" class="db-note">{{ session.note }}</p>

          <div class="db-progress">
            <div class="db-progress-bar">
              <span :style="{ width: progressPct + '%' }"></span>
            </div>
            <span class="db-progress-txt">
              Завершено {{ session.completed }} из {{ session.total }} этапов
            </span>
          </div>

          <div v-if="!session.blocks.length" class="db-empty">
            Заявку ещё никто не взял. Специалисты увидят её во вкладке
            «Заявки на диагностику» и возьмут реабилитанта сами.
          </div>

          <article
            v-for="b in session.blocks"
            :key="b.id"
            class="db-block"
            :class="{ 'is-mine': b.isMine, 'is-done': b.blockStatus === 'completed' }"
            :style="{ '--accent': accentOf(b) }"
          >
            <header class="db-block-head">
              <span class="db-block-dot" aria-hidden="true"></span>
              <div class="db-block-id">
                <span class="db-block-name">{{ blockLabel(b) }}</span>
                <span class="db-block-who">
                  {{ b.specialistName || 'Специалист' }}
                  <template v-if="b.cabinet"> · каб. {{ b.cabinet }}</template>
                  <template v-if="b.startTime"> · {{ hhmm(b.startTime) }}–{{ hhmm(b.endTime) }}</template>
                </span>
              </div>
              <span class="db-pill" :class="b.blockStatus === 'completed' ? 'is-done' : 'is-progress'">
                {{ b.blockStatus === 'completed' ? 'Завершён' : 'В работе' }}
              </span>
            </header>

            <div v-if="b.resultsHidden" class="db-hidden">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Результаты этого специалиста вам не видны. Право на просмотр
              результатов других педагогов выдаёт администратор.
            </div>

            <template v-else>
              <div v-if="criteriaOf(b).length" class="db-crits">
                <div v-for="c in criteriaOf(b)" :key="c.id" class="db-crit">
                  <span class="db-crit-label">{{ c.label }}</span>
                  <span class="db-crit-scale" :aria-label="c.label">
                    <i
                      v-for="s in SCALE"
                      :key="s.value"
                      class="db-tick"
                      :class="{ on: c.value === s.value }"
                      :title="s.label"
                    >{{ s.short }}</i>
                  </span>
                </div>
                <div class="db-avg" v-if="avgOf(b) !== null">Средний балл: {{ avgOf(b) }}</div>
              </div>
              <p v-else class="db-blank">Специалист ещё не внёс оценки.</p>

              <p v-if="commentOf(b)" class="db-block-comment">{{ commentOf(b) }}</p>
            </template>

            <footer class="db-block-foot" v-if="b.isMine">
              <button class="dm-btn dm-btn--secondary" @click="$emit('open-block', b.id)">
                Открыть мой блок
              </button>
              <button class="dm-btn dm-btn--ghost" :disabled="busy" @click="release(b)">
                Отказаться
              </button>
            </footer>
          </article>

          <section class="db-concl">
            <h3 class="db-concl-title">Итоговое заключение</h3>

            <div v-if="session.conclusion && !editingConclusion" class="db-concl-view">
              <p v-if="session.conclusion.verdict" class="db-concl-verdict" :class="'is-' + session.conclusion.verdict">
                {{ VERDICT_LABELS[session.conclusion.verdict] }}
              </p>
              <p class="db-concl-text">{{ session.conclusion.summary }}</p>
              <template v-if="session.conclusion.recommendations">
                <div class="db-concl-sub">Рекомендации</div>
                <p class="db-concl-text">{{ session.conclusion.recommendations }}</p>
              </template>
              <p class="db-concl-sign">
                {{ session.conclusion.authorName || 'Специалист' }},
                {{ formatDateTime(session.conclusion.issuedAt) }}
              </p>
              <button v-if="session.canConclude" class="dm-btn dm-btn--ghost" @click="startEditConclusion">
                Изменить заключение
              </button>
            </div>

            <div v-else-if="session.canConclude" class="db-concl-form">
              <p v-if="conclusionBlockReason" class="db-concl-warn">
                {{ conclusionBlockReason }}
              </p>
              <label class="db-field">
                <span>Решение по итогам</span>
                <select v-model="conclForm.verdict" class="db-input">
                  <option value="">— не выбрано —</option>
                  <option value="recommended">Рекомендованы — зачислить на программу</option>
                  <option value="trial">Пробные (2 недели)</option>
                  <option value="rejected">Не рекомендованы</option>
                </select>
              </label>
              <label class="db-field">
                <span>Заключение <b class="db-req">*</b></span>
                <textarea v-model="conclForm.summary" rows="5" class="db-input"
                          placeholder="Обобщённые выводы по результатам диагностики всех специалистов…"></textarea>
              </label>
              <label class="db-field">
                <span>Рекомендации</span>
                <textarea v-model="conclForm.recommendations" rows="3" class="db-input"
                          placeholder="Что рекомендовано реабилитанту и семье…"></textarea>
              </label>
              <label v-if="isAdmin && conclusionBlockReason" class="db-check">
                <input type="checkbox" v-model="conclForm.force" />
                <span>Выдать заключение, не дожидаясь остальных специалистов</span>
              </label>
              <p v-if="conclError" class="db-error">{{ conclError }}</p>
              <div class="db-concl-actions">
                <button v-if="editingConclusion" class="dm-btn dm-btn--ghost" @click="editingConclusion = false">
                  Отмена
                </button>
                <button class="dm-btn dm-btn--primary" :disabled="busy || !canSubmitConclusion"
                        :title="canSubmitConclusion ? '' : conclusionBlockReason"
                        @click="submitConclusion">
                  {{ busy ? 'Сохранение…' : 'Выдать заключение' }}
                </button>
              </div>
            </div>

            <p v-else class="db-concl-none">
              Заключение ещё не выдано. Право выдать заключение есть только
              у специалистов, которым его назначил администратор.
            </p>
          </section>
        </div>

        <div class="db-foot">
          <button
            v-if="canCancel"
            class="dm-btn dm-btn--danger"
            :disabled="busy"
            @click="cancelSession"
          >Отменить заявку</button>
          <button class="dm-btn dm-btn--ghost" @click="close">Закрыть</button>
        </div>
      </template>

      <div v-else class="db-loading"><p>Не удалось загрузить заявку.</p></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';
import { fullName } from '../utils/recipient';
import { SCALE, getBlock, profileLabel, averageScore } from '../utils/diagnosticBlocks';

const POLL_MS = 15000;

const props = defineProps({
  sessionId: { type: [Number, String], required: true }
});
const emit = defineEmits(['close', 'open-block', 'changed']);

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAdmin);

const loading = ref(true);
const busy = ref(false);
const session = ref(null);
const conclError = ref('');
const editingConclusion = ref(false);
const conclForm = reactive({ verdict: '', summary: '', recommendations: '', force: false });

const VERDICT_LABELS = {
  recommended: 'Рекомендованы — зачислить на программу реабилитации',
  trial: 'Пробные занятия (2 недели)',
  rejected: 'Не рекомендованы'
};

let poller = null;

const recipientName = computed(() =>
  session.value?.recipient ? fullName(session.value.recipient) : 'Реабилитант'
);
const progressPct = computed(() => {
  const s = session.value;
  if (!s || !s.total) return 0;
  return Math.round((s.completed / s.total) * 100);
});
const conclusionBlockReason = computed(() => {
  const s = session.value;
  if (!s) return '';
  if (s.conclusion) return '';
  if (!s.total) return 'Ни один специалист ещё не провёл диагностику.';
  const missing = Array.isArray(s.missingStages) ? s.missingStages : [];
  if (missing.length) {
    return 'Заключение выдаётся после этапов 01–03. Ещё не пройдены: ' +
           missing.map((m) => m.title).join(', ') + '.';
  }
  if (!s.fullyCompleted) {
    return `Не все взятые блоки сданы (${s.completed} из ${s.total}).`;
  }
  return '';
});
const canSubmitConclusion = computed(() =>
  !conclusionBlockReason.value || (isAdmin.value && conclForm.force)
);

const live = computed(() => session.value && ['open', 'in_progress'].includes(session.value.status));
const canCancel = computed(() =>
  session.value && (isAdmin.value || authStore.isEmployee) &&
  ['open', 'in_progress'].includes(session.value.status)
);

function statusLabel(s) {
  return { open: 'свободна', in_progress: 'в работе', completed: 'завершена', cancelled: 'отменена' }[s] || s;
}
function blockLabel(b) {
  return getBlock(b.profileKey)?.label || b.direction?.name || profileLabel(b.profileKey);
}
function accentOf(b) {
  return getBlock(b.profileKey)?.accent || '#5F7E45';
}
function criteriaOf(b) {
  const schema = getBlock(b.profileKey);
  if (!schema) return [];
  const stored = b.results?.criteria || {};
  const rows = schema.criteria.map((c) => ({
    id: c.id,
    label: c.label,
    value: stored[c.id] === undefined ? null : stored[c.id]
  }));
  return rows.some((r) => r.value !== null && r.value !== '') ? rows : [];
}
function avgOf(b) {
  return averageScore(b.results);
}
function commentOf(b) {
  return b.results?.comment || b.comment || '';
}

async function load(silent = false) {
  if (!silent) loading.value = true;
  try {
    const { data } = await api.get(`/schedule/sessions/${props.sessionId}`);
    session.value = data;
    if (data.conclusion && !editingConclusion.value) {
      conclForm.verdict = data.conclusion.verdict || '';
      conclForm.summary = data.conclusion.summary || '';
      conclForm.recommendations = data.conclusion.recommendations || '';
    }
  } catch (err) {
    console.error(err);
    if (!silent) session.value = null;
  } finally {
    if (!silent) loading.value = false;
  }
}

function startEditConclusion() {
  conclError.value = '';
  conclForm.verdict = session.value?.conclusion?.verdict || '';
  conclForm.summary = session.value?.conclusion?.summary || '';
  conclForm.recommendations = session.value?.conclusion?.recommendations || '';
  editingConclusion.value = true;
}

async function submitConclusion() {
  conclError.value = '';
  if (conclForm.summary.trim().length < 10) {
    conclError.value = 'Заключение слишком короткое (минимум 10 символов).';
    return;
  }
  busy.value = true;
  try {
    const { data } = await api.post(`/schedule/sessions/${props.sessionId}/conclusion`, {
      verdict: conclForm.verdict || '',
      summary: conclForm.summary,
      recommendations: conclForm.recommendations || null,
      force: conclForm.force
    });
    session.value = data;
    editingConclusion.value = false;
    emit('changed');
  } catch (err) {
    conclError.value = err.response?.data?.message || 'Не удалось сохранить заключение.';
  } finally {
    busy.value = false;
  }
}

async function release(b) {
  if (!confirm('Отказаться от этого реабилитанта? Слот освободится в расписании.')) return;
  busy.value = true;
  try {
    await api.post(`/schedule/assignments/${b.id}/release`);
    await load();
    emit('changed');
  } catch (err) {
    alert(err.response?.data?.message || 'Не удалось освободить блок.');
  } finally {
    busy.value = false;
  }
}

async function cancelSession() {
  if (!confirm('Отменить заявку на диагностику?')) return;
  busy.value = true;
  try {
    await api.post(`/schedule/sessions/${props.sessionId}/cancel`);
    emit('changed');
    emit('close');
  } catch (err) {
    alert(err.response?.data?.message || 'Не удалось отменить заявку.');
  } finally {
    busy.value = false;
  }
}

const close = () => emit('close');

const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = String(d).split('-');
  return `${parseInt(day, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}
function formatDateTime(v) {
  if (!v) return '';
  const d = new Date(v);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

onMounted(async () => {
  await load();
  poller = setInterval(() => {
    if (!busy.value && !editingConclusion.value && live.value) load(true);
  }, POLL_MS);
});
onUnmounted(() => { if (poller) clearInterval(poller); });
</script>

<style scoped>
.db-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(17, 34, 17, 0.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 2.5rem 1rem; overflow-y: auto;
  font-family: 'Inter', system-ui, sans-serif;
}
.db-modal {
  background: #F7F4ED; width: 100%; max-width: 760px;
  border-radius: 1.1rem; border: 1px solid #E4DECF;
  box-shadow: 0 24px 60px rgba(17,34,17,0.28); overflow: hidden;
}

.db-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  padding: 1.25rem 1.4rem 1.1rem; background: #fff; border-bottom: 1px solid #EFEADC;
}
.db-kicker { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: #B0533F; font-weight: 600; }
.db-title { font-family: 'Lora', Georgia, serif; font-size: 1.35rem; color: #0F140F; margin: 0.2rem 0 0.15rem; }
.db-meta { font-size: 0.85rem; color: #6E7368; margin: 0; }
.db-status { font-weight: 600; }
.db-status.open { color: #B97718; }
.db-status.in_progress { color: #2F4A2F; }
.db-status.completed { color: #4F564A; }
.db-status.cancelled { color: #B0533F; }
.db-head-side { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
.db-live { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; color: #6E7368; }
.db-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #5F7E45; animation: dbPulse 1.8s ease-in-out infinite; }
@keyframes dbPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
.db-x { background: none; border: none; color: #6E7368; cursor: pointer; padding: 0.3rem; border-radius: 0.5rem; }
.db-x:hover { background: #F3EEE4; color: #131713; }

.db-loading { padding: 3rem; text-align: center; color: #4F564A; }
.db-spinner {
  width: 36px; height: 36px; margin: 0 auto;
  border: 4px solid rgba(95,126,69,0.2); border-top-color: #3F6E3F;
  border-radius: 50%; animation: dbspin 0.8s linear infinite;
}
@keyframes dbspin { to { transform: rotate(360deg); } }

.db-body { padding: 1.25rem 1.4rem; display: flex; flex-direction: column; gap: 0.9rem; }

.db-note {
  margin: 0; padding: 0.6rem 0.75rem; border-radius: 0.6rem;
  background: #FBF9F3; border: 1px dashed #E4DECF; color: #4F564A;
  font-size: 0.85rem; line-height: 1.5;
}

.db-progress { display: flex; align-items: center; gap: 0.7rem; }
.db-progress-bar { flex: 1; height: 7px; border-radius: 999px; background: #E9E2D3; overflow: hidden; }
.db-progress-bar span { display: block; height: 100%; background: #5F7E45; transition: width 0.3s ease; }
.db-progress-txt { font-size: 0.78rem; color: #6E7368; white-space: nowrap; }

.db-empty {
  padding: 1.1rem; border-radius: 0.8rem; background: #fff; border: 1px dashed #E4DECF;
  color: #6E7368; font-size: 0.88rem; line-height: 1.5;
}

.db-block {
  background: #fff; border: 1px solid #E4DECF; border-radius: 0.9rem;
  border-left: 4px solid var(--accent); padding: 0.95rem 1.05rem;
  display: flex; flex-direction: column; gap: 0.65rem;
}
.db-block.is-mine { box-shadow: 0 0 0 2px rgba(95,126,69,0.16); }
.db-block-head { display: flex; align-items: center; gap: 0.6rem; }
.db-block-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.db-block-id { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.db-block-name { font-family: 'Lora', Georgia, serif; font-size: 1rem; font-weight: 600; color: #0F140F; }
.db-block-who { font-size: 0.78rem; color: #6E7368; }
.db-pill { margin-left: auto; flex-shrink: 0; font-size: 0.73rem; font-weight: 600; padding: 0.24rem 0.6rem; border-radius: 999px; }
.db-pill.is-done { background: #E0EBD1; color: #234623; }
.db-pill.is-progress { background: #F3EEE4; color: #4F564A; }

.db-hidden {
  display: flex; align-items: flex-start; gap: 0.5rem;
  padding: 0.6rem 0.75rem; border-radius: 0.6rem;
  background: #FAE9E0; color: #8A3A28; font-size: 0.81rem; line-height: 1.45;
}
.db-hidden svg { flex-shrink: 0; margin-top: 0.1rem; }

.db-crits { display: flex; flex-direction: column; gap: 0.4rem; }
.db-crit { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
.db-crit-label { font-size: 0.85rem; color: #131713; flex: 1; min-width: 130px; }
.db-crit-scale { display: inline-flex; gap: 0.22rem; }
.db-tick {
  width: 1.55rem; height: 1.55rem; display: grid; place-items: center;
  border-radius: 0.4rem; border: 1px solid #E4DECF; background: #FBF9F3;
  color: #B4B0A4; font-size: 0.76rem; font-weight: 600; font-style: normal;
}
.db-tick.on { background: var(--accent); border-color: var(--accent); color: #fff; }
.db-avg { margin-top: 0.25rem; font-size: 0.78rem; color: #6E7368; }
.db-blank { margin: 0; font-size: 0.83rem; color: #8A8F82; font-style: italic; }
.db-block-comment {
  margin: 0; padding: 0.55rem 0.7rem; border-radius: 0.55rem;
  background: #FBF9F3; border: 1px solid #EFEADC;
  font-size: 0.84rem; color: #4F564A; line-height: 1.5; white-space: pre-wrap;
}
.db-block-foot { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.db-concl {
  background: #fff; border: 1px solid #E4DECF; border-radius: 0.9rem; padding: 1rem 1.1rem;
}
.db-concl-title {
  font-family: 'Lora', Georgia, serif; font-size: 1.05rem; font-weight: 600;
  color: #0F140F; margin: 0 0 0.7rem;
}
.db-concl-view { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; }
.db-concl-verdict {
  margin: 0; align-self: flex-start;
  padding: 0.3rem 0.65rem; border-radius: 0.5rem;
  border: 1px solid transparent;
  font-size: 0.82rem; font-weight: 600;
}
.db-concl-verdict.is-recommended { background: #EEF4E2; border-color: #A8C08A; color: #2F4A2F; }
.db-concl-verdict.is-trial       { background: #FDF7E8; border-color: #EFE0BB; color: #8A6416; }
.db-concl-verdict.is-rejected    { background: #FBEDED; border-color: #E7BEBE; color: #8A2F2F; }
.db-concl-text { margin: 0; font-size: 0.88rem; color: #131713; line-height: 1.55; white-space: pre-wrap; }
.db-concl-sub { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #6E7368; font-weight: 600; }
.db-concl-sign { margin: 0; font-size: 0.78rem; color: #8A8F82; }
.db-concl-none { margin: 0; font-size: 0.85rem; color: #6E7368; line-height: 1.5; }
.db-concl-form { display: flex; flex-direction: column; gap: 0.6rem; }
.db-concl-warn {
  margin: 0; padding: 0.5rem 0.7rem; border-radius: 0.55rem;
  background: #FDF7E8; border: 1px solid #EFE0BB; color: #8A6416; font-size: 0.82rem;
}
.db-field { display: flex; flex-direction: column; gap: 0.3rem; }
.db-field > span { font-size: 0.78rem; font-weight: 600; color: #4F564A; }
.db-req { color: #B0533F; }
.db-input {
  width: 100%; border: 1px solid #D6CFBE; border-radius: 0.6rem;
  padding: 0.6rem 0.75rem; font-family: inherit; font-size: 0.88rem;
  color: #131713; background: #FBF9F3; resize: vertical;
}
.db-input:focus { outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95,126,69,0.18); }
.db-check { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; color: #4F564A; cursor: pointer; }
.db-check input { margin-top: 0.15rem; accent-color: #5F7E45; }
.db-error { margin: 0; color: #B0533F; font-size: 0.83rem; }
.db-concl-actions { display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap; }

.db-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;
  padding: 1rem 1.4rem; background: #fff; border-top: 1px solid #EFEADC; flex-wrap: wrap;
}

.dm-btn {
  padding: 0.55rem 1rem; border-radius: 0.65rem; font-weight: 600;
  font-size: 0.86rem; cursor: pointer; border: 1px solid transparent;
  font-family: inherit; transition: background 0.14s, transform 0.14s;
}
.dm-btn:disabled { opacity: 0.6; cursor: default; }
.dm-btn--ghost { background: transparent; border-color: #D6CFBE; color: #4F564A; }
.dm-btn--ghost:hover:not(:disabled) { background: #F3EEE4; }
.dm-btn--secondary { background: #F3EEE4; border-color: #D6CFBE; color: #131713; }
.dm-btn--secondary:hover:not(:disabled) { background: #E9E2D3; }
.dm-btn--primary { background: #2F4A2F; color: #fff; }
.dm-btn--primary:hover:not(:disabled) { background: #24391F; transform: translateY(-1px); }
.dm-btn--danger { background: transparent; border-color: #E0B6A8; color: #8A3A28; margin-right: auto; }
.dm-btn--danger:hover:not(:disabled) { background: #FAE9E0; }
</style>

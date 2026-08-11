<template>
  <div class="ad-overlay" @click.self="tryClose">
    <div class="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ad-title">

      <header class="ad-head">
        <div>
          <h3 class="ad-title" id="ad-title">Назначение диагностики</h3>
          <p class="ad-sub">{{ recipientLabel }}</p>
        </div>
        <button type="button" class="ad-close" aria-label="Закрыть" @click="tryClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>

      <div class="ad-body">

        <div v-if="checking" class="ad-loading">
          <div class="ad-spinner" aria-hidden="true"></div>
          <p>Проверяем карточку и документы…</p>
        </div>

        <template v-else-if="readiness">

          <section v-if="readiness.errors.length" class="ad-section">
            <h4 class="ad-section-title">Нельзя назначить</h4>
            <ul class="ad-blockers">
              <li v-for="(b, i) in readiness.errors" :key="'e' + i" class="ad-blocker error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{{ b.message }}</span>
              </li>
            </ul>
            <div class="ad-fix-row">
              <button type="button" class="ad-btn ad-btn-ghost" @click="goToCard">
                Открыть карточку и обновить документы
              </button>
            </div>
          </section>

          <section v-if="readiness.warnings.length" class="ad-section">
            <h4 class="ad-section-title">Обратите внимание</h4>
            <ul class="ad-blockers">
              <li v-for="(b, i) in readiness.warnings" :key="'w' + i" class="ad-blocker warn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>{{ b.message }}</span>
              </li>
            </ul>
            <label v-if="isAdmin" class="ad-confirm">
              <input type="checkbox" v-model="forceConfirm" />
              <span>Всё равно назначить диагностику — предупреждения проверены</span>
            </label>
            <p v-else class="ad-note">
              Подтвердить назначение вопреки предупреждениям может только администратор.
            </p>
          </section>

          <section class="ad-section" :class="{ 'is-locked': !formEnabled }">
            <h4 class="ad-section-title">Дата диагностики</h4>

            <p class="ad-explain">
              Укажите только дату. Направление и специалиста выбирать не нужно —
              заявка попадёт в общий список, и специалисты сами возьмут реабилитанта
              на диагностику по своему профилю в удобное им время.
            </p>

            <div class="ad-grid">
              <label class="ad-field">
                <span class="ad-key">Дата</span>
                <input type="date" v-model="form.date" :min="todayStr" class="ad-input" :disabled="!formEnabled || saving" />
              </label>

              <label class="ad-field ad-field-full">
                <span class="ad-key">Комментарий <span class="ad-opt">(необязательно)</span></span>
                <textarea v-model="form.note" class="ad-input ad-textarea" rows="2"
                          :disabled="!formEnabled || saving"
                          placeholder="Что важно учесть специалистам"></textarea>
              </label>
            </div>

            <div v-if="conflict" class="ad-conflict">
              <p class="ad-conflict-text">
                На этого реабилитанта уже есть активная заявка на диагностику
                <b>{{ humanDate(conflict.date) }}</b>. Если дата назначена по ошибке —
                отмените прежнюю заявку и сразу назначьте новую на нужный день.
              </p>
              <button type="button" class="ad-btn ad-btn-danger" :disabled="cancelling" @click="cancelConflict">
                {{ cancelling ? 'Отменяем…' : 'Отменить заявку от ' + humanDate(conflict.date) }}
              </button>
            </div>

            <p v-if="error" class="ad-error">{{ error }}</p>
            <ul v-if="serverBlockers.length" class="ad-blockers ad-blockers-tight">
              <li v-for="(b, i) in serverBlockers" :key="'sb' + i" class="ad-blocker" :class="b.severity === 'error' ? 'error' : 'warn'">
                <span>{{ b.message }}</span>
              </li>
            </ul>
            <p v-if="success" class="ad-success">{{ success }}</p>
          </section>

        </template>

        <div v-else class="ad-loading">
          <p>{{ error || 'Не удалось загрузить данные проверки' }}</p>
        </div>
      </div>

      <footer class="ad-foot">
        <button type="button" class="ad-btn ad-btn-ghost" :disabled="saving" @click="tryClose">
          {{ success ? 'Закрыть' : 'Отмена' }}
        </button>
        <button type="button" class="ad-btn ad-btn-primary" :disabled="!canSubmit || saving" @click="submit">
          {{ saving ? 'Создание заявки…' : 'Назначить диагностику' }}
        </button>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { usePageStore } from '../stores/page';
import { useAuthStore } from '../stores/auth';
import { notifySaved } from '../utils/toast';

const props = defineProps({
  recipientId: { type: [Number, String], required: true },
  recipientName: { type: String, default: '' }
});
const emit = defineEmits(['close', 'assigned']);

const pageStore = usePageStore();
const authStore = useAuthStore();

const checking = ref(true);
const saving = ref(false);
const readiness = ref(null);
const error = ref('');
const success = ref('');
const serverBlockers = ref([]);
const forceConfirm = ref(false);
const conflict = ref(null);
const cancelling = ref(false);

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const humanDate = (v) => {
  const [y, m, d] = String(v || '').split('-');
  return y && m && d ? `${d}.${m}.${y}` : String(v || '');
};

const todayStr = localDate();
const form = ref({
  date: todayStr,
  note: ''
});

const isAdmin = computed(() => authStore.isAdmin);
const recipientLabel = computed(() =>
  props.recipientName || readiness.value?.recipientName || `Реабилитант #${props.recipientId}`
);
const formEnabled = computed(() => {
  const r = readiness.value;
  if (!r) return false;
  if (r.errors.length) return false;
  if (r.warnings.length) return isAdmin.value && forceConfirm.value;
  return true;
});

const canSubmit = computed(() =>
  formEnabled.value && !success.value && !!form.value.date
);

const loadReadiness = async () => {
  checking.value = true;
  error.value = '';
  try {
    const { data } = await api.get(`/recipients/${props.recipientId}/readiness`);
    readiness.value = data;
  } catch (err) {
    console.error('loadReadiness', err);
    error.value = err?.response?.data?.message || 'Не удалось проверить готовность реабилитанта';
    readiness.value = null;
  } finally {
    checking.value = false;
  }
};

const submit = async () => {
  if (!canSubmit.value || saving.value) return;
  saving.value = true;
  error.value = '';
  serverBlockers.value = [];
  conflict.value = null;
  try {
    const { data } = await api.post('/schedule/sessions', {
      recipientId: Number(props.recipientId),
      date: form.value.date,
      note: form.value.note || null,
      force: forceConfirm.value
    });
    success.value = 'Заявка на диагностику создана. Специалисты увидят её в списке свободных заявок и возьмут реабилитанта сами.';
    notifySaved(`Диагностика назначена на дату — ${humanDate(data?.date || form.value.date)}`);
    emit('assigned', data);
  } catch (err) {
    console.error('assignDiagnostic', err);
    const res = err?.response;
    if (res?.status === 409 && res?.data?.sessionId) {
      conflict.value = { sessionId: res.data.sessionId, date: res.data.date || null };
      error.value = '';
    } else {
      error.value = res?.data?.message || 'Не удалось назначить диагностику';
    }
    if (Array.isArray(res?.data?.blockers)) serverBlockers.value = res.data.blockers;
    if (res?.data?.readiness) readiness.value = res.data.readiness;
  } finally {
    saving.value = false;
  }
};

const cancelConflict = async () => {
  if (!conflict.value || cancelling.value) return;
  cancelling.value = true;
  error.value = '';
  try {
    await api.post(`/schedule/sessions/${conflict.value.sessionId}/cancel`);
    notifySaved(`Заявка на диагностику от ${humanDate(conflict.value.date)} отменена`);
    conflict.value = null;
    emit('assigned', null);
  } catch (err) {
    console.error('cancelConflict', err);
    error.value = err?.response?.data?.message || 'Не удалось отменить прежнюю заявку';
  } finally {
    cancelling.value = false;
  }
};

const goToCard = () => {
  emit('close');
  pageStore.setPage('recipient-details', 'Карточка реабилитанта', {
    recipientId: Number(props.recipientId),
    tab: 'profile'
  });
};

const tryClose = () => {
  if (saving.value) return;
  emit('close');
};

onMounted(() => {
  loadReadiness();
});
</script>

<style scoped>
.ad-overlay {
  --accent: var(--sage-700);
  --accent-hover: var(--sage-900);
  --accent-soft: var(--sage-50);
  --accent-text: var(--sage-900);
  --accent-border: var(--sage-100);

  position: fixed; inset: 0; z-index: 1200;
  background: rgba(20, 18, 16, .55);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  padding: 1.25rem;
  animation: adFade .16s ease;
}
.ad-modal {
  width: 100%; max-width: 680px; max-height: 88vh;
  display: flex; flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: adUp .18s ease;
}

.ad-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
  padding: 1.15rem 1.35rem 1rem;
  border-bottom: 1px solid var(--border);
}
.ad-title { font-family: var(--font-serif); font-size: 1.2rem; font-weight: 600; color: var(--text-primary); }
.ad-sub { margin-top: .2rem; font-size: .82rem; color: var(--text-secondary); }
.ad-close {
  flex-shrink: 0; width: 32px; height: 32px; display: grid; place-items: center;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  background: transparent; color: var(--text-tertiary); cursor: pointer;
  transition: background .15s ease, color .15s ease;
}
.ad-close:hover { background: var(--bg-app); color: var(--text-primary); }
.ad-close svg { width: 16px; height: 16px; }

.ad-body { padding: 1.1rem 1.35rem; overflow-y: auto; }

.ad-loading { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 2rem 0; color: var(--text-secondary); font-size: .88rem; }
.ad-spinner {
  width: 26px; height: 26px; border-radius: 50%;
  border: 2.5px solid var(--border); border-top-color: var(--accent);
  animation: adSpin .7s linear infinite;
}

.ad-section { padding-bottom: 1.1rem; margin-bottom: 1.1rem; border-bottom: 1px dashed var(--border-light); }
.ad-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.ad-section.is-locked { opacity: .55; }
.ad-section-title {
  font-size: .72rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
  color: var(--text-tertiary); margin-bottom: .65rem;
}

.ad-blockers { display: grid; gap: .4rem; }
.ad-blockers-tight { margin-top: .6rem; }
.ad-blocker {
  display: flex; align-items: flex-start; gap: .5rem;
  padding: .5rem .65rem; border-radius: var(--radius-md);
  font-size: .82rem; line-height: 1.4;
}
.ad-blocker svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: .08rem; }
.ad-blocker.error { background: #fdf0ea; color: #92401d; border: 1px solid #f0cfbe; }
.ad-blocker.warn { background: #fdf7e8; color: var(--amber-text); border: 1px solid #efe0bb; }

.ad-fix-row { margin-top: .65rem; }
.ad-confirm {
  display: flex; align-items: flex-start; gap: .5rem; margin-top: .7rem;
  font-size: .82rem; color: var(--text-secondary); cursor: pointer;
}
.ad-confirm input { margin-top: .15rem; accent-color: var(--accent); }
.ad-note { margin-top: .6rem; font-size: .78rem; color: var(--text-tertiary); }

.ad-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.ad-field { display: flex; flex-direction: column; gap: .3rem; min-width: 0; }
.ad-field-full { grid-column: 1 / -1; }
.ad-key { font-size: .74rem; font-weight: 600; color: var(--text-secondary); }
.ad-opt { font-weight: 400; color: var(--text-tertiary); }
.ad-input {
  width: 100%; padding: .5rem .65rem;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  background: var(--bg-app); color: var(--text-primary);
  font-family: inherit; font-size: .86rem;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.ad-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.ad-input:disabled { opacity: .6; cursor: not-allowed; }
.ad-textarea { resize: vertical; min-height: 52px; }

.ad-explain {
  margin-bottom: .8rem; padding: .6rem .7rem;
  border: 1px dashed var(--accent-border); border-radius: var(--radius-md);
  background: var(--accent-soft); color: var(--accent-text);
  font-size: .8rem; line-height: 1.45;
}

.ad-error { margin-top: .7rem; font-size: .82rem; color: #a3341d; }
.ad-success { margin-top: .7rem; font-size: .82rem; color: var(--accent-text); font-weight: 600; }

.ad-foot {
  display: flex; justify-content: flex-end; gap: .6rem;
  padding: .9rem 1.35rem; border-top: 1px solid var(--border);
  background: var(--bg-app);
}
.ad-btn {
  padding: .5rem .95rem; border-radius: var(--radius-md);
  font-family: inherit; font-size: .85rem; font-weight: 600; cursor: pointer;
  border: 1px solid transparent; transition: background .15s ease, border-color .15s ease;
}
.ad-btn:disabled { opacity: .5; cursor: not-allowed; }
.ad-btn-ghost { background: var(--bg-surface); border-color: var(--border); color: var(--text-secondary); }
.ad-btn-ghost:hover:not(:disabled) { background: var(--bg-app); color: var(--text-primary); }
.ad-btn-primary { background: var(--accent); color: #fff; }
.ad-btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.ad-btn-danger { background: #a3341d; color: #fff; }
.ad-btn-danger:hover:not(:disabled) { background: #832a17; }

.ad-conflict {
  margin-top: .7rem; padding: .7rem .75rem;
  border: 1px solid #f0cfbe; border-radius: var(--radius-md);
  background: #fdf0ea; color: #92401d;
}
.ad-conflict-text { font-size: .82rem; line-height: 1.45; }
.ad-conflict .ad-btn { margin-top: .65rem; }

@keyframes adFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes adUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes adSpin { to { transform: rotate(360deg); } }

@media (max-width: 560px) {
  .ad-grid { grid-template-columns: 1fr; }
}
</style>

<template>
  <div class="te">
    <h2>Привяжите ключ</h2>
    <p class="subtitle">Для вашей учётной записи администратор включил вход по ключу электронной подписи. Выберите сертификат с токена — дальше он понадобится при каждом входе.</p>

    <div class="te-list" :aria-busy="phase === 'loading'">
      <p v-if="phase === 'loading'" class="te-empty">Ищем сертификаты на токене…</p>
      <p v-else-if="!certs.length" class="te-empty">
        {{ phase === 'plugin-missing' ? 'Плагин КриптоПро недоступен.' : 'Действующих сертификатов не найдено. Вставьте токен и нажмите «Обновить список».' }}
      </p>
      <label
        v-for="c in certs"
        v-else
        :key="c.thumbprint"
        class="te-cert"
        :class="{ 'is-picked': picked === c.thumbprint }"
      >
        <input v-model="picked" type="radio" name="enroll-cert" :value="c.thumbprint" :disabled="busy" />
        <span class="te-cert-body">
          <span class="te-cert-name">{{ c.subject || 'Без имени' }}</span>
          <span class="te-cert-meta">{{ c.issuer || 'УЦ не указан' }} · до {{ formatDate(c.validTo) }}</span>
          <span class="te-cert-meta">…{{ c.thumbprint.slice(-8) }}<template v-if="c.media"> · {{ c.media }}</template></span>
        </span>
      </label>
    </div>

    <div class="te-status" role="status" aria-live="polite">
      <p v-if="statusText" class="te-status-text" :class="'is-' + statusTone">{{ statusText }}</p>
    </div>

    <button type="button" class="btn-primary" :disabled="!picked || busy" @click="enroll">
      {{ busyLabel || 'Подписать и привязать' }}
    </button>
    <button type="button" class="te-secondary" :disabled="busy" @click="loadCerts">Обновить список</button>

    <p class="te-hint">PIN-код вводится только в окне КриптоПро CSP. Сайт PIN-код не запрашивает и не получает.</p>

    <button type="button" class="te-link" :disabled="busy" @click="cancel">Войти под другой учётной записью</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { listCertificates, signChallenge, CryptoProError } from '../utils/cryptoPro';

const auth = useAuthStore();

const BACK_TO_LOGIN = new Set(['MFA_SESSION_EXPIRED', 'ACCOUNT_LOCKED', 'TWOFA_ALREADY_BOUND', 'FORBIDDEN_ROLE']);

const certs = ref([]);
const picked = ref('');
const phase = ref('loading');
const busyLabel = ref('');
const statusText = ref('');
const statusTone = ref('info');

const busy = computed(() => !!busyLabel.value);
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '—');

const say = (text, tone = 'info') => {
  statusText.value = text;
  statusTone.value = tone;
};

async function loadCerts() {
  phase.value = 'loading';
  say('');
  try {
    certs.value = await listCertificates();
    phase.value = 'ready';
    if (!certs.value.some((c) => c.thumbprint === picked.value)) {
      picked.value = certs.value.length === 1 ? certs.value[0].thumbprint : '';
    }
    if (certs.value.length) say('Выберите свой сертификат и нажмите «Подписать и привязать».');
  } catch (err) {
    certs.value = [];
    const e = err instanceof CryptoProError ? err : new CryptoProError('PLUGIN_MISSING');
    phase.value = e.code === 'PLUGIN_MISSING' ? 'plugin-missing' : 'ready';
    say(e.message, 'error');
  }
}

async function enroll() {
  if (!picked.value || busy.value) return;
  let challenge = null;
  let signature = null;
  try {
    busyLabel.value = 'Получаем код…';
    challenge = await auth.startEnrollment();
    busyLabel.value = 'Ожидаем подпись…';
    say('Подтвердите подпись в окне КриптоПро CSP.');
    signature = await signChallenge(challenge, { thumbprint: picked.value });
    busyLabel.value = 'Проверяем подпись…';
    say('Проверяем подпись и сертификат на сервере…');
    await auth.completeEnrollment(challenge.challengeId, signature);
  } catch (err) {
    if (err instanceof CryptoProError) {
      say(err.message, err.code === 'CANCELLED' ? 'warn' : 'error');
      if (err.code === 'TOKEN_MISSING') loadCerts();
      return;
    }
    const code = err?.response?.data?.code || '';
    const message = err?.response?.data?.message || 'Сервер недоступен. Проверьте подключение и повторите.';
    if (BACK_TO_LOGIN.has(code)) {
      await auth.cancelSecondFactor(message);
      return;
    }
    say(message, 'error');
  } finally {
    challenge = null;
    signature = null;
    busyLabel.value = '';
  }
}

async function cancel() {
  await auth.cancelSecondFactor();
}

onMounted(loadCerts);
</script>

<style scoped>
.te { padding: 2rem; }
h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
  line-height: 1.45;
}
.te-list {
  display: grid;
  gap: 0.5rem;
  min-height: 4.5rem;
  max-height: 16rem;
  overflow-y: auto;
}
.te-empty {
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding: 0.75rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
}
.te-cert {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  cursor: pointer;
}
.te-cert.is-picked { border-color: var(--sage-500, #5F7E45); background: var(--sage-50, #EEF4E2); }
.te-cert input { margin-top: 0.2rem; accent-color: var(--sage-700, #2F4A2F); }
.te-cert-body { display: grid; gap: 0.1rem; min-width: 0; }
.te-cert-name { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); overflow-wrap: anywhere; }
.te-cert-meta { font-size: 0.78rem; color: var(--text-secondary); overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.te-status { min-height: 3.5rem; margin: 0.75rem 0; }
.te-status-text {
  font-size: 0.85rem;
  line-height: 1.4;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm, 6px);
}
.te-status-text.is-info { color: var(--text-secondary); background: var(--bg-surface-sunken, #e6edf4); }
.te-status-text.is-warn { color: var(--amber-text, #7a5900); background: var(--amber-soft, #fff0df); }
.te-status-text.is-error { color: var(--red-text, #8b2f2f); background: var(--red-soft, #ffe9e6); }
.btn-primary {
  width: 100%;
  background: var(--btn-primary-bg);
  border: 1px solid var(--btn-primary-bg);
  color: var(--btn-primary-fg);
}
.btn-primary:hover:not(:disabled) {
  background: var(--btn-primary-bg-hover);
  border-color: var(--btn-primary-bg-hover);
}
.btn-primary:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
.te-secondary {
  width: 100%;
  margin-top: 0.5rem;
  background: var(--btn-secondary-bg);
  border: 1px solid var(--btn-secondary-border);
  color: var(--btn-secondary-fg);
}
.te-hint {
  margin-top: 1rem;
  font-size: 0.78rem;
  color: var(--text-tertiary, #5a7d9a);
  line-height: 1.4;
}
.te-link {
  display: block;
  margin: 0.75rem auto 0;
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-decoration: underline;
  cursor: pointer;
}
.te-link:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 768px) {
  .te { padding: 1.5rem 1.25rem; }
  .btn-primary, .te-secondary { min-height: var(--tap, 2.75rem); font-size: 1rem; }
}
</style>

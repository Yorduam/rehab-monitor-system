<template>
  <div class="tf">
    <h2>Подтвердите вход</h2>
    <p class="subtitle">Подпишите одноразовый код ключом электронной подписи с токена</p>

    <div class="tf-cert" :class="{ 'is-muted': !cert.thumbprint }">
      <div class="tf-cert-ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div class="tf-cert-body">
        <div class="tf-cert-name">{{ cert.subject || 'Сертификат учётной записи' }}</div>
        <div class="tf-cert-meta">
          <span v-if="cert.thumbprint" :title="cert.thumbprint">Отпечаток …{{ shortThumb }}</span>
          <span v-if="cert.validTo"> · до {{ formatDate(cert.validTo) }}</span>
          <span v-if="!cert.thumbprint">Получаем код…</span>
        </div>
      </div>
    </div>

    <div class="tf-timer" :class="{ 'is-low': remaining <= 30 && remaining > 0, 'is-over': expired }" aria-live="polite">
      <div class="tf-timer-bar"><span :style="{ width: progress + '%' }"></span></div>
      <div class="tf-timer-text">
        <template v-if="expired">Время на подпись истекло</template>
        <template v-else-if="remaining > 0">Код действует ещё {{ clock }}</template>
        <template v-else>&nbsp;</template>
      </div>
    </div>

    <div class="tf-status" role="status" aria-live="polite">
      <p v-if="statusText" class="tf-status-text" :class="'is-' + statusTone">{{ statusText }}</p>
    </div>

    <button
      v-if="!expired && !needsNewCode"
      type="button"
      class="btn-primary"
      :disabled="phase !== 'ready'"
      @click="sign"
    >
      {{ phase === 'signing' ? 'Ожидаем подпись…' : phase === 'verifying' ? 'Проверяем подпись…' : 'Подписать и войти' }}
    </button>
    <button v-else type="button" class="btn-primary" :disabled="phase === 'loading'" @click="begin">
      Получить новый код
    </button>

    <button
      v-if="phase === 'cert-missing' || phase === 'plugin-missing'"
      type="button"
      class="tf-secondary"
      @click="recheck"
    >
      Проверить снова
    </button>

    <p class="tf-hint">PIN-код вводится только в окне КриптоПро CSP. Сайт PIN-код не запрашивает и не получает.</p>

    <button type="button" class="tf-link" :disabled="phase === 'verifying'" @click="cancel">
      Войти под другой учётной записью
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from '../stores/auth';
import { listCertificates, signChallenge, CryptoProError } from '../utils/cryptoPro';

const auth = useAuthStore();

const BACK_TO_LOGIN = new Set(['MFA_SESSION_EXPIRED', 'ACCOUNT_LOCKED', 'TWOFA_NOT_BOUND', 'CERT_EXPIRED']);

let challenge = null;
let timer = null;
let ttlTotal = 180;

const cert = ref({ subject: '', thumbprint: '', validTo: null });
const phase = ref('loading');
const remaining = ref(0);
const expired = ref(false);
const needsNewCode = ref(false);
const statusText = ref('');
const statusTone = ref('info');

const shortThumb = computed(() => cert.value.thumbprint.slice(-8).replace(/(.{4})(.{4})/, '$1 $2'));
const clock = computed(() => {
  const s = Math.max(0, remaining.value);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
});
const progress = computed(() => {
  if (expired.value || needsNewCode.value) return 0;
  if (!remaining.value) return 100;
  return Math.max(0, Math.min(100, (remaining.value / ttlTotal) * 100));
});

const formatDate = (iso) => new Date(iso).toLocaleDateString('ru-RU');

const say = (text, tone = 'info') => {
  statusText.value = text;
  statusTone.value = tone;
};

const stopTimer = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

const startTimer = (ttlSeconds) => {
  stopTimer();
  ttlTotal = Math.max(1, ttlSeconds);
  const deadline = Date.now() + ttlSeconds * 1000;
  const tick = () => {
    remaining.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remaining.value === 0) {
      stopTimer();
      expired.value = true;
      challenge = null;
      if (phase.value !== 'verifying') say('Получите новый код и подпишите его ещё раз.', 'warn');
    }
  };
  tick();
  timer = setInterval(tick, 1000);
};

const serverError = (err) => ({
  code: err?.response?.data?.code || '',
  message: err?.response?.data?.message || 'Сервер недоступен. Проверьте подключение и повторите.'
});

async function findCertificate() {
  try {
    const certs = await listCertificates();
    if (certs.some((c) => c.thumbprint === cert.value.thumbprint)) {
      phase.value = 'ready';
      say('Токен найден. Нажмите «Подписать и войти» и введите PIN-код в окне КриптоПро.');
    } else {
      phase.value = 'cert-missing';
      say('Вставьте токен с привязанным сертификатом и нажмите «Проверить снова». Другим сертификатом войти нельзя.', 'warn');
    }
  } catch (err) {
    const e = err instanceof CryptoProError ? err : new CryptoProError('PLUGIN_MISSING');
    phase.value = e.code === 'PLUGIN_MISSING' ? 'plugin-missing' : 'cert-missing';
    say(e.message, 'error');
  }
}

async function begin() {
  phase.value = 'loading';
  expired.value = false;
  needsNewCode.value = false;
  challenge = null;
  say('Получаем одноразовый код…');
  try {
    const data = await auth.startSecondFactor();
    challenge = data;
    cert.value = { subject: data.subject || '', thumbprint: String(data.thumbprint || '').toUpperCase(), validTo: data.validTo };
    startTimer(Number(data.ttlSeconds) || 180);
  } catch (err) {
    const { code, message } = serverError(err);
    if (BACK_TO_LOGIN.has(code)) {
      await auth.cancelSecondFactor(message);
      return;
    }
    phase.value = 'error';
    needsNewCode.value = true;
    say(message, 'error');
    return;
  }
  await findCertificate();
}

async function recheck() {
  if (!challenge) return begin();
  phase.value = 'loading';
  say('Ищем токен…');
  await findCertificate();
}

async function sign() {
  if (!challenge || expired.value || phase.value !== 'ready') return;
  const current = challenge;
  phase.value = 'signing';
  say('Подтвердите подпись в окне КриптоПро CSP.');
  let signature;
  try {
    signature = await signChallenge(current);
  } catch (err) {
    const e = err instanceof CryptoProError ? err : new CryptoProError('SIGN_FAILED');
    if (e.code === 'CERT_NOT_FOUND' || e.code === 'TOKEN_MISSING') phase.value = 'cert-missing';
    else if (e.code === 'PLUGIN_MISSING') phase.value = 'plugin-missing';
    else phase.value = expired.value ? 'error' : 'ready';
    say(e.message, e.code === 'CANCELLED' ? 'warn' : 'error');
    return;
  }

  phase.value = 'verifying';
  say('Проверяем подпись на сервере…');
  try {
    await auth.completeSecondFactor(current.challengeId, signature);
    stopTimer();
  } catch (err) {
    const { code, message } = serverError(err);
    challenge = null;
    stopTimer();
    remaining.value = 0;
    if (BACK_TO_LOGIN.has(code)) {
      await auth.cancelSecondFactor(message);
      return;
    }
    phase.value = 'error';
    needsNewCode.value = true;
    say(message, 'error');
  } finally {
    signature = null;
  }
}

async function cancel() {
  stopTimer();
  challenge = null;
  await auth.cancelSecondFactor();
}

onMounted(begin);
onBeforeUnmount(() => {
  stopTimer();
  challenge = null;
});
</script>

<style scoped>
.tf { padding: 2rem; }
h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
  font-size: 0.9rem;
}
.tf-cert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  min-height: 4rem;
}
.tf-cert.is-muted { opacity: 0.7; }
.tf-cert-ic {
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--sage-50, #EEF4E2);
  color: var(--sage-700, #2F4A2F);
}
.tf-cert-ic svg { width: 1.1rem; height: 1.1rem; }
.tf-cert-body { min-width: 0; }
.tf-cert-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
.tf-cert-meta {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.tf-timer { margin: 1rem 0 0.25rem; }
.tf-timer-bar {
  height: 0.25rem;
  border-radius: 999px;
  background: var(--border-light, #dce5ec);
  overflow: hidden;
}
.tf-timer-bar span {
  display: block;
  height: 100%;
  background: var(--sage-500, #5F7E45);
  transition: width 1s linear;
}
.tf-timer.is-low .tf-timer-bar span { background: var(--amber, #f5b042); }
.tf-timer-text {
  margin-top: 0.375rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  min-height: 1.2em;
}
.tf-timer.is-over .tf-timer-text { color: var(--red-text, #8b2f2f); }
.tf-status {
  min-height: 3.5rem;
  margin: 0.5rem 0 0.75rem;
}
.tf-status-text {
  font-size: 0.85rem;
  line-height: 1.4;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm, 6px);
}
.tf-status-text.is-info { color: var(--text-secondary); background: var(--bg-surface-sunken, #e6edf4); }
.tf-status-text.is-warn { color: var(--amber-text, #7a5900); background: var(--amber-soft, #fff0df); }
.tf-status-text.is-error { color: var(--red-text, #8b2f2f); background: var(--red-soft, #ffe9e6); }
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
.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}
.tf-secondary {
  width: 100%;
  margin-top: 0.5rem;
  background: var(--btn-secondary-bg);
  border: 1px solid var(--btn-secondary-border);
  color: var(--btn-secondary-fg);
}
.tf-hint {
  margin-top: 1rem;
  font-size: 0.78rem;
  color: var(--text-tertiary, #5a7d9a);
  line-height: 1.4;
}
.tf-link {
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
.tf-link:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 768px) {
  .tf { padding: 1.5rem 1.25rem; }
  .btn-primary, .tf-secondary { min-height: var(--tap, 2.75rem); font-size: 1rem; }
}
</style>

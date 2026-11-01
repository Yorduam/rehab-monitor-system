<template>
  <div class="sec-page">
    <header class="sec-head">
      <span class="sec-eyebrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Профиль
      </span>
      <h1 class="sec-title">Безопасность</h1>
      <p class="sec-sub">Вход по ключу электронной подписи — вторая ступень после пароля.</p>
    </header>

    <section class="card">
      <div class="card-header">
        <div class="card-title">Вход по ключу ЭП</div>
        <span v-if="status" class="sec-badges">
          <span v-if="status.required" class="sec-badge is-req">Обязателен</span>
          <span class="sec-badge" :class="status.enabled ? 'is-on' : 'is-off'">
            {{ status.enabled ? 'Включён' : 'Не настроен' }}
          </span>
        </span>
      </div>

      <div class="card-body">
        <p v-if="loading" class="sec-muted">Загружаем настройки…</p>
        <p v-else-if="loadError" class="sec-msg is-error">{{ loadError }}</p>

        <template v-else-if="status && !status.available">
          <p class="sec-muted">Вход по ключу электронной подписи доступен только сотрудникам центра.</p>
        </template>

        <template v-else-if="status">
          <dl v-if="status.enabled" class="sec-key">
            <div><dt>Владелец</dt><dd>{{ status.subject || '—' }}</dd></div>
            <div><dt>Отпечаток</dt><dd class="sec-mono">{{ groupThumb(status.thumbprint) }}</dd></div>
            <div>
              <dt>Действует до</dt>
              <dd>
                {{ formatDate(status.validTo) }}
                <span v-if="expiryNote" class="sec-tag" :class="expiryNote.tone">{{ expiryNote.text }}</span>
              </dd>
            </div>
            <div><dt>Привязан</dt><dd>{{ formatDateTime(status.boundAt) }}</dd></div>
          </dl>
          <p v-else class="sec-muted">
            После привязки при входе, кроме пароля, нужно будет подписать одноразовый код ключом с токена.
            PIN-код вводится только в окне КриптоПро CSP.
          </p>

          <p v-if="status.required" class="sec-msg is-info sec-required">
            Администратор сделал вход по ключу обязательным для вашей учётной записи. Ключ можно заменить на новый, но не отвязать.
          </p>

          <div v-if="mode === 'idle'" class="sec-actions">
            <button type="button" class="btn-primary" @click="openBind">
              {{ status.enabled ? 'Заменить ключ' : 'Привязать ключ' }}
            </button>
            <button v-if="status.enabled && !status.required" type="button" class="btn-danger" @click="openUnbind">Отвязать ключ</button>
          </div>

          <form v-if="mode === 'bind'" class="sec-panel" @submit.prevent="bind">
            <div class="sec-panel-head">
              <h2>{{ status.enabled ? 'Замена ключа' : 'Привязка ключа' }}</h2>
              <button type="button" class="btn-ghost" :disabled="busy" @click="refreshCerts">Обновить список</button>
            </div>

            <p v-if="certsLoading" class="sec-muted">Ищем сертификаты на токенах…</p>
            <p v-else-if="!certs.length && !pluginError" class="sec-muted">
              Действующих сертификатов с закрытым ключом не найдено. Вставьте токен и нажмите «Обновить список».
            </p>

            <fieldset v-if="certs.length" class="sec-certs">
              <legend class="sr-only">Сертификат для входа</legend>
              <label v-for="c in certs" :key="c.thumbprint" class="sec-cert" :class="{ 'is-picked': picked === c.thumbprint }">
                <input v-model="picked" type="radio" name="cert" :value="c.thumbprint" :disabled="busy" />
                <span class="sec-cert-body">
                  <span class="sec-cert-name">{{ c.subject || 'Без имени' }}</span>
                  <span class="sec-cert-meta">
                    {{ c.issuer || 'УЦ не указан' }} · до {{ formatDate(c.validTo) }}<template v-if="c.media"> · {{ c.media }}</template>
                  </span>
                  <span class="sec-cert-meta sec-mono">…{{ c.thumbprint.slice(-8) }}</span>
                </span>
              </label>
            </fieldset>

            <label class="sec-field">
              <span>Текущий пароль</span>
              <input v-model="password" type="password" autocomplete="current-password" required :disabled="busy" />
            </label>

            <p v-if="message" class="sec-msg" :class="'is-' + messageTone" role="status">{{ message }}</p>

            <div class="sec-actions">
              <button type="submit" class="btn-primary" :disabled="busy || !picked || !password">
                {{ busyLabel || 'Подписать и привязать' }}
              </button>
              <button type="button" class="btn-ghost" :disabled="busy" @click="closePanel">Отмена</button>
            </div>
          </form>

          <form v-if="mode === 'unbind'" class="sec-panel" @submit.prevent="unbind">
            <h2>Отвязать ключ</h2>
            <p class="sec-muted">После отвязки вход будет только по паролю. Действие попадёт в журнал аудита.</p>
            <label class="sec-field">
              <span>Текущий пароль</span>
              <input v-model="password" type="password" autocomplete="current-password" required :disabled="busy" />
            </label>
            <p v-if="message" class="sec-msg" :class="'is-' + messageTone" role="status">{{ message }}</p>
            <div class="sec-actions">
              <button type="submit" class="btn-danger" :disabled="busy || !password">
                {{ busy ? 'Отвязываем…' : 'Отвязать' }}
              </button>
              <button type="button" class="btn-ghost" :disabled="busy" @click="closePanel">Отмена</button>
            </div>
          </form>

          <p v-if="mode === 'idle' && message" class="sec-msg" :class="'is-' + messageTone" role="status">{{ message }}</p>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import { listCertificates, signChallenge, CryptoProError } from '../utils/cryptoPro';
import { notify } from '../utils/toast';

const status = ref(null);
const loading = ref(true);
const loadError = ref('');
const mode = ref('idle');
const certs = ref([]);
const certsLoading = ref(false);
const pluginError = ref(false);
const picked = ref('');
const password = ref('');
const busy = ref(false);
const busyLabel = ref('');
const message = ref('');
const messageTone = ref('info');

const DAY = 24 * 60 * 60 * 1000;

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '—');
const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const groupThumb = (t) => String(t || '').replace(/(.{4})/g, '$1 ').trim();

const expiryNote = computed(() => {
  if (!status.value?.validTo) return null;
  const left = new Date(status.value.validTo).getTime() - Date.now();
  if (left <= 0) return { text: 'истёк — вход по ключу невозможен', tone: 'is-error' };
  if (left <= 30 * DAY) return { text: `истекает через ${Math.ceil(left / DAY)} дн. — замените ключ заранее`, tone: 'is-warn' };
  return null;
});

const say = (text, tone = 'info') => {
  message.value = text;
  messageTone.value = tone;
};

const serverMessage = (err) => err?.response?.data?.message || 'Сервер недоступен. Повторите попытку.';

async function loadStatus() {
  loading.value = true;
  loadError.value = '';
  try {
    const { data } = await api.get('/auth/2fa/status');
    status.value = data;
  } catch (err) {
    loadError.value = serverMessage(err);
  } finally {
    loading.value = false;
  }
}

async function refreshCerts() {
  certsLoading.value = true;
  pluginError.value = false;
  say('');
  try {
    certs.value = await listCertificates();
    if (!certs.value.some((c) => c.thumbprint === picked.value)) {
      picked.value = certs.value.length === 1 ? certs.value[0].thumbprint : '';
    }
  } catch (err) {
    certs.value = [];
    pluginError.value = true;
    say(err instanceof CryptoProError ? err.message : 'Не удалось получить список сертификатов.', 'error');
  } finally {
    certsLoading.value = false;
  }
}

function openBind() {
  mode.value = 'bind';
  password.value = '';
  picked.value = '';
  refreshCerts();
}

function openUnbind() {
  mode.value = 'unbind';
  password.value = '';
  say('');
}

function closePanel() {
  mode.value = 'idle';
  password.value = '';
  say('');
}

async function bind() {
  if (!picked.value || !password.value || busy.value) return;
  busy.value = true;
  say('');
  let challenge = null;
  try {
    busyLabel.value = 'Получаем код…';
    const { data } = await api.post('/auth/2fa/bind/start', { currentPassword: password.value });
    challenge = data;
    password.value = '';

    busyLabel.value = 'Подтвердите подпись в окне КриптоПро…';
    let signature = await signChallenge(challenge, { thumbprint: picked.value });

    busyLabel.value = 'Проверяем подпись…';
    const { data: next } = await api.post('/auth/2fa/bind/confirm', { challengeId: challenge.challengeId, signature });
    signature = null;
    status.value = next;
    mode.value = 'idle';
    say('');
    notify('Ключ привязан. Со следующего входа понадобится токен.', { ms: 5000 });
  } catch (err) {
    if (err instanceof CryptoProError) say(err.message, err.code === 'CANCELLED' ? 'warn' : 'error');
    else say(serverMessage(err), 'error');
  } finally {
    challenge = null;
    busy.value = false;
    busyLabel.value = '';
  }
}

async function unbind() {
  if (!password.value || busy.value) return;
  busy.value = true;
  say('');
  try {
    const { data } = await api.post('/auth/2fa/unbind', { currentPassword: password.value });
    status.value = data;
    mode.value = 'idle';
    notify('Ключ отвязан. Вход теперь только по паролю.', { ms: 5000 });
  } catch (err) {
    say(serverMessage(err), 'error');
  } finally {
    password.value = '';
    busy.value = false;
  }
}

onMounted(loadStatus);
</script>

<style scoped>
.sec-page { font-family: 'Inter', system-ui, sans-serif; color: #1a211a; max-width: 46rem; }
.sec-head { margin-bottom: 1.5rem; }
.sec-eyebrow {
  display: inline-flex; align-items: center; gap: 0.45rem;
  text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem; font-weight: 600;
  color: #2F4A2F;
}
.sec-eyebrow svg { width: 16px; height: 16px; }
.sec-title {
  font-family: 'Lora', Georgia, serif; font-weight: 600;
  font-size: 1.9rem; line-height: 1.15; color: #0F140F; margin: 0.4rem 0 0.3rem;
}
.sec-sub { color: #4F564A; font-size: 0.95rem; margin: 0; }

.card { background: #FFFFFF; border-radius: 1.125rem; border: 1px solid #E4DECF; overflow: hidden; }
.card-header {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  padding: 1rem 1.35rem; border-bottom: 1px solid #EFEADC;
}
.card-title { font-family: 'Lora', Georgia, serif; font-weight: 600; font-size: 1.05rem; color: #0F140F; }
.card-body { padding: 1.1rem 1.35rem 1.35rem; }

.sec-badge {
  font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap;
}
.sec-badges { display: inline-flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.35rem; }
.sec-badge.is-req { background: #fff0df; color: #7a5900; }
.sec-required { margin: 0 0 0.25rem; }
.sec-badge.is-on { background: #EEF4E2; color: #2F4A2F; }
.sec-badge.is-off { background: #F3EEE4; color: #6E7368; }

.sec-muted { color: #4F564A; font-size: 0.9rem; line-height: 1.5; margin: 0 0 1rem; }

.sec-key { display: grid; gap: 0.6rem; margin: 0 0 1.1rem; }
.sec-key > div { display: grid; grid-template-columns: 9rem 1fr; gap: 0.75rem; }
.sec-key dt { color: #6E7368; font-size: 0.85rem; }
.sec-key dd { margin: 0; font-size: 0.9rem; color: #0F140F; overflow-wrap: anywhere; }
.sec-mono { font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace; font-size: 0.82rem; letter-spacing: 0.02em; }
.sec-tag { display: inline-block; margin-left: 0.4rem; font-size: 0.75rem; padding: 0.1rem 0.45rem; border-radius: 0.4rem; }
.sec-tag.is-warn { background: #fff0df; color: #7a5900; }
.sec-tag.is-error { background: #ffe9e6; color: #8b2f2f; }

.sec-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }

.sec-panel { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #EFEADC; }
.sec-panel h2 { font-family: 'Lora', Georgia, serif; font-size: 1rem; font-weight: 600; margin: 0 0 0.6rem; color: #0F140F; }
.sec-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }

.sec-certs { border: none; padding: 0; margin: 0.25rem 0 0.9rem; display: grid; gap: 0.5rem; }
.sec-cert {
  display: flex; gap: 0.65rem; align-items: flex-start;
  padding: 0.65rem 0.8rem; border: 1px solid #E4DECF; border-radius: 0.75rem; cursor: pointer;
}
.sec-cert.is-picked { border-color: #5F7E45; background: #F7FAF1; }
.sec-cert input { margin-top: 0.2rem; accent-color: #2F4A2F; }
.sec-cert-body { display: grid; gap: 0.15rem; min-width: 0; }
.sec-cert-name { font-weight: 600; font-size: 0.9rem; color: #0F140F; overflow-wrap: anywhere; }
.sec-cert-meta { font-size: 0.78rem; color: #6E7368; overflow-wrap: anywhere; }

.sec-field { display: grid; gap: 0.3rem; max-width: 22rem; }
.sec-field span { font-size: 0.8rem; font-weight: 600; color: #4F564A; }
.sec-field input {
  padding: 0.65rem 0.75rem; border: 1px solid #D6CFBE; border-radius: 0.6rem; font-size: 0.9rem; background: #fff;
}
.sec-field input:focus { outline: none; border-color: #5F7E45; box-shadow: 0 0 0 2px rgba(95, 126, 69, 0.25); }

.sec-msg { margin: 0.75rem 0 0; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.85rem; line-height: 1.4; }
.sec-msg.is-info { background: #e6edf4; color: #2c4c6e; }
.sec-msg.is-warn { background: #fff0df; color: #7a5900; }
.sec-msg.is-error { background: #ffe9e6; color: #8b2f2f; }

.btn-primary {
  background: var(--btn-primary-bg); border: 1px solid var(--btn-primary-bg); color: var(--btn-primary-fg);
}
.btn-primary:hover:not(:disabled) { background: var(--btn-primary-bg-hover); border-color: var(--btn-primary-bg-hover); }
.btn-danger {
  background: #fff; border: 1px solid #E8C4B8; color: var(--btn-danger-fg, #B0533F);
}
.btn-danger:hover:not(:disabled) { background: var(--btn-danger-bg-hover, #FAE9E0); }
.btn-ghost { background: none; border: 1px solid transparent; color: var(--btn-ghost-fg, #4F564A); }
.btn-ghost:hover:not(:disabled) { background: var(--btn-ghost-bg-hover, #F3EEE4); }
button:disabled { opacity: 0.6; cursor: not-allowed; }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

@media (max-width: 768px) {
  .sec-title { font-size: 1.5rem; }
  .card-header, .card-body { padding-left: 1rem; padding-right: 1rem; }
  .sec-key > div { grid-template-columns: 1fr; gap: 0.1rem; }
  .sec-actions button { flex: 1 1 100%; min-height: var(--tap, 2.75rem); }
  .sec-field { max-width: none; }
  .sec-field input { font-size: 1rem; min-height: var(--tap, 2.75rem); }
}
</style>

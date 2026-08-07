<template>
  <!-- Открыто — показываем содержимое как есть. -->
  <template v-if="!locked">
    <slot />
  </template>

  <!-- Закрыто. Слот не рендерим вовсе, и не для красоты: сервер закрытые поля
       не присылает, размывать тут физически нечего. Настоящая защита — на
       бэкенде, это только её видимая часть.

       Показываем названия полей и вместо значений — точки. Так сразу понятно,
       что именно скрыто и стоит ли вообще запрашивать доступ. Прошлый вариант
       рисовал размытые полоски: они читались как сбой отрисовки, а какие
       данные под ними — было не угадать. -->
  <div v-else class="lb">
    <dl v-if="fields.length" class="lb-rows">
      <div v-for="f in fields" :key="f" class="lb-row">
        <dt class="lb-key">{{ f }}</dt>
        <dd class="lb-val"><span class="lb-dots" aria-label="скрыто">••••••••</span></dd>
      </div>
    </dl>

    <div class="lb-cta">
      <span class="lb-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </span>
      <span class="lb-text">
        <span class="lb-title">{{ title }} — закрыто</span>
        <span class="lb-sub">Откроются после указания причины, она попадёт в журнал</span>
      </span>
      <button type="button" class="lb-btn" @click="openAsk">Показать {{ shortTitle }}</button>
    </div>
  </div>

  <!-- Запрос причины -->
  <teleport to="body">
    <div v-if="asking" class="lb-modal" @click.self="close">
      <div class="lb-box" role="dialog" aria-modal="true" aria-labelledby="lb-h">
        <h3 id="lb-h" class="lb-h">Для чего вы хотите получить информацию?</h3>
        <p class="lb-h-sub">{{ title }}</p>

        <label class="lb-label" for="lb-reason">Причина получения информации</label>
        <select id="lb-reason" v-model="reasonCode" class="lb-input" :disabled="sending">
          <option value="">— выберите причину —</option>
          <option v-for="r in reasons" :key="r.code" :value="r.code">{{ r.label }}</option>
        </select>

        <label class="lb-label" for="lb-text">
          Пояснение<template v-if="reasonCode === 'other'"> — обязательно</template>
        </label>
        <textarea
          id="lb-text" v-model="reasonText" class="lb-input lb-area" :disabled="sending"
          rows="3" maxlength="500"
          placeholder="Коротко опишите, зачем нужны эти данные"
        ></textarea>

        <p v-if="error" class="lb-err">{{ error }}</p>
        <p class="lb-note">
          Доступ откроется на {{ grantMinutes }} минут и только по этому реабилитанту.
          Запись о том, кто, когда и зачем открыл данные, сохранится в журнале.
        </p>

        <div class="lb-actions">
          <button type="button" class="lb-cancel" :disabled="sending" @click="close">Отмена</button>
          <button type="button" class="lb-ok" :disabled="sending || !reasonCode" @click="submit">
            {{ sending ? 'Открываем…' : 'Открыть данные' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref } from 'vue';
import api from '../api';
import { notifySaved } from '../utils/toast';

const props = defineProps({
  locked: { type: Boolean, default: false },
  category: { type: String, required: true },
  recipientId: { type: [Number, String], required: true },
  title: { type: String, default: 'Персональные данные' },
  shortTitle: { type: String, default: 'данные' },
  // Названия скрытых полей — чтобы человек видел, что именно закрыто.
  // Пусто (например, у сканов) — тогда рисуем только строку с кнопкой.
  fields: { type: Array, default: () => [] }
});

const emit = defineEmits(['unlocked']);

const asking = ref(false);
const sending = ref(false);
const error = ref('');
const reasonCode = ref('');
const reasonText = ref('');

// Список причин задаётся на сервере и кэшируется на всё приложение: он один и
// тот же для всех блоков, тянуть его на каждое открытие окна незачем.
const reasons = ref([]);
const grantMinutes = ref(30);
let optionsPromise = null;

const loadOptions = () => {
  if (!optionsPromise) optionsPromise = api.get('/recipients/access/options').then((r) => r.data);
  return optionsPromise;
};

const openAsk = async () => {
  error.value = '';
  reasonCode.value = '';
  reasonText.value = '';
  asking.value = true;
  try {
    const data = await loadOptions();
    reasons.value = data.reasons || [];
    grantMinutes.value = data.grantMinutes || 30;
  } catch (err) {
    console.error('loadAccessOptions', err);
    error.value = 'Не удалось загрузить список причин';
  }
};

const close = () => {
  if (sending.value) return;
  asking.value = false;
};

const submit = async () => {
  if (!reasonCode.value || sending.value) return;
  sending.value = true;
  error.value = '';
  try {
    await api.post(`/recipients/${props.recipientId}/access`, {
      category: props.category,
      reasonCode: reasonCode.value,
      reasonText: reasonText.value.trim()
    });
    asking.value = false;
    notifySaved(`Доступ открыт на ${grantMinutes.value} минут. Причина записана в журнал.`);
    // Данные подтянет родитель: сервер их не присылал, поэтому карточку надо
    // перезапросить, а не «показать спрятанное».
    emit('unlocked', props.category);
  } catch (err) {
    console.error('requestAccess', err);
    error.value = err?.response?.data?.message || 'Не удалось открыть данные';
  } finally {
    sending.value = false;
  }
};
</script>

<style scoped>
/* Панель с явной границей: без неё два закрытых блока подряд сливались в одно
   серое пятно, и было не понять, где кончается один и начинается другой. */
.lb {
  border: 0.0625rem solid var(--border-light, #dce5ec);
  border-radius: var(--radius-md, 10px);
  background: var(--bg-surface, #fff);
  overflow: hidden;
}

.lb-rows { display: flex; flex-direction: column; }
.lb-row {
  display: flex; align-items: baseline; gap: 0.75rem;
  padding: 0.5rem 0.875rem;
}
.lb-row + .lb-row { border-top: 0.0625rem solid var(--border-light, #dce5ec); }
.lb-key {
  flex: 0 0 auto; min-width: 11rem;
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--text-tertiary, #5a7d9a);
}
.lb-val { min-width: 0; }
.lb-dots {
  font-size: 0.9375rem; letter-spacing: 0.14em;
  color: var(--text-tertiary, #5a7d9a); opacity: 0.5;
  user-select: none;
}

/* Строка с кнопкой — одной полосой, а не столбиком по центру: столбик занимал
   пол-экрана, а на карточке таких блоков четыре. */
.lb-cta {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  background: var(--sage-50, #EEF4E2);
  border-top: 0.0625rem solid var(--border-light, #dce5ec);
}
/* У сканов список полей пуст, блока .lb-rows нет вовсе, и полоса с кнопкой
   становится первой. Без этого её верхняя граница легла бы вплотную к рамке
   самой панели и получилась бы двойная линия. */
.lb-cta:first-child { border-top: none; }
.lb-icon {
  flex: 0 0 1.75rem; width: 1.75rem; height: 1.75rem; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--sage-100, #E0EBD1); color: var(--sage-700, #2F4A2F);
}
.lb-icon svg { width: 0.9375rem; height: 0.9375rem; }
.lb-text { display: flex; flex-direction: column; gap: 0.0625rem; min-width: 0; flex: 1 1 auto; }
.lb-title { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary, #1a2c3e); }
.lb-sub { font-size: 0.75rem; color: var(--text-tertiary, #5a7d9a); line-height: 1.35; }
.lb-btn {
  flex: 0 0 auto;
  padding: 0.4375rem 0.875rem;
  border: 0.0625rem solid var(--sage-500, #5F7E45); border-radius: var(--radius-sm, 6px);
  background: var(--sage-500, #5F7E45); color: #fff;
  font-family: var(--font-sans); font-size: 0.8125rem; font-weight: 600;
  cursor: pointer; white-space: nowrap;
}
.lb-btn:hover { background: var(--sage-700, #2F4A2F); border-color: var(--sage-700, #2F4A2F); }

@media (max-width: 40rem) {
  .lb-row { flex-direction: column; gap: 0.125rem; }
  .lb-key { min-width: 0; }
  .lb-cta { flex-wrap: wrap; }
  .lb-btn { width: 100%; }
}

.lb-modal {
  position: fixed; inset: 0; z-index: 1200;
  display: grid; place-items: center; padding: 1rem;
  background: rgba(15, 20, 15, 0.45);
}
.lb-box {
  width: min(30rem, 100%);
  background: var(--bg-surface, #fff); border-radius: var(--radius-lg, 14px);
  box-shadow: var(--shadow-lg); padding: 1.25rem;
  font-family: var(--font-sans);
}
.lb-h { font-size: 1rem; font-weight: 600; color: var(--text-primary, #1a2c3e); }
.lb-h-sub { font-size: 0.8125rem; color: var(--text-tertiary, #5a7d9a); margin-top: 0.125rem; }
.lb-label {
  display: block; margin-top: 0.875rem; margin-bottom: 0.25rem;
  font-size: 0.75rem; font-weight: 600; color: var(--text-secondary, #2c4c6e);
}
.lb-input {
  width: 100%; padding: 0.5rem 0.625rem;
  border: 0.0625rem solid var(--border, #cbdde6); border-radius: var(--radius-sm, 6px);
  font-family: var(--font-sans); font-size: 0.875rem; color: var(--text-primary, #1a2c3e);
  background: var(--bg-surface, #fff);
}
.lb-input:focus { outline: 0.125rem solid var(--sage-400, #8AAB6A); outline-offset: 0; }
.lb-area { resize: vertical; }
.lb-err {
  margin-top: 0.625rem; padding: 0.5rem 0.625rem;
  border-radius: var(--radius-sm, 6px);
  background: var(--red-soft, #ffe9e6); color: var(--red-text, #8b2f2f);
  font-size: 0.8125rem;
}
.lb-note {
  margin-top: 0.75rem; font-size: 0.75rem; line-height: 1.45;
  color: var(--text-tertiary, #5a7d9a);
}
.lb-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.lb-cancel, .lb-ok {
  padding: 0.5rem 0.875rem; border-radius: var(--radius-sm, 6px);
  font-family: var(--font-sans); font-size: 0.8125rem; font-weight: 600; cursor: pointer;
}
.lb-cancel { border: 0.0625rem solid var(--border, #cbdde6); background: none; color: var(--text-secondary, #2c4c6e); }
.lb-ok { border: 0.0625rem solid var(--sage-500, #5F7E45); background: var(--sage-500, #5F7E45); color: #fff; }
.lb-ok:disabled, .lb-cancel:disabled { opacity: 0.55; cursor: default; }
.lb-ok:not(:disabled):hover { background: var(--sage-700, #2F4A2F); border-color: var(--sage-700, #2F4A2F); }
</style>

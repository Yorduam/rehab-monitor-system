<template>
  <Modal :title="title" @close="close">
    <form class="rsn-form" @submit.prevent="submit">
      <p v-if="text" class="rsn-text">{{ text }}</p>
      <p class="rsn-note">Это действие нельзя отменить. Оно записывается в журнал изменений.</p>
      <label class="rsn-label" :for="fieldId">Причина <span class="rsn-req">— обязательно</span></label>
      <textarea
        :id="fieldId"
        ref="field"
        v-model="reason"
        class="rsn-input"
        rows="3"
        maxlength="500"
        :disabled="busy"
        :placeholder="placeholder"
        :aria-invalid="!!error"
      ></textarea>
      <p class="rsn-hint" :class="{ 'rsn-hint-ok': valid }">
        {{ valid ? 'Причина будет сохранена в журнале' : `Не менее ${MIN_LENGTH} символов` }}
      </p>
      <p v-if="error" class="rsn-error" role="alert">{{ error }}</p>
    </form>
    <template #footer>
      <button type="button" class="btn-secondary" :disabled="busy" @click="close">Отмена</button>
      <button type="button" class="btn-danger" :disabled="!valid || busy" @click="submit">
        {{ busy ? busyLabel : confirmLabel }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import Modal from './Modal.vue';

const MIN_LENGTH = 3;

const props = defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Удалить' },
  busyLabel: { type: String, default: 'Удаляем…' },
  placeholder: { type: String, default: 'Например: карточка заведена по ошибке' },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' }
});
const emit = defineEmits(['confirm', 'close']);

const fieldId = `rsn-${Math.random().toString(36).slice(2, 9)}`;
const field = ref(null);
const reason = ref('');
const valid = computed(() => reason.value.trim().length >= MIN_LENGTH);

const close = () => { if (!props.busy) emit('close'); };
const submit = () => { if (valid.value && !props.busy) emit('confirm', reason.value.trim()); };

onMounted(async () => {
  if (!window.matchMedia?.('(hover: hover)').matches) return;
  await nextTick();
  field.value?.focus();
});
</script>

<style scoped>
.rsn-form { display: flex; flex-direction: column; gap: 0.5rem; }
.rsn-text { font-size: 0.9375rem; line-height: 1.45; color: var(--text-primary); }
.rsn-note { font-size: 0.8125rem; line-height: 1.4; color: var(--btn-ghost-fg); margin-bottom: 0.5rem; }
.rsn-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--btn-ghost-fg); }
.rsn-req { font-weight: 600; text-transform: none; letter-spacing: 0; color: var(--btn-danger-fg); }
.rsn-input {
  width: 100%;
  min-height: 5.5rem;
  resize: vertical;
  padding: 0.625rem 0.75rem;
  font: inherit;
  font-size: 1rem;
  line-height: 1.4;
  color: var(--text-primary);
  background: var(--bg-surface);
  border: 1px solid var(--btn-secondary-border);
  border-radius: var(--radius-md);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.rsn-input:focus { outline: none; border-color: var(--sage-700); box-shadow: 0 0 0 3px var(--sage-100); }
.rsn-input:disabled { opacity: 0.7; }
.rsn-hint { min-height: 1.125rem; font-size: 0.75rem; color: var(--btn-ghost-fg); }
.rsn-hint-ok { color: var(--sage-700); }
.rsn-error {
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--red-text);
  background: var(--red-soft);
  border-radius: var(--radius-md);
}
.btn-secondary, .btn-danger { min-height: var(--tap); }
</style>

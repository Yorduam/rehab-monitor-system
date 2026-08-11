import { ref } from 'vue';

export const toasts = ref([]);

let seq = 0;
const timers = new Map();

export const dismissToast = (id) => {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

export const notify = (text, { ms = 3000, key = null } = {}) => {
  if (key) {
    const prev = toasts.value.find((t) => t.key === key);
    if (prev) dismissToast(prev.id);
  }
  const id = ++seq;
  toasts.value = [...toasts.value, { id, text, key }];
  if (ms > 0) timers.set(id, setTimeout(() => dismissToast(id), ms));
  return id;
};

export const notifySaved = (text = 'Сохранено', options) => notify(text, options);

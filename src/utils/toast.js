// Общие всплывающие уведомления об успешных действиях.
//
// Сделано отдельным модулем, а не Pinia-стором, по двум причинам:
//   1) уведомления зовут из мест, где Pinia не подключена — например,
//      AddRecipientWizard.vue импортирует только vue и api;
//   2) состояние тут ровно одно — список видимых сообщений; заводить ради
//      него полноценный стор нечего.
//
// На странице диагностики есть свой тост (Diagnostics.vue, showToast). Он
// работает и переписан не был: там сообщения с разметкой внутри и своя вёрстка,
// трогать её без нужды рискованно.
import { ref } from 'vue';

export const toasts = ref([]);

let seq = 0;
// Таймеры держим вне реактивного массива: иначе каждая запись таймера
// дёргала бы перерисовку списка на ровном месте.
const timers = new Map();

export const dismissToast = (id) => {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

// key нужен, чтобы одинаковые сообщения не копились стопкой. Черновик мастера
// сохраняется на каждое нажатие клавиши — без ключа экран за минуту забился бы
// десятком одинаковых плашек. Повторный вызов с тем же ключом заменяет прежнюю
// плашку и заводит отсчёт заново.
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

// Основная точка входа: одна строка на месте вызова.
export const notifySaved = (text = 'Сохранено', options) => notify(text, options);

<template>
  <div class="rp-bar" v-if="total > 0">
    <span class="rp-info">
      Показано <strong>{{ rangeStart }}&ndash;{{ rangeEnd }}</strong> из <strong>{{ total }}</strong>
    </span>

    <nav class="rp-nav" aria-label="Страницы">
      <button
        class="rp-btn" type="button" aria-label="Предыдущая страница"
        :disabled="page <= 1" @click="go(page - 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        v-for="p in pageButtons" :key="p"
        class="rp-btn" :class="{ active: p === page }"
        type="button"
        :aria-label="`Страница ${p}`"
        :aria-current="p === page ? 'page' : undefined"
        @click="go(p)"
      >{{ p }}</button>

      <button
        class="rp-btn" type="button" aria-label="Следующая страница"
        :disabled="page >= totalPages" @click="go(page + 1)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>

    <div class="rp-per">
      <label>На странице:</label>
      <select :value="limit" @change="changeLimit(+$event.target.value)">
        <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page:       { type: Number, required: true },
  totalPages: { type: Number, required: true },
  limit:      { type: Number, required: true },
  total:      { type: Number, default: 0 }
});
const emit = defineEmits(['update:page', 'update:limit']);

const perPageOptions = [12, 24, 48];

const rangeStart = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1));
const rangeEnd   = computed(() => Math.min(props.page * props.limit, props.total));

const pageButtons = computed(() => {
  const total = props.totalPages;
  const current = props.page;
  const start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  const btns = [];
  for (let i = start; i <= end; i++) btns.push(i);
  return btns;
});

const go = (p) => {
  if (p >= 1 && p <= props.totalPages && p !== props.page) emit('update:page', p);
};
const changeLimit = (l) => emit('update:limit', l);
</script>

<style scoped>
.rp-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: auto;
  padding: 1.15rem 0.25rem 0.5rem;
  border-top: 1px solid var(--t-line, #D6CFBE);
}
.rp-info { font-size: 0.875rem; color: var(--t-ink-muted, #3A4036); white-space: nowrap; }
.rp-info strong { color: var(--t-ink-strong, #0A0D0A); font-weight: 600; }

.rp-nav { display: flex; align-items: center; gap: 0.375rem; }
.rp-btn {
  min-width: 2.25rem; height: 2.25rem; padding: 0 0.5rem;
  display: grid; place-items: center;
  border-radius: 0.5rem;
  font-size: 0.875rem; font-weight: 500;
  color: var(--t-ink-muted, #3A4036);
  background: none; border: none; cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.rp-btn:hover:not([disabled]) { background: var(--t-paper-soft, #F2ECDF); color: var(--t-ink-strong, #0A0D0A); }
.rp-btn.active { background: var(--t-sage-900, #112211); color: #F3F6EA; }
.rp-btn[disabled] { opacity: 0.4; cursor: default; }
.rp-btn svg { width: 0.875rem; height: 0.875rem; }

.rp-per { display: flex; align-items: center; gap: 0.5rem; }
.rp-per label { font-size: 0.875rem; color: var(--t-ink-muted, #3A4036); white-space: nowrap; }
.rp-per select {
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--t-line-strong, #B8AF9A);
  border-radius: 0.375rem;
  background: var(--t-paper, #fff);
  color: var(--t-ink-strong, #0A0D0A);
  font-size: 0.875rem;
  cursor: pointer;
}
.rp-per select:hover { border-color: var(--t-ink-muted, #3A4036); }

@media (max-width: 40rem) {
  .rp-bar { justify-content: center; }
}
</style>

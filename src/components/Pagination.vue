<template>
  <div class="pagination-container">
    <div class="pagination-controls">
      <button class="btn-ghost" :disabled="page === 1" @click="changePage(page - 1)">←</button>
      <span class="page-info">Страница {{ page }} из {{ totalPages }}</span>
      <button class="btn-ghost" :disabled="page === totalPages" @click="changePage(page + 1)">→</button>
    </div>
    <div class="limit-selector">
      <label>Показывать:</label>
      <select :value="limit" @change="changeLimit(+$event.target.value)">
        <option v-for="opt in [15, 30, 45]" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  limit: { type: Number, required: true }
});
const emit = defineEmits(['update:page', 'update:limit']);
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= props.totalPages) {
    emit('update:page', newPage);
  }
};
const changeLimit = (newLimit) => {
  emit('update:limit', newLimit);
};
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem 0;
}
.pagination-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.page-info {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
.limit-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.limit-selector select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.9rem;
}
.btn-ghost {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-md);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--bg-surface-sunken);
}
.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
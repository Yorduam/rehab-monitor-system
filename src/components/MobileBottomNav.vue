<template>
  <div class="bottom-nav">
    <button v-for="item in navItems" :key="item.id" @click="pageStore.setPage(item.id, item.label)"
            :class="{ active: pageStore.current === item.id }">
      <span v-html="item.icon"></span>
      <span>{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { usePageStore } from '../stores/page';
const pageStore = usePageStore();
const navItems = [
  { id: 'dashboard', label: 'Дашборд', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
  { id: 'recipients', label: 'Реабилитанты', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { id: 'groups', label: 'Группы', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
  { id: 'diagnostics', label: 'Диагностика', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' }
];
</script>

<style scoped>
.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: var(--bg-surface); border-top: 1px solid var(--border);
  display: flex; justify-content: space-around; padding: 0.5rem 0.5rem env(safe-area-inset-bottom);
  z-index: 100;
}
.bottom-nav button {
  display: flex; flex-direction: column; align-items: center; background: none; border: none;
  color: var(--text-secondary); font-size: 0.7rem; gap: 0.2rem; padding: 0.3rem;
  border-radius: var(--radius-md);
}
.bottom-nav button.active { color: var(--accent); }
@media (min-width: 769px) { .bottom-nav { display: none; } }
</style>
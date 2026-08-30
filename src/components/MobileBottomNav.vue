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
  border-top: 1px solid var(--border);
  display: flex; justify-content: space-around;
  padding: 0.25rem max(0.5rem, var(--safe-right)) calc(0.25rem + var(--safe-bottom))
           max(0.5rem, var(--safe-left));
  z-index: 100;
  background: color-mix(in srgb, var(--bg-surface) 85%, transparent);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  backdrop-filter: saturate(180%) blur(18px);
}
@supports not (background: color-mix(in srgb, red 50%, transparent)) {
  .bottom-nav { background: var(--bg-surface); }
}
.bottom-nav button {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: none; border: none;
  color: var(--text-tertiary); font-size: 0.625rem; line-height: 1.1; gap: 0.1875rem;
  padding: 0.375rem 0.125rem;
  flex: 1; min-width: 3.25rem; min-height: 2.875rem;
  border-radius: var(--radius-md);
  -webkit-tap-highlight-color: transparent;
}
.bottom-nav button svg { width: 1.375rem; height: 1.375rem; }
.bottom-nav button span:last-child {
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.bottom-nav button.active { color: var(--accent); font-weight: 600; }
.bottom-nav button:active { background: var(--bg-surface-sunken); }
@media (min-width: 769px) { .bottom-nav { display: none; } }
</style>
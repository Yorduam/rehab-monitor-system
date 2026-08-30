<template>
  <header class="topbar">
    <div class="left">
      <button
        v-if="showBurger"
        class="hamburger"
        type="button"
        :aria-expanded="ui.drawerOpen"
        :aria-label="ui.drawerOpen ? 'Закрыть меню' : 'Открыть меню'"
        @click="ui.toggleDrawer()"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div class="crumbs">
        <div class="breadcrumb">ERP-Р › {{ pageStore.title }}</div>
        <div class="title">{{ pageStore.title }}</div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { usePageStore } from '../stores/page';
import { useUiStore } from '../stores/ui';

const pageStore = usePageStore();
const ui = useUiStore();

const showBurger = computed(() => ui.isMobile);
</script>

<style scoped>
.topbar {
  min-height: 64px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
}
.left { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.crumbs { min-width: 0; }
.hamburger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 2.75rem;
  margin-left: -0.5rem;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
}
@media (hover: hover) {
  .hamburger:hover { background: var(--bg-surface-sunken); }
}
.hamburger:active { background: var(--bg-surface-sunken); }
.hamburger svg { width: 1.375rem; height: 1.375rem; }
.breadcrumb {
  font-size: 0.75rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.title {
  font-size: 1.1rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .topbar {
    min-height: calc(56px + var(--safe-top));
    padding: var(--safe-top) 0.875rem 0;
    padding-left: max(0.875rem, var(--safe-left));
    padding-right: max(0.875rem, var(--safe-right));
    background: color-mix(in srgb, var(--bg-surface) 82%, transparent);
    -webkit-backdrop-filter: saturate(180%) blur(14px);
    backdrop-filter: saturate(180%) blur(14px);
  }
  .left { gap: 0.625rem; }
  .breadcrumb { display: none; }
  .title { font-size: 1.0625rem; font-weight: 600; letter-spacing: -0.01em; }
}

@supports not (background: color-mix(in srgb, red 50%, transparent)) {
  @media (max-width: 768px) {
    .topbar { background: var(--bg-surface); }
  }
}
</style>

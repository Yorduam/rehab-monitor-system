<template>
  <header class="topbar">
    <div class="left">
      <button class="hamburger" @click="toggleSidebar">☰</button>
      <div>
        <div class="breadcrumb">ERP-Р › {{ pageStore.title }}</div>
        <div class="title">{{ pageStore.title }}</div>
      </div>
    </div>
    <!-- Кнопка смены темы и окно «Настройки» удалены вместе с тёмной темой и
         режимом высокой контрастности: единственной настройкой была
         контрастность, без неё окно осталось бы пустым. -->
  </header>
</template>

<script setup>
import { usePageStore } from '../stores/page';

const pageStore = usePageStore();
const toggleSidebar = () => document.querySelector('.sidebar')?.classList.toggle('open');
</script>

<style scoped>
.topbar {
  height: 64px;
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
.left { display: flex; align-items: center; gap: 1rem; }
.hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; }
@media (max-width: 768px) { .hamburger { display: block; } }
.breadcrumb { font-size: 0.75rem; color: var(--text-secondary); }
.title { font-size: 1.1rem; font-weight: 700; }
/* Стили .right/.icon-btn/.switch/.slider удалены вместе с кнопками темы
   и настроек — в разметке они больше не встречаются. */
</style>
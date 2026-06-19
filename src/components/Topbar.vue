<template>
  <header class="topbar">
    <div class="left">
      <button class="hamburger" @click="toggleSidebar">☰</button>
      <div>
        <div class="breadcrumb">ERP-Р › {{ pageStore.title }}</div>
        <div class="title">{{ pageStore.title }}</div>
      </div>
    </div>
    <div class="right">
      <button class="icon-btn" @click="toggleTheme" title="Сменить тему">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
        </svg>
      </button>
      <button class="icon-btn" @click="openSettings" title="Настройки">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
    <Modal v-if="settingsVisible" title="Настройки" @close="settingsVisible = false">
      <div class="settings-form">
        <label class="switch-label">
          <span>Высокая контрастность</span>
          <label class="switch">
            <input type="checkbox" v-model="highContrast" @change="applyContrast">
            <span class="slider round"></span>
          </label>
        </label>
      </div>
    </Modal>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePageStore } from '../stores/page';
import Modal from './Modal.vue';

const pageStore = usePageStore();
const settingsVisible = ref(false);
const highContrast = ref(localStorage.getItem('contrast') === 'high');
const toggleSidebar = () => document.querySelector('.sidebar')?.classList.toggle('open');
const toggleTheme = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
};
const openSettings = () => { settingsVisible.value = true; };
const applyContrast = () => {
  document.body.classList.toggle('high-contrast', highContrast.value);
  localStorage.setItem('contrast', highContrast.value ? 'high' : 'normal');
};
onMounted(() => {
  if (highContrast.value) document.body.classList.add('high-contrast');
});
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
.right { display: flex; gap: 0.5rem; }
.icon-btn {
  width: 38px; height: 38px;
  background: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: grid;
  place-items: center;
}
.switch-label { display: flex; justify-content: space-between; align-items: center; }
.switch { position: relative; display: inline-block; width: 48px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc; transition: 0.3s; border-radius: 24px;
}
.slider:before {
  position: absolute; content: ""; height: 18px; width: 18px;
  left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%;
}
input:checked + .slider { background-color: var(--accent); }
input:checked + .slider:before { transform: translateX(24px); }
</style>
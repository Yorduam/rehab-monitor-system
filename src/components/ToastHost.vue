<template>
  <div class="toast-host" role="status" aria-live="polite">
    <transition-group name="toast">
      <button
        v-for="t in toasts"
        :key="t.id"
        type="button"
        class="toast"
        @click="dismissToast(t.id)"
        title="Скрыть"
      >
        <span class="toast-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <span class="toast-text">{{ t.text }}</span>
      </button>
    </transition-group>
  </div>
</template>

<script setup>
import { toasts, dismissToast } from '../utils/toast';
</script>

<style scoped>
.toast-host {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 1.25rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  max-width: 26rem;
  padding: 0.75rem 1rem;
  border: 0.0625rem solid var(--sage-400);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
}
.toast:hover { border-color: var(--sage-500); }
.toast-icon {
  flex: 0 0 1.25rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--sage-500);
  color: #fff;
}
.toast-icon svg { width: 0.75rem; height: 0.75rem; }
.toast-text { min-width: 0; }

.toast-enter-active, .toast-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateY(0.5rem); }
.toast-leave-to   { opacity: 0; transform: translateY(0.5rem); }

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active, .toast-leave-active { transition: none; }
}

@media (max-width: 48rem) {
  .toast-host {
    left: max(1rem, var(--safe-left, 0px));
    right: max(1rem, var(--safe-right, 0px));
    bottom: calc(var(--bottom-nav-h, 4.375rem) + var(--safe-bottom, 0px) + 0.75rem);
    align-items: stretch;
  }
  .toast { max-width: none; text-align: center; justify-content: center; min-height: var(--tap, 2.75rem); }
}
</style>

<template>
  <div class="modal-overlay" @click.self="close">
    <div
      ref="sheet"
      class="modal"
      :class="{ dragging }"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <div class="modal-header">
        <span class="grabber" aria-hidden="true"></span>
        <h3>{{ title }}</h3>
        <button class="close-btn" type="button" aria-label="Закрыть" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
      <div class="modal-footer" v-if="$slots.footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useUiStore } from '../stores/ui';
import { useScrollLock } from '../utils/scrollLock';

const props = defineProps({ title: { type: String, default: '' } });
const emit = defineEmits(['close']);
const ui = useUiStore();
const close = () => emit('close');
const handleEscape = (e) => { if (e.key === 'Escape') close(); };
onMounted(() => document.addEventListener('keydown', handleEscape));
onUnmounted(() => document.removeEventListener('keydown', handleEscape));
useScrollLock();

const sheet = ref(null);
const dragging = ref(false);
let startY = 0;
let shift = 0;
let active = false;

const fromHeader = (e) => !!e.target.closest && !!e.target.closest('.modal-header');

const onTouchStart = (e) => {
  if (!ui.isMobile || e.touches.length !== 1 || !fromHeader(e)) return;
  active = true;
  startY = e.touches[0].clientY;
  shift = 0;
};

const onTouchMove = (e) => {
  if (!active || e.touches.length !== 1) return;
  shift = Math.max(0, e.touches[0].clientY - startY);
  if (shift < 6) return;
  e.preventDefault();
  dragging.value = true;
  if (sheet.value) sheet.value.style.transform = `translateY(${shift}px)`;
};

const onTouchEnd = () => {
  if (!active) return;
  active = false;
  dragging.value = false;
  const el = sheet.value;
  if (el) el.style.transform = '';
  if (shift > 90) close();
  shift = 0;
};
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  animation: fadeIn 0.2s ease;
}
.modal {
  background: var(--bg-surface); border-radius: var(--radius-xl);
  width: 90%; max-width: 600px; max-height: 85vh; overflow-y: auto;
  box-shadow: var(--shadow-lg); animation: slideUp 0.2s ease;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border);
  gap: 0.75rem;
}
.modal-header h3 { font-size: 1.1rem; font-weight: 700; min-width: 0; }
.grabber { display: none; }
.close-btn {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem;
  background: none; border: none; border-radius: var(--radius-md);
  color: var(--btn-ghost-fg); font-size: 1rem; cursor: pointer;
}
.close-btn:active { background: var(--btn-ghost-bg-hover); }
@media (hover: hover) {
  .close-btn:hover { background: var(--btn-ghost-bg-hover); color: var(--btn-ghost-fg-hover); }
}
.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

@media (max-width: 768px) {
  .modal-overlay { align-items: flex-end; padding: 0 0 var(--kb); }
  .modal {
    width: 100%;
    max-width: none;
    max-height: calc(100dvh - var(--kb) - 2.5rem);
    border-radius: 1rem 1rem 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: sheetUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
    padding-left: var(--safe-left);
    padding-right: var(--safe-right);
  }
  .modal.dragging { transition: none; }
  .modal-header {
    position: relative;
    padding: 1.375rem 1rem 0.75rem;
    flex: 0 0 auto;
    touch-action: none;
  }
  .grabber {
    display: block;
    position: absolute;
    top: 0.5rem; left: 50%;
    width: 2.25rem; height: 0.3125rem;
    margin-left: -1.125rem;
    border-radius: 999px;
    background: var(--border);
  }
  .modal-body {
    padding: 1rem;
    flex: 1 1 auto;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  .modal-footer {
    flex: 0 0 auto;
    flex-direction: column-reverse;
    padding: 0.75rem 1rem calc(0.75rem + var(--safe-bottom));
    background: var(--bg-surface);
  }
  .modal-footer > * { width: 100%; }
}
</style>

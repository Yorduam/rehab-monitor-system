<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="btn-ghost" @click="close">✕</button>
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
import { onMounted, onUnmounted } from 'vue';
const props = defineProps({ title: { type: String, default: '' } });
const emit = defineEmits(['close']);
const close = () => emit('close');
const handleEscape = (e) => { if (e.key === 'Escape') close(); };
onMounted(() => document.addEventListener('keydown', handleEscape));
onUnmounted(() => document.removeEventListener('keydown', handleEscape));
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
}
.modal-header h3 { font-size: 1.1rem; font-weight: 700; }
.modal-body { padding: 1.5rem; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
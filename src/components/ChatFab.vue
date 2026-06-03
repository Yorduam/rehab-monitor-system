<template>
  <button class="fab" @click="toggleChat">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  </button>
  <div v-if="chatOpen" class="chat-window">
    <div class="chat-header">
      <span>Помощник ERP</span>
      <button @click="chatOpen=false">✕</button>
    </div>
    <div class="chat-body">
      <div v-for="msg in messages" :class="['message', msg.from === 'user' ? 'user' : 'bot']">
        <b>{{ msg.from === 'user' ? 'Вы' : 'Бот' }}:</b> {{ msg.text }}
      </div>
    </div>
    <div class="chat-input">
      <input type="text" v-model="inputText" @keypress.enter="sendMessage" placeholder="Напишите...">
      <button @click="sendMessage">→</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePageStore } from '../stores/page'
import api from '../api'

const chatOpen = ref(false)
const inputText = ref('')
const messages = ref([{ from: 'bot', text: 'Привет! Напишите, что ищете — раздел, имя или термин.' }])
const pageStore = usePageStore()

const toggleChat = () => {
  chatOpen.value = !chatOpen.value
}
const sendMessage = async () => {
  if (!inputText.value.trim()) return
  messages.value.push({ from: 'user', text: inputText.value })
  const query = inputText.value
  inputText.value = ''
  try {
    const { data } = await api.get(`/search?q=${query}`)
    if (data.recipient) {
      messages.value.push({ from: 'bot', text: `Найден: ${data.recipient.fullName}. Открываю карточку.` })
      // здесь можно вызвать открытие профиля
    } else if (data.page) {
      messages.value.push({ from: 'bot', text: `Открываю: ${data.page.label}` })
      pageStore.setPage(data.page.id, data.page.label)
    } else {
      messages.value.push({ from: 'bot', text: 'Не нашёл. Попробуйте: дашборд, реабилитанты, группы, диагностика, программы, прогресс, таймлайн или имя участника.' })
    }
  } catch (err) {
    messages.value.push({ from: 'bot', text: 'Ошибка поиска' })
  }
}
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #4b5675;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(118,183,41,0.4);
}
.chat-window {
  position: fixed;
  bottom: 5rem;
  right: 1.5rem;
  width: 320px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}
.chat-header {
  padding: 0.75rem;
  background: #76B729;
  color: white;
  display: flex;
  justify-content: space-between;
}
.chat-body {
  height: 300px;
  overflow-y: auto;
  padding: 0.75rem;
  font-size: 0.85rem;
}
.message {
  margin-bottom: 0.5rem;
}
.message.user {
  text-align: right;
}
.chat-input {
  display: flex;
  border-top: 1px solid var(--border);
}
.chat-input input {
  flex: 1;
  border: none;
  padding: 0.75rem;
  outline: none;
}
.chat-input button {
  background: none;
  border: none;
  padding: 0 1rem;
  font-weight: bold;
  cursor: pointer;
}
</style>
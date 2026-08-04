<template>
  <button
    class="fab" :class="{ open: chatOpen }"
    @click="toggleChat"
    :aria-label="chatOpen ? 'Закрыть помощник' : 'Открыть помощник ERP'"
  >
    <svg v-if="!chatOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  </button>

  <transition name="chat-pop">
    <div v-if="chatOpen" class="chat-window" role="dialog" aria-label="Помощник ERP">
      <div class="chat-header">
        <button
          class="chat-icon-btn" :class="{ active: menuOpen }"
          @click="toggleMenu"
          :aria-label="menuOpen ? 'Закрыть меню' : 'Открыть меню разделов'" title="Меню"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>
          </svg>
        </button>
        <div class="chat-title"><span class="chat-dot"></span> Помощник ERP</div>
        <button class="chat-icon-btn" @click="closeChat" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <div v-if="menuOpen" class="chat-menu">
        <div class="cm-group-title">Разделы</div>
        <div class="cm-grid">
          <button v-for="p in menuPages" :key="p.id" class="cm-tile" @click="openPage(p)">
            <svg class="cm-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="p.icon"/></svg>
            <span>{{ p.label }}</span>
          </button>
        </div>

        <template v-if="menuActions.length">
          <div class="cm-group-title">Быстрые действия</div>
          <div class="cm-actions">
            <button v-for="a in menuActions" :key="a" class="cm-action" @click="menuAsk(a)">{{ a }}</button>
          </div>
        </template>
      </div>

      <div class="chat-body" v-show="!menuOpen" ref="bodyEl">
        <div v-for="(msg, i) in messages" :key="i" :class="['message', msg.from]">
          <div class="msg-bubble">
            <span v-if="msg.text">{{ msg.text }}</span>

            <div v-if="msg.pages && msg.pages.length" class="msg-chips">
              <button v-for="p in msg.pages" :key="p.id" class="msg-chip" @click="openPage(p)">{{ p.label }}</button>
            </div>

            <div v-if="msg.results && msg.results.length" class="msg-results">
              <button v-for="r in msg.results" :key="r.id" class="msg-result" @click="openRecipient(r)">
                <span class="mr-avatar">{{ initials(r) }}</span>
                <span class="mr-info">
                  <span class="mr-name">{{ nameOf(r) }}</span>
                  <span class="mr-sub">{{ subOf(r) }}</span>
                </span>
                <svg class="mr-go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            <div v-if="msg.events && msg.events.length" class="msg-events">
              <button v-for="ev in msg.events" :key="ev.id" class="msg-event" @click="openEvent(ev)">
                <span class="me-time">{{ evTime(ev) }}</span>
                <span class="me-info">
                  <span class="me-name">{{ evName(ev) }}</span>
                  <span class="me-sub">
                    <span class="me-kind" :class="ev.type === 'diagnostic' ? 'k-diag' : 'k-lesson'">{{ evKind(ev) }}</span>
                    <template v-if="evSpec(ev)"> · {{ evSpec(ev) }}</template>
                  </span>
                </span>
              </button>
            </div>

            <div v-if="msg.lines && msg.lines.length" class="msg-lines">
              <div v-for="(ln, k) in msg.lines" :key="k" class="msg-line">{{ ln }}</div>
            </div>

            <div v-if="msg.more" class="msg-more">…и ещё {{ msg.more }}</div>
          </div>
        </div>

        <div v-if="loading" class="message bot">
          <div class="msg-bubble typing"><span></span><span></span><span></span></div>
        </div>
      </div>

      <div v-if="!menuOpen && messages.length <= 1" class="chat-suggest">
        <button v-for="s in suggestions" :key="s" class="suggest-chip" @click="quickAsk(s)">{{ s }}</button>
      </div>

      <form class="chat-input" @submit.prevent="sendMessage">
        <input v-model="inputText" type="text" placeholder="Спросите или напишите раздел / имя…" aria-label="Сообщение" @focus="menuOpen = false" />
        <button type="submit" :disabled="!inputText.trim() || loading" aria-label="Отправить">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </form>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { usePageStore } from '../stores/page'
import { useAuthStore } from '../stores/auth'
import { fullName } from '../utils/recipient'
import api from '../api'

const pageStore = usePageStore()
const authStore = useAuthStore()

const chatOpen = ref(false)
const menuOpen = ref(false)
const inputText = ref('')
const loading = ref(false)
const bodyEl = ref(null)
const messages = ref([
  { from: 'bot', text: 'Привет! Нажмите на меню (кнопка слева вверху), чтобы быстро перейти в раздел, или спросите словами: «кто сегодня занимается», «у кого сегодня диагностика», «кто требует внимания», «статистика», либо напишите фамилию.' }
])

const PAGES = [
  { id: 'dashboard',   label: 'Дашборд',      words: ['дашборд', 'главная', 'панель', 'сводка'],                     stems: ['дашборд', 'дэшборд', 'главн', 'панель', 'сводк'],       roles: ['*'],                              icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { id: 'recipients',  label: 'Реабилитанты', words: ['реабилитанты', 'реабилитант', 'участники', 'список', 'дети'], stems: ['реабилит', 'участник', 'список'],                       roles: ['admin', 'teacher', 'employee'],   icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
  { id: 'groups',      label: 'Группы',       words: ['группы', 'группа'],                                            stems: ['групп'],                                                roles: ['admin', 'teacher', 'employee'],   icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'diagnostics', label: 'Диагностика',  words: ['диагностика', 'диагностики', 'тесты'],                         stems: ['диагностик', 'тест', 'обследов'],                       roles: ['admin', 'teacher', 'employee'],   icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'progress',    label: 'Прогресс',     words: ['прогресс', 'успеваемость', 'динамика'],                        stems: ['прогресс', 'успеваем', 'динамик'],                      roles: ['*'],                              icon: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },
  { id: 'documents',   label: 'Документы',    words: ['документы', 'документ', 'отчёты', 'отчеты', 'справки'],         stems: ['документ', 'отчёт', 'отчет', 'справк'],                 roles: ['*'],                              icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6' },
  { id: 'schedule',    label: 'Расписание',   words: ['расписание', 'занятия', 'календарь', 'уроки'],                 stems: ['расписан', 'занят', 'календар', 'урок', 'график'],      roles: ['admin', 'teacher', 'employee'],   icon: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM16 2v4M8 2v4M3 10h18' },
  { id: 'admin-users', label: 'Пользователи', words: ['пользователи', 'сотрудники', 'аккаунты', 'персонал'],          stems: ['пользоват', 'сотрудник', 'аккаунт', 'персонал'],        roles: ['admin'],                          icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 11l2 2 4-4' }
]

const isCoord = computed(() => authStore.isAdmin || authStore.isTeacher || authStore.isEmployee)
const allowed = (p) => p.roles.includes('*') || p.roles.includes(authStore.user?.role)
const norm = (s) => (s || '').toLowerCase().trim().replace(/ё/g, 'е').replace(/[?!.,]+$/g, '')

const menuPages = computed(() => PAGES.filter(allowed))
const suggestions = computed(() => {
  if (authStore.isTeacher) return ['Мои занятия сегодня', 'Мои группы', 'Требуют внимания', 'Статистика']
  if (authStore.isRecipient) return ['Мои документы', 'Мой прогресс', 'Дашборд']
  if (isCoord.value) return ['Кто сегодня занимается', 'Требуют внимания', 'Статистика', 'Диагностика сегодня']
  return ['Дашборд', 'Прогресс', 'Документы']
})

const menuActions = computed(() => {
  if (authStore.isRecipient) return ['Мои документы', 'Мой прогресс']
  if (!isCoord.value) return []
  const base = ['Кто сегодня занимается', 'Диагностика сегодня', 'Расписание на завтра', 'Расписание на неделю', 'Ожидают диагностики', 'Требуют внимания', 'Статистика']
  if (authStore.isTeacher) base.splice(1, 0, 'Мои группы')
  return base
})

function lev(a, b) {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[n]
}

const exactPage = (q) => {
  const s = norm(q)
  return PAGES.filter(allowed).find((p) => norm(p.label) === s || p.words.map(norm).includes(s))
}
const loosePages = (q) => {
  const s = norm(q)
  if (!s) return []
  return PAGES.filter(allowed).filter((p) => p.stems.some((k) => s.includes(norm(k))))
}
function fuzzyPage(q) {
  const tokens = norm(q).split(/\s+/).filter((t) => t.length >= 4)
  if (!tokens.length) return null
  const hits = new Set()
  let match = null
  for (const p of PAGES.filter(allowed)) {
    for (const w of p.words.map(norm)) {
      for (const t of tokens) {
        const th = t.length >= 7 ? 2 : 1
        if (Math.abs(w.length - t.length) <= th && lev(w, t) <= th) { hits.add(p.id); match = p; break }
      }
      if (hits.has(p.id)) break
    }
  }
  return hits.size === 1 ? match : null
}
const pageById = (id) => PAGES.find((p) => p.id === id)

const nameOf = (r) => r._name || fullName(r)
const subOf = (r) => r._sub || r.diagnosis || 'Диагноз не указан'
const initials = (r) => {
  const src = r._name || [r.lastName, r.firstName].filter(Boolean).join(' ')
  const parts = (src || '').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '—'
}
const evTime = (ev) => (ev.startTime || '').slice(0, 5) || '—'
const evName = (ev) => (ev.recipient ? fullName(ev.recipient) : ev.title || ev.direction?.name || 'Событие')
const evKind = (ev) => (ev.type === 'diagnostic' ? 'Диагностика' : 'Занятие')
const evSpec = (ev) =>
  ev.specialist
    ? [ev.specialist.lastName, ev.specialist.firstName].filter(Boolean).join(' ')
    : ev.direction?.name || ''

const dateStr = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const fmtDate = (iso) => {
  const parts = String(iso || '').slice(0, 10).split('-')
  return parts.length === 3 ? `${parts[2]}.${parts[1]}` : ''
}

const STOP = new Set(['в', 'во', 'на', 'у', 'по', 'для', 'из', 'о', 'об', 'с', 'к', 'а', 'и', 'кто', 'что', 'какие', 'какое', 'какой', 'чьи', 'чей', 'покажи', 'показать', 'дай', 'мне', 'есть', 'ли', 'мои', 'моих', 'мой', 'моя', 'мое', 'свои', 'своих'])
function extractName(query, keywordRe) {
  return norm(query)
    .replace(keywordRe, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t))
    .join(' ')
    .trim()
}

const scrollDown = async () => {
  await nextTick()
  if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
}
const bot = (text, extra) => {
  messages.value.push({ from: 'bot', text, ...(extra || {}) })
  scrollDown()
}

const toggleChat = () => {
  chatOpen.value = !chatOpen.value
  if (chatOpen.value) scrollDown()
  else menuOpen.value = false
}
const closeChat = () => { chatOpen.value = false; menuOpen.value = false }
const toggleMenu = () => { menuOpen.value = !menuOpen.value }

const openPage = (p) => {
  pageStore.setPage(p.id, p.label)
  closeChat()
}
const openRecipient = (r) => {
  pageStore.setPage('recipient-details', 'Карточка реабилитанта', { recipientId: r.id })
  closeChat()
}
const openEvent = (ev) => {
  const rid = ev.recipient?.id || ev._rid
  if (rid) openRecipient({ id: rid })
  else openPage(pageById('schedule'))
}
const quickAsk = (text) => {
  inputText.value = text
  sendMessage()
}
const menuAsk = (text) => {
  menuOpen.value = false
  quickAsk(text)
}
function navTo(p) {
  bot(`Открываю раздел «${p.label}».`)
  setTimeout(() => openPage(p), 450)
}

async function intentDay(type, when = 'today') {
  loading.value = true
  await scrollDown()
  const dayWord = when === 'tomorrow' ? 'завтра' : 'сегодня'
  try {
    const t = dateStr(when === 'tomorrow' ? 1 : 0)
    const params = { from: t, to: t }
    if (type) params.type = type
    const { data } = await api.get('/schedule/events', { params })
    const evs = Array.isArray(data) ? data : []
    evs.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    if (!evs.length) {
      bot(type === 'diagnostic' ? `На ${dayWord} диагностик не запланировано.` : `На ${dayWord} событий в расписании нет.`)
    } else {
      const shown = evs.slice(0, 8)
      bot(type === 'diagnostic' ? `Диагностик на ${dayWord}: ${evs.length}.` : `В расписании на ${dayWord}: ${evs.length}.`, {
        events: shown,
        more: evs.length - shown.length
      })
    }
  } catch (e) {
    bot('Не удалось загрузить расписание.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentAttention() {
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get('/dashboard/missing-docs')
    const list = (data.list || []).filter((r) => r.docCount === 0)
    if (!list.length) {
      bot('Отлично — у всех есть документы, требующих внимания нет.')
    } else {
      const results = list.map((r) => ({
        id: r.id,
        _name: r.fullName,
        _sub: r.groupName && r.groupName !== '—' ? `Группа: ${r.groupName} · нет документов` : 'Нет документов'
      }))
      bot(`Требуют внимания (нет документов): ${data.missingCount}.`, { results })
    }
  } catch (e) {
    bot('Не удалось загрузить список внимания.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentStats(focus) {
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get('/dashboard/stats')
    const s = data.stats || {}
    let head = ''
    if (focus === 'groups') head = `Групп: ${s.groups ?? '—'}. `
    else if (focus === 'recipients') head = `Реабилитантов: ${s.recipients ?? '—'} (активных ${s.activeCount ?? 0}). `
    else if (focus === 'diagnostics') head = `Диагностик: ${s.resultsTotal ?? 0} (опубликовано ${s.resultsPublished ?? 0}, ожидают ${s.resultsPending ?? 0}). `
    bot(
      head +
        `Всего: реабилитантов ${s.recipients ?? '—'} (активных ${s.activeCount ?? 0}), ` +
        `групп ${s.groups ?? '—'}, ` +
        `диагностик ${s.resultsTotal ?? 0} (ожидают ${s.resultsPending ?? 0}).`,
      { pages: PAGES.filter((p) => p.id === 'recipients' && allowed(p)) }
    )
  } catch (e) {
    bot('Не удалось загрузить статистику.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function searchRecipients(query) {
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get('/recipients', { params: { search: query, limit: 5, page: 1 } })
    return Array.isArray(data) ? data : data.data || data.rows || []
  } catch (e) {
    bot('Не удалось выполнить поиск. Проверьте подключение и попробуйте ещё раз.')
    return 'error'
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentPersonAgenda(name) {
  const found = await searchRecipients(name)
  if (found === 'error') return
  if (!found.length) return bot(`Не нашёл реабилитанта по запросу «${name}».`)
  if (found.length > 1) return bot(`Несколько совпадений по «${name}» — выберите карточку:`, { results: found })
  const r = found[0]
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get(`/recipients/${r.id}/agenda`)
    const all = (data.events || []).map((e) => ({ ...e, _rid: r.id }))
    const upcoming = all.filter((e) => (e.date || '') >= dateStr())
    const src = upcoming.length ? upcoming : all
    const list = src.slice(0, 8)
    if (!list.length) {
      bot(`${fullName(r)} — событий в расписании нет.`, { results: [{ id: r.id, _name: fullName(r), _sub: 'Открыть карточку' }] })
    } else {
      bot(`${fullName(r)} — ${upcoming.length ? 'ближайшие события' : 'последние события'}:`, { events: list, more: Math.max(0, src.length - list.length) })
    }
  } catch (e) {
    bot('Не удалось загрузить расписание реабилитанта.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentPersonDocs(name) {
  const found = await searchRecipients(name)
  if (found === 'error') return
  if (!found.length) return bot(`Не нашёл реабилитанта по запросу «${name}».`)
  if (found.length > 1) return bot(`Несколько совпадений по «${name}» — выберите карточку:`, { results: found })
  const r = found[0]
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get(`/documents/recipient/${r.id}`)
    const docs = Array.isArray(data) ? data : []
    bot(
      docs.length ? `${fullName(r)}: документы оформлены (записей: ${docs.length}).` : `${fullName(r)}: документов нет.`,
      { results: [{ id: r.id, _name: fullName(r), _sub: docs.length ? 'Открыть карточку' : 'Требует оформления' }] }
    )
  } catch (e) {
    bot('Не удалось загрузить документы реабилитанта.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentGroupMembers(name) {
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get('/groups', { params: { search: name, limit: 6, page: 1 } })
    const groups = (data && data.data) || []
    if (!groups.length) return bot(`Группа «${name}» не найдена.`)
    const exact = groups.find((g) => norm(g.name) === norm(name))
    const g = exact || (groups.length === 1 ? groups[0] : null)
    if (!g) return bot(`Несколько групп по «${name}» — уточните:`, { lines: groups.map((x) => `${x.name} · ${x.participantsCount} чел.`) })
    const { data: members } = await api.get(`/groups/${g.id}/recipients`)
    const list = Array.isArray(members) ? members : []
    if (!list.length) return bot(`В группе «${g.name}» пока нет участников.`)
    bot(`Группа «${g.name}» — ${list.length} чел.:`, { results: list.slice(0, 8), more: Math.max(0, list.length - 8) })
  } catch (e) {
    bot('Не удалось загрузить состав группы.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentPendingDiagnostics() {
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get('/dashboard/diagnostics', { params: { limit: 100, page: 1 } })
    const rows = ((data && data.data) || []).filter((d) => !d.published)
    if (!rows.length) return bot('Все диагностики опубликованы — ожидающих нет.')
    const lines = rows.slice(0, 8).map((d) => `${d.recipientName} · ${d.direction}${d.date ? ' · ' + fmtDate(d.date) : ''}`)
    bot(`Ожидают публикации: ${rows.length}.`, { lines, more: Math.max(0, rows.length - 8), pages: PAGES.filter((p) => p.id === 'diagnostics' && allowed(p)) })
  } catch (e) {
    bot('Не удалось загрузить диагностики.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentWeek() {
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get('/schedule/events', { params: { from: dateStr(0), to: dateStr(6) } })
    const evs = Array.isArray(data) ? data.slice() : []
    evs.sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')))
    if (!evs.length) return bot('На ближайшую неделю событий нет.')
    const lines = evs.slice(0, 10).map(
      (e) => `${fmtDate(e.date)} ${(e.startTime || '').slice(0, 5)} · ${e.recipient ? fullName(e.recipient) : e.title || e.direction?.name || 'событие'} · ${e.type === 'diagnostic' ? 'диагностика' : 'занятие'}`
    )
    bot(`На неделю событий: ${evs.length}.`, { lines, more: Math.max(0, evs.length - 10), pages: PAGES.filter((p) => p.id === 'schedule' && allowed(p)) })
  } catch (e) {
    bot('Не удалось загрузить расписание.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentMyGroups() {
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get('/groups', { params: { limit: 50, page: 1 } })
    const groups = (data && data.data) || []
    if (!groups.length) return bot('Групп не найдено.')
    bot(`Групп: ${groups.length}.`, { lines: groups.map((g) => `${g.name} · ${g.participantsCount} чел.`), pages: PAGES.filter((p) => p.id === 'groups' && allowed(p)) })
  } catch (e) {
    bot('Не удалось загрузить группы.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

async function intentMyDocs() {
  loading.value = true
  await scrollDown()
  try {
    const { data } = await api.get('/documents/my')
    const docs = Array.isArray(data) ? data : []
    bot(
      docs.length ? `Ваши документы оформлены (записей: ${docs.length}).` : 'У вас пока нет оформленных документов.',
      { pages: PAGES.filter((p) => p.id === 'documents' && allowed(p)) }
    )
  } catch (e) {
    bot('Не удалось загрузить ваши документы.')
  } finally {
    loading.value = false
    await scrollDown()
  }
}

function showHelp(fallback) {
  let lines
  if (authStore.isRecipient) {
    lines = 'Нажмите на меню (кнопка слева вверху) для перехода. Спросите: «мои документы», «мой прогресс», или откройте дашборд.'
  } else if (isCoord.value) {
    lines =
      'Нажмите на меню (кнопка слева вверху) — там все разделы и быстрые действия. Или спросите словами: ' +
      'найти реабилитанта по фамилии, «расписание Иванова», «документы Иванова», «кто в группе …», ' +
      '«кто сегодня/завтра занимается», «у кого сегодня диагностика», «ожидают диагностики», «расписание на неделю», ' +
      '«кто требует внимания», «статистика».'
  } else {
    lines = 'Нажмите на меню (кнопка слева вверху) для быстрого перехода. Доступные разделы: дашборд, прогресс, документы.'
  }
  bot((fallback ? 'Не совсем понял запрос. ' : '') + lines)
}

async function route(query) {
  const s = norm(query)
  const coordUser = isCoord.value

  if (/^(привет|здравств|добр(ый|ое|ого)|хай|хеллоу|hello|hi|салют|доброе утро)/.test(s))
    return bot('Здравствуйте! Чем помочь? Откройте меню слева вверху или напишите запрос словами.')
  if (/(спасибо|благодар|спс|thanks|thx|пасиб)/.test(s)) return bot('Пожалуйста! Обращайтесь.')
  if (/^(пока|до свидан|прощай|бб|bye|досвидан)/.test(s)) return bot('До связи! Помощник всегда доступен по кнопке справа снизу.')
  if (/(что ты умеешь|что умеешь|помощ|справк|команд|возможност|как польз|help|меню)/.test(s)) return showHelp()

  const personal = /(^|\s)(мои|моих|мой|моя|мое|свои|своих)(\s|$)/.test(s) || s.includes('у меня')
  if (personal && authStore.isRecipient) {
    if (/(документ|справк)/.test(s)) return intentMyDocs()
    if (/(прогресс|динамик|успеваем|результат)/.test(s)) return navTo(pageById('progress'))
    if (/(расписан|занят|график|дела|событ)/.test(s)) return navTo(pageById('dashboard'))
  }
  if (personal && authStore.isTeacher) {
    if (/групп/.test(s)) return intentMyGroups()
    if (/(реабилит|дети|подопечн|участник)/.test(s)) return navTo(pageById('recipients'))
    if (/(занят|расписан|урок|график|событ)/.test(s)) return intentDay(null, s.includes('завтра') ? 'tomorrow' : 'today')
  }

  if (coordUser) {
    if (s.includes('внимани') || (s.includes('документ') && /(нет|без|отсут|проблем|не хват)/.test(s))) return intentAttention()

    const when = s.includes('завтра') ? 'tomorrow' : 'today'
    const hasDay = /(сегодн|завтра)/.test(s)
    if (s.includes('диагностик') && /(ожида|не заполн|незаполн|не опубл|неопубл|остал|пусты)/.test(s)) return intentPendingDiagnostics()
    if (/(расписан|занят|событ|график)/.test(s) && /(недел|семь дней|7 дней)/.test(s)) return intentWeek()
    if (s.includes('диагностик') && hasDay) return intentDay('diagnostic', when)
    if (hasDay && /(занят|заним|урок|расписан|событ|запис|график)/.test(s)) return intentDay(null, when)
    if (/(кто|что|какие|какое)\s+(сегодня|завтра)/.test(s)) return intentDay(null, when)

    if (s.includes('статистик') || s.includes('сводка') || s.includes('итог')) return intentStats()
    if (s.includes('сколько')) {
      if (/(групп)/.test(s)) return intentStats('groups')
      if (/(реабилит|участник|дет|человек|людей)/.test(s)) return intentStats('recipients')
      if (/(диагност|тест|результат|обследов)/.test(s)) return intentStats('diagnostics')
      if (/(документ|отчёт|отчет|справк)/.test(s)) return intentStats()
    }

    if (/групп/.test(s) && /(кто|состав|участник|список)/.test(s)) {
      const name = extractName(query, /(кто|в|во|группе|группы|группа|групп\w*|состав\w*|участник\w*|список|покажи\w*|мне|есть)/gi)
      if (name && name.length >= 2) return intentGroupMembers(name)
    }

    if (/(документ|справк|скан|бумаг)/.test(s)) {
      const name = extractName(query, /(документ\w*|справк\w*|скан\w*|бумаг\w*|у|покажи\w*|мне|есть|какие|чьи|чей|по)/gi)
      if (name && name.length >= 3) return intentPersonDocs(name)
    }

    if (/(расписан|занят|занима|дела|агенд|график|чем занят)/.test(s)) {
      const name = extractName(query, /(расписан\w*|занят\w*|занима\w*|дела|агенд\w*|график\w*|чем|ближайш\w*|событ\w*|у|покажи\w*|мне|есть|какие)/gi)
      if (name && name.length >= 3) return intentPersonAgenda(name)
    }
  }

  const ep = exactPage(query)
  if (ep) return navTo(ep)

  if (coordUser && s.length >= 2) {
    const found = await searchRecipients(query)
    if (found === 'error') return
    if (found && found.length) return bot(`Нашёл ${found.length} — откройте карточку:`, { results: found })
  }

  const lp = loosePages(query)
  if (lp.length === 1) return navTo(lp[0])
  if (lp.length > 1) return bot('Нашёл несколько разделов — выберите:', { pages: lp })

  const fp = fuzzyPage(query)
  if (fp) return navTo(fp)

  showHelp(true)
}

const sendMessage = async () => {
  const query = inputText.value.trim()
  if (!query || loading.value) return
  menuOpen.value = false
  messages.value.push({ from: 'user', text: query })
  inputText.value = ''
  await scrollDown()
  await route(query)
}
</script>

<style scoped>
.fab,
.chat-window {
  --accent: var(--sage-700);
  --accent-hover: var(--sage-900);
  --accent-soft: var(--sage-50);
  --accent-text: var(--sage-900);
  --accent-border: var(--sage-100);
}

.fab {
  position: fixed;
  bottom: calc(1.5rem + var(--fab-offset, 0rem));
  right: 1.5rem;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  background: var(--accent);
  border: none;
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(47, 74, 47, 0.35);
  z-index: 95;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.fab:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(47, 74, 47, 0.42);
}
.fab.open { background: var(--accent-hover); }

.chat-window {
  position: fixed;
  bottom: calc(5.25rem + var(--fab-offset, 0rem));
  right: 1.5rem;
  width: 350px;
  max-width: calc(100vw - 3rem);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

.chat-header {
  padding: 0.7rem 0.8rem;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.chat-title { flex: 1; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.95rem; }
.chat-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #7ee2a8; box-shadow: 0 0 0 3px rgba(126, 226, 168, 0.3); }
.chat-icon-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none; color: #fff; cursor: pointer;
  width: 1.7rem; height: 1.7rem; border-radius: 8px;
  display: grid; place-items: center; flex-shrink: 0;
  transition: background 0.15s ease;
}
.chat-icon-btn:hover, .chat-icon-btn.active { background: rgba(255, 255, 255, 0.3); }
.chat-icon-btn svg { width: 1.05rem; height: 1.05rem; }

.chat-menu {
  height: 340px;
  overflow-y: auto;
  padding: 0.9rem;
  background: var(--bg-app);
}
.cm-group-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
  font-weight: 700;
  margin: 0.1rem 0 0.55rem;
}
.cm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
.cm-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 0.7rem 0.65rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.cm-tile:hover { border-color: var(--accent); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
.cm-ico { width: 1.25rem; height: 1.25rem; color: var(--accent); }
.cm-actions { display: flex; flex-direction: column; gap: 0.4rem; }
.cm-action {
  text-align: left;
  padding: 0.55rem 0.7rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.83rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: border-color 0.15s ease, color 0.15s ease;
}
.cm-action:hover { border-color: var(--accent); color: var(--accent-text); }

.chat-body {
  height: 340px;
  overflow-y: auto;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: var(--bg-app);
}

.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.bot { justify-content: flex-start; }

.msg-bubble {
  max-width: 88%;
  padding: 0.55rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.86rem;
  line-height: 1.4;
}
.message.bot .msg-bubble {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  border-top-left-radius: 4px;
}
.message.user .msg-bubble {
  background: var(--accent);
  color: #fff;
  border-top-right-radius: 4px;
}

.msg-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
.msg-chip {
  border: 1px solid var(--accent-border);
  background: var(--accent-soft);
  color: var(--accent-text);
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.msg-chip:hover { background: var(--accent); color: #fff; }

.msg-results, .msg-events { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.5rem; }
.msg-result, .msg-event {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  text-align: left;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.msg-result:hover, .msg-event:hover { border-color: var(--accent); box-shadow: var(--shadow-sm); }

.mr-avatar {
  width: 2rem; height: 2rem; border-radius: 50%; flex-shrink: 0;
  display: grid; place-items: center;
  background: var(--accent-soft); color: var(--accent-text);
  font-size: 0.72rem; font-weight: 700;
}
.mr-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.mr-name { font-size: 0.83rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mr-sub { font-size: 0.74rem; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mr-go { width: 1rem; height: 1rem; color: var(--text-tertiary); flex-shrink: 0; }

.me-time {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--accent-text);
  font-variant-numeric: tabular-nums;
  min-width: 2.7rem;
}
.me-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.me-name { font-size: 0.83rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.me-sub { font-size: 0.74rem; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.me-kind { font-weight: 600; }
.me-kind.k-lesson { color: var(--accent); }
.me-kind.k-diag { color: var(--amber-text); }

.msg-lines { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.5rem; }
.msg-line {
  position: relative;
  padding-left: 0.65rem;
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--text-secondary);
}
.msg-line::before {
  content: '';
  position: absolute;
  left: 0; top: 0.5rem;
  width: 0.28rem; height: 0.28rem;
  border-radius: 50%;
  background: var(--accent);
}

.msg-more { margin-top: 0.4rem; font-size: 0.76rem; color: var(--text-tertiary); }

.typing { display: flex; gap: 0.25rem; align-items: center; }
.typing span { width: 0.4rem; height: 0.4rem; border-radius: 50%; background: var(--text-tertiary); opacity: 0.5; animation: typing 1s infinite ease-in-out; }
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.35; } 30% { transform: translateY(-3px); opacity: 0.9; } }

.chat-suggest { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.6rem 0.9rem 0; background: var(--bg-app); }
.suggest-chip {
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-secondary);
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.suggest-chip:hover { border-color: var(--accent); color: var(--accent-text); }

.chat-input {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.7rem;
  border-top: 1px solid var(--border-light);
  background: var(--bg-app);
}
.chat-input input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.5rem 0.85rem;
  outline: none;
  font-size: 0.85rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  transition: border-color 0.15s ease;
}
.chat-input input:focus { border-color: var(--accent); }
.chat-input button {
  flex-shrink: 0;
  width: 2.25rem; height: 2.25rem;
  border-radius: 50%;
  background: var(--accent);
  border: none; color: #fff;
  display: grid; place-items: center;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}
.chat-input button:hover:not(:disabled) { background: var(--accent-hover); }
.chat-input button:disabled { opacity: 0.45; cursor: default; }
.chat-input button svg { width: 1.05rem; height: 1.05rem; }

.chat-pop-enter-active, .chat-pop-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.chat-pop-enter-from, .chat-pop-leave-to { opacity: 0; transform: translateY(12px) scale(0.98); }

@media (max-width: 480px) {
  .chat-window { width: calc(100vw - 2rem); right: 1rem; }
}
</style>

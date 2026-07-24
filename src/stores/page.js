import { defineStore } from 'pinia'

// Флаги на уровне модуля (не в state), чтобы обработчики истории не пушили
// новую запись, когда мы САМИ восстанавливаем состояние из истории/URL.
let restoring = false
let historyInited = false

// Заголовки страниц — нужны, когда пользователь открывает прямую ссылку
// (#/recipients) или обновляет страницу: восстановить title из одного лишь URL.
const PAGE_TITLES = {
  dashboard: 'Дашборд',
  recipients: 'Реабилитанты',
  groups: 'Группы',
  diagnostics: 'Диагностика',
  progress: 'Прогресс',
  documents: 'Документы',
  schedule: 'Расписание',
  'admin-users': 'Пользователи',
  'recipient-details': 'Карточка реабилитанта'
}

// page + params -> hash-URL (#/recipients?recipientId=15) и обратно.
// ИМЕННО смена URL заставляет кнопки браузера Назад/Вперёд работать надёжно —
// в т.ч. во встроенных браузерах (VS Code Simple Browser, webview), которые
// игнорируют pushState с тем же самым URL и считают, что мы «не уходили».
function buildUrl(page, params = {}) {
  let url = '#/' + (page || 'dashboard')
  const pairs = Object.keys(params || {})
    .filter((k) => params[k] != null && params[k] !== '')
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
  if (pairs.length) url += '?' + pairs.join('&')
  return url
}

function parseUrl() {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash || ''
  if (!hash.startsWith('#/')) return null
  const [path, query = ''] = hash.slice(2).split('?')
  if (!path) return null
  const params = {}
  if (query) {
    for (const pair of query.split('&')) {
      const [k, v = ''] = pair.split('=')
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v)
    }
  }
  return { page: path, params }
}

export const usePageStore = defineStore('page', {
  state: () => ({
    current: 'dashboard',
    title: 'Дашборд',
    params: {}
  }),
  actions: {
    // Один раз: восстанавливает страницу из истории/URL, фиксирует стартовую
    // запись с её собственным URL и вешает слушатели Назад/Вперёд.
    // Вызывается лениво из setPage — работает даже без onMounted и переживает HMR.
    ensureHistory() {
      if (historyInited || typeof window === 'undefined') return
      historyInited = true

      // Применить состояние страницы из записи истории, а если в записи нет
      // state (частый случай во встроенных браузерах) — разобрать сам URL.
      // Благодаря этому страница ПЕРЕКЛЮЧАЕТСЯ всегда, как только меняется адрес.
      const applyFromHistory = () => {
        const st = window.history.state && window.history.state.__page
        let target = st
        if (!target) {
          const u = parseUrl()
          if (u) target = { page: u.page, title: PAGE_TITLES[u.page] || u.page, params: u.params }
        }
        if (!target) target = { page: 'dashboard', title: 'Дашборд', params: {} }

        restoring = true
        this.current = target.page
        this.title = target.title || PAGE_TITLES[target.page] || target.page
        this.params = target.params || {}
        restoring = false
      }

      // Начальное состояние: перезагрузка (history.state) или прямая ссылка (hash).
      const saved = window.history.state && window.history.state.__page
      if (saved) {
        restoring = true
        this.current = saved.page
        this.title = saved.title || PAGE_TITLES[saved.page] || saved.page
        this.params = saved.params || {}
        restoring = false
      } else {
        const fromUrl = parseUrl()
        if (fromUrl) {
          restoring = true
          this.current = fromUrl.page
          this.title = PAGE_TITLES[fromUrl.page] || fromUrl.page
          this.params = fromUrl.params
          restoring = false
        }
      }

      // Фиксируем текущую страницу как стартовую запись истории c её URL,
      // иначе кнопке «Назад» некуда возвращаться на первом переходе.
      window.history.replaceState(
        { __page: { page: this.current, title: this.title, params: this.params } },
        '',
        buildUrl(this.current, this.params)
      )

      // Кнопки Назад/Вперёд. Слушаем ОБА события: popstate работает в обычных
      // браузерах, hashchange — подстраховка для webview, где popstate «молчит».
      window.addEventListener('popstate', applyFromHistory)
      window.addEventListener('hashchange', applyFromHistory)
    },

    // Совместимость: App.vue вызывает initHistory() в onMounted.
    initHistory() {
      this.ensureHistory()
    },

    setPage(page, title, params = {}) {
      // Гарантируем, что стартовая запись и слушатели установлены ДО смены
      // страницы, — иначе кнопке «Назад» некуда возвращаться.
      this.ensureHistory()

      // Если ни страница, ни параметры не меняются — не плодим записи в истории.
      const sameState =
        this.current === page &&
        JSON.stringify(this.params || {}) === JSON.stringify(params || {})

      this.current = page
      this.title = title
      this.params = params

      // Пушим НОВУЮ запись со своим URL, чтобы кнопка «Назад» работала.
      // pushState НЕ вызывает popstate/hashchange — поэтому лишних срабатываний нет.
      if (!restoring && !sameState && typeof window !== 'undefined') {
        window.history.pushState(
          { __page: { page, title, params } },
          '',
          buildUrl(page, params)
        )
      }
    },

    goBack() {
      // Отдаём управление истории браузера — она сама вернёт предыдущую страницу.
      window.history.back()
    }
  }
})

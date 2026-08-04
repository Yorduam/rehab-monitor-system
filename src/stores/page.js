import { defineStore } from 'pinia'

let restoring = false
let historyInited = false

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

function buildUrl(page, params = {}) {
  let url = '#/' + (page || 'dashboard')
  const pairs = Object.keys(params || {})
    .filter((k) => params[k] != null && params[k] !== '')
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
  if (pairs.length) url += '?' + pairs.join('&')
  return url
}

function plain(obj) {
  try {
    return JSON.parse(JSON.stringify(obj ?? {}))
  } catch {
    return {}
  }
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
    ensureHistory() {
      if (historyInited || typeof window === 'undefined') return
      historyInited = true

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

      window.history.replaceState(
        { __page: { page: this.current, title: this.title, params: plain(this.params) } },
        '',
        buildUrl(this.current, this.params)
      )

      window.addEventListener('popstate', applyFromHistory)
      window.addEventListener('hashchange', applyFromHistory)
    },

    initHistory() {
      this.ensureHistory()
    },

    setPage(page, title, params = {}) {
      this.ensureHistory()

      const sameState =
        this.current === page &&
        JSON.stringify(this.params || {}) === JSON.stringify(params || {})

      this.current = page
      this.title = title
      this.params = params

      if (!restoring && !sameState && typeof window !== 'undefined') {
        window.history.pushState(
          { __page: { page, title, params: plain(params) } },
          '',
          buildUrl(page, params)
        )
      }
    },

    goBack() {
      window.history.back()
    }
  }
})

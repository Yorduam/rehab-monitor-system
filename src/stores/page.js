import { defineStore } from 'pinia'

// Флаги на уровне модуля (не в state), чтобы popstate-обработчик не пушил
// новую запись в историю, когда мы САМИ восстанавливаем состояние из истории.
let restoring = false
let historyInited = false

export const usePageStore = defineStore('page', {
  state: () => ({
    current: 'dashboard',
    title: 'Дашборд',
    params: {}
  }),
  actions: {
    // Один раз: фиксирует ТЕКУЩУЮ страницу как стартовую запись истории и вешает
    // слушатель popstate (кнопки браузера Назад/Вперёд). Вызывается лениво из
    // setPage — поэтому работает даже без onMounted и переживает hot-reload.
    ensureHistory() {
      if (historyInited || typeof window === 'undefined') return
      historyInited = true

      window.history.replaceState(
        { __page: { page: this.current, title: this.title, params: this.params } },
        ''
      )

      window.addEventListener('popstate', (e) => {
        const p = e.state && e.state.__page
        if (!p) return
        // Восстанавливаем состояние БЕЗ повторного пуша в историю.
        restoring = true
        this.current = p.page
        this.title = p.title
        this.params = p.params || {}
        restoring = false
      })
    },

    // Совместимость: App.vue может вызывать initHistory() в onMounted.
    initHistory() {
      this.ensureHistory()
    },

    setPage(page, title, params = {}) {
      // Гарантируем, что стартовая запись и слушатель установлены ДО того, как
      // сменим страницу, — иначе кнопке «Назад» некуда возвращаться.
      this.ensureHistory()

      this.current = page
      this.title = title
      this.params = params

      // Пушим запись в историю браузера, чтобы кнопка «Назад» работала.
      // Не пушим, когда сами восстанавливаемся из popstate.
      if (!restoring && typeof window !== 'undefined') {
        window.history.pushState({ __page: { page, title, params } }, '')
      }
    },

    goBack() {
      // Отдаём управление истории браузера — она сама вернёт предыдущую страницу
      // через popstate. Работает и для системной кнопки «Назад».
      window.history.back()
    }
  }
})

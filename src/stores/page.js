import { defineStore } from 'pinia'

export const usePageStore = defineStore('page', {
  state: () => ({
    current: 'dashboard',
    title: 'Дашборд',
    params: {} // дополнительные параметры, например { recipientId: 123 }
  }),
  actions: {
    setPage(page, title, params = {}) {
      this.current = page
      this.title = title
      this.params = params
    },
    goBack() {
      // возврат на предыдущую страницу (например, к списку реабилитантов)
      if (this.current === 'recipient-details') {
        this.setPage('recipients', 'Реабилитанты', {})
      }
    }
  }
})
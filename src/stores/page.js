import { defineStore } from 'pinia'

export const usePageStore = defineStore('page', {
  state: () => ({
    current: 'dashboard',
    title: 'Дашборд',
    params: {} 
  }),
  actions: {
    setPage(page, title, params = {}) {
      this.current = page
      this.title = title
      this.params = params
    },
    goBack() {
      
      if (this.current === 'recipient-details') {
        this.setPage('recipients', 'Реабилитанты', {})
      }
    }
  }
})
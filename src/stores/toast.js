import { defineStore } from 'pinia'

export const useToastStore = defineStore('toast', {
  state: () => ({
    messages: [],
  }),
  actions: {
    show(message, type = 'info') {
      const id = Date.now() + Math.random()
      this.messages.push({ id, message, type })
      setTimeout(() => {
        this.remove(id)
      }, 3000)
    },
    remove(id) {
      this.messages = this.messages.filter((m) => m.id !== id)
    },
  },
})

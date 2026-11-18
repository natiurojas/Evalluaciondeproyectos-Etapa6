import { ref } from 'vue'
import { defineStore } from 'pinia'

let counter = 0

export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])

  function dismiss(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function notify(message, type = 'success', duration = 3600) {
    counter += 1
    const id = `toast-${counter}`
    toasts.value.push({ id, message, type })
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function success(message) {
    return notify(message, 'success')
  }

  function error(message) {
    return notify(message, 'error', 5200)
  }

  function info(message) {
    return notify(message, 'info')
  }

  return { toasts, notify, success, error, info, dismiss }
})

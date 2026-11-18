<script setup>
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const iconos = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-host" aria-live="polite">
      <div v-for="toast in ui.toasts" :key="toast.id" class="toast" :class="`toast--${toast.type}`">
        <span class="toast__icon">
          <component :is="iconos[toast.type] || Info" />
        </span>
        <p class="toast__message">{{ toast.message }}</p>
        <button
          class="toast__close"
          type="button"
          aria-label="Cerrar aviso"
          @click="ui.dismiss(toast.id)"
        >
          <X />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

<script setup>
import { AlertTriangle, HelpCircle } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar acción' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirmar' },
  cancelLabel: { type: String, default: 'Cancelar' },
  tone: { type: String, default: 'danger' },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function cancelar() {
  emit('cancel')
  emit('update:modelValue', false)
}

function confirmar() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="confirm">
      <span class="confirm__icon" :class="`confirm__icon--${tone}`">
        <AlertTriangle v-if="tone === 'danger'" />
        <HelpCircle v-else />
      </span>
      <p class="confirm__message">{{ message }}</p>
    </div>
    <template #footer>
      <button class="btn btn--ghost" type="button" @click="cancelar">
        {{ cancelLabel }}
      </button>
      <button
        class="btn"
        :class="tone === 'danger' ? 'btn--danger' : 'btn--primary'"
        type="button"
        @click="confirmar"
      >
        {{ confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm {
  display: flex;
  align-items: flex-start;
  gap: 13px;
}

.confirm__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: none;
  place-items: center;
  border-radius: 50%;
  background: var(--navy-50);
  color: var(--navy-700);
}

.confirm__icon--danger {
  background: var(--red-soft);
  color: var(--red);
}

.confirm__icon svg {
  width: 20px;
  height: 20px;
}

.confirm__message {
  padding-top: 4px;
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.55;
}
</style>

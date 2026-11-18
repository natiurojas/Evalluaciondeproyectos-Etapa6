<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'md' },
  closeOnBackdrop: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const modalRef = ref(null)

const sizeClass = computed(() => {
  if (props.size === 'wide') return 'modal--wide'
  if (props.size === 'sm') return 'modal--sm'
  return ''
})

function close() {
  emit('update:modelValue', false)
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  async (abierto) => {
    if (abierto) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      const focusable = modalRef.value?.querySelector(
        'input:not([type="hidden"]), select, textarea, [data-autofocus]',
      )
      focusable?.focus()
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="modal-backdrop"
      role="presentation"
      @mousedown.self="closeOnBackdrop && close()"
    >
      <section
        ref="modalRef"
        class="modal"
        :class="sizeClass"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Diálogo'"
      >
        <header v-if="title || $slots.header" class="modal__header">
          <slot name="header">
            <div>
              <h2>{{ title }}</h2>
              <p v-if="subtitle">{{ subtitle }}</p>
            </div>
          </slot>
          <button class="modal__close" type="button" aria-label="Cerrar" @click="close">
            <X />
          </button>
        </header>

        <div class="modal__body" :class="{ 'modal__body--flush': $slots.flush }">
          <slot name="flush" />
          <slot />
        </div>

        <footer v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Teleport>
</template>

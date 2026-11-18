<script setup>
import { BookOpen } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: 'Sin resultados' },
  message: { type: String, default: '' },
  icon: { type: [Object, Function], default: () => BookOpen },
})
</script>

<template>
  <div class="empty">
    <span class="empty__icon">
      <component :is="icon" />
    </span>
    <h3>{{ title }}</h3>
    <p v-if="message">{{ message }}</p>
    <slot />
  </div>
</template>

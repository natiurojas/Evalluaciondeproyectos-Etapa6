<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
  tone: { type: String, default: '' },
})
</script>

<template>
  <article class="stat" :class="tone ? `stat--${tone}` : ''">
    <p class="stat__label">
      <component :is="icon" v-if="icon" />
      {{ label }}
    </p>
    <p class="stat__value">{{ value }}</p>
    <p v-if="hint" class="stat__hint">{{ hint }}</p>
  </article>
</template>

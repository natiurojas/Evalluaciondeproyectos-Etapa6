<script setup>
defineProps({
  size: { type: Number, default: 40 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="64" height="64" rx="15" fill="#C58A32" />
    <path
      d="M15 20.5c6-2.5 11-1.5 17 1.5 6-3 11-4 17-1.5v26c-6-2.5-11-1.5-17 1.5-6-3-11-4-17-1.5v-26Z"
      fill="#FFFDF8"
    />
    <path d="M32 22v26" stroke="#0C2A40" stroke-width="2.4" stroke-linecap="round" />
    <path
      d="M21 27c3.2-.9 6.1-.4 9 1.2M21 32.5c3.2-.9 6.1-.4 9 1.2M21 38c3.2-.9 6.1-.4 9 1.2M43 27c-3.2-.9-6.1-.4-9 1.2M43 32.5c-3.2-.9-6.1-.4-9 1.2M43 38c-3.2-.9-6.1-.4-9 1.2"
      stroke="#0C2A40"
      stroke-width="1.6"
      stroke-linecap="round"
      opacity=".5"
    />
  </svg>
</template>

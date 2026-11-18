<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import ToastHost from '@/components/ui/ToastHost.vue'

const route = useRoute()
const esPantallaPublica = computed(() => route.meta.layout === 'auth')
</script>

<template>
  <RouterView v-if="esPantallaPublica" />
  <AppLayout v-else>
    <RouterView />
  </AppLayout>
  <ToastHost />
</template>

<script setup>
import { computed } from 'vue'
import { useLoansStore } from '@/stores/loans'
import { daysLate, daysUntil } from '@/utils/dates'

const props = defineProps({
  prestamo: { type: Object, required: true },
})

const loans = useLoansStore()
const estado = computed(() => loans.estadoDe(props.prestamo))

const resultado = computed(() => {
  switch (estado.value) {
    case 'devuelto':
      return { texto: 'Devuelto', clase: 'badge--gray' }
    case 'vencido': {
      const dias = daysLate(props.prestamo.fechaVencimiento)
      return {
        texto: `Vencido · ${dias} ${dias === 1 ? 'día' : 'días'}`,
        clase: 'badge--red',
      }
    }
    case 'vence-hoy':
      return { texto: 'Vence hoy', clase: 'badge--amber' }
    case 'por-vencer': {
      const dias = daysUntil(props.prestamo.fechaVencimiento)
      return {
        texto: `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`,
        clase: 'badge--amber',
      }
    }
    default:
      return { texto: 'En plazo', clase: 'badge--green' }
  }
})
</script>

<template>
  <span class="badge" :class="resultado.clase">{{ resultado.texto }}</span>
</template>

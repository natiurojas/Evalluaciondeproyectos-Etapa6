<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalItems: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 },
  itemLabel: { type: String, default: 'resultados' },
})

const emit = defineEmits(['update:page'])

const desde = computed(() =>
  props.totalItems === 0 ? 0 : (props.page - 1) * props.pageSize + 1,
)
const hasta = computed(() => Math.min(props.page * props.pageSize, props.totalItems))

const paginas = computed(() => {
  const total = props.totalPages
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const actual = props.page
  const numeros = new Set([1, total, actual - 1, actual, actual + 1])
  if (actual <= 3) [2, 3, 4].forEach((n) => numeros.add(n))
  if (actual >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => numeros.add(n))

  const ordenados = [...numeros].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const resultado = []
  ordenados.forEach((n, index) => {
    if (index > 0 && n - ordenados[index - 1] > 1) resultado.push('…')
    resultado.push(n)
  })
  return resultado
})

function irA(pagina) {
  if (pagina === '…' || pagina === props.page) return
  emit('update:page', pagina)
}
</script>

<template>
  <div v-if="totalPages > 1 || totalItems > 0" class="pagination">
    <p class="pagination__info">
      Mostrando {{ desde }}–{{ hasta }} de {{ totalItems }} {{ itemLabel }}
    </p>
    <div v-if="totalPages > 1" class="pagination__buttons">
      <button
        class="page-btn"
        type="button"
        aria-label="Página anterior"
        :disabled="page <= 1"
        @click="irA(page - 1)"
      >
        <ChevronLeft />
      </button>
      <button
        v-for="(pagina, index) in paginas"
        :key="`${pagina}-${index}`"
        class="page-btn"
        :class="{ 'is-active': pagina === page }"
        type="button"
        :disabled="pagina === '…'"
        @click="irA(pagina)"
      >
        {{ pagina }}
      </button>
      <button
        class="page-btn"
        type="button"
        aria-label="Página siguiente"
        :disabled="page >= totalPages"
        @click="irA(page + 1)"
      >
        <ChevronRight />
      </button>
    </div>
  </div>
</template>

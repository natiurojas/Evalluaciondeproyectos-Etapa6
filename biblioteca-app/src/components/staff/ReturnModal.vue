<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { AlertCircle, CheckCircle2, Info } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import EstadoPrestamo from '@/components/loans/EstadoPrestamo.vue'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/ui'
import { formatDate, todayISO } from '@/utils/dates'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  prestamo: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const books = useBooksStore()
const users = useUsersStore()
const loans = useLoansStore()
const ui = useUiStore()

const form = reactive({
  fechaDevolucion: todayISO(),
  observaciones: '',
})
const error = ref('')

const libro = computed(() => (props.prestamo ? books.porId(props.prestamo.libroId) : null))
const usuario = computed(() =>
  props.prestamo ? users.porId(props.prestamo.usuarioId) : null,
)

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      form.fechaDevolucion = todayISO()
      form.observaciones = ''
      error.value = ''
    }
  },
  { immediate: true },
)

function confirmar() {
  if (!props.prestamo) return
  error.value = ''
  const resultado = loans.devolver(props.prestamo.id, {
    fechaDevolucion: form.fechaDevolucion,
    observaciones: form.observaciones,
  })

  if (!resultado.ok) {
    error.value = resultado.error
    return
  }

  ui.success(`Devolución registrada: «${libro.value?.titulo ?? 'libro'}».`)
  emit('done', resultado.prestamo)
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Registrar devolución"
    subtitle="Al confirmar, el ejemplar vuelve a estar disponible en el catálogo."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="prestamo && libro && usuario">
      <div class="return-summary">
        <div class="return-summary__book">
          <p class="eyebrow">Préstamo {{ prestamo.id }}</p>
          <h3>{{ libro.titulo }}</h3>
          <p class="muted small">{{ libro.autor }} · {{ libro.ubicacion }}</p>
        </div>
        <EstadoPrestamo :prestamo="prestamo" />
      </div>

      <dl class="return-grid">
        <div>
          <dt>Usuario</dt>
          <dd>{{ usuario.nombre }}</dd>
        </div>
        <div>
          <dt>Curso / área</dt>
          <dd>{{ usuario.curso || '—' }}</dd>
        </div>
        <div>
          <dt>Fecha de préstamo</dt>
          <dd>{{ formatDate(prestamo.fechaPrestamo) }}</dd>
        </div>
        <div>
          <dt>Vencimiento</dt>
          <dd>{{ formatDate(prestamo.fechaVencimiento) }}</dd>
        </div>
      </dl>

      <div class="divider" />

      <form id="form-devolucion" @submit.prevent="confirmar">
        <div class="field">
          <label class="field__label" for="devolucion-fecha">Fecha de devolución</label>
          <input
            id="devolucion-fecha"
            v-model="form.fechaDevolucion"
            class="input"
            type="date"
            :min="prestamo.fechaPrestamo"
            :max="todayISO()"
          />
        </div>

        <div class="field">
          <label class="field__label" for="devolucion-observaciones">
            Observaciones
          </label>
          <textarea
            id="devolucion-observaciones"
            v-model="form.observaciones"
            class="textarea"
            rows="2"
            placeholder="Opcional: pérdida, deterioro, aclaraciones…"
          />
        </div>

        <p v-if="form.observaciones.trim()" class="inline-note inline-note--amber" style="margin-top: 12px">
          <Info />
          La observación queda registrada en el historial del préstamo.
        </p>

        <p v-if="error" class="form-error">
          <AlertCircle />
          {{ error }}
        </p>
      </form>
    </template>

    <template #footer>
      <button class="btn btn--ghost" type="button" @click="emit('update:modelValue', false)">
        Cancelar
      </button>
      <button
        class="btn btn--primary"
        type="submit"
        form="form-devolucion"
        :disabled="!prestamo"
      >
        <CheckCircle2 />
        Confirmar devolución
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.return-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: #faf7f1;
}

.return-summary__book h3 {
  margin-top: 4px;
  font-size: 1.15rem;
}

.return-grid {
  display: grid;
  gap: 12px 20px;
  margin: 18px 0 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.return-grid dt {
  margin: 0;
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.return-grid dd {
  margin: 2px 0 0;
  color: var(--ink-soft);
  font-size: 0.86rem;
}
</style>

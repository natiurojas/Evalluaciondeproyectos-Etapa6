<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { AlertCircle, BookOpen, CalendarDays, Info, Save } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { configuracion } from '@/data/configuracion'
import { addDaysISO, formatDate, todayISO } from '@/utils/dates'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  libroId: { type: String, default: '' },
  usuarioId: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const books = useBooksStore()
const loans = useLoansStore()
const users = useUsersStore()
const auth = useAuthStore()
const ui = useUiStore()

const form = reactive({
  usuarioId: '',
  libroId: '',
  fechaVencimiento: '',
  observaciones: '',
})
const error = ref('')

const librosDisponibles = computed(() =>
  [...books.activos].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es')),
)

const libroSeleccionado = computed(() => books.porId(form.libroId))
const usuarioSeleccionado = computed(() => users.porId(form.usuarioId))
const disponibles = computed(() => loans.disponibles(libroSeleccionado.value))
const prestamosActivos = computed(() =>
  form.usuarioId ? loans.activosDeUsuario(form.usuarioId).length : 0,
)
const alLimite = computed(() => prestamosActivos.value >= configuracion.maxPrestamos)

function cargar() {
  form.usuarioId = props.usuarioId || ''
  form.libroId = props.libroId || ''
  form.fechaVencimiento = addDaysISO(todayISO(), configuracion.plazoDias)
  form.observaciones = ''
  error.value = ''
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) cargar()
  },
  { immediate: true },
)

function guardar() {
  error.value = ''
  const resultado = loans.registrar({
    libroId: form.libroId,
    usuarioId: form.usuarioId,
    fechaVencimiento: form.fechaVencimiento,
    registradoPor: auth.currentUser?.id,
    observaciones: form.observaciones,
  })

  if (!resultado.ok) {
    error.value = resultado.error
    return
  }

  ui.success(
    `Préstamo registrado. Devolución prevista: ${formatDate(resultado.prestamo.fechaVencimiento)}.`,
  )
  emit('saved', resultado.prestamo)
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    title="Registrar préstamo"
    subtitle="El sistema descuenta la disponibilidad y calcula el vencimiento."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="form-prestamo" @submit.prevent="guardar">
      <div class="field">
        <label class="field__label" for="prestamo-usuario">
          Usuario <span class="req">*</span>
        </label>
        <select id="prestamo-usuario" v-model="form.usuarioId" class="select">
          <option value="" disabled>Seleccioná un usuario</option>
          <optgroup v-if="users.estudiantes.length" label="Estudiantes">
            <option v-for="usuario in users.estudiantes" :key="usuario.id" :value="usuario.id">
              {{ usuario.nombre }} · {{ usuario.curso }} · {{ usuario.identificacion }}
            </option>
          </optgroup>
          <optgroup v-if="users.docentes.length" label="Docentes">
            <option v-for="usuario in users.docentes" :key="usuario.id" :value="usuario.id">
              {{ usuario.nombre }} · {{ usuario.curso || 'Docente' }}
            </option>
          </optgroup>
        </select>
      </div>

      <div class="field">
        <label class="field__label" for="prestamo-libro">
          Libro <span class="req">*</span>
        </label>
        <select id="prestamo-libro" v-model="form.libroId" class="select">
          <option value="" disabled>Seleccioná un libro</option>
          <option
            v-for="libro in librosDisponibles"
            :key="libro.id"
            :value="libro.id"
            :disabled="loans.disponibles(libro) === 0"
          >
            {{ libro.titulo }} · {{ loans.disponibles(libro) }} de {{ libro.ejemplares }}
          </option>
        </select>
      </div>

      <div class="field">
        <label class="field__label" for="prestamo-vencimiento">
          Fecha de vencimiento <span class="req">*</span>
        </label>
        <input
          id="prestamo-vencimiento"
          v-model="form.fechaVencimiento"
          class="input"
          type="date"
          :min="todayISO()"
        />
        <p class="field__hint">
          Plazo sugerido: {{ configuracion.plazoDias }} días. Podés modificarlo.
        </p>
      </div>

      <div class="field">
        <label class="field__label" for="prestamo-observaciones">Observaciones</label>
        <textarea
          id="prestamo-observaciones"
          v-model="form.observaciones"
          class="textarea"
          rows="2"
          placeholder="Opcional: estado del ejemplar, aclaraciones, etc."
        />
      </div>

      <div v-if="usuarioSeleccionado || libroSeleccionado" class="loan-summary">
        <div v-if="usuarioSeleccionado" class="loan-summary__item">
          <span class="loan-summary__label">Préstamos activos del usuario</span>
          <strong :class="{ 'text-danger': alLimite }">
            {{ prestamosActivos }} de {{ configuracion.maxPrestamos }}
          </strong>
        </div>
        <div v-if="libroSeleccionado" class="loan-summary__item">
          <span class="loan-summary__label">Disponibilidad del libro</span>
          <strong :class="{ 'text-danger': disponibles === 0 }">
            {{ disponibles }} de {{ libroSeleccionado.ejemplares }} ejemplares
          </strong>
        </div>
      </div>

      <p v-if="alLimite" class="inline-note inline-note--red" style="margin-top: 12px">
        <AlertCircle />
        Este usuario ya alcanzó el máximo de {{ configuracion.maxPrestamos }} préstamos activos.
      </p>

      <p v-else-if="libroSeleccionado && disponibles === 0" class="inline-note inline-note--red" style="margin-top: 12px">
        <AlertCircle />
        No quedan ejemplares disponibles de este libro.
      </p>

      <p v-else-if="libroSeleccionado && usuarioSeleccionado" class="inline-note" style="margin-top: 12px">
        <Info />
        El préstamo se guarda a nombre de {{ usuarioSeleccionado.nombre }} y lo registra
        {{ auth.nombre }}.
      </p>

      <p v-if="error" class="form-error">
        <AlertCircle />
        {{ error }}
      </p>
    </form>

    <template #footer>
      <button class="btn btn--ghost" type="button" @click="emit('update:modelValue', false)">
        Cancelar
      </button>
      <button
        class="btn btn--primary"
        type="submit"
        form="form-prestamo"
        :disabled="!form.usuarioId || !form.libroId || !form.fechaVencimiento"
      >
        <Save />
        Registrar préstamo
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.loan-summary {
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #faf7f1;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.loan-summary__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.loan-summary__label {
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.loan-summary__item strong {
  color: var(--navy-900);
  font-size: 0.92rem;
}

.text-danger {
  color: var(--red-dark) !important;
}
</style>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { AlertCircle, Save } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import { MATERIAS_NOMBRES } from '@/data/materias'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  libro: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const books = useBooksStore()
const loans = useLoansStore()
const ui = useUiStore()

const esEdicion = computed(() => Boolean(props.libro?.id))
const form = reactive({
  titulo: '',
  autor: '',
  materia: '',
  editorial: '',
  anio: '',
  isbn: '',
  ejemplares: 1,
  ubicacion: '',
  sinopsis: '',
})
const errores = reactive({})

function limpiarErrores() {
  Object.keys(errores).forEach((clave) => delete errores[clave])
}

function cargarFormulario() {
  const libro = props.libro
  Object.assign(form, {
    titulo: libro?.titulo ?? '',
    autor: libro?.autor ?? '',
    materia: libro?.materia ?? '',
    editorial: libro?.editorial ?? '',
    anio: libro?.anio ?? '',
    isbn: libro?.isbn ?? '',
    ejemplares: libro?.ejemplares ?? 1,
    ubicacion: libro?.ubicacion ?? '',
    sinopsis: libro?.sinopsis ?? '',
  })
  limpiarErrores()
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) cargarFormulario()
  },
  { immediate: true },
)

watch(
  () => props.libro,
  () => {
    if (props.modelValue) cargarFormulario()
  },
)

function validar() {
  limpiarErrores()
  if (!form.titulo.trim()) errores.titulo = 'Ingresá el título.'
  if (!form.autor.trim()) errores.autor = 'Ingresá el autor o la autora.'
  if (!form.materia) errores.materia = 'Seleccioná una materia.'

  const ejemplares = Number(form.ejemplares)
  if (!Number.isInteger(ejemplares) || ejemplares < 1) {
    errores.ejemplares = 'La cantidad debe ser un número entero mayor a cero.'
  } else if (esEdicion.value) {
    const enPrestamo = loans.activosDeLibro(props.libro.id).length
    if (ejemplares < enPrestamo) {
      errores.ejemplares = `Hay ${enPrestamo} ejemplares en préstamo; no podés dejar menos que eso.`
    }
  }

  if (form.anio !== '' && form.anio !== null) {
    const anio = Number(form.anio)
    const maximo = new Date().getFullYear() + 1
    if (!Number.isInteger(anio) || anio < 1400 || anio > maximo) {
      errores.anio = `Ingresá un año entre 1400 y ${maximo}.`
    }
  }

  if (form.isbn.trim() && books.existeIsbn(form.isbn, props.libro?.id)) {
    errores.isbn = 'Ya existe un libro con ese ISBN.'
  }

  if (
    form.titulo.trim() &&
    form.autor.trim() &&
    books.existeTituloAutor(form.titulo, form.autor, props.libro?.id)
  ) {
    errores.general = 'Ya existe un libro con el mismo título y autor.'
  }

  return Object.keys(errores).length === 0
}

function guardar() {
  if (!validar()) return

  const payload = { ...form, anio: form.anio === '' ? null : Number(form.anio) }

  if (esEdicion.value) {
    books.actualizar(props.libro.id, payload)
    ui.success('Los datos del libro se actualizaron.')
  } else {
    books.crear(payload)
    ui.success('El libro se agregó al catálogo.')
  }

  emit('saved')
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="esEdicion ? 'Editar libro' : 'Nuevo libro'"
    :subtitle="
      esEdicion
        ? 'Actualizá los datos del ejemplar. La disponibilidad se calcula con los préstamos activos.'
        : 'Completá los datos mínimos para incorporar el libro al catálogo.'
    "
    size="wide"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form id="form-libro" @submit.prevent="guardar">
      <div class="form-grid">
        <div class="field field--full">
          <label class="field__label" for="libro-titulo">
            Título <span class="req">*</span>
          </label>
          <input
            id="libro-titulo"
            v-model="form.titulo"
            class="input"
            type="text"
            placeholder="Ej.: Cien años de soledad"
            autocomplete="off"
          />
          <p v-if="errores.titulo" class="field__error">{{ errores.titulo }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="libro-autor">
            Autor/a <span class="req">*</span>
          </label>
          <input
            id="libro-autor"
            v-model="form.autor"
            class="input"
            type="text"
            placeholder="Nombre y apellido"
            autocomplete="off"
          />
          <p v-if="errores.autor" class="field__error">{{ errores.autor }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="libro-materia">
            Materia <span class="req">*</span>
          </label>
          <select id="libro-materia" v-model="form.materia" class="select">
            <option value="" disabled>Seleccioná una materia</option>
            <option v-for="materia in MATERIAS_NOMBRES" :key="materia" :value="materia">
              {{ materia }}
            </option>
          </select>
          <p v-if="errores.materia" class="field__error">{{ errores.materia }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="libro-editorial">Editorial</label>
          <input
            id="libro-editorial"
            v-model="form.editorial"
            class="input"
            type="text"
            placeholder="Ej.: Santillana"
          />
        </div>

        <div class="field">
          <label class="field__label" for="libro-anio">Año</label>
          <input
            id="libro-anio"
            v-model="form.anio"
            class="input"
            type="number"
            min="1400"
            :max="new Date().getFullYear() + 1"
            placeholder="Ej.: 2022"
          />
          <p v-if="errores.anio" class="field__error">{{ errores.anio }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="libro-isbn">ISBN</label>
          <input
            id="libro-isbn"
            v-model="form.isbn"
            class="input"
            type="text"
            placeholder="978-..."
          />
          <p v-if="errores.isbn" class="field__error">{{ errores.isbn }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="libro-ejemplares">
            Ejemplares <span class="req">*</span>
          </label>
          <input
            id="libro-ejemplares"
            v-model.number="form.ejemplares"
            class="input"
            type="number"
            min="1"
            step="1"
          />
          <p class="field__hint">Cantidad total que tiene la biblioteca.</p>
          <p v-if="errores.ejemplares" class="field__error">{{ errores.ejemplares }}</p>
        </div>

        <div class="field">
          <label class="field__label" for="libro-ubicacion">Ubicación</label>
          <input
            id="libro-ubicacion"
            v-model="form.ubicacion"
            class="input"
            type="text"
            placeholder="Ej.: Estante A-2"
          />
        </div>

        <div class="field field--full">
          <label class="field__label" for="libro-sinopsis">Sinopsis</label>
          <textarea
            id="libro-sinopsis"
            v-model="form.sinopsis"
            class="textarea"
            rows="4"
            placeholder="Breve descripción del libro para la ficha del catálogo."
          />
        </div>
      </div>

      <p v-if="errores.general" class="form-error">
        <AlertCircle />
        {{ errores.general }}
      </p>
    </form>

    <template #footer>
      <button class="btn btn--ghost" type="button" @click="emit('update:modelValue', false)">
        Cancelar
      </button>
      <button class="btn btn--primary" type="submit" form="form-libro">
        <Save />
        {{ esEdicion ? 'Guardar cambios' : 'Agregar libro' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Info, Upload } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import { downloadCsv, parseCsv, toCsv } from '@/utils/csv'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tipo: { type: String, default: 'libros' },
  titulo: { type: String, default: 'Importar CSV' },
  descripcion: { type: String, default: '' },
  columnas: { type: Array, required: true },
  ejemplo: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue', 'importar'])

const archivoRef = ref(null)
const nombreArchivo = ref('')
const texto = ref('')
const filas = ref([])
const errores = ref([])
const errorGeneral = ref('')

const filasConError = computed(() => new Set(errores.value.map((error) => error.fila)).size)
const puedeImportar = computed(
  () => filas.value.length > 0 && filasConError.value === 0 && !errorGeneral.value,
)

const columnasEsperadas = computed(() =>
  props.columnas.map((columna) => columna.key).join(', '),
)

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      reset()
    }
  },
  { immediate: true },
)

function reset() {
  nombreArchivo.value = ''
  texto.value = ''
  filas.value = []
  errores.value = []
  errorGeneral.value = ''
  if (archivoRef.value) archivoRef.value.value = ''
}

function descargarPlantilla() {
  const filaEjemplo = {}
  props.columnas.forEach((columna) => {
    filaEjemplo[columna.key] = props.ejemplo[columna.key] ?? ''
  })
  const contenido = toCsv(
    [filaEjemplo],
    props.columnas.map((columna) => ({ key: columna.key, label: columna.key })),
  )
  downloadCsv(`plantilla-${props.tipo}.csv`, contenido)
}

async function seleccionarArchivo(event) {
  const file = event.target.files?.[0]
  if (!file) return
  nombreArchivo.value = file.name
  texto.value = await file.text()
  analizar()
}

function analizar() {
  filas.value = []
  errores.value = []
  errorGeneral.value = ''

  const resultado = parseCsv(texto.value)
  if (!resultado.rows.length) {
    errorGeneral.value = 'El archivo no contiene filas para importar.'
    return
  }

  const faltantes = props.columnas
    .filter((columna) => columna.required)
    .filter((columna) => !resultado.headers.includes(columna.key))
    .map((columna) => columna.key)

  if (faltantes.length) {
    errorGeneral.value = `Faltan columnas obligatorias: ${faltantes.join(', ')}.`
    return
  }

  const nuevosErrores = []
  resultado.rows.forEach((fila) => {
    props.columnas.forEach((columna) => {
      const valor = String(fila[columna.key] ?? '').trim()

      if (columna.required && !valor) {
        nuevosErrores.push({
          fila: fila.__fila,
          mensaje: `Falta el campo «${columna.label}».`,
        })
        return
      }

      if (!valor) return

      if (columna.type === 'number' && !Number.isFinite(Number(valor))) {
        nuevosErrores.push({
          fila: fila.__fila,
          mensaje: `«${columna.label}» debe ser un número.`,
        })
      }

      if (columna.type === 'positive' && (!Number.isFinite(Number(valor)) || Number(valor) < 1)) {
        nuevosErrores.push({
          fila: fila.__fila,
          mensaje: `«${columna.label}» debe ser mayor a cero.`,
        })
      }

      if (columna.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
        nuevosErrores.push({
          fila: fila.__fila,
          mensaje: `El correo «${valor}» no es válido.`,
        })
      }
    })
  })

  filas.value = resultado.rows
  errores.value = nuevosErrores
}

function importar() {
  if (!puedeImportar.value) return
  emit('importar', filas.value)
  emit('update:modelValue', false)
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    :title="titulo"
    size="wide"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p v-if="descripcion" class="import-intro">{{ descripcion }}</p>

    <div class="import-actions">
      <input
        ref="archivoRef"
        class="sr-only"
        type="file"
        accept=".csv,text/csv"
        @change="seleccionarArchivo"
      />
      <button class="btn btn--primary" type="button" @click="archivoRef?.click()">
        <Upload />
        Elegir archivo CSV
      </button>
      <span v-if="nombreArchivo" class="import-file">
        <FileSpreadsheet />
        {{ nombreArchivo }}
      </span>
      <button class="btn btn--ghost" type="button" @click="descargarPlantilla">
        <Download />
        Descargar plantilla
      </button>
    </div>

    <div class="field">
      <label class="field__label" for="csv-texto">
        O pegá el contenido del archivo
        <button class="link-button" type="button" @click="analizar">Analizar texto</button>
      </label>
      <textarea
        id="csv-texto"
        v-model="texto"
        class="textarea import-textarea"
        rows="4"
        placeholder="titulo;autor;materia;ejemplares&#10;Cien años de soledad;Gabriel García Márquez;Literatura;4"
      />
      <p class="field__hint">
        Encabezados esperados: <code>{{ columnasEsperadas }}</code>. Se aceptan comas o punto y
        coma como separador.
      </p>
    </div>

    <p class="inline-note" style="margin-top: 14px">
      <Info />
      Antes de importar se valida cada fila. Los duplicados por ISBN, título y autor, o por
      correo, se omiten automáticamente.
    </p>

    <p v-if="errorGeneral" class="form-error">
      <AlertCircle />
      {{ errorGeneral }}
    </p>

    <div v-if="filas.length" class="import-result">
      <div class="import-result__header">
        <p class="strong">
          {{ filas.length }} {{ filas.length === 1 ? 'fila detectada' : 'filas detectadas' }}
        </p>
        <span v-if="filasConError" class="badge badge--red">
          {{ filasConError }} con errores
        </span>
        <span v-else class="badge badge--green">Sin errores de formato</span>
      </div>

      <div v-if="errores.length" class="import-errors">
        <p v-for="(error, index) in errores.slice(0, 6)" :key="index">
          Fila {{ error.fila }}: {{ error.mensaje }}
        </p>
        <p v-if="errores.length > 6" class="muted">
          y {{ errores.length - 6 }} errores más…
        </p>
      </div>

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="columna in columnas" :key="columna.key">{{ columna.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in filas.slice(0, 5)" :key="fila.__fila">
              <td v-for="columna in columnas" :key="columna.key">
                {{ fila[columna.key] || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="filas.length > 5 && !errores.length" class="muted small" style="margin-top: 8px">
        Vista previa de las primeras 5 filas.
      </p>
    </div>

    <template #footer>
      <button class="btn btn--ghost" type="button" @click="emit('update:modelValue', false)">
        Cancelar
      </button>
      <button class="btn btn--primary" type="button" :disabled="!puedeImportar" @click="importar">
        <CheckCircle2 />
        Importar {{ filas.length || '' }} {{ filas.length === 1 ? 'fila' : 'filas' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.import-intro {
  margin-bottom: 16px;
  color: var(--muted);
  font-size: 0.85rem;
}

.import-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.import-file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 0.78rem;
}

.import-file svg {
  width: 15px;
  height: 15px;
  color: var(--green);
}

.import-textarea {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.76rem;
}

code {
  padding: 1px 5px;
  border-radius: 4px;
  background: #f0ece3;
  font-size: 0.72rem;
}

.import-result {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.import-result__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.import-errors {
  padding: 10px 12px;
  border: 1px solid #edc9c4;
  border-radius: 8px;
  background: var(--red-soft);
  color: var(--red-dark);
  font-size: 0.78rem;
}

.import-errors p + p {
  margin-top: 3px;
}
</style>

<script setup>
import { computed, ref } from 'vue'
import {
  Archive,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import BookFormModal from '@/components/staff/BookFormModal.vue'
import CsvImportModal from '@/components/staff/CsvImportModal.vue'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { downloadCsv, toCsv } from '@/utils/csv'
import { includesText, pluralize } from '@/utils/text'
import { todayISO } from '@/utils/dates'

const books = useBooksStore()
const loans = useLoansStore()
const auth = useAuthStore()
const ui = useUiStore()

const busqueda = ref('')
const materia = ref('')
const estado = ref('activos')

const modalForm = ref(false)
const libroEditando = ref(null)
const modalImport = ref(false)
const modalBaja = ref(false)
const libroBaja = ref(null)

const columnasImportacion = [
  { key: 'titulo', label: 'Título', required: true },
  { key: 'autor', label: 'Autor/a', required: true },
  { key: 'materia', label: 'Materia', required: true },
  { key: 'editorial', label: 'Editorial' },
  { key: 'anio', label: 'Año', type: 'number' },
  { key: 'isbn', label: 'ISBN' },
  { key: 'ejemplares', label: 'Ejemplares', type: 'positive' },
  { key: 'ubicacion', label: 'Ubicación' },
  { key: 'sinopsis', label: 'Sinopsis' },
]

const ejemploImportacion = {
  titulo: 'Cien años de soledad',
  autor: 'Gabriel García Márquez',
  materia: 'Literatura',
  editorial: 'Sudamericana',
  anio: 1967,
  isbn: '978-950-07-1300-1',
  ejemplares: 4,
  ubicacion: 'Estante A-1',
  sinopsis: 'Novela fundamental del realismo mágico latinoamericano.',
}

const filtrados = computed(() => {
  const texto = busqueda.value.trim()
  return [...books.libros]
    .filter((libro) => {
      if (estado.value === 'activos' && !libro.activo) return false
      if (estado.value === 'inactivos' && libro.activo) return false
      if (materia.value && libro.materia !== materia.value) return false
      if (texto) {
        const contenido = [
          libro.titulo,
          libro.autor,
          libro.materia,
          libro.editorial,
          libro.isbn,
          libro.ubicacion,
        ].join(' ')
        if (!includesText(contenido, texto)) return false
      }
      return true
    })
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))
})

const sinStock = computed(
  () => books.activos.filter((libro) => loans.disponibles(libro) === 0).length,
)

const hayFiltros = computed(
  () => Boolean(busqueda.value.trim()) || Boolean(materia.value) || estado.value !== 'activos',
)

function limpiarFiltros() {
  busqueda.value = ''
  materia.value = ''
  estado.value = 'activos'
}

function abrirNuevo() {
  libroEditando.value = null
  modalForm.value = true
}

function abrirEdicion(libro) {
  libroEditando.value = libro
  modalForm.value = true
}

function pedirBaja(libro) {
  if (loans.activosDeLibro(libro.id).length > 0) {
    ui.error('No se puede dar de baja un libro con préstamos activos.')
    return
  }
  libroBaja.value = libro
  modalBaja.value = true
}

function confirmarBaja() {
  if (!libroBaja.value) return
  books.baja(libroBaja.value.id)
  ui.success(`Se dio de baja «${libroBaja.value.titulo}».`)
  libroBaja.value = null
}

function reactivar(libro) {
  books.reactivar(libro.id)
  ui.success(`Se reactivó «${libro.titulo}».`)
}

function importar(filas) {
  const resumen = books.importar(filas)
  if (resumen.creados) {
    ui.success(`Se importaron ${pluralize(resumen.creados, 'libro', 'libros')}.`)
  }
  if (resumen.omitidos) {
    ui.info(
      `${pluralize(resumen.omitidos, 'fila omitida', 'filas omitidas')} por duplicado de ISBN o de título y autor.`,
    )
  }
  if (resumen.errores.length) {
    ui.error(
      `${pluralize(resumen.errores.length, 'fila con error', 'filas con error')}. ${resumen.errores[0]}`,
    )
  }
}

function exportar() {
  const filas = filtrados.value.map((libro) => ({
    titulo: libro.titulo,
    autor: libro.autor,
    materia: libro.materia,
    editorial: libro.editorial,
    anio: libro.anio || '',
    isbn: libro.isbn,
    ejemplares: libro.ejemplares,
    disponibles: loans.disponibles(libro),
    ubicacion: libro.ubicacion,
    estado: libro.activo ? 'Activo' : 'Inactivo',
    sinopsis: libro.sinopsis,
  }))

  const contenido = toCsv(filas, [
    { key: 'titulo', label: 'Título' },
    { key: 'autor', label: 'Autor' },
    { key: 'materia', label: 'Materia' },
    { key: 'editorial', label: 'Editorial' },
    { key: 'anio', label: 'Año' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'ejemplares', label: 'Ejemplares' },
    { key: 'disponibles', label: 'Disponibles' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'estado', label: 'Estado' },
    { key: 'sinopsis', label: 'Sinopsis' },
  ])

  downloadCsv(`catalogo-${todayISO()}.csv`, contenido)
  ui.success('Se descargó el catálogo en CSV.')
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="page-header__title">
        <p class="eyebrow">Catálogo</p>
        <h1>Gestión de libros</h1>
        <p>
          Altas, ediciones y bajas lógicas. La disponibilidad se calcula automáticamente con los
          préstamos activos.
        </p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--ghost" type="button" @click="modalImport = true">
          <Upload />
          Importar CSV
        </button>
        <button class="btn btn--ghost" type="button" @click="exportar">
          <Download />
          Exportar
        </button>
        <button
          v-if="auth.can('libros:gestionar')"
          class="btn btn--primary"
          type="button"
          @click="abrirNuevo"
        >
          <Plus />
          Nuevo libro
        </button>
      </div>
    </header>

    <div class="books-summary">
      <span class="chip">{{ books.libros.length }} títulos cargados</span>
      <span class="chip">{{ books.totalEjemplares }} ejemplares</span>
      <span class="chip" :class="{ 'chip--alert': sinStock }">
        {{ sinStock }} sin ejemplares disponibles
      </span>
    </div>

    <div class="toolbar">
      <div class="toolbar__search">
        <Search />
        <input
          v-model="busqueda"
          class="input"
          type="search"
          placeholder="Buscar por título, autor, ISBN o ubicación…"
          aria-label="Buscar libros"
        />
      </div>

      <select v-model="materia" class="select toolbar__select" aria-label="Filtrar por materia">
        <option value="">Todas las materias</option>
        <option v-for="nombre in books.materias" :key="nombre" :value="nombre">
          {{ nombre }}
        </option>
      </select>

      <select v-model="estado" class="select toolbar__select" aria-label="Filtrar por estado">
        <option value="activos">Solo activos</option>
        <option value="inactivos">Solo dados de baja</option>
        <option value="todos">Todos</option>
      </select>

      <button v-if="hayFiltros" class="btn btn--quiet btn--sm" type="button" @click="limpiarFiltros">
        <RotateCcw />
        Limpiar
      </button>
    </div>

    <p class="result-count">{{ pluralize(filtrados.length, 'libro', 'libros') }}</p>

    <div v-if="filtrados.length" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Libro</th>
            <th>Materia</th>
            <th>ISBN</th>
            <th class="num">Ejemplares</th>
            <th class="num">Disponibles</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th class="num">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="libro in filtrados" :key="libro.id">
            <td>
              <div class="cell-title">
                <strong>{{ libro.titulo }}</strong>
                <span>{{ libro.autor }} · {{ libro.editorial || 'Sin editorial' }}</span>
              </div>
            </td>
            <td><span class="badge badge--gray badge--plain">{{ libro.materia }}</span></td>
            <td class="nowrap muted">{{ libro.isbn || '—' }}</td>
            <td class="num">{{ libro.ejemplares }}</td>
            <td class="num">
              <span
                class="badge"
                :class="
                  loans.disponibles(libro) === 0
                    ? 'badge--red'
                    : loans.disponibles(libro) <= 1
                      ? 'badge--amber'
                      : 'badge--green'
                "
              >
                {{ loans.disponibles(libro) }}
              </span>
            </td>
            <td class="nowrap muted">{{ libro.ubicacion || '—' }}</td>
            <td>
              <span class="badge" :class="libro.activo ? 'badge--green' : 'badge--gray'">
                {{ libro.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="cell-actions">
                <button
                  class="btn btn--quiet btn--sm"
                  type="button"
                  title="Editar libro"
                  @click="abrirEdicion(libro)"
                >
                  <Pencil />
                  Editar
                </button>
                <button
                  v-if="libro.activo"
                  class="btn btn--quiet btn--sm"
                  type="button"
                  title="Dar de baja"
                  @click="pedirBaja(libro)"
                >
                  <Archive />
                  Baja
                </button>
                <button
                  v-else
                  class="btn btn--quiet btn--sm"
                  type="button"
                  title="Reactivar libro"
                  @click="reactivar(libro)"
                >
                  <RotateCcw />
                  Activar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <EmptyState
      v-else
      title="No hay libros con esos filtros"
      message="Podés limpiar la búsqueda o crear un libro nuevo para incorporarlo al catálogo."
    >
      <button v-if="hayFiltros" class="btn btn--ghost" type="button" @click="limpiarFiltros">
        <RotateCcw />
        Limpiar filtros
      </button>
      <button class="btn btn--primary" type="button" @click="abrirNuevo">
        <Plus />
        Nuevo libro
      </button>
    </EmptyState>

    <BookFormModal v-model="modalForm" :libro="libroEditando" />
    <CsvImportModal
      v-model="modalImport"
      tipo="libros"
      titulo="Importar catálogo desde CSV"
      descripcion="Cargá el catálogo inicial o sumá títulos de forma masiva. Se valida cada fila antes de importar."
      :columnas="columnasImportacion"
      :ejemplo="ejemploImportacion"
      @importar="importar"
    />
    <ConfirmDialog
      v-model="modalBaja"
      title="Dar de baja el libro"
      :message="`«${libroBaja?.titulo || ''}» dejará de aparecer en el catálogo. El historial de préstamos se conserva y podés reactivarlo más adelante.`"
      confirm-label="Dar de baja"
      @confirm="confirmarBaja"
    />
  </div>
</template>

<style scoped>
.books-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 14px;
}

.chip--alert {
  border-color: #ecc7c2;
  background: var(--red-soft);
  color: var(--red-dark);
}

.result-count {
  margin: 14px 2px 10px;
  color: var(--muted);
  font-size: 0.78rem;
}
</style>

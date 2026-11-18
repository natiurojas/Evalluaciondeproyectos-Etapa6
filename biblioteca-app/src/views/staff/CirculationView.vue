<script setup>
import { computed, ref } from 'vue'
import {
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import EstadoPrestamo from '@/components/loans/EstadoPrestamo.vue'
import LoanFormModal from '@/components/staff/LoanFormModal.vue'
import ReturnModal from '@/components/staff/ReturnModal.vue'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/ui'
import { downloadCsv, toCsv } from '@/utils/csv'
import {
  daysLate,
  formatDate,
  humanDueLabel,
  todayISO,
} from '@/utils/dates'
import { includesText, pluralize } from '@/utils/text'

const books = useBooksStore()
const loans = useLoansStore()
const users = useUsersStore()
const ui = useUiStore()

const tab = ref('activos')
const busqueda = ref('')
const estadoFiltro = ref('todos')
const cursoFiltro = ref('')

const modalPrestamo = ref(false)
const modalDevolucion = ref(false)
const prestamoSeleccionado = ref(null)

const activosEnriquecidos = computed(() =>
  [...loans.activos]
    .map((prestamo) => ({
      ...prestamo,
      libro: books.porId(prestamo.libroId),
      usuario: users.porId(prestamo.usuarioId),
    }))
    .filter((prestamo) => prestamo.libro && prestamo.usuario)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)),
)

const historialEnriquecido = computed(() =>
  [...loans.historial]
    .map((prestamo) => ({
      ...prestamo,
      libro: books.porId(prestamo.libroId),
      usuario: users.porId(prestamo.usuarioId),
    }))
    .filter((prestamo) => prestamo.libro && prestamo.usuario)
    .sort(
      (a, b) =>
        b.fechaDevolucion.localeCompare(a.fechaDevolucion) || b.id.localeCompare(a.id),
    ),
)

const base = computed(() =>
  tab.value === 'activos' ? activosEnriquecidos.value : historialEnriquecido.value,
)

const filtrados = computed(() => {
  const texto = busqueda.value.trim()
  return base.value.filter((prestamo) => {
    if (texto) {
      const contenido = [
        prestamo.id,
        prestamo.libro.titulo,
        prestamo.libro.autor,
        prestamo.usuario.nombre,
        prestamo.usuario.correo,
        prestamo.usuario.curso,
      ].join(' ')
      if (!includesText(contenido, texto)) return false
    }

    if (cursoFiltro.value && prestamo.usuario.curso !== cursoFiltro.value) return false

    if (tab.value === 'activos' && estadoFiltro.value !== 'todos') {
      const estado = loans.estadoDe(prestamo)
      if (estadoFiltro.value === 'proximo' && !['vence-hoy', 'por-vencer'].includes(estado)) {
        return false
      }
      if (estadoFiltro.value === 'vencido' && estado !== 'vencido') return false
      if (estadoFiltro.value === 'a-tiempo' && estado !== 'a-tiempo') return false
    }

    return true
  })
})

const hayFiltros = computed(
  () => Boolean(busqueda.value.trim()) || estadoFiltro.value !== 'todos' || Boolean(cursoFiltro.value),
)

function limpiarFiltros() {
  busqueda.value = ''
  estadoFiltro.value = 'todos'
  cursoFiltro.value = ''
}

function abrirDevolucion(prestamo) {
  prestamoSeleccionado.value = prestamo
  modalDevolucion.value = true
}

function verVencidos() {
  tab.value = 'activos'
  estadoFiltro.value = 'vencido'
}

function verProximos() {
  tab.value = 'activos'
  estadoFiltro.value = 'proximo'
}

function verActivos() {
  tab.value = 'activos'
  estadoFiltro.value = 'todos'
}

function estadoTexto(prestamo) {
  const estado = loans.estadoDe(prestamo)
  if (estado === 'devuelto') return 'Devuelto'
  if (estado === 'vencido') {
    const dias = daysLate(prestamo.fechaVencimiento)
    return `Vencido (${dias} ${dias === 1 ? 'día' : 'días'})`
  }
  if (estado === 'vence-hoy') return 'Vence hoy'
  if (estado === 'por-vencer') return 'Por vencer'
  return 'En plazo'
}

async function copiarRecordatorio(prestamo) {
  const texto = loans.recordatorio(prestamo)
  try {
    await navigator.clipboard.writeText(texto)
    ui.success('Recordatorio copiado. Ya podés enviarlo por el medio habitual.')
  } catch (error) {
    ui.error('No se pudo copiar el recordatorio. Revisá los permisos del navegador.')
  }
}

function exportar() {
  if (!filtrados.value.length) {
    ui.info('No hay préstamos para exportar con los filtros actuales.')
    return
  }

  const filas = filtrados.value.map((prestamo) => ({
    id: prestamo.id,
    libro: prestamo.libro.titulo,
    autor: prestamo.libro.autor,
    usuario: prestamo.usuario.nombre,
    curso: prestamo.usuario.curso || prestamo.usuario.tipo,
    fechaPrestamo: prestamo.fechaPrestamo,
    fechaVencimiento: prestamo.fechaVencimiento,
    fechaDevolucion: prestamo.fechaDevolucion || '',
    estado: estadoTexto(prestamo),
    observaciones: prestamo.observaciones || '',
  }))

  const contenido = toCsv(filas, [
    { key: 'id', label: 'ID' },
    { key: 'libro', label: 'Libro' },
    { key: 'autor', label: 'Autor' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'curso', label: 'Curso' },
    { key: 'fechaPrestamo', label: 'Fecha de préstamo' },
    { key: 'fechaVencimiento', label: 'Fecha de vencimiento' },
    { key: 'fechaDevolucion', label: 'Fecha de devolución' },
    { key: 'estado', label: 'Estado' },
    { key: 'observaciones', label: 'Observaciones' },
  ])

  downloadCsv(`prestamos-${tab.value}-${todayISO()}.csv`, contenido)
  ui.success('Se descargó el archivo CSV.')
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="page-header__title">
        <p class="eyebrow">Mostrador</p>
        <h1>Circulación</h1>
        <p>
          Registrá préstamos y devoluciones, controlá vencimientos y copiá recordatorios para
          enviar a los usuarios.
        </p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--ghost" type="button" @click="exportar">
          <Download />
          Exportar CSV
        </button>
        <button class="btn btn--primary" type="button" @click="modalPrestamo = true">
          <Plus />
          Nuevo préstamo
        </button>
      </div>
    </header>

    <div class="circulation-stats">
      <button class="mini-stat mini-stat--blue" type="button" @click="verActivos">
        <span class="mini-stat__icon"><BookMarked /></span>
        <span>
          <strong>{{ loans.activos.length }}</strong>
          <small>Préstamos activos</small>
        </span>
      </button>
      <button class="mini-stat mini-stat--red" type="button" @click="verVencidos">
        <span class="mini-stat__icon"><AlertTriangle /></span>
        <span>
          <strong>{{ loans.vencidos.length }}</strong>
          <small>Vencidos</small>
        </span>
      </button>
      <button class="mini-stat mini-stat--amber" type="button" @click="verProximos">
        <span class="mini-stat__icon"><Clock /></span>
        <span>
          <strong>{{ loans.porVencer.length }}</strong>
          <small>Vencen hoy o en 3 días</small>
        </span>
      </button>
    </div>

    <div class="tabs-row">
      <div class="tabs" role="tablist" aria-label="Préstamos">
        <button
          class="tabs__button"
          :class="{ 'is-active': tab === 'activos' }"
          type="button"
          role="tab"
          :aria-selected="tab === 'activos'"
          @click="tab = 'activos'"
        >
          Activos
          <span class="tabs__count">{{ loans.activos.length }}</span>
        </button>
        <button
          class="tabs__button"
          :class="{ 'is-active': tab === 'historial' }"
          type="button"
          role="tab"
          :aria-selected="tab === 'historial'"
          @click="tab = 'historial'"
        >
          Historial
          <span class="tabs__count">{{ loans.historial.length }}</span>
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar__search">
        <Search />
        <input
          v-model="busqueda"
          class="input"
          type="search"
          placeholder="Buscar por libro, usuario, curso o ID de préstamo…"
          aria-label="Buscar préstamos"
        />
      </div>

      <select
        v-if="tab === 'activos'"
        v-model="estadoFiltro"
        class="select toolbar__select"
        aria-label="Filtrar por estado"
      >
        <option value="todos">Todos los estados</option>
        <option value="vencido">Vencidos</option>
        <option value="proximo">Vencen hoy o en 3 días</option>
        <option value="a-tiempo">En plazo</option>
      </select>

      <select
        v-model="cursoFiltro"
        class="select toolbar__select"
        aria-label="Filtrar por curso"
      >
        <option value="">Todos los cursos</option>
        <option v-for="curso in users.cursos" :key="curso" :value="curso">{{ curso }}</option>
      </select>

      <button v-if="hayFiltros" class="btn btn--quiet btn--sm" type="button" @click="limpiarFiltros">
        <RotateCcw />
        Limpiar
      </button>
    </div>

    <p class="result-count">
      {{ pluralize(filtrados.length, 'préstamo', 'préstamos') }}
      <span v-if="tab === 'activos'"> · ordenados por vencimiento</span>
    </p>

    <template v-if="tab === 'activos'">
      <div v-if="filtrados.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Usuario</th>
              <th>Préstamo</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th class="num">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="prestamo in filtrados"
              :key="prestamo.id"
              :class="{ 'row-overdue': loans.estadoDe(prestamo) === 'vencido' }"
            >
              <td>
                <div class="cell-title">
                  <strong>{{ prestamo.libro.titulo }}</strong>
                  <span>{{ prestamo.libro.autor }} · {{ prestamo.libro.ubicacion }}</span>
                </div>
              </td>
              <td>
                <div class="cell-title">
                  <strong>{{ prestamo.usuario.nombre }}</strong>
                  <span>{{ prestamo.usuario.curso || prestamo.usuario.tipo }}</span>
                </div>
              </td>
              <td class="nowrap">
                <div class="cell-title">
                  <strong>{{ formatDate(prestamo.fechaPrestamo) }}</strong>
                  <span>{{ prestamo.id }}</span>
                </div>
              </td>
              <td class="nowrap">
                <div class="cell-title">
                  <strong>{{ formatDate(prestamo.fechaVencimiento) }}</strong>
                  <span>{{ humanDueLabel(prestamo.fechaVencimiento) }}</span>
                </div>
              </td>
              <td><EstadoPrestamo :prestamo="prestamo" /></td>
              <td>
                <div class="cell-actions">
                  <button
                    class="btn btn--quiet btn--sm"
                    type="button"
                    title="Copiar recordatorio"
                    @click="copiarRecordatorio(prestamo)"
                  >
                    <Copy />
                    Recordatorio
                  </button>
                  <button
                    class="btn btn--ghost btn--sm"
                    type="button"
                    @click="abrirDevolucion(prestamo)"
                  >
                    <CheckCircle2 />
                    Devolver
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else
        :icon="BookMarked"
        title="No hay préstamos activos con esos filtros"
        message="Probá limpiar los filtros o registrá un nuevo préstamo desde el botón superior."
      >
        <button v-if="hayFiltros" class="btn btn--ghost" type="button" @click="limpiarFiltros">
          <RotateCcw />
          Limpiar filtros
        </button>
      </EmptyState>
    </template>

    <template v-else>
      <div v-if="filtrados.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Usuario</th>
              <th>Prestado</th>
              <th>Devuelto</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prestamo in filtrados" :key="prestamo.id">
              <td>
                <div class="cell-title">
                  <strong>{{ prestamo.libro.titulo }}</strong>
                  <span>{{ prestamo.libro.autor }}</span>
                </div>
              </td>
              <td>
                <div class="cell-title">
                  <strong>{{ prestamo.usuario.nombre }}</strong>
                  <span>{{ prestamo.usuario.curso || prestamo.usuario.tipo }}</span>
                </div>
              </td>
              <td class="nowrap">{{ formatDate(prestamo.fechaPrestamo) }}</td>
              <td class="nowrap">
                <span class="badge badge--gray">
                  {{ formatDate(prestamo.fechaDevolucion) }}
                </span>
              </td>
              <td class="muted">{{ prestamo.observaciones || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else
        :icon="CheckCircle2"
        title="No hay devoluciones registradas"
        message="El historial se completa cuando registrás la devolución de un préstamo."
      />
    </template>

    <LoanFormModal v-model="modalPrestamo" />
    <ReturnModal v-model="modalDevolucion" :prestamo="prestamoSeleccionado" />
  </div>
</template>

<style scoped>
.circulation-stats {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: border-color 0.16s ease, transform 0.12s ease, box-shadow 0.16s ease;
}

.mini-stat:hover {
  border-color: var(--line-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.mini-stat__icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: none;
  place-items: center;
  border-radius: 10px;
  background: var(--navy-50);
  color: var(--navy-700);
}

.mini-stat__icon svg {
  width: 18px;
  height: 18px;
}

.mini-stat--red .mini-stat__icon {
  background: var(--red-soft);
  color: var(--red);
}

.mini-stat--amber .mini-stat__icon {
  background: var(--amber-soft);
  color: var(--amber-dark);
}

.mini-stat strong {
  display: block;
  color: var(--navy-900);
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
}

.mini-stat small {
  color: var(--muted);
  font-size: 0.72rem;
}

.tabs-row {
  margin-bottom: 12px;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  width: fit-content;
}

.tabs__button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.tabs__button.is-active {
  background: var(--navy-800);
  color: #fff;
}

.tabs__count {
  display: inline-grid;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  place-items: center;
  border-radius: var(--radius-pill);
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.66rem;
}

.tabs__button.is-active .tabs__count {
  background: rgba(255, 255, 255, 0.2);
}

.result-count {
  margin: 14px 2px 10px;
  color: var(--muted);
  font-size: 0.78rem;
}

.row-overdue td {
  background: #fff9f8;
}

@media (max-width: 760px) {
  .circulation-stats {
    grid-template-columns: 1fr;
  }

  .mini-stat {
    padding: 11px 13px;
  }
}
</style>

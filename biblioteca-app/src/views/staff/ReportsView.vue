<script setup>
import { computed, ref } from 'vue'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  Download,
  Library,
  Printer,
  TrendingUp,
  Users,
} from 'lucide-vue-next'
import StatCard from '@/components/ui/StatCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import EstadoPrestamo from '@/components/loans/EstadoPrestamo.vue'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useUsersStore } from '@/stores/users'
import { useUiStore } from '@/stores/ui'
import { downloadCsv, toCsv } from '@/utils/csv'
import {
  currentMonthKey,
  daysLate,
  formatDate,
  lastMonths,
  monthKey,
  monthLabel,
  todayISO,
} from '@/utils/dates'
import { materiaInfo } from '@/data/materias'

const books = useBooksStore()
const loans = useLoansStore()
const users = useUsersStore()
const ui = useUiStore()

const periodo = ref(currentMonthKey())

const meses = computed(() => lastMonths(6))

const prestamosPeriodo = computed(() =>
  [...loans.prestamosDelMes(periodo.value)].sort(
    (a, b) => b.fechaPrestamo.localeCompare(a.fechaPrestamo) || b.id.localeCompare(a.id),
  ),
)

const devolucionesPeriodo = computed(() =>
  loans.prestamos.filter(
    (prestamo) =>
      prestamo.fechaDevolucion && monthKey(prestamo.fechaDevolucion) === periodo.value,
  ),
)

const topLibros = computed(() => loans.topLibros(5, periodo.value))
const materias = computed(() => loans.porMateria(periodo.value))
const maxLibro = computed(() => Math.max(1, ...topLibros.value.map((item) => item.total)))
const totalMaterias = computed(() =>
  materias.value.reduce((total, item) => total + item.total, 0),
)
const maxMateria = computed(() => Math.max(1, ...materias.value.map((item) => item.total)))

const detalle = computed(() =>
  prestamosPeriodo.value.slice(0, 15).map((prestamo) => ({
    ...prestamo,
    libro: books.porId(prestamo.libroId),
    usuario: users.porId(prestamo.usuarioId),
  })),
)

const resumen = computed(() => {
  const titulos = topLibros.value.slice(0, 3).map((item) => item.libro.titulo)
  const mencion = titulos.length
    ? ` Los títulos más solicitados fueron ${titulos.join(', ')}.`
    : ''
  return `Durante ${monthLabel(periodo.value)}, la biblioteca registró ${prestamosPeriodo.value.length} ${
    prestamosPeriodo.value.length === 1 ? 'préstamo' : 'préstamos'
  } y ${devolucionesPeriodo.value.length} ${
    devolucionesPeriodo.value.length === 1 ? 'devolución' : 'devoluciones'
  }.${mencion}`
})

function mesCorto(key) {
  const [anio, mes] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('es-AR', { month: 'short', year: 'numeric' }).format(
    new Date(anio, mes - 1, 1),
  )
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

function exportar() {
  if (!prestamosPeriodo.value.length) {
    ui.info('No hay préstamos registrados en el período seleccionado.')
    return
  }

  const filas = prestamosPeriodo.value.map((prestamo) => {
    const libro = books.porId(prestamo.libroId)
    const usuario = users.porId(prestamo.usuarioId)
    return {
      id: prestamo.id,
      libro: libro?.titulo ?? '',
      autor: libro?.autor ?? '',
      materia: libro?.materia ?? '',
      usuario: usuario?.nombre ?? '',
      curso: usuario?.curso || usuario?.tipo || '',
      fechaPrestamo: prestamo.fechaPrestamo,
      fechaVencimiento: prestamo.fechaVencimiento,
      fechaDevolucion: prestamo.fechaDevolucion || '',
      estado: estadoTexto(prestamo),
    }
  })

  const contenido = toCsv(filas, [
    { key: 'id', label: 'ID' },
    { key: 'libro', label: 'Libro' },
    { key: 'autor', label: 'Autor' },
    { key: 'materia', label: 'Materia' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'curso', label: 'Curso' },
    { key: 'fechaPrestamo', label: 'Fecha de préstamo' },
    { key: 'fechaVencimiento', label: 'Fecha de vencimiento' },
    { key: 'fechaDevolucion', label: 'Fecha de devolución' },
    { key: 'estado', label: 'Estado' },
  ])

  downloadCsv(`reporte-${periodo.value}.csv`, contenido)
  ui.success('Se descargó el reporte del período en CSV.')
}

function imprimir() {
  window.print()
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="page-header__title">
        <p class="eyebrow">Evaluación y rendición de cuentas</p>
        <h1>Reporte básico</h1>
        <p>
          Contadores y movimiento del período para presentar en la asamblea. El reporte se calcula
          con los préstamos registrados en el sistema.
        </p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--ghost" type="button" @click="exportar">
          <Download />
          Exportar CSV
        </button>
        <button class="btn btn--ghost" type="button" @click="imprimir">
          <Printer />
          Imprimir
        </button>
      </div>
    </header>

    <div class="period-bar">
      <label class="period-bar__label" for="reporte-periodo">
        <CalendarDays />
        Período
      </label>
      <input
        id="reporte-periodo"
        v-model="periodo"
        class="input period-bar__input"
        type="month"
      />
      <div class="period-bar__chips">
        <button
          v-for="mes in meses"
          :key="mes"
          class="chip period-chip"
          :class="{ 'is-active': mes === periodo }"
          type="button"
          @click="periodo = mes"
        >
          {{ mesCorto(mes) }}
        </button>
      </div>
    </div>

    <p class="report-period-title">
      <BarChart3 />
      Datos de <strong>{{ monthLabel(periodo) }}</strong>
    </p>

    <section class="stats-grid">
      <StatCard
        label="Préstamos del período"
        :value="prestamosPeriodo.length"
        hint="Registrados en el mes"
        :icon="BookOpen"
        tone="blue"
      />
      <StatCard
        label="Devoluciones"
        :value="devolucionesPeriodo.length"
        hint="Devueltos en el período"
        :icon="TrendingUp"
        tone="green"
      />
      <StatCard
        label="Préstamos activos"
        :value="loans.activos.length"
        hint="Al día de hoy"
        :icon="BookOpen"
        tone="amber"
      />
      <StatCard
        label="Vencidos"
        :value="loans.vencidos.length"
        hint="Requieren seguimiento"
        :icon="AlertTriangle"
        tone="red"
      />
      <StatCard
        label="Usuarios activos"
        :value="users.activos.length"
        hint="Cuentas habilitadas"
        :icon="Users"
      />
      <StatCard
        label="Títulos en catálogo"
        :value="books.activos.length"
        :hint="`${books.totalEjemplares} ejemplares`"
        :icon="Library"
      />
    </section>

    <div class="report-note">
      <span class="report-note__icon"><TrendingUp /></span>
      <div>
        <strong>Resumen del período</strong>
        <p>{{ resumen }}</p>
      </div>
    </div>

    <div class="report-grid">
      <section class="section">
        <div class="section__header">
          <h2><BookOpen /> Top 5 de libros</h2>
          <span class="section__hint">Préstamos del período</span>
        </div>
        <div v-if="topLibros.length" class="card ranking">
          <div v-for="(item, index) in topLibros" :key="item.libro.id" class="ranking__row">
            <span class="ranking__position">{{ index + 1 }}</span>
            <div class="ranking__info">
              <strong>{{ item.libro.titulo }}</strong>
              <span>{{ item.libro.autor }}</span>
              <div class="ranking__bar">
                <span :style="{ width: `${(item.total / maxLibro) * 100}%` }" />
              </div>
            </div>
            <span class="ranking__total">{{ item.total }}</span>
          </div>
        </div>
        <EmptyState
          v-else
          :icon="BarChart3"
          title="Sin préstamos en el período"
          message="Elegí otro mes o registrá préstamos para ver el ranking de libros."
        />
      </section>

      <section class="section">
        <div class="section__header">
          <h2><BarChart3 /> Por materia</h2>
          <span class="section__hint">{{ totalMaterias }} préstamos</span>
        </div>
        <div v-if="materias.length" class="card matters">
          <div v-for="item in materias" :key="item.materia" class="matter-row">
            <div class="matter-row__top">
              <span
                class="matter-row__dot"
                :style="{ background: materiaInfo(item.materia).color }"
              />
              <strong>{{ item.materia }}</strong>
              <span class="muted small">{{ item.total }}</span>
              <span class="matter-row__percent">
                {{ Math.round((item.total / totalMaterias) * 100) }}%
              </span>
            </div>
            <div class="matter-row__bar">
              <span
                :style="{
                  width: `${(item.total / maxMateria) * 100}%`,
                  background: materiaInfo(item.materia).color,
                }"
              />
            </div>
          </div>
        </div>
        <EmptyState
          v-else
          :icon="BarChart3"
          title="Sin datos por materia"
          message="Los préstamos del período se agruparán por la materia del libro."
        />
      </section>
    </div>

    <section class="section">
      <div class="section__header">
        <h2><CalendarDays /> Detalle de préstamos</h2>
        <span class="section__hint">
          {{ detalle.length }} {{ detalle.length === 1 ? 'movimiento' : 'movimientos' }}
          <template v-if="prestamosPeriodo.length > 15"> · se muestran los primeros 15</template>
        </span>
      </div>

      <div v-if="detalle.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Usuario</th>
              <th>Préstamo</th>
              <th>Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prestamo in detalle" :key="prestamo.id">
              <td>
                <div class="cell-title">
                  <strong>{{ prestamo.libro?.titulo || 'Libro eliminado' }}</strong>
                  <span>{{ prestamo.libro?.materia }}</span>
                </div>
              </td>
              <td>
                <div class="cell-title">
                  <strong>{{ prestamo.usuario?.nombre || 'Usuario' }}</strong>
                  <span>{{ prestamo.usuario?.curso || prestamo.usuario?.tipo }}</span>
                </div>
              </td>
              <td class="nowrap">{{ formatDate(prestamo.fechaPrestamo) }}</td>
              <td class="nowrap">{{ formatDate(prestamo.fechaVencimiento) }}</td>
              <td><EstadoPrestamo :prestamo="prestamo" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else
        :icon="CalendarDays"
        title="No hay movimientos en este período"
        message="Seleccioná otro mes para consultar el detalle de préstamos."
      />
    </section>

    <p class="report-footnote">
      Reporte generado el {{ formatDate(todayISO()) }} · Datos del piloto local · Biblioteca
      Escolar.
    </p>
  </div>
</template>

<style scoped>
.period-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper);
  box-shadow: var(--shadow-xs);
}

.period-bar__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.period-bar__label svg {
  width: 14px;
  height: 14px;
  color: var(--amber-dark);
}

.period-bar__input {
  width: 168px;
}

.period-bar__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.period-chip {
  cursor: pointer;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.period-chip:hover {
  border-color: var(--navy-600);
}

.period-chip.is-active {
  border-color: var(--navy-800);
  background: var(--navy-800);
  color: #fff;
}

.report-period-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 20px 2px 12px;
  color: var(--muted);
  font-size: 0.8rem;
}

.report-period-title svg {
  width: 15px;
  height: 15px;
  color: var(--amber-dark);
}

.report-period-title strong {
  color: var(--navy-900);
  font-weight: 600;
  text-transform: capitalize;
}

.report-note {
  display: flex;
  gap: 13px;
  margin-top: 20px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--amber);
  border-radius: var(--radius);
  background: linear-gradient(100deg, #fffaf0, var(--surface));
}

.report-note__icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: none;
  place-items: center;
  border-radius: 9px;
  background: var(--amber-soft);
  color: var(--amber-dark);
}

.report-note__icon svg {
  width: 17px;
  height: 17px;
}

.report-note strong {
  color: var(--navy-900);
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 600;
}

.report-note p {
  margin-top: 3px;
  max-width: 90ch;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.6;
}

.report-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ranking,
.matters {
  padding: 7px 0;
}

.ranking__row {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 11px 16px;
}

.ranking__position {
  display: grid;
  width: 24px;
  height: 24px;
  flex: none;
  margin-top: 1px;
  place-items: center;
  border-radius: 6px;
  background: var(--navy-50);
  color: var(--navy-700);
  font-family: var(--font-serif);
  font-size: 0.76rem;
  font-weight: 600;
}

.ranking__row:first-child .ranking__position {
  background: var(--amber-soft);
  color: var(--amber-dark);
}

.ranking__info {
  flex: 1;
  min-width: 0;
}

.ranking__info strong {
  display: block;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.82rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking__info > span {
  color: var(--muted);
  font-size: 0.7rem;
}

.ranking__bar {
  height: 4px;
  margin-top: 6px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: #f0ece3;
}

.ranking__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--navy-600);
}

.ranking__total {
  color: var(--navy-800);
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.matter-row {
  padding: 9px 16px;
}

.matter-row__top {
  display: flex;
  align-items: center;
  gap: 7px;
}

.matter-row__dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
}

.matter-row__top strong {
  flex: 1;
  color: var(--ink-soft);
  font-size: 0.78rem;
  font-weight: 600;
}

.matter-row__percent {
  width: 36px;
  color: var(--muted);
  font-size: 0.68rem;
  text-align: right;
}

.matter-row__bar {
  height: 4px;
  margin-top: 5px;
  margin-left: 15px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: #f0ece3;
}

.matter-row__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  opacity: 0.85;
}

.report-footnote {
  margin-top: 28px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  color: var(--muted-light);
  font-size: 0.7rem;
}

@media (max-width: 900px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
}

@media print {
  .period-bar__chips,
  .period-bar__label,
  .report-footnote {
    display: none;
  }

  .report-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Library,
  Plus,
  Users,
} from 'lucide-vue-next'
import StatCard from '@/components/ui/StatCard.vue'
import EstadoPrestamo from '@/components/loans/EstadoPrestamo.vue'
import LoanFormModal from '@/components/staff/LoanFormModal.vue'
import ReturnModal from '@/components/staff/ReturnModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useUsersStore } from '@/stores/users'
import { currentMonthKey, formatDate, humanDueLabel, monthLabel } from '@/utils/dates'

const auth = useAuthStore()
const books = useBooksStore()
const loans = useLoansStore()
const users = useUsersStore()

const modalPrestamo = ref(false)
const modalDevolucion = ref(false)
const prestamoSeleccionado = ref(null)

const saludo = computed(() => {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buen día'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
})

const mesActual = computed(() => currentMonthKey())
const prestamosMes = computed(() => loans.prestamosDelMes(mesActual.value).length)
const topLibros = computed(() => {
  const delMes = loans.topLibros(5, mesActual.value)
  return delMes.length ? delMes : loans.topLibros(5)
})

const alertas = computed(() =>
  loans.conAlerta.map((prestamo) => ({
    ...prestamo,
    libro: books.porId(prestamo.libroId),
    usuario: users.porId(prestamo.usuarioId),
  })),
)

const ultimos = computed(() =>
  [...loans.prestamos]
    .sort(
      (a, b) =>
        b.fechaPrestamo.localeCompare(a.fechaPrestamo) || b.id.localeCompare(a.id),
    )
    .slice(0, 6)
    .map((prestamo) => ({
      ...prestamo,
      libro: books.porId(prestamo.libroId),
      usuario: users.porId(prestamo.usuarioId),
    }))
    .filter((prestamo) => prestamo.libro && prestamo.usuario),
)

function abrirDevolucion(prestamo) {
  prestamoSeleccionado.value = prestamo
  modalDevolucion.value = true
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="page-header__title">
        <p class="eyebrow">Panel de circulación</p>
        <h1>{{ saludo }}, {{ auth.nombre.split(' ')[0] }}</h1>
        <p>
          Resumen de la biblioteca al día de hoy. Registrá préstamos, controlá vencimientos y
          revisá el movimiento del mes.
        </p>
      </div>
      <div class="page-header__actions">
        <RouterLink to="/circulacion" class="btn btn--ghost">
          <ClipboardList />
          Ver circulación
        </RouterLink>
        <button class="btn btn--primary" type="button" @click="modalPrestamo = true">
          <Plus />
          Nuevo préstamo
        </button>
      </div>
    </header>

    <section class="stats-grid">
      <StatCard
        label="Títulos activos"
        :value="books.activos.length"
        :hint="`${books.totalEjemplares} ejemplares en total`"
        :icon="Library"
        tone="blue"
      />
      <StatCard
        label="Usuarios activos"
        :value="users.activos.length"
        :hint="`${users.estudiantes.length} estudiantes · ${users.docentes.length} docentes`"
        :icon="Users"
      />
      <StatCard
        label="Préstamos activos"
        :value="loans.activos.length"
        :hint="`${loans.venceHoy.length} ${loans.venceHoy.length === 1 ? 'vence hoy' : 'vencen hoy'}`"
        :icon="BookMarked"
        tone="green"
      />
      <StatCard
        label="Vencidos"
        :value="loans.vencidos.length"
        hint="Requieren seguimiento"
        :icon="AlertTriangle"
        tone="red"
      />
      <StatCard
        label="Por vencer"
        :value="loans.porVencer.length"
        hint="Hoy o en los próximos 3 días"
        :icon="Clock"
        tone="amber"
      />
      <StatCard
        label="Préstamos del mes"
        :value="prestamosMes"
        :hint="monthLabel(mesActual)"
        :icon="CalendarDays"
        tone="blue"
      />
    </section>

    <div v-if="loans.vencidos.length" class="alert-banner">
      <span class="alert-banner__icon"><AlertTriangle /></span>
      <div>
        <strong>Hay {{ loans.vencidos.length }} préstamos vencidos</strong>
        <p>Revisá el panel y generá un recordatorio para los casos que lo necesiten.</p>
      </div>
      <RouterLink to="/circulacion" class="btn btn--accent btn--sm">
        Gestionar vencidos
        <ArrowRight />
      </RouterLink>
    </div>

    <section class="section">
      <div class="section__header">
        <h2><AlertTriangle /> Vencidos y por vencer</h2>
        <RouterLink to="/circulacion" class="link-button">
          Ver todos
          <ArrowRight />
        </RouterLink>
      </div>

      <div v-if="alertas.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Usuario</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th class="num">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prestamo in alertas.slice(0, 6)" :key="prestamo.id">
              <td>
                <div class="cell-title">
                  <strong>{{ prestamo.libro?.titulo || 'Libro eliminado' }}</strong>
                  <span>{{ prestamo.libro?.autor }}</span>
                </div>
              </td>
              <td>
                <div class="cell-title">
                  <strong>{{ prestamo.usuario?.nombre || 'Usuario' }}</strong>
                  <span>{{ prestamo.usuario?.curso || prestamo.usuario?.tipo }}</span>
                </div>
              </td>
              <td>
                <div class="cell-title">
                  <strong>{{ formatDate(prestamo.fechaVencimiento) }}</strong>
                  <span>{{ humanDueLabel(prestamo.fechaVencimiento) }}</span>
                </div>
              </td>
              <td><EstadoPrestamo :prestamo="prestamo" /></td>
              <td>
                <div class="cell-actions">
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

      <div v-else class="inline-note" style="padding: 18px">
        <CheckCircle2 />
        No hay vencimientos pendientes. Los préstamos activos están dentro del plazo.
      </div>
    </section>

    <div class="panel-columns">
      <section class="section">
        <div class="section__header">
          <h2><ClipboardList /> Últimos movimientos</h2>
        </div>
        <div class="movements card">
          <div v-for="prestamo in ultimos" :key="prestamo.id" class="movement">
            <span class="movement__icon" :class="{ 'is-returned': prestamo.fechaDevolucion }">
              <CheckCircle2 v-if="prestamo.fechaDevolucion" />
              <BookOpen v-else />
            </span>
            <div class="movement__text">
              <strong>{{ prestamo.libro.titulo }}</strong>
              <span>
                {{ prestamo.usuario.nombre }} ·
                {{ prestamo.fechaDevolucion ? 'devuelto' : 'préstamo' }}
                {{ formatDate(prestamo.fechaDevolucion || prestamo.fechaPrestamo) }}
              </span>
            </div>
            <EstadoPrestamo :prestamo="prestamo" />
          </div>
          <p v-if="!ultimos.length" class="muted small" style="padding: 16px">
            Todavía no hay movimientos registrados.
          </p>
        </div>
      </section>

      <section class="section">
        <div class="section__header">
          <h2><BarChart3 /> Más prestados</h2>
          <RouterLink to="/reportes" class="link-button">
            Reporte
            <ArrowRight />
          </RouterLink>
        </div>
        <div class="card top-books">
          <div v-for="(item, index) in topLibros" :key="item.libro.id" class="top-book">
            <span class="top-book__rank">{{ index + 1 }}</span>
            <div class="top-book__info">
              <strong>{{ item.libro.titulo }}</strong>
              <span>{{ item.libro.materia }}</span>
            </div>
            <span class="top-book__count">{{ item.total }}</span>
          </div>
          <p v-if="!topLibros.length" class="muted small" style="padding: 16px">
            Sin préstamos registrados todavía.
          </p>
        </div>

        <div class="quick-links">
          <RouterLink to="/libros" class="quick-link">
            <span><Library /></span>
            <div>
              <strong>Gestionar libros</strong>
              <small>Altas, ediciones e importación CSV</small>
            </div>
            <ArrowRight />
          </RouterLink>
          <RouterLink to="/usuarios" class="quick-link">
            <span><Users /></span>
            <div>
              <strong>Gestionar usuarios</strong>
              <small>Cuentas, roles y cursos</small>
            </div>
            <ArrowRight />
          </RouterLink>
        </div>
      </section>
    </div>

    <LoanFormModal v-model="modalPrestamo" />
    <ReturnModal v-model="modalDevolucion" :prestamo="prestamoSeleccionado" />
  </div>
</template>

<style scoped>
.alert-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
  padding: 14px 18px;
  border: 1px solid #ecc7c2;
  border-radius: var(--radius);
  background: linear-gradient(100deg, #fbecea, #fff8f4);
}

.alert-banner__icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: none;
  place-items: center;
  border-radius: 50%;
  background: #f4d3ce;
  color: var(--red-dark);
}

.alert-banner__icon svg {
  width: 18px;
  height: 18px;
}

.alert-banner > div {
  flex: 1;
  min-width: 220px;
}

.alert-banner strong {
  color: var(--red-dark);
  font-size: 0.9rem;
}

.alert-banner p {
  color: var(--muted);
  font-size: 0.77rem;
}

.panel-columns {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
}

.movements {
  overflow: hidden;
}

.movement {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 15px;
  border-bottom: 1px solid #f0ebe1;
}

.movement:last-child {
  border-bottom: 0;
}

.movement__icon {
  display: grid;
  width: 31px;
  height: 31px;
  flex: none;
  place-items: center;
  border-radius: 8px;
  background: var(--navy-50);
  color: var(--navy-700);
}

.movement__icon.is-returned {
  background: var(--green-soft);
  color: var(--green-dark);
}

.movement__icon svg {
  width: 14px;
  height: 14px;
}

.movement__text {
  flex: 1;
  min-width: 0;
}

.movement__text strong {
  display: block;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.79rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.movement__text span {
  color: var(--muted);
  font-size: 0.69rem;
}

.top-books {
  overflow: hidden;
}

.top-book {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 15px;
  border-bottom: 1px solid #f0ebe1;
}

.top-book:last-child {
  border-bottom: 0;
}

.top-book__rank {
  display: grid;
  width: 23px;
  height: 23px;
  flex: none;
  place-items: center;
  border-radius: 6px;
  background: var(--amber-soft);
  color: var(--amber-dark);
  font-family: var(--font-serif);
  font-size: 0.76rem;
  font-weight: 600;
}

.top-book__info {
  flex: 1;
  min-width: 0;
}

.top-book__info strong {
  display: block;
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.79rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-book__info span {
  color: var(--muted);
  font-size: 0.68rem;
}

.top-book__count {
  color: var(--navy-800);
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--ink-soft);
  transition: border-color 0.16s ease, background 0.16s ease;
}

.quick-link:hover {
  border-color: var(--navy-600);
  background: #fff;
}

.quick-link > span {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border-radius: 8px;
  background: var(--navy-50);
  color: var(--navy-700);
}

.quick-link > span svg {
  width: 15px;
  height: 15px;
}

.quick-link div {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quick-link strong {
  font-size: 0.8rem;
  font-weight: 600;
}

.quick-link small {
  color: var(--muted);
  font-size: 0.68rem;
}

.quick-link > svg {
  width: 14px;
  height: 14px;
  color: var(--muted-light);
}

@media (max-width: 1000px) {
  .panel-columns {
    grid-template-columns: 1fr;
  }
}
</style>

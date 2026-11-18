<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  BookMarked,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import EstadoPrestamo from '@/components/loans/EstadoPrestamo.vue'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { configuracion } from '@/data/configuracion'
import { materiaInfo } from '@/data/materias'
import { formatDate, humanDueLabel } from '@/utils/dates'

const auth = useAuthStore()
const books = useBooksStore()
const loans = useLoansStore()

const tab = ref('activos')

const propios = computed(() => {
  if (!auth.currentUser) return []
  return loans.prestamosDeUsuario(auth.currentUser.id)
})

const activos = computed(() =>
  propios.value
    .filter((prestamo) => !prestamo.fechaDevolucion)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
    .map((prestamo) => ({ ...prestamo, libro: books.porId(prestamo.libroId) }))
    .filter((prestamo) => prestamo.libro),
)

const historial = computed(() =>
  propios.value
    .filter((prestamo) => prestamo.fechaDevolucion)
    .sort((a, b) => b.fechaDevolucion.localeCompare(a.fechaDevolucion))
    .map((prestamo) => ({ ...prestamo, libro: books.porId(prestamo.libroId) }))
    .filter((prestamo) => prestamo.libro),
)

const vencidos = computed(
  () => activos.value.filter((prestamo) => loans.estadoDe(prestamo) === 'vencido'),
)
const porVencer = computed(() =>
  activos.value.filter((prestamo) =>
    ['vence-hoy', 'por-vencer'].includes(loans.estadoDe(prestamo)),
  ),
)

const cuposLibres = computed(() => Math.max(0, configuracion.maxPrestamos - activos.value.length))

function clasePrestamo(prestamo) {
  const estado = loans.estadoDe(prestamo)
  return {
    'loan-card--vencido': estado === 'vencido',
    'loan-card--por-vencer': ['vence-hoy', 'por-vencer'].includes(estado),
  }
}
</script>

<template>
  <div class="page page--narrow">
    <header class="page-header">
      <div class="page-header__title">
        <p class="eyebrow">Mi cuenta</p>
        <h1>Mis préstamos</h1>
        <p>
          {{ auth.nombre }}, acá ves los libros que tenés en préstamo, sus fechas de devolución y
          tu historial.
        </p>
      </div>
      <RouterLink to="/catalogo" class="btn btn--ghost">
        <BookOpen />
        Explorar catálogo
      </RouterLink>
    </header>

    <div class="stats-grid">
      <div class="stat stat--blue">
        <p class="stat__label"><BookMarked /> Activos</p>
        <p class="stat__value">{{ activos.length }}</p>
        <p class="stat__hint">Máximo {{ configuracion.maxPrestamos }} · {{ cuposLibres }} {{ cuposLibres === 1 ? 'cupo libre' : 'cupos libres' }}</p>
      </div>
      <div class="stat stat--amber">
        <p class="stat__label"><Clock /> Por vencer</p>
        <p class="stat__value">{{ porVencer.length }}</p>
        <p class="stat__hint">Vencen en los próximos {{ configuracion.diasAviso }} días</p>
      </div>
      <div class="stat stat--red">
        <p class="stat__label"><AlertTriangle /> Vencidos</p>
        <p class="stat__value">{{ vencidos.length }}</p>
        <p class="stat__hint">Requieren devolución</p>
      </div>
      <div class="stat stat--green">
        <p class="stat__label"><CheckCircle2 /> Devueltos</p>
        <p class="stat__value">{{ historial.length }}</p>
        <p class="stat__hint">En tu historial</p>
      </div>
    </div>

    <div v-if="vencidos.length" class="inline-note inline-note--red" style="margin-top: 18px">
      <AlertTriangle />
      Tenés {{ vencidos.length }} {{ vencidos.length === 1 ? 'préstamo vencido' : 'préstamos vencidos' }}.
      Acercate a la biblioteca para devolver el material.
    </div>

    <div class="tabs" role="tablist" aria-label="Préstamos activos e historial">
      <button
        class="tabs__button"
        :class="{ 'is-active': tab === 'activos' }"
        type="button"
        role="tab"
        :aria-selected="tab === 'activos'"
        @click="tab = 'activos'"
      >
        Préstamos activos
        <span class="tabs__count">{{ activos.length }}</span>
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
        <span class="tabs__count">{{ historial.length }}</span>
      </button>
    </div>

    <section v-if="tab === 'activos'" class="loans-list">
      <article
        v-for="prestamo in activos"
        :key="prestamo.id"
        class="loan-card"
        :class="clasePrestamo(prestamo)"
      >
        <div
          class="loan-card__cover"
          :style="{ '--cover': materiaInfo(prestamo.libro.materia).color }"
        >
          <BookOpen />
          <span>{{ prestamo.libro.materia }}</span>
        </div>

        <div class="loan-card__body">
          <div class="loan-card__top">
            <EstadoPrestamo :prestamo="prestamo" />
            <span class="loan-card__due">
              <CalendarDays />
              {{ humanDueLabel(prestamo.fechaVencimiento) }}
            </span>
          </div>

          <h3>
            <RouterLink :to="`/catalogo/${prestamo.libro.id}`">
              {{ prestamo.libro.titulo }}
            </RouterLink>
          </h3>
          <p class="loan-card__author">{{ prestamo.libro.autor }}</p>

          <dl class="loan-card__meta">
            <div>
              <dt>Prestado</dt>
              <dd>{{ formatDate(prestamo.fechaPrestamo) }}</dd>
            </div>
            <div>
              <dt>Vence</dt>
              <dd>{{ formatDate(prestamo.fechaVencimiento) }}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>
                <MapPin />
                {{ prestamo.libro.ubicacion || '—' }}
              </dd>
            </div>
          </dl>

          <p v-if="prestamo.observaciones" class="loan-card__obs">
            {{ prestamo.observaciones }}
          </p>
        </div>
      </article>

      <EmptyState
        v-if="!activos.length"
        :icon="BookMarked"
        title="No tenés préstamos activos"
        message="Cuando retires un libro, la biblioteca registrará el préstamo y lo vas a ver acá con su fecha de devolución."
      >
        <RouterLink to="/catalogo" class="btn btn--primary">
          <BookOpen />
          Ver catálogo
        </RouterLink>
      </EmptyState>
    </section>

    <section v-else>
      <div v-if="historial.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Prestado</th>
              <th>Devuelto</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prestamo in historial" :key="prestamo.id">
              <td>
                <div class="cell-title">
                  <strong>
                    <RouterLink :to="`/catalogo/${prestamo.libro.id}`">
                      {{ prestamo.libro.titulo }}
                    </RouterLink>
                  </strong>
                  <span>{{ prestamo.libro.autor }}</span>
                </div>
              </td>
              <td class="nowrap">{{ formatDate(prestamo.fechaPrestamo) }}</td>
              <td class="nowrap">{{ formatDate(prestamo.fechaDevolucion) }}</td>
              <td class="muted">{{ prestamo.observaciones || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else
        :icon="Clock"
        title="Todavía no hay devoluciones"
        message="Tu historial se completa cuando la biblioteca registra la devolución de un libro."
      />
    </section>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin: 26px 0 16px;
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

.loans-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loan-card {
  display: flex;
  overflow: hidden;
  border: 1px solid var(--line);
  border-left: 4px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
}

.loan-card--por-vencer {
  border-left-color: var(--amber);
}

.loan-card--vencido {
  border-left-color: var(--red);
}

.loan-card__cover {
  display: flex;
  width: 106px;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px;
  background: var(--cover);
  color: #fff;
}

.loan-card__cover::after {
  content: '';
  position: absolute;
}

.loan-card__cover svg {
  width: 26px;
  height: 26px;
  opacity: 0.85;
}

.loan-card__cover span {
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  opacity: 0.85;
}

.loan-card__body {
  flex: 1;
  padding: 15px 18px;
  min-width: 0;
}

.loan-card__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.loan-card__due {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  font-size: 0.72rem;
}

.loan-card__due svg {
  width: 13px;
  height: 13px;
}

.loan-card h3 {
  margin-top: 8px;
  font-size: 1.14rem;
}

.loan-card h3 a {
  color: var(--navy-900);
}

.loan-card h3 a:hover {
  color: var(--navy-600);
}

.loan-card__author {
  color: var(--muted);
  font-size: 0.8rem;
}

.loan-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
  margin: 12px 0 0;
}

.loan-card__meta dt {
  margin: 0;
  color: var(--muted);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.loan-card__meta dd {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 1px 0 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
}

.loan-card__meta dd svg {
  width: 12px;
  height: 12px;
  color: var(--amber-dark);
}

.loan-card__obs {
  margin-top: 10px;
  padding: 7px 9px;
  border-radius: 6px;
  background: #faf7f1;
  color: var(--muted);
  font-size: 0.73rem;
}

@media (max-width: 640px) {
  .loan-card__cover {
    width: 76px;
  }

  .loan-card__cover span {
    display: none;
  }

  .loan-card__body {
    padding: 13px 14px;
  }
}
</style>

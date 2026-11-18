<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookX,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Users,
} from 'lucide-vue-next'
import BookCard from '@/components/catalog/BookCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoanFormModal from '@/components/staff/LoanFormModal.vue'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { materiaInfo } from '@/data/materias'
import { formatDate } from '@/utils/dates'

const props = defineProps({
  id: { type: String, required: true },
})

const books = useBooksStore()
const loans = useLoansStore()
const users = useUsersStore()
const auth = useAuthStore()

const modalPrestamo = ref(false)

const libro = computed(() => books.porId(props.id))
const info = computed(() => materiaInfo(libro.value?.materia))
const disponibles = computed(() => (libro.value ? loans.disponibles(libro.value) : 0))
const prestamosActivos = computed(() =>
  libro.value ? loans.activosDeLibro(libro.value.id) : [],
)
const porcentaje = computed(() => {
  if (!libro.value || !libro.value.ejemplares) return 0
  return Math.round((disponibles.value / libro.value.ejemplares) * 100)
})

const miPrestamo = computed(() => {
  if (!auth.currentUser) return null
  return (
    loans
      .activosDeUsuario(auth.currentUser.id)
      .find((prestamo) => prestamo.libroId === props.id) ?? null
  )
})

const relacionados = computed(() => {
  if (!libro.value) return []
  const mismaMateria = books.activos.filter(
    (item) => item.id !== libro.value.id && item.materia === libro.value.materia,
  )
  if (mismaMateria.length >= 3) return mismaMateria.slice(0, 3)
  const otros = books.activos.filter(
    (item) => item.id !== libro.value.id && !mismaMateria.some((m) => m.id === item.id),
  )
  return [...mismaMateria, ...otros].slice(0, 3)
})

function nombreUsuario(id) {
  return users.porId(id)?.nombre ?? 'Usuario'
}
</script>

<template>
  <div class="page">
    <nav class="breadcrumb" aria-label="Miga de pan">
      <RouterLink to="/catalogo">
        <ArrowLeft />
        Catálogo
      </RouterLink>
      <span>/</span>
      <span class="muted">{{ libro?.titulo || 'Libro no encontrado' }}</span>
    </nav>

    <template v-if="libro">
      <div class="detail-grid">
        <div class="detail-cover-col">
          <div
            class="detail-cover"
            :style="{ '--cover': info.color }"
          >
            <span class="detail-cover__materia">{{ libro.materia }}</span>
            <BookOpen class="detail-cover__icon" />
            <div class="detail-cover__text">
              <p>{{ libro.titulo }}</p>
              <span>{{ libro.autor }}</span>
            </div>
          </div>
          <p class="detail-location">
            <MapPin />
            {{ libro.ubicacion || 'Ubicación a confirmar' }}
          </p>
        </div>

        <div class="detail-info">
          <p class="eyebrow">{{ libro.materia }}</p>
          <h1>{{ libro.titulo }}</h1>
          <p class="detail-author">{{ libro.autor }}</p>

          <div class="detail-tags">
            <span class="badge badge--green" :class="{ 'badge--red': disponibles === 0 }">
              {{ disponibles > 0 ? 'Disponible' : 'Sin ejemplares' }}
            </span>
            <span class="badge badge--gray badge--plain">{{ libro.ejemplares }} ejemplares</span>
            <span v-if="libro.anio" class="badge badge--gray badge--plain">{{ libro.anio }}</span>
          </div>

          <dl class="detail-meta">
            <div>
              <dt>Editorial</dt>
              <dd>{{ libro.editorial || '—' }}</dd>
            </div>
            <div>
              <dt>Año</dt>
              <dd>{{ libro.anio || '—' }}</dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{{ libro.isbn || '—' }}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{{ libro.ubicacion || '—' }}</dd>
            </div>
          </dl>

          <section class="detail-synopsis">
            <h2>Sinopsis</h2>
            <p>
              {{ libro.sinopsis || 'Este libro todavía no tiene una sinopsis cargada.' }}
            </p>
          </section>

          <div v-if="miPrestamo" class="inline-note" style="margin-top: 20px">
            <CalendarDays />
            Tenés este libro en préstamo. Devolución prevista:
            <strong>{{ formatDate(miPrestamo.fechaVencimiento) }}</strong>.
          </div>
        </div>

        <aside class="detail-side">
          <div class="availability card">
            <p class="availability__label">Disponibilidad</p>
            <div class="availability__big">
              <strong>{{ disponibles }}</strong>
              <span>de {{ libro.ejemplares }} ejemplares</span>
            </div>
            <div class="availability__bar">
              <span :style="{ width: `${porcentaje}%` }" :class="{ 'is-empty': disponibles === 0 }" />
            </div>

            <p v-if="disponibles > 0" class="availability__status is-available">
              <CheckCircle2 />
              Podés retirarlo en la biblioteca.
            </p>
            <p v-else class="availability__status is-empty">
              <AlertCircle />
              Todos los ejemplares están prestados.
            </p>

            <div class="availability__location">
              <MapPin />
              <div>
                <span>Ubicación</span>
                <strong>{{ libro.ubicacion || 'A confirmar' }}</strong>
              </div>
            </div>

            <template v-if="auth.isStaff">
              <button
                class="btn btn--primary btn--block"
                type="button"
                :disabled="disponibles === 0"
                @click="modalPrestamo = true"
              >
                <ClipboardList />
                Registrar préstamo
              </button>
              <RouterLink to="/circulacion" class="availability__link">
                Ir a circulación
                <ArrowRight />
              </RouterLink>
            </template>

            <template v-else>
              <p class="availability__hint">
                El préstamo se registra en el mostrador de la biblioteca con tu cuenta.
              </p>
              <RouterLink to="/mis-prestamos" class="btn btn--ghost btn--block">
                Ver mis préstamos
              </RouterLink>
            </template>
          </div>

          <div v-if="auth.isStaff && prestamosActivos.length" class="active-loans card">
            <div class="active-loans__header">
              <Users />
              <h3>En préstamo</h3>
              <span class="badge badge--blue badge--plain">{{ prestamosActivos.length }}</span>
            </div>
            <ul>
              <li v-for="prestamo in prestamosActivos.slice(0, 4)" :key="prestamo.id">
                <div>
                  <strong>{{ nombreUsuario(prestamo.usuarioId) }}</strong>
                  <span>Vence {{ formatDate(prestamo.fechaVencimiento) }}</span>
                </div>
                <RouterLink to="/circulacion" class="link-button">Ver</RouterLink>
              </li>
              <li v-if="prestamosActivos.length > 4" class="muted small">
                y {{ prestamosActivos.length - 4 }} préstamos más…
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <section v-if="relacionados.length" class="section">
        <div class="section__header">
          <h2><BookOpen /> También en {{ libro.materia }}</h2>
          <RouterLink to="/catalogo" class="link-button">
            Ver catálogo completo
            <ArrowRight />
          </RouterLink>
        </div>
        <div class="related-grid">
          <BookCard v-for="item in relacionados" :key="item.id" :libro="item" />
        </div>
      </section>

      <LoanFormModal v-model="modalPrestamo" :libro-id="libro.id" />
    </template>

    <EmptyState
      v-else
      :icon="BookX"
      title="No encontramos este libro"
      message="Puede haber sido dado de baja o el enlace no es correcto."
    >
      <RouterLink to="/catalogo" class="btn btn--primary">
        <ArrowLeft />
        Volver al catálogo
      </RouterLink>
    </EmptyState>
  </div>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-bottom: 20px;
  color: var(--muted-light);
  font-size: 0.78rem;
}

.breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
}

.breadcrumb a svg {
  width: 14px;
  height: 14px;
}

.detail-grid {
  display: grid;
  gap: 30px;
  align-items: start;
  grid-template-columns: 232px minmax(0, 1fr) 300px;
}

.detail-cover-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-cover {
  position: relative;
  display: flex;
  height: 328px;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 20px;
  border-radius: 6px 14px 14px 6px;
  background: var(--cover);
  box-shadow: 0 18px 34px rgba(7, 31, 48, 0.24), inset 8px 0 14px rgba(0, 0, 0, 0.14);
  color: #fff;
}

.detail-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 31, 48, 0.05) 20%, rgba(7, 31, 48, 0.66) 100%),
    radial-gradient(circle at 85% 8%, rgba(255, 255, 255, 0.22), transparent 36%);
  pointer-events: none;
}

.detail-cover__materia {
  position: relative;
  z-index: 1;
  align-self: flex-start;
  padding: 3px 9px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-cover__icon {
  position: absolute;
  top: 56px;
  left: 50%;
  width: 44px;
  height: 44px;
  opacity: 0.34;
  transform: translateX(-50%);
}

.detail-cover__text {
  position: relative;
  z-index: 1;
}

.detail-cover__text p {
  font-family: var(--font-serif);
  font-size: 1.45rem;
  line-height: 1.16;
  text-wrap: balance;
}

.detail-cover__text span {
  display: block;
  margin-top: 7px;
  font-size: 0.72rem;
  opacity: 0.78;
}

.detail-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--muted);
  font-size: 0.74rem;
}

.detail-location svg {
  width: 13px;
  height: 13px;
}

.detail-info h1 {
  margin-top: 5px;
  font-size: clamp(1.9rem, 1.3rem + 1.8vw, 2.7rem);
  line-height: 1.1;
  text-wrap: balance;
}

.detail-author {
  margin-top: 7px;
  color: var(--ink-soft);
  font-family: var(--font-serif);
  font-size: 1.08rem;
  font-style: italic;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 15px;
}

.detail-meta {
  display: grid;
  gap: 12px 22px;
  margin: 22px 0 0;
  padding: 18px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-meta dt {
  margin: 0;
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-meta dd {
  margin: 2px 0 0;
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.detail-synopsis {
  margin-top: 22px;
}

.detail-synopsis h2 {
  font-size: 1.15rem;
}

.detail-synopsis p {
  margin-top: 8px;
  max-width: 62ch;
  color: var(--ink-soft);
  font-size: 0.9rem;
  line-height: 1.72;
}

.detail-side {
  position: sticky;
  top: calc(var(--topbar-height) + 20px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.availability {
  padding: 20px;
  border-top: 3px solid var(--amber);
}

.availability__label {
  color: var(--muted);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.availability__big {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 5px;
}

.availability__big strong {
  color: var(--navy-900);
  font-family: var(--font-serif);
  font-size: 2.7rem;
  font-weight: 600;
  line-height: 1;
}

.availability__big span {
  color: var(--muted);
  font-size: 0.76rem;
}

.availability__bar {
  height: 6px;
  margin: 12px 0 14px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: #eee9df;
}

.availability__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--green);
  transition: width 0.3s ease;
}

.availability__bar span.is-empty {
  background: var(--red);
}

.availability__status {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 11px;
  border-radius: 8px;
  font-size: 0.78rem;
  line-height: 1.45;
}

.availability__status svg {
  width: 15px;
  height: 15px;
  flex: none;
  margin-top: 1px;
}

.availability__status.is-available {
  background: var(--green-soft);
  color: var(--green-dark);
}

.availability__status.is-empty {
  background: var(--red-soft);
  color: var(--red-dark);
}

.availability__location {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 14px 0;
  padding-top: 13px;
  border-top: 1px solid var(--line);
}

.availability__location > svg {
  width: 17px;
  height: 17px;
  color: var(--amber-dark);
}

.availability__location div {
  display: flex;
  flex-direction: column;
}

.availability__location span {
  color: var(--muted);
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.availability__location strong {
  color: var(--ink-soft);
  font-size: 0.82rem;
  font-weight: 600;
}

.availability__link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;
  font-size: 0.76rem;
  font-weight: 600;
}

.availability__link svg {
  width: 13px;
  height: 13px;
}

.availability__hint {
  margin: 12px 0;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1.5;
}

.active-loans {
  padding: 15px 17px;
}

.active-loans__header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-bottom: 9px;
  border-bottom: 1px solid var(--line);
}

.active-loans__header > svg {
  width: 15px;
  height: 15px;
  color: var(--navy-600);
}

.active-loans__header h3 {
  flex: 1;
  font-size: 0.95rem;
}

.active-loans ul {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.active-loans li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.active-loans li div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.active-loans li strong {
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.78rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-loans li span {
  color: var(--muted);
  font-size: 0.68rem;
}

.related-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1180px) {
  .detail-grid {
    grid-template-columns: 212px minmax(0, 1fr);
  }

  .detail-side {
    position: static;
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-cover-col {
    align-items: center;
  }

  .detail-cover {
    width: 210px;
    height: 300px;
  }

  .detail-side {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>

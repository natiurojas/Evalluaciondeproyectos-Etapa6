<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Library, RotateCcw, Search, SlidersHorizontal } from 'lucide-vue-next'
import BookCard from '@/components/catalog/BookCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PaginationBar from '@/components/ui/PaginationBar.vue'
import { useBooksStore } from '@/stores/books'
import { useLoansStore } from '@/stores/loans'
import { useAuthStore } from '@/stores/auth'
import { includesText, pluralize } from '@/utils/text'

const books = useBooksStore()
const loans = useLoansStore()
const auth = useAuthStore()
const router = useRouter()

const busqueda = ref('')
const materia = ref('')
const disponibilidad = ref('todos')
const orden = ref('titulo')
const page = ref(1)
const pageSize = 12

const totalDisponibles = computed(() =>
  books.activos.reduce((total, libro) => total + loans.disponibles(libro), 0),
)

const filtrados = computed(() => {
  const texto = busqueda.value.trim()

  let resultado = books.activos.filter((libro) => {
    if (texto) {
      const contenido = [
        libro.titulo,
        libro.autor,
        libro.materia,
        libro.editorial,
        libro.isbn,
        libro.sinopsis,
      ].join(' ')
      if (!includesText(contenido, texto)) return false
    }

    if (materia.value && libro.materia !== materia.value) return false

    const disponibles = loans.disponibles(libro)
    if (disponibilidad.value === 'disponibles' && disponibles === 0) return false
    if (disponibilidad.value === 'sin-ejemplares' && disponibles > 0) return false

    return true
  })

  resultado = [...resultado].sort((a, b) => {
    if (orden.value === 'autor') return a.autor.localeCompare(b.autor, 'es')
    if (orden.value === 'recientes') return (b.anio || 0) - (a.anio || 0)
    if (orden.value === 'disponibles') return loans.disponibles(b) - loans.disponibles(a)
    return a.titulo.localeCompare(b.titulo, 'es')
  })

  return resultado
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / pageSize)))

const visibles = computed(() => {
  const inicio = (page.value - 1) * pageSize
  return filtrados.value.slice(inicio, inicio + pageSize)
})

const hayFiltros = computed(
  () =>
    Boolean(busqueda.value.trim()) ||
    Boolean(materia.value) ||
    disponibilidad.value !== 'todos' ||
    orden.value !== 'titulo',
)

watch([busqueda, materia, disponibilidad, orden], () => {
  page.value = 1
})

watch(totalPages, (total) => {
  if (page.value > total) page.value = total
})

function limpiarFiltros() {
  busqueda.value = ''
  materia.value = ''
  disponibilidad.value = 'todos'
  orden.value = 'titulo'
  page.value = 1
}
</script>

<template>
  <div class="page">
    <section class="catalog-hero">
      <div class="catalog-hero__text">
        <p class="eyebrow">Catálogo escolar</p>
        <h1>Encontrá tu próximo libro</h1>
        <p>
          Buscá por título, autor o materia y consultá al instante cuántos ejemplares hay
          disponibles antes de acercarte a la biblioteca.
        </p>
      </div>
      <div class="catalog-hero__stats">
        <div>
          <BookOpen />
          <strong>{{ books.activos.length }}</strong>
          <span>títulos</span>
        </div>
        <div>
          <Library />
          <strong>{{ books.totalEjemplares }}</strong>
          <span>ejemplares</span>
        </div>
        <div class="is-accent">
          <span class="pulse" />
          <strong>{{ totalDisponibles }}</strong>
          <span>disponibles hoy</span>
        </div>
      </div>
      <button
        v-if="auth.isStaff"
        class="btn btn--accent catalog-hero__action"
        type="button"
        @click="router.push('/libros')"
      >
        Gestionar catálogo
      </button>
    </section>

    <div class="toolbar catalog-toolbar">
      <div class="toolbar__search">
        <Search />
        <input
          v-model="busqueda"
          class="input"
          type="search"
          placeholder="Buscar por título, autor, materia o ISBN…"
          aria-label="Buscar libros"
        />
      </div>

      <select v-model="materia" class="select toolbar__select" aria-label="Filtrar por materia">
        <option value="">Todas las materias</option>
        <option v-for="nombre in books.materias" :key="nombre" :value="nombre">
          {{ nombre }}
        </option>
      </select>

      <select
        v-model="disponibilidad"
        class="select toolbar__select"
        aria-label="Filtrar por disponibilidad"
      >
        <option value="todos">Cualquier disponibilidad</option>
        <option value="disponibles">Con ejemplares disponibles</option>
        <option value="sin-ejemplares">Sin ejemplares</option>
      </select>

      <select v-model="orden" class="select toolbar__select" aria-label="Ordenar resultados">
        <option value="titulo">Ordenar por título</option>
        <option value="autor">Ordenar por autor/a</option>
        <option value="recientes">Más recientes</option>
        <option value="disponibles">Más disponibles</option>
      </select>

      <button
        v-if="hayFiltros"
        class="btn btn--quiet btn--sm"
        type="button"
        @click="limpiarFiltros"
      >
        <RotateCcw />
        Limpiar
      </button>
    </div>

    <div class="catalog-count">
      <p>
        <SlidersHorizontal />
        <strong>{{ pluralize(filtrados.length, 'resultado', 'resultados') }}</strong>
        <span v-if="materia"> en {{ materia }}</span>
        <span v-if="busqueda.trim()"> para «{{ busqueda.trim() }}»</span>
      </p>
      <button v-if="hayFiltros" class="link-button" type="button" @click="limpiarFiltros">
        Ver todo el catálogo
      </button>
    </div>

    <div v-if="visibles.length" class="catalog-grid">
      <BookCard v-for="libro in visibles" :key="libro.id" :libro="libro" />
    </div>

    <EmptyState
      v-else
      :icon="Search"
      title="No encontramos libros con esos filtros"
      message="Probá con otro término de búsqueda o quitá los filtros para ver el catálogo completo."
    >
      <button class="btn btn--ghost" type="button" @click="limpiarFiltros">
        <RotateCcw />
        Limpiar filtros
      </button>
    </EmptyState>

    <PaginationBar
      v-model:page="page"
      :total-pages="totalPages"
      :total-items="filtrados.length"
      :page-size="pageSize"
      item-label="libros"
    />
  </div>
</template>

<style scoped>
.catalog-hero {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  overflow: hidden;
  margin-bottom: 22px;
  padding: 28px 30px;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 88% 0%, rgba(197, 138, 50, 0.28), transparent 36%),
    linear-gradient(140deg, var(--navy-800) 0%, var(--navy-950) 100%);
  color: #fff;
  box-shadow: var(--shadow-md);
}

.catalog-hero::after {
  content: '';
  position: absolute;
  top: -70px;
  right: -50px;
  width: 260px;
  height: 260px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  box-shadow: 0 0 0 35px rgba(255, 255, 255, 0.02), 0 0 0 70px rgba(255, 255, 255, 0.015);
  pointer-events: none;
}

.catalog-hero__text {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.catalog-hero__text .eyebrow {
  color: #e7bb72;
}

.catalog-hero__text h1 {
  margin-top: 5px;
  color: #fff;
  font-size: clamp(1.8rem, 1.3rem + 1.4vw, 2.5rem);
  font-weight: 500;
}

.catalog-hero__text > p:last-child {
  max-width: 480px;
  margin-top: 9px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.88rem;
  line-height: 1.6;
}

.catalog-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.catalog-hero__stats > div {
  display: flex;
  min-width: 98px;
  flex-direction: column;
  gap: 1px;
  padding: 11px 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(4px);
}

.catalog-hero__stats svg {
  width: 15px;
  height: 15px;
  margin-bottom: 3px;
  color: #e7bb72;
}

.catalog-hero__stats strong {
  color: #fff;
  font-family: var(--font-serif);
  font-size: 1.45rem;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.catalog-hero__stats span {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.64rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.catalog-hero__stats .is-accent {
  border-color: rgba(197, 138, 50, 0.45);
  background: rgba(197, 138, 50, 0.14);
}

.catalog-hero__stats .is-accent strong {
  color: #f2cd8d;
}

.catalog-hero__stats .pulse {
  width: 7px;
  height: 7px;
  margin-bottom: 5px;
  border-radius: 50%;
  background: #7dd3a1;
  box-shadow: 0 0 0 3px rgba(125, 211, 161, 0.22);
}

.catalog-hero__action {
  position: relative;
  z-index: 1;
}

.catalog-toolbar {
  position: sticky;
  top: calc(var(--topbar-height) + 10px);
  z-index: 20;
  background: rgba(255, 253, 248, 0.96);
  backdrop-filter: blur(8px);
}

.catalog-count {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 20px 2px 14px;
}

.catalog-count p {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--muted);
  font-size: 0.82rem;
}

.catalog-count p svg {
  width: 15px;
  height: 15px;
  color: var(--amber-dark);
}

.catalog-count strong {
  color: var(--ink-soft);
  font-weight: 600;
}

.catalog-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(212px, 1fr));
}

@media (max-width: 760px) {
  .catalog-hero {
    padding: 22px;
  }

  .catalog-hero__stats {
    width: 100%;
  }

  .catalog-hero__stats > div {
    flex: 1;
    min-width: 88px;
  }

  .catalog-toolbar {
    top: calc(var(--topbar-height) + 4px);
  }

  .catalog-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}
</style>

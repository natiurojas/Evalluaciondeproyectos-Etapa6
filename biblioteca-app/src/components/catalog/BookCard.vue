<script setup>
import { computed } from 'vue'
import { BookOpen } from 'lucide-vue-next'
import { materiaInfo } from '@/data/materias'
import { useLoansStore } from '@/stores/loans'

const props = defineProps({
  libro: { type: Object, required: true },
})

const loans = useLoansStore()
const info = computed(() => materiaInfo(props.libro.materia))
const disponibles = computed(() => loans.disponibles(props.libro))
const sinEjemplares = computed(() => disponibles.value === 0)
</script>

<template>
  <RouterLink
    :to="`/catalogo/${libro.id}`"
    class="book-card"
    :style="{ '--cover': info.color, '--cover-soft': info.suave }"
    :aria-label="`${libro.titulo}, de ${libro.autor}`"
  >
    <div class="book-card__cover">
      <span class="book-card__materia">{{ libro.materia }}</span>
      <BookOpen class="book-card__icon" />
      <p class="book-card__cover-title">{{ libro.titulo }}</p>
      <p class="book-card__cover-author">{{ libro.autor }}</p>
      <span class="book-card__spine" aria-hidden="true" />
    </div>

    <div class="book-card__body">
      <h3 class="book-card__title">{{ libro.titulo }}</h3>
      <p class="book-card__author">{{ libro.autor }}</p>
      <div class="book-card__footer">
        <span class="badge" :class="sinEjemplares ? 'badge--red' : 'badge--green'">
          {{ sinEjemplares ? 'Sin ejemplares' : `${disponibles} disponible${disponibles === 1 ? '' : 's'}` }}
        </span>
        <span class="book-card__meta">{{ libro.ubicacion }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.book-card {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-xs);
  color: inherit;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.book-card:hover {
  border-color: #cdbfa8;
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

.book-card__cover {
  position: relative;
  display: flex;
  height: 172px;
  flex-direction: column;
  justify-content: flex-end;
  padding: 14px 16px;
  background: var(--cover);
  color: #fff;
  isolation: isolate;
}

.book-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(180deg, rgba(7, 31, 48, 0) 18%, rgba(7, 31, 48, 0.62) 100%),
    radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.18), transparent 38%);
}

.book-card__materia {
  position: absolute;
  top: 12px;
  left: 14px;
  padding: 3px 8px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.16);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.book-card__icon {
  position: absolute;
  top: 15px;
  right: 14px;
  width: 19px;
  height: 19px;
  opacity: 0.65;
}

.book-card__spine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 6px;
  width: 3px;
  background: rgba(0, 0, 0, 0.22);
  border-radius: 2px;
}

.book-card__cover-title {
  display: -webkit-box;
  overflow: hidden;
  color: #fff;
  font-family: var(--font-serif);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.book-card__cover-author {
  margin-top: 4px;
  overflow: hidden;
  font-size: 0.68rem;
  opacity: 0.8;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  padding: 13px 15px 14px;
}

.book-card__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.96rem;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.book-card__author {
  overflow: hidden;
  color: var(--muted);
  font-size: 0.77rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
}

.book-card__meta {
  overflow: hidden;
  color: var(--muted-light);
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

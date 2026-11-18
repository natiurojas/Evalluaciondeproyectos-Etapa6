<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, BookOpen, Compass, Search } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
</script>

<template>
  <div class="page page--narrow">
    <section class="not-found">
      <div class="not-found__scenery" aria-hidden="true">
        <span class="not-found__code">404</span>
        <span class="not-found__book"><BookOpen /></span>
        <span class="not-found__compass"><Compass /></span>
      </div>

      <p class="eyebrow">Página no encontrada</p>
      <h1>Ese estante no existe</h1>
      <p class="not-found__lead">
        No pudimos encontrar la página que buscabas. Puede que el enlace esté mal escrito o que
        el contenido se haya movido de lugar.
      </p>

      <p class="not-found__route">
        <Search />
        <code>{{ route.fullPath }}</code>
      </p>

      <div class="not-found__actions">
        <RouterLink v-if="auth.isAuthenticated" to="/catalogo" class="btn btn--primary">
          <BookOpen />
          Volver al catálogo
        </RouterLink>
        <RouterLink v-else to="/ingresar" class="btn btn--primary">
          <ArrowLeft />
          Ir a ingresar
        </RouterLink>
        <RouterLink
          v-if="auth.isAuthenticated && auth.isStaff"
          :to="auth.homeRoute"
          class="btn btn--ghost"
        >
          Ir al panel
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 62vh;
  padding: 48px 24px;
  text-align: center;
}

.not-found__scenery {
  position: relative;
  display: grid;
  width: 190px;
  height: 130px;
  margin-bottom: 26px;
  place-items: center;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 70% 20%, rgba(197, 138, 50, 0.24), transparent 46%),
    linear-gradient(150deg, var(--navy-800), var(--navy-950));
  color: #fff;
  box-shadow: var(--shadow-md);
}

.not-found__code {
  font-family: var(--font-serif);
  font-size: 3.4rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.9);
}

.not-found__book,
.not-found__compass {
  position: absolute;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  background: var(--amber);
  color: var(--navy-950);
  box-shadow: 0 6px 16px rgba(7, 31, 48, 0.28);
}

.not-found__book svg,
.not-found__compass svg {
  width: 17px;
  height: 17px;
}

.not-found__book {
  top: -12px;
  left: 24px;
  transform: rotate(-12deg);
}

.not-found__compass {
  right: 26px;
  bottom: -10px;
  background: #e9f2f9;
  color: var(--navy-700);
}

.not-found h1 {
  margin-top: 6px;
}

.not-found__lead {
  max-width: 460px;
  margin-top: 10px;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.65;
}

.not-found__route {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
  margin-top: 18px;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--paper);
  color: var(--muted);
  font-size: 0.76rem;
}

.not-found__route svg {
  width: 14px;
  height: 14px;
  flex: none;
  color: var(--amber-dark);
}

.not-found__route code {
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px;
  margin-top: 26px;
}
</style>

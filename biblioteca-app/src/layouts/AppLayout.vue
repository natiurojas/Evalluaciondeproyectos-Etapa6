<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { formatDateLong, todayISO } from '@/utils/dates'
import BrandMark from '@/components/BrandMark.vue'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const menuAbierto = ref(false)

const navBiblioteca = computed(() => [
  { to: '/catalogo', label: 'Catálogo', icon: BookOpen },
  { to: '/mis-prestamos', label: 'Mis préstamos', icon: BookMarked },
])

const navGestion = computed(() => {
  if (!auth.isStaff) return []
  const items = [
    { to: '/panel', label: 'Panel', icon: LayoutDashboard },
    { to: '/circulacion', label: 'Circulación', icon: ClipboardList },
    { to: '/libros', label: 'Libros', icon: Library },
    { to: '/usuarios', label: 'Usuarios', icon: Users },
    { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  ]
  return items.filter((item) => {
    const permiso = { '/panel': 'panel', '/circulacion': 'circulacion', '/libros': 'libros', '/usuarios': 'usuarios', '/reportes': 'reportes' }[item.to]
    return auth.can(permiso)
  })
})

const fechaHoy = computed(() => formatDateLong(todayISO()))

watch(
  () => route.fullPath,
  () => {
    menuAbierto.value = false
  },
)

function cerrarSesion() {
  auth.logout()
  ui.info('Cerraste sesión correctamente.')
  router.push('/ingresar')
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ 'is-open': menuAbierto }">
      <div class="sidebar__brand">
        <BrandMark :size="40" />
        <div class="sidebar__brand-text">
          <strong>Biblioteca Escolar</strong>
          <span>Precooperativa</span>
        </div>
      </div>

      <nav class="sidebar__nav" aria-label="Navegación principal">
        <div class="sidebar__group">
          <p class="sidebar__group-label">Espacio de lectura</p>
          <RouterLink
            v-for="item in navBiblioteca"
            :key="item.to"
            :to="item.to"
            class="nav-link"
          >
            <component :is="item.icon" />
            {{ item.label }}
          </RouterLink>
        </div>

        <div v-if="navGestion.length" class="sidebar__group">
          <p class="sidebar__group-label">Gestión de la biblioteca</p>
          <RouterLink
            v-for="item in navGestion"
            :key="item.to"
            :to="item.to"
            class="nav-link"
          >
            <component :is="item.icon" />
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar__footer">
        <div class="user-card">
          <span class="avatar">{{ auth.initialsUser }}</span>
          <div class="user-card__info">
            <strong>{{ auth.nombre }}</strong>
            <span>{{ auth.rolLabel }}</span>
          </div>
          <button
            class="icon-button"
            type="button"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            @click="cerrarSesion"
          >
            <LogOut />
          </button>
        </div>
        <p class="demo-note">
          Prototipo local · Los datos se guardan en este navegador.
        </p>
      </div>
    </aside>

    <div v-if="menuAbierto" class="sidebar-backdrop" @click="menuAbierto = false" />

    <div class="app-main">
      <header class="topbar">
        <button
          class="icon-button menu-toggle"
          type="button"
          aria-label="Abrir menú"
          :aria-expanded="menuAbierto"
          @click="menuAbierto = !menuAbierto"
        >
          <X v-if="menuAbierto" />
          <Menu v-else />
        </button>

        <div class="topbar__title">
          <span class="topbar__eyebrow">{{ auth.isStaff ? 'Gestión' : 'Comunidad educativa' }}</span>
          <strong>{{ route.meta.title || 'Biblioteca Escolar' }}</strong>
        </div>

        <div class="topbar__spacer" />

        <div class="topbar__meta">
          <span class="topbar__date">
            <CalendarDays />
            {{ fechaHoy }}
          </span>
          <span class="badge badge--amber badge--plain">{{ auth.rolLabel }}</span>
        </div>
      </header>

      <main id="contenido">
        <slot />
      </main>
    </div>
  </div>
</template>

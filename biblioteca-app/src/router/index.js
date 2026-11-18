import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/ingresar',
    name: 'ingresar',
    component: () => import('@/views/LoginView.vue'),
    meta: { layout: 'auth', public: true, title: 'Ingresar' },
  },
  {
    path: '/',
    redirect: '/catalogo',
  },
  {
    path: '/catalogo',
    name: 'catalogo',
    component: () => import('@/views/CatalogView.vue'),
    meta: { title: 'Catálogo', permiso: 'catalogo' },
  },
  {
    path: '/catalogo/:id',
    name: 'libro',
    component: () => import('@/views/BookDetailView.vue'),
    props: true,
    meta: { title: 'Ficha del libro', permiso: 'catalogo' },
  },
  {
    path: '/mis-prestamos',
    name: 'mis-prestamos',
    component: () => import('@/views/MyLoansView.vue'),
    meta: { title: 'Mis préstamos', permiso: 'mis-prestamos' },
  },
  {
    path: '/panel',
    name: 'panel',
    component: () => import('@/views/staff/PanelView.vue'),
    meta: { title: 'Panel de circulación', permiso: 'panel' },
  },
  {
    path: '/circulacion',
    name: 'circulacion',
    component: () => import('@/views/staff/CirculationView.vue'),
    meta: { title: 'Circulación', permiso: 'circulacion' },
  },
  {
    path: '/libros',
    name: 'libros',
    component: () => import('@/views/staff/BooksView.vue'),
    meta: { title: 'Gestión de libros', permiso: 'libros' },
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('@/views/staff/UsersView.vue'),
    meta: { title: 'Gestión de usuarios', permiso: 'usuarios' },
  },
  {
    path: '/reportes',
    name: 'reportes',
    component: () => import('@/views/staff/ReportsView.vue'),
    meta: { title: 'Reporte básico', permiso: 'reportes' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'no-encontrado',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Página no encontrada' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const esPublica = to.meta.public === true

  if (esPublica) {
    if (to.name === 'ingresar' && auth.isAuthenticated) {
      return auth.homeRoute
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'ingresar', query: { redirect: to.fullPath } }
  }

  if (to.meta.permiso && !auth.can(to.meta.permiso)) {
    return auth.homeRoute
  }

  return true
})

router.afterEach((to) => {
  const base = 'Biblioteca Escolar'
  document.title = to.meta.title ? `${to.meta.title} · ${base}` : base
})

export default router

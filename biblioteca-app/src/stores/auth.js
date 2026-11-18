import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loadState, removeState, saveState } from '@/utils/storage'
import { initials } from '@/utils/text'
import { ETIQUETAS_ROL } from '@/data/configuracion'
import { useUsersStore } from './users'

const PERMISOS = {
  administrador: [
    'catalogo',
    'mis-prestamos',
    'panel',
    'circulacion',
    'libros',
    'libros:gestionar',
    'libros:eliminar',
    'usuarios',
    'usuarios:gestionar',
    'usuarios:eliminar',
    'reportes',
  ],
  bibliotecario: [
    'catalogo',
    'mis-prestamos',
    'panel',
    'circulacion',
    'libros',
    'libros:gestionar',
    'usuarios',
    'usuarios:gestionar',
    'reportes',
  ],
  usuario: ['catalogo', 'mis-prestamos'],
}

export const useAuthStore = defineStore('auth', () => {
  const sesion = ref(loadState('sesion', null))

  const currentUser = computed(() => {
    if (!sesion.value) return null
    const users = useUsersStore()
    return users.porId(sesion.value.id) ?? sesion.value
  })

  const isAuthenticated = computed(() => Boolean(sesion.value))
  const rol = computed(() => currentUser.value?.rol ?? null)
  const isStaff = computed(() => ['administrador', 'bibliotecario'].includes(rol.value))
  const isAdmin = computed(() => rol.value === 'administrador')
  const nombre = computed(() => currentUser.value?.nombre ?? '')
  const initialsUser = computed(() => initials(nombre.value))
  const rolLabel = computed(() => ETIQUETAS_ROL[rol.value] ?? '')
  const homeRoute = computed(() => (isStaff.value ? '/panel' : '/catalogo'))

  function can(permiso) {
    return PERMISOS[rol.value]?.includes(permiso) ?? false
  }

  function login(correo, clave) {
    const users = useUsersStore()
    const usuario = users.porCorreo(correo)

    if (!usuario || usuario.clave !== clave) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' }
    }
    if (!usuario.activo) {
      return {
        ok: false,
        error: 'La cuenta está dada de baja. Consultá con el personal de la biblioteca.',
      }
    }

    const { clave: _clave, ...perfil } = usuario
    sesion.value = perfil
    saveState('sesion', perfil)
    return { ok: true, usuario: perfil }
  }

  function logout() {
    sesion.value = null
    removeState('sesion')
  }

  return {
    sesion,
    currentUser,
    isAuthenticated,
    rol,
    isStaff,
    isAdmin,
    nombre,
    initialsUser,
    rolLabel,
    homeRoute,
    can,
    login,
    logout,
  }
})

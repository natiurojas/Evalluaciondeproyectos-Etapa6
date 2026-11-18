import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { usuariosSeed } from '@/data/usuarios'
import { loadState, saveState } from '@/utils/storage'
import { nextId } from '@/utils/ids'
import { normalize } from '@/utils/text'
import { todayISO } from '@/utils/dates'

function normalizarRol(valor) {
  const texto = normalize(valor)
  if (['administrador', 'administradora', 'admin'].includes(texto)) return 'administrador'
  if (['bibliotecario', 'bibliotecaria', 'biblioteca'].includes(texto)) return 'bibliotecario'
  return 'usuario'
}

function normalizarTipo(valor, rol) {
  if (rol === 'administrador') return 'Administración'
  if (rol === 'bibliotecario') return 'Biblioteca'
  return normalize(valor).includes('docente') ? 'Docente' : 'Estudiante'
}

export const useUsersStore = defineStore('users', () => {
  const usuarios = ref(loadState('usuarios', usuariosSeed))

  watch(usuarios, (value) => saveState('usuarios', value), { deep: true })

  const activos = computed(() => usuarios.value.filter((usuario) => usuario.activo))
  const estudiantes = computed(() =>
    activos.value.filter((usuario) => usuario.rol === 'usuario' && usuario.tipo === 'Estudiante'),
  )
  const docentes = computed(() =>
    activos.value.filter((usuario) => usuario.rol === 'usuario' && usuario.tipo === 'Docente'),
  )
  const cursos = computed(() =>
    [...new Set(usuarios.value.map((usuario) => usuario.curso).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    ),
  )

  function porId(id) {
    return usuarios.value.find((usuario) => usuario.id === id) ?? null
  }

  function porCorreo(correo) {
    return (
      usuarios.value.find(
        (usuario) => normalize(usuario.correo) === normalize(correo),
      ) ?? null
    )
  }

  function existeCorreo(correo, exceptoId = null) {
    return usuarios.value.some(
      (usuario) =>
        usuario.id !== exceptoId && normalize(usuario.correo) === normalize(correo),
    )
  }

  function crear(payload) {
    const usuario = {
      id: nextId('usr', usuarios.value),
      nombre: payload.nombre.trim(),
      correo: payload.correo.trim().toLowerCase(),
      clave: payload.clave || 'biblioteca123',
      rol: payload.rol,
      tipo:
        payload.tipo ||
        (payload.rol === 'usuario' ? 'Estudiante' : normalizarTipo('', payload.rol)),
      curso: payload.rol === 'usuario' ? (payload.curso || '').trim() : '',
      identificacion: (payload.identificacion || '').trim(),
      activo: true,
      fechaAlta: todayISO(),
    }
    usuarios.value.push(usuario)
    return usuario
  }

  function actualizar(id, payload) {
    const usuario = porId(id)
    if (!usuario) return null
    Object.assign(usuario, {
      nombre: payload.nombre.trim(),
      correo: payload.correo.trim().toLowerCase(),
      rol: payload.rol,
      tipo:
        payload.tipo ||
        (payload.rol === 'usuario' ? usuario.tipo : normalizarTipo('', payload.rol)),
      curso: payload.rol === 'usuario' ? (payload.curso || '').trim() : '',
      identificacion: (payload.identificacion || '').trim(),
    })
    if (payload.clave) usuario.clave = payload.clave
    return usuario
  }

  function baja(id) {
    const usuario = porId(id)
    if (usuario) usuario.activo = false
  }

  function reactivar(id) {
    const usuario = porId(id)
    if (usuario) usuario.activo = true
  }

  function importar(filas) {
    const resumen = { creados: 0, omitidos: 0, errores: [] }

    filas.forEach((fila) => {
      const nombre = (fila.nombre || '').trim()
      const correo = (fila.correo || '').trim()

      if (!nombre || !correo) {
        resumen.errores.push(`Fila ${fila.__fila}: faltan nombre o correo.`)
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        resumen.errores.push(`Fila ${fila.__fila}: el correo «${correo}» no es válido.`)
        return
      }
      if (existeCorreo(correo)) {
        resumen.omitidos += 1
        return
      }

      const rol = normalizarRol(fila.rol)
      crear({
        nombre,
        correo,
        clave: fila.clave || 'biblioteca123',
        rol,
        tipo: normalizarTipo(fila.tipo, rol),
        curso: fila.curso,
        identificacion: fila.identificacion,
      })
      resumen.creados += 1
    })

    return resumen
  }

  return {
    usuarios,
    activos,
    estudiantes,
    docentes,
    cursos,
    porId,
    porCorreo,
    existeCorreo,
    crear,
    actualizar,
    baja,
    reactivar,
    importar,
  }
})

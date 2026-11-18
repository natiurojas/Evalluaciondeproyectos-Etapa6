import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { prestamosSeed } from '@/data/prestamos'
import { configuracion } from '@/data/configuracion'
import { loadState, saveState } from '@/utils/storage'
import { nextId } from '@/utils/ids'
import { daysUntil, formatDate, monthKey, todayISO } from '@/utils/dates'
import { useBooksStore } from './books'
import { useUsersStore } from './users'

export const useLoansStore = defineStore('loans', () => {
  const prestamos = ref(loadState('prestamos', prestamosSeed))

  watch(prestamos, (value) => saveState('prestamos', value), { deep: true })

  const activos = computed(() =>
    prestamos.value.filter((prestamo) => !prestamo.fechaDevolucion),
  )
  const historial = computed(() =>
    prestamos.value.filter((prestamo) => prestamo.fechaDevolucion),
  )
  const vencidos = computed(() =>
    activos.value.filter((prestamo) => estadoDe(prestamo) === 'vencido'),
  )
  const venceHoy = computed(() =>
    activos.value.filter((prestamo) => estadoDe(prestamo) === 'vence-hoy'),
  )
  const porVencer = computed(() =>
    activos.value.filter((prestamo) => {
      const estado = estadoDe(prestamo)
      return estado === 'vence-hoy' || estado === 'por-vencer'
    }),
  )
  const conAlerta = computed(() =>
    activos.value
      .filter((prestamo) => ['vencido', 'vence-hoy', 'por-vencer'].includes(estadoDe(prestamo)))
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)),
  )

  function porId(id) {
    return prestamos.value.find((prestamo) => prestamo.id === id) ?? null
  }

  function activosDeLibro(libroId) {
    return activos.value.filter((prestamo) => prestamo.libroId === libroId)
  }

  function activosDeUsuario(usuarioId) {
    return activos.value.filter((prestamo) => prestamo.usuarioId === usuarioId)
  }

  function prestamosDeUsuario(usuarioId) {
    return prestamos.value
      .filter((prestamo) => prestamo.usuarioId === usuarioId)
      .sort((a, b) => b.fechaPrestamo.localeCompare(a.fechaPrestamo))
  }

  function disponibles(libro) {
    if (!libro) return 0
    return Math.max(0, Number(libro.ejemplares || 0) - activosDeLibro(libro.id).length)
  }

  function estadoDe(prestamo) {
    if (!prestamo) return 'a-tiempo'
    if (prestamo.fechaDevolucion) return 'devuelto'
    const diff = daysUntil(prestamo.fechaVencimiento)
    if (diff < 0) return 'vencido'
    if (diff === 0) return 'vence-hoy'
    if (diff <= configuracion.diasAviso) return 'por-vencer'
    return 'a-tiempo'
  }

  function registrar({ libroId, usuarioId, fechaVencimiento, registradoPor, observaciones }) {
    const books = useBooksStore()
    const users = useUsersStore()
    const libro = books.porId(libroId)
    const usuario = users.porId(usuarioId)

    if (!libro) return { ok: false, error: 'Seleccioná un libro válido.' }
    if (!usuario) return { ok: false, error: 'Seleccioná un usuario válido.' }
    if (!libro.activo) return { ok: false, error: 'El libro está dado de baja.' }
    if (!usuario.activo) return { ok: false, error: 'El usuario está dado de baja.' }
    if (!fechaVencimiento) return { ok: false, error: 'Indicá la fecha de vencimiento.' }
    if (fechaVencimiento < todayISO()) {
      return { ok: false, error: 'La fecha de vencimiento no puede ser anterior a hoy.' }
    }
    if (disponibles(libro) <= 0) {
      return { ok: false, error: 'No quedan ejemplares disponibles de este libro.' }
    }
    if (activosDeUsuario(usuarioId).length >= configuracion.maxPrestamos) {
      return {
        ok: false,
        error: `El usuario ya tiene ${configuracion.maxPrestamos} préstamos activos (máximo permitido).`,
      }
    }
    if (
      activosDeUsuario(usuarioId).some((prestamo) => prestamo.libroId === libroId)
    ) {
      return { ok: false, error: 'El usuario ya tiene un préstamo activo de este libro.' }
    }

    const nuevo = {
      id: nextId('pre', prestamos.value),
      libroId,
      usuarioId,
      fechaPrestamo: todayISO(),
      fechaVencimiento,
      fechaDevolucion: null,
      registradoPor: registradoPor || '',
      observaciones: (observaciones || '').trim(),
    }
    prestamos.value.push(nuevo)
    return { ok: true, prestamo: nuevo }
  }

  function devolver(id, { fechaDevolucion = todayISO(), observaciones = '' } = {}) {
    const prestamo = porId(id)
    if (!prestamo) return { ok: false, error: 'No se encontró el préstamo.' }
    if (prestamo.fechaDevolucion) {
      return { ok: false, error: 'El préstamo ya fue devuelto.' }
    }
    if (fechaDevolucion < prestamo.fechaPrestamo) {
      return { ok: false, error: 'La devolución no puede ser anterior al préstamo.' }
    }

    prestamo.fechaDevolucion = fechaDevolucion
    if (observaciones.trim()) {
      prestamo.observaciones = [prestamo.observaciones, observaciones.trim()]
        .filter(Boolean)
        .join(' ')
    }
    return { ok: true, prestamo }
  }

  function prestamosDelMes(key) {
    return prestamos.value.filter((prestamo) => monthKey(prestamo.fechaPrestamo) === key)
  }

  function topLibros(limite = 5, key = null) {
    const base = key ? prestamosDelMes(key) : prestamos.value
    const books = useBooksStore()
    const conteo = new Map()

    base.forEach((prestamo) => {
      conteo.set(prestamo.libroId, (conteo.get(prestamo.libroId) || 0) + 1)
    })

    return [...conteo.entries()]
      .map(([libroId, total]) => ({ libro: books.porId(libroId), total }))
      .filter((item) => item.libro)
      .sort((a, b) => b.total - a.total)
      .slice(0, limite)
  }

  function porMateria(key = null) {
    const base = key ? prestamosDelMes(key) : prestamos.value
    const books = useBooksStore()
    const conteo = new Map()

    base.forEach((prestamo) => {
      const libro = books.porId(prestamo.libroId)
      if (!libro) return
      conteo.set(libro.materia, (conteo.get(libro.materia) || 0) + 1)
    })

    return [...conteo.entries()]
      .map(([materia, total]) => ({ materia, total }))
      .sort((a, b) => b.total - a.total)
  }

  function recordatorio(prestamo) {
    const books = useBooksStore()
    const users = useUsersStore()
    const libro = books.porId(prestamo.libroId)
    const usuario = users.porId(prestamo.usuarioId)
    if (!libro || !usuario) return ''
    const atraso = estadoDe(prestamo) === 'vencido'
    return [
      `Hola ${usuario.nombre}:`,
      atraso
        ? `te recordamos que el libro «${libro.titulo}» debía devolverse el ${formatDate(prestamo.fechaVencimiento)}.`
        : `te recordamos que el libro «${libro.titulo}» vence el ${formatDate(prestamo.fechaVencimiento)}.`,
      'Por favor, acercalo a la biblioteca escolar.',
      'Gracias.',
    ].join(' ')
  }

  return {
    prestamos,
    activos,
    historial,
    vencidos,
    venceHoy,
    porVencer,
    conAlerta,
    porId,
    activosDeLibro,
    activosDeUsuario,
    prestamosDeUsuario,
    disponibles,
    estadoDe,
    registrar,
    devolver,
    prestamosDelMes,
    topLibros,
    porMateria,
    recordatorio,
  }
})

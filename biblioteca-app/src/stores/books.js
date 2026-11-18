import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { librosSeed } from '@/data/libros'
import { loadState, saveState } from '@/utils/storage'
import { nextId } from '@/utils/ids'
import { normalize } from '@/utils/text'

export const useBooksStore = defineStore('books', () => {
  const libros = ref(loadState('libros', librosSeed))

  watch(libros, (value) => saveState('libros', value), { deep: true })

  const activos = computed(() => libros.value.filter((libro) => libro.activo))
  const materias = computed(() =>
    [...new Set(activos.value.map((libro) => libro.materia))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    ),
  )
  const totalEjemplares = computed(() =>
    activos.value.reduce((total, libro) => total + Number(libro.ejemplares || 0), 0),
  )

  function porId(id) {
    return libros.value.find((libro) => libro.id === id) ?? null
  }

  function existeIsbn(isbn, exceptoId = null) {
    const limpio = normalize(String(isbn || '').replace(/[-\s]/g, ''))
    if (!limpio) return false
    return libros.value.some(
      (libro) =>
        libro.id !== exceptoId &&
        normalize(String(libro.isbn || '').replace(/[-\s]/g, '')) === limpio,
    )
  }

  function existeTituloAutor(titulo, autor, exceptoId = null) {
    return libros.value.some(
      (libro) =>
        libro.id !== exceptoId &&
        normalize(libro.titulo) === normalize(titulo) &&
        normalize(libro.autor) === normalize(autor),
    )
  }

  function crear(payload) {
    const libro = {
      id: nextId('lib', libros.value),
      titulo: payload.titulo.trim(),
      autor: payload.autor.trim(),
      materia: payload.materia,
      editorial: (payload.editorial || '').trim(),
      anio: payload.anio ? Number(payload.anio) : null,
      isbn: (payload.isbn || '').trim(),
      sinopsis: (payload.sinopsis || '').trim(),
      ejemplares: Math.max(1, Number(payload.ejemplares) || 1),
      ubicacion: (payload.ubicacion || '').trim(),
      activo: true,
    }
    libros.value.push(libro)
    return libro
  }

  function actualizar(id, payload) {
    const libro = porId(id)
    if (!libro) return null
    Object.assign(libro, {
      titulo: payload.titulo.trim(),
      autor: payload.autor.trim(),
      materia: payload.materia,
      editorial: (payload.editorial || '').trim(),
      anio: payload.anio ? Number(payload.anio) : null,
      isbn: (payload.isbn || '').trim(),
      sinopsis: (payload.sinopsis || '').trim(),
      ejemplares: Math.max(1, Number(payload.ejemplares) || 1),
      ubicacion: (payload.ubicacion || '').trim(),
    })
    return libro
  }

  function baja(id) {
    const libro = porId(id)
    if (libro) libro.activo = false
  }

  function reactivar(id) {
    const libro = porId(id)
    if (libro) libro.activo = true
  }

  /**
   * Importa filas validadas. No crea duplicados por ISBN ni por título + autor.
   * Devuelve un resumen para mostrar al usuario.
   */
  function importar(filas) {
    const resumen = { creados: 0, omitidos: 0, errores: [] }

    filas.forEach((fila) => {
      const titulo = (fila.titulo || '').trim()
      const autor = (fila.autor || '').trim()
      const materia = (fila.materia || '').trim()

      if (!titulo || !autor || !materia) {
        resumen.errores.push(`Fila ${fila.__fila}: faltan título, autor o materia.`)
        return
      }

      if (
        existeIsbn(fila.isbn) ||
        existeTituloAutor(titulo, autor)
      ) {
        resumen.omitidos += 1
        return
      }

      crear({
        titulo,
        autor,
        materia,
        editorial: fila.editorial,
        anio: fila.anio,
        isbn: fila.isbn,
        sinopsis: fila.sinopsis,
        ejemplares: fila.ejemplares,
        ubicacion: fila.ubicacion,
      })
      resumen.creados += 1
    })

    return resumen
  }

  return {
    libros,
    activos,
    materias,
    totalEjemplares,
    porId,
    existeIsbn,
    existeTituloAutor,
    crear,
    actualizar,
    baja,
    reactivar,
    importar,
  }
})

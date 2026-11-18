/**
 * Persistencia local del prototipo.
 * En producción estos datos vivirán en una base de datos con contraseñas
 * cifradas. Aquí se guarda todo en localStorage para poder pilotear la interfaz.
 */

const PREFIX = 'biblioteca-escolar'

function key(name) {
  return `${PREFIX}:${name}`
}

export function loadState(name, fallback) {
  try {
    const raw = window.localStorage.getItem(key(name))
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`No se pudo leer el estado "${name}".`, error)
    return fallback
  }
}

export function saveState(name, value) {
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value))
  } catch (error) {
    console.warn(`No se pudo guardar el estado "${name}".`, error)
  }
}

export function removeState(name) {
  try {
    window.localStorage.removeItem(key(name))
  } catch (error) {
    console.warn(`No se pudo borrar el estado "${name}".`, error)
  }
}

export function resetDemoState() {
  const names = ['libros', 'usuarios', 'prestamos', 'sesion']
  names.forEach(removeState)
}

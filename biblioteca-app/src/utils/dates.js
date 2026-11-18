/**
 * Utilidades de fecha del MVP.
 * Trabajamos con fechas locales en formato ISO corto (YYYY-MM-DD) para evitar
 * corrimientos de zona horaria al comparar vencimientos.
 */

export function toISO(date = new Date()) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso) {
  if (!iso) return null
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function todayISO() {
  return toISO(new Date())
}

export function addDaysISO(iso, days) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + Number(days))
  return toISO(d)
}

export function daysFromToday(days) {
  return addDaysISO(todayISO(), days)
}

/** Diferencia en días entre dos fechas ISO (a - b). */
export function diffDays(aISO, bISO) {
  const a = parseISO(aISO)
  const b = parseISO(bISO)
  if (!a || !b) return 0
  return Math.round((a - b) / 86400000)
}

export function daysLate(dueISO) {
  return Math.max(0, diffDays(todayISO(), dueISO))
}

export function daysUntil(dueISO) {
  return diffDays(dueISO, todayISO())
}

export function formatDate(iso, options = {}) {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: options.long ? 'long' : 'short',
    year: options.year === false ? undefined : 'numeric',
    ...options.intl,
  })
    .format(d)
    .replace('.', '')
}

export function formatDateLong(iso) {
  return formatDate(iso, { long: true })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function monthKey(iso) {
  return iso ? iso.slice(0, 7) : ''
}

export function currentMonthKey() {
  return monthKey(todayISO())
}

export function monthLabel(key) {
  if (!key) return '—'
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  )
}

export function lastMonths(count = 6) {
  const result = []
  const base = new Date()
  for (let i = 0; i < count; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
    result.push(monthKey(toISO(d)))
  }
  return result
}

export function humanDueLabel(dueISO) {
  if (!dueISO) return '—'
  const diff = diffDays(dueISO, todayISO())
  if (diff === 0) return 'Vence hoy'
  if (diff === 1) return 'Vence mañana'
  if (diff > 1) return `Vence en ${diff} días`
  return `Vencido hace ${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'día' : 'días'}`
}

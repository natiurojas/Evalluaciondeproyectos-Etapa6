export function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function includesText(haystack, needle) {
  return normalize(haystack).includes(normalize(needle))
}

export function initials(nombre = '') {
  return String(nombre)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function truncate(value = '', max = 120) {
  if (value.length <= max) return value
  return `${value.slice(0, max).trimEnd()}…`
}

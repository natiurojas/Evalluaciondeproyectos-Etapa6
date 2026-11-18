/**
 * Importación y exportación CSV simple, sin dependencias.
 * Acepta separador coma o punto y coma y detecta encabezados con o sin acentos.
 */

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || ''
  const commas = (firstLine.match(/,/g) || []).length
  const semicolons = (firstLine.match(/;/g) || []).length
  return semicolons > commas ? ';' : ','
}

/** Parsea un texto CSV y devuelve filas como objetos con encabezados normalizados. */
export function parseCsv(text) {
  const clean = String(text || '')
    .replace(/^\uFEFF/, '')
    .trim()
  if (!clean) return { headers: [], rows: [] }

  const delimiter = detectDelimiter(clean)
  const matrix = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i]
    const next = clean[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field.trim())
      field = ''
    } else if (char === '\n') {
      row.push(field.trim())
      matrix.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  row.push(field.trim())
  matrix.push(row)

  const nonEmpty = matrix.filter((cells) => cells.some((cell) => cell !== ''))
  if (!nonEmpty.length) return { headers: [], rows: [] }

  const headers = nonEmpty[0].map(normalizeHeader)
  const rows = nonEmpty.slice(1).map((cells, index) => {
    const entry = { __fila: index + 2 }
    headers.forEach((header, i) => {
      entry[header] = cells[i] ?? ''
    })
    return entry
  })

  return { headers, rows }
}

export function normalizeHeader(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export function toCsv(rows, columns) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    if (/[";\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  const header = columns.map((column) => escape(column.label)).join(';')
  const body = rows.map((row) =>
    columns.map((column) => escape(row[column.key])).join(';'),
  )
  return [header, ...body].join('\r\n')
}

export function downloadCsv(filename, content) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function nextId(prefix, collection, pad = 3) {
  const max = collection.reduce((acc, item) => {
    const match = String(item.id || '').match(/(\d+)$/)
    return match ? Math.max(acc, Number(match[1])) : acc
  }, 0)
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`
}

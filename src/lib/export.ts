import type { Entry } from '@/types'

export function exportJSON(data: object, filename: string = 'rawlog-export.json'): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCSV(entries: Entry[], filename: string = 'rawlog-entries.csv'): void {
  const headers = ['id', 'timestamp', 'category', 'subcategory', 'note', 'tags', 'fields']
  const rows = entries.map((e) => [
    e.id,
    e.timestamp,
    e.category,
    e.subcategory,
    `"${(e.note ?? '').replace(/"/g, '""')}"`,
    (e.tags ?? []).join('|'),
    `"${JSON.stringify(e.fields).replace(/"/g, '""')}"`,
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

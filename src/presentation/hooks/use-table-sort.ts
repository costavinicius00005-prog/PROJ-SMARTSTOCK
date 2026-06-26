import { useMemo, useState } from "react"

export type SortDirection = "asc" | "desc"

export function useTableSort<T>(items: T[]) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>("asc")

  const sortedItems = useMemo(() => {
    if (!sortColumn) {
      return items
    }

    return [...items].sort((a, b) => {
      const left = String(a[sortColumn] ?? "")
      const right = String(b[sortColumn] ?? "")
      const result = left.localeCompare(right, "pt-BR", { numeric: true })

      return sortDir === "asc" ? result : -result
    })
  }, [items, sortColumn, sortDir])

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortColumn(column)
    setSortDir("asc")
  }

  return {
    sortedItems,
    sortColumn,
    sortDir,
    handleSort,
  }
}

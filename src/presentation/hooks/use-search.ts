import { useMemo } from "react"

export function useSearch<T>(
  items: T[],
  search: string,
  matches: (item: T, normalizedSearch: string) => boolean
) {
  return useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) {
      return items
    }

    return items.filter((item) => matches(item, normalizedSearch))
  }, [items, matches, search])
}

import { useState } from 'react'

/** Splits `items` into pages. Returns the current page's rows plus what <Pagination> needs. */
export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount)
  const start = (current - 1) * pageSize
  return {
    page: current,
    pageCount,
    setPage,
    rows: items.slice(start, start + pageSize),
  }
}

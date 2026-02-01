import { useState, useCallback, useMemo } from 'react';

/**
 * Configuration for pagination
 */
export interface UsePaginationConfig {
  /** Initial page (default: 1) */
  initialPage?: number;
  /** Initial rows per page (default: 10) */
  initialRowsPerPage?: number;
  /** Available rows per page options (default: [10, 25, 50, 100]) */
  rowsPerPageOptions?: number[];
}

/**
 * Return type for usePagination hook
 */
export interface UsePaginationReturn<T> {
  /** Current page (1-indexed) */
  page: number;
  /** Rows per page */
  rowsPerPage: number;
  /** Total pages */
  totalPages: number;
  /** Paginated data for current page */
  paginatedData: T[];
  /** Change page */
  setPage: (page: number) => void;
  /** Change rows per page */
  setRowsPerPage: (rows: number) => void;
  /** Available rows per page options */
  rowsPerPageOptions: number[];
  /** Go to first page */
  goToFirstPage: () => void;
  /** Go to last page */
  goToLastPage: () => void;
  /** Go to next page */
  goToNextPage: () => void;
  /** Go to previous page */
  goToPreviousPage: () => void;
  /** Whether has next page */
  hasNextPage: boolean;
  /** Whether has previous page */
  hasPreviousPage: boolean;
}

/**
 * Hook for managing pagination state and calculations
 *
 * @example
 * ```tsx
 * const pagination = usePagination(data, {
 *   initialPage: 1,
 *   initialRowsPerPage: 25,
 *   rowsPerPageOptions: [10, 25, 50],
 * });
 *
 * // Use in component
 * <DataTable data={pagination.paginatedData} />
 * <Pagination
 *   page={pagination.page}
 *   totalPages={pagination.totalPages}
 *   onPageChange={pagination.setPage}
 *   rowsPerPage={pagination.rowsPerPage}
 *   onRowsPerPageChange={pagination.setRowsPerPage}
 * />
 * ```
 */
export function usePagination<T>(
  data: T[],
  config: UsePaginationConfig = {}
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    initialRowsPerPage = 10,
    rowsPerPageOptions = [10, 25, 50, 100],
  } = config;

  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / rowsPerPage);
  }, [data.length, rowsPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, page, rowsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  }, [totalPages]);

  const handleRowsPerPageChange = useCallback((rows: number) => {
    setRowsPerPage(rows);
    setPage(1); // Reset to first page when changing rows per page
  }, []);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPreviousPage = useMemo(() => page > 1, [page]);

  return {
    page,
    rowsPerPage,
    totalPages,
    paginatedData,
    setPage: handlePageChange,
    setRowsPerPage: handleRowsPerPageChange,
    rowsPerPageOptions,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
  };
}

export default usePagination;

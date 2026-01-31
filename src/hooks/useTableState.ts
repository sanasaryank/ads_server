import { useState, useMemo, useCallback } from 'react';

/**
 * Props for useTableState hook
 */
export interface UseTableStateProps<T> {
  /** Data to display in table */
  data: T[];
  /** Initial rows per page (default: 10) */
  initialRowsPerPage?: number;
  /** Initial page number (default: 0) */
  initialPage?: number;
  /** Default sort column */
  defaultSortColumn?: keyof T;
  /** Default sort direction (default: 'asc') */
  defaultSortDirection?: 'asc' | 'desc';
}

/**
 * Return type for useTableState hook
 */
export interface UseTableStateReturn<T> {
  /** Current page number (0-indexed) */
  page: number;
  /** Rows per page */
  rowsPerPage: number;
  /** Current sort column */
  sortColumn: keyof T | null;
  /** Current sort direction */
  sortDirection: 'asc' | 'desc';
  /** Data paginated for current page */
  paginatedData: T[];
  /** Data sorted by current sort settings */
  sortedData: T[];
  /** Total number of pages */
  totalPages: number;
  /** Handle page change */
  handlePageChange: (newPage: number) => void;
  /** Handle rows per page change */
  handleRowsPerPageChange: (newRowsPerPage: number) => void;
  /** Handle column sort */
  handleSort: (column: keyof T) => void;
}

/**
 * Hook for managing table state with client-side sorting and pagination
 *
 * @template T - The type of data items
 * @param props - Hook configuration
 * @returns Object with table state and control functions
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * const tableState = useTableState<User>({
 *   data: users,
 *   initialRowsPerPage: 10,
 *   defaultSortColumn: 'name',
 *   defaultSortDirection: 'asc',
 * });
 *
 * return (
 *   <Table>
 *     <TableHead>
 *       <TableRow>
 *         <TableCell onClick={() => tableState.handleSort('name')}>
 *           Name
 *         </TableCell>
 *       </TableRow>
 *     </TableHead>
 *     <TableBody>
 *       {tableState.paginatedData.map(user => (
 *         <TableRow key={user.id}>
 *           <TableCell>{user.name}</TableCell>
 *         </TableRow>
 *       ))}
 *     </TableBody>
 *   </Table>
 * );
 * ```
 */
function useTableState<T>({
  data,
  initialRowsPerPage = 10,
  initialPage = 0,
  defaultSortColumn,
  defaultSortDirection = 'asc',
}: UseTableStateProps<T>): UseTableStateReturn<T> {
  const [page, setPage] = useState<number>(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState<number>(initialRowsPerPage);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(
    defaultSortColumn ?? null
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSortDirection
  );

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      let comparison = 0;
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(sortedData.length / rowsPerPage);
  }, [sortedData.length, rowsPerPage]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, page, rowsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Handle rows per page change
  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page
  }, []);

  // Handle sort
  const handleSort = useCallback(
    (column: keyof T) => {
      if (sortColumn === column) {
        // Toggle direction if same column
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        // Set new column with default direction
        setSortColumn(column);
        setSortDirection('asc');
      }
      setPage(0); // Reset to first page
    },
    [sortColumn]
  );

  return {
    page,
    rowsPerPage,
    sortColumn,
    sortDirection,
    paginatedData,
    sortedData,
    totalPages,
    handlePageChange,
    handleRowsPerPageChange,
    handleSort,
  };
}

export default useTableState;

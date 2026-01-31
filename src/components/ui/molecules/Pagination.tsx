import React from 'react';
import { TablePagination } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Props для универсальной пагинации
 */
export interface PaginationProps {
  /** Текущая страница (начиная с 0) */
  page: number;
  /** Общее количество страниц */
  totalPages: number;
  /** Обработчик изменения страницы */
  onPageChange: (page: number) => void;
  /** Количество строк на странице */
  rowsPerPage: number;
  /** Обработчик изменения количества строк на странице */
  onRowsPerPageChange: (rowsPerPage: number) => void;
  /** Опции для выбора количества строк на странице */
  rowsPerPageOptions?: number[];
  /** Общее количество элементов */
  totalCount?: number;
}

/**
 * Универсальная пагинация
 *
 * @example
 * ```tsx
 * <Pagination
 *   page={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={setCurrentPage}
 *   rowsPerPage={pageSize}
 *   onRowsPerPageChange={setPageSize}
 *   rowsPerPageOptions={[10, 25, 50, 100]}
 *   totalCount={totalCount}
 * />
 * ```
 */
const Pagination: React.FC<PaginationProps> = React.memo(({
  page,
  totalPages,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],
  totalCount,
}) => {
  const { t } = useTranslation();

  /**
   * Обработчик изменения страницы
   */
  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    onPageChange(newPage);
  };

  /**
   * Обработчик изменения количества строк на странице
   */
  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    onRowsPerPageChange(newRowsPerPage);
    // При изменении количества строк, возвращаемся на первую страницу
    onPageChange(0);
  };

  // Вычисляем общее количество элементов, если не передано
  const count = totalCount ?? totalPages * rowsPerPage;

  return (
    <TablePagination
      component="div"
      count={count}
      page={page}
      onPageChange={handlePageChange}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={handleRowsPerPageChange}
      rowsPerPageOptions={rowsPerPageOptions}
      labelRowsPerPage={t('pagination.rowsPerPage')}
      labelDisplayedRows={({ from, to, count }) =>
        `${from}–${to} ${t('pagination.of')} ${count !== -1 ? count : `${t('pagination.moreThan')} ${to}`}`
      }
    />
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;

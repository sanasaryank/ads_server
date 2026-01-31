import { useCallback, type ReactNode, Component, type ErrorInfo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Skeleton,
  Box,
  Typography,
} from '@mui/material';
import { logger } from '../../../utils/logger';

/**
 * Error boundary for table cells
 */
class CellErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Cell rendering error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <span>-</span>;
    }
    return this.props.children;
  }
}

/**
 * Определение колонки таблицы
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Column<T extends Record<string, any> = Record<string, any>> {
  /** ID колонки (ключ объекта или строка) */
  id: keyof T | string;
  /** Отображаемое название колонки */
  label: string;
  /** Поддержка сортировки */
  sortable?: boolean;
  /** Кастомная функция рендера ячейки */
  render?: (row: T) => ReactNode;
  /** Ширина колонки */
  width?: string | number;
}

/**
 * Props для универсальной таблицы данных
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataTableProps<T extends Record<string, any> = Record<string, any>> {
  /** Определения колонок */
  columns: Column<T>[];
  /** Данные таблицы */
  data: T[];
  /** Состояние загрузки */
  loading?: boolean;
  /** Сообщение при отсутствии данных */
  emptyMessage?: string;
  /** Обработчик сортировки */
  onSort?: (column: keyof T | string, direction: 'asc' | 'desc') => void;
  /** Текущая колонка сортировки */
  sortColumn?: keyof T | string;
  /** Направление сортировки */
  sortDirection?: 'asc' | 'desc';
  /** Обработчик клика по строке */
  onRowClick?: (row: T) => void;
  /** Ключ для идентификации строки */
  rowKey: keyof T;
}

/**
 * Универсальная таблица данных
 *
 * @example
 * ```tsx
 * const columns: Column<User>[] = [
 *   { id: 'name', label: 'Имя', sortable: true },
 *   { id: 'email', label: 'Email', sortable: true },
 *   {
 *     id: 'status',
 *     label: 'Статус',
 *     render: (user) => <StatusChip status={user.status} />
 *   },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   loading={isLoading}
 *   onSort={handleSort}
 *   sortColumn={sortBy}
 *   sortDirection={sortDirection}
 *   onRowClick={handleRowClick}
 *   rowKey="id"
 * />
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Нет данных для отображения',
  onSort,
  sortColumn,
  sortDirection = 'asc',
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  /**
   * Обработчик клика по заголовку колонки для сортировки
   */
  const handleSort = useCallback(
    (column: keyof T | string) => {
      if (!onSort) return;

      const newDirection =
        sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(column, newDirection);
    },
    [onSort, sortColumn, sortDirection]
  );

  /**
   * Обработчик клика по строке
   */
  const handleRowClick = useCallback(
    (row: T) => {
      if (onRowClick) {
        onRowClick(row);
      }
    },
    [onRowClick]
  );

  /**
   * Рендер скелетона загрузки
   */
  const renderSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          {columns.map((column) => (
            <TableCell key={String(column.id)}>
              <Skeleton variant="text" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );

  /**
   * Рендер пустого состояния
   */
  const renderEmpty = () => (
    <TableRow>
      <TableCell colSpan={columns.length} align="center">
        <Box py={4}>
          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );

  /**
   * Рендер данных таблицы
   */
  const renderData = () =>
    data.map((row) => (
      <TableRow
        key={String(row[rowKey])}
        hover={!!onRowClick}
        onClick={() => handleRowClick(row)}
        sx={{
          cursor: onRowClick ? 'pointer' : 'default',
        }}
      >
        {columns.map((column) => (
          <TableCell
            key={String(column.id)}
            style={{ width: column.width }}
          >
            <CellErrorBoundary>
              {column.render
                ? column.render(row)
                : String(row[column.id as keyof T] ?? '')}
            </CellErrorBoundary>
          </TableCell>
        ))}
      </TableRow>
    ));

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={String(column.id)}
                style={{ width: column.width }}
              >
                {column.sortable && onSort ? (
                  <TableSortLabel
                    active={sortColumn === column.id}
                    direction={
                      sortColumn === column.id ? sortDirection : 'asc'
                    }
                    onClick={() => handleSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? renderSkeleton()
            : data.length === 0
            ? renderEmpty()
            : renderData()}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DataTable;

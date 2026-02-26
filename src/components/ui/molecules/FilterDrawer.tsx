import React, { type ReactNode } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import Button from '../atoms/Button';

/**
 * Props для универсального drawer с фильтрами
 */
export interface FilterDrawerProps {
  /** Состояние открытия drawer */
  open: boolean;
  /** Обработчик закрытия */
  onClose: () => void;
  /** Обработчик применения фильтров */
  onApply: () => void;
  /** Обработчик сброса фильтров */
  onReset: () => void;
  /** Содержимое drawer (фильтры) */
  children: ReactNode;
  /** Заголовок drawer */
  title?: string;
}

/**
 * Универсальный drawer с фильтрами
 *
 * @example
 * ```tsx
 * <FilterDrawer
 *   open={isFilterOpen}
 *   onClose={handleCloseFilter}
 *   onApply={handleApplyFilters}
 *   onReset={handleResetFilters}
 *   title="Фильтры"
 * >
 *   <TextField
 *     name="search"
 *     label="Поиск"
 *     value={filters.search}
 *     onChange={handleFilterChange}
 *   />
 *   <Select
 *     name="status"
 *     label="Статус"
 *     value={filters.status}
 *     onChange={(value) => handleFilterChange('status', value)}
 *     options={statusOptions}
 *   />
 * </FilterDrawer>
 * ```
 */
const FilterDrawer: React.FC<FilterDrawerProps> = React.memo(({
  open,
  onClose,
  onApply,
  onReset,
  children,
  title,
}) => {
  const { t } = useTranslation();

  /**
   * Обработчик применения фильтров
   */
  const handleApply = () => {
    onApply();
    onClose();
  };

  /**
   * Обработчик сброса фильтров
   */
  const handleReset = () => {
    onReset();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <Box
        sx={{
          width: 350,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Заголовок */}
        <Box p={2}>
          <Typography variant="h6">{title || t('common.filters')}</Typography>
        </Box>

        <Divider />

        {/* Содержимое фильтров */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
          }}
        >
          <Stack spacing={2}>
            {children}
          </Stack>
        </Box>

        <Divider />

        {/* Кнопки действий */}
        <Box p={2}>
          <Stack spacing={1}>
            <Button
              onClick={handleApply}
              variant="contained"
              color="primary"
              fullWidth
            >
              {t('filterDrawer.apply')}
            </Button>
            <Button
              onClick={handleReset}
              variant="outlined"
              color="secondary"
              fullWidth
            >
              {t('filterDrawer.reset')}
            </Button>
            <Button
              onClick={onClose}
              variant="text"
              color="secondary"
              fullWidth
            >
              {t('filterDrawer.cancel')}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
});

FilterDrawer.displayName = 'FilterDrawer';

export default FilterDrawer;

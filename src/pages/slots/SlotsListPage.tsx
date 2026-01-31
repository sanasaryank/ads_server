/**
 * Slots List Page
 * Manages advertising slots (ad placement configurations)
 */

import { useCallback, useMemo, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Alert, CircularProgress, Stack } from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon, Edit as EditIcon } from '@mui/icons-material';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { slotsApi } from '../../api/endpoints';
import { useFetch, useFilters, useDrawer, useConfirmDialog, useMultilingualName, useDialogState } from '../../hooks';
import { logger } from '../../utils/logger';
import type { Slot } from '../../types';
import { useSnackbar } from 'notistack';

// Atoms
import Button from '../../components/ui/atoms/Button';
import Select from '../../components/ui/atoms/Select';
import IconButton from '../../components/ui/atoms/IconButton';
import Switch from '../../components/ui/atoms/Switch';

// Molecules
import DataTable, { type Column } from '../../components/ui/molecules/DataTable';
import SearchField from '../../components/ui/molecules/SearchField';
import FilterDrawer from '../../components/ui/molecules/FilterDrawer';
import ConfirmDialog from '../../components/ui/molecules/ConfirmDialog';

// Slot Form Dialog
import { SlotFormDialog } from '../../components/slots/SlotFormDialog';

type SortField = 'id' | 'name';

interface SlotFilters {
  search: string;
  status: 'active' | 'blocked' | 'all';
}

export const SlotsListPage = memo(() => {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  const { enqueueSnackbar } = useSnackbar();
  const confirmDialog = useConfirmDialog();
  const formDialog = useDialogState<string>();
  const [sortColumn, setSortColumn] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filters
  const { filters, updateFilter, resetFilters, applyFilters } = useFilters<SlotFilters>({
    search: '',
    status: 'active',
  });

  // Temporary filters for drawer
  const {
    filters: tempFilters,
    updateFilter: updateTempFilter,
    resetFilters: resetTempFilters,
  } = useFilters<SlotFilters>({
    search: '',
    status: 'active',
  });

  // Filter drawer
  const filterDrawer = useDrawer();

  // Fetch slots
  const { data: slots = [], loading, error, refetch } = useFetch<Slot[]>(
    async () => await slotsApi.list(),
    []
  );

  // Apply filters to slots
  const filteredSlots = useMemo(() => {
    return applyFilters(slots || [], (slot, currentFilters) => {
      // Status filter
      if (currentFilters.status !== 'all') {
        const isBlocked = currentFilters.status === 'blocked';
        if (slot.isBlocked !== isBlocked) return false;
      }

      // Search filter
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        const displayName = getDisplayName(slot.name);
        const matchesId = slot.id.toLowerCase().includes(searchLower);
        const matchesName = displayName.toLowerCase().includes(searchLower);
        if (!matchesId && !matchesName) return false;
      }

      return true;
    });
  }, [slots, applyFilters, filters, getDisplayName]);

  // Sorted slots
  const sortedSlots = useMemo(() => {
    let result = [...filteredSlots];

    result.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      if (sortColumn === 'name') {
        aValue = getDisplayName(a.name);
        bValue = getDisplayName(b.name);
      } else {
        aValue = a[sortColumn];
        bValue = b[sortColumn];
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [filteredSlots, sortColumn, sortDirection, getDisplayName]);

  // Handlers
  const handleSort = useCallback((column: string | SortField, direction: 'asc' | 'desc') => {
    setSortColumn(column as SortField);
    setSortDirection(direction);
  }, []);

  const handleAdd = useCallback(() => {
    formDialog.openDialog();
  }, [formDialog]);

  const handleEdit = useCallback((slot: Slot) => {
    formDialog.openDialog(slot.id);
  }, [formDialog]);

  const handleCloseDialog = useCallback(() => {
    formDialog.closeDialog();
  }, [formDialog]);

  const handleSaveSlot = useCallback(async () => {
    await refetch();
    handleCloseDialog();
  }, [refetch, handleCloseDialog]);

  const handleOpenFilters = useCallback(() => {
    updateTempFilter('search', filters.search);
    updateTempFilter('status', filters.status);
    filterDrawer.open();
  }, [filters, updateTempFilter, filterDrawer]);

  const handleApplyFilters = useCallback(() => {
    updateFilter('search', tempFilters.search);
    updateFilter('status', tempFilters.status);
    filterDrawer.close();
  }, [tempFilters, updateFilter, filterDrawer]);

  const handleResetFilters = useCallback(() => {
    resetTempFilters();
    resetFilters();
    filterDrawer.close();
  }, [resetFilters, resetTempFilters, filterDrawer]);

  const handleBlock = useCallback(
    (slot: Slot) => {
      const action = slot.isBlocked ? 'unblock' : 'block';
      const slotName = getDisplayName(slot.name);
      confirmDialog.open({
        title: t(`slots.confirm.${action}Title`),
        message: t(`slots.confirm.${action}Message`, { name: slotName }),
        confirmText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onConfirm: async () => {
          try {
            await slotsApi.block(slot.id, !slot.isBlocked);
            enqueueSnackbar(
              t(`common.success.${slot.isBlocked ? 'unblocked' : 'blocked'}`),
              { variant: 'success' }
            );
            await refetch();
          } catch (error) {
            logger.error('Failed to block/unblock slot', error as Error, {
              entityType: 'slot',
              slotId: slot.id,
              operation: slot.isBlocked ? 'unblock' : 'block'
            });
            enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
          }
        },
      });
    },
    [t, getDisplayName, confirmDialog, enqueueSnackbar, refetch]
  );

  // Columns
  const columns = useMemo<Column<Slot>[]>(
    () => [
      {
        id: 'id',
        label: t('common.id'),
        sortable: true,
        width: '100px',
        render: (slot) => slot.id,
      },
      {
        id: 'name',
        label: t('dictionaries.name'),
        sortable: true,
        render: (slot) => getDisplayName(slot.name),
      },
      {
        id: 'isBlocked',
        label: t('common.statusLabel'),
        width: '120px',
        render: (slot) => (
          <Switch
            checked={!slot.isBlocked}
            onChange={() => handleBlock(slot)}
          />
        ),
      },
      {
        id: 'actions',
        label: t('common.actions'),
        width: '100px',
        align: 'right',
        render: (slot) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton
              icon={<EditIcon />}
              size="small"
              onClick={() => handleEdit(slot)}
              aria-label={t('common.edit')}
            />
          </Stack>
        ),
      },
    ],
    [t, getDisplayName, handleEdit, handleBlock]
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('menu.slots')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          {t('slots.addNew')}
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <SearchField
            value={filters.search}
            onChange={(value) => updateFilter('search', value)}
            placeholder={t('dictionaries.searchPlaceholder')}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleOpenFilters}
        >
          {t('common.filters')}
        </Button>
      </Box>

      {/* Table */}
      {loading && (!slots || slots.length === 0) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          data={sortedSlots}
          loading={loading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          rowKey="id"
          emptyMessage={t('dictionaries.noEntries')}
        />
      )}

      {/* Filters Drawer */}
      <FilterDrawer
        open={filterDrawer.isOpen}
        onClose={filterDrawer.close}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title={t('common.filters')}
      >
        <Select
          name="status"
          label={t('common.statusLabel')}
          value={tempFilters.status || 'active'}
          onChange={(value) => updateTempFilter('status', value as 'active' | 'blocked' | 'all')}
          options={[
            { value: 'active', label: t('common.active') },
            { value: 'blocked', label: t('common.blocked') },
            { value: 'all', label: t('common.all') },
          ]}
        />
      </FilterDrawer>

      {/* Form Dialog */}
      <ErrorBoundary>
        <SlotFormDialog
          open={formDialog.open}
          slotId={formDialog.data || undefined}
          onClose={handleCloseDialog}
          onSave={handleSaveSlot}
        />
      </ErrorBoundary>

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Box>
  );
});

SlotsListPage.displayName = 'SlotsListPage';

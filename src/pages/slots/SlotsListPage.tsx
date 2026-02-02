/**
 * Slots List Page
 * Manages advertising slots (ad placement configurations)
 */

import { useCallback, useMemo, useState, memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress, Stack, Backdrop } from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon, Edit as EditIcon } from '@mui/icons-material';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { slotsApi } from '../../api/endpoints';
import { useFetch, useFilters, useDrawer, useConfirmDialog, useMultilingualName, useDialogState, useDebounce, useEditWithLoading, useCommonFilters } from '../../hooks';
import { logger } from '../../utils/logger';
import { isApiError } from '../../api/errors';
import type { Slot } from '../../types';
import { useSnackbar } from 'notistack';
import { PageHeader, FiltersContainer, CenteredContainer } from '../../components/ui/styled';

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

type SortField = 'id' | 'name' | 'type';

interface SlotFilters {
  search: string;
  status: 'active' | 'blocked' | 'all';
  type: string; // 'all' or specific SlotType
}

export const SlotsListPage = memo(() => {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  const { enqueueSnackbar } = useSnackbar();

  // Helper to translate slot types
  const getSlotTypeLabel = useCallback((type: string) => {
    const typeKey = type.charAt(0).toLowerCase() + type.slice(1); // MainLarge -> mainLarge
    return t(`slots.types.${typeKey}`);
  }, [t]);
  const confirmDialog = useConfirmDialog();
  const formDialog = useDialogState<{ id?: string; data?: any }>();
  const [sortColumn, setSortColumn] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filters
  const { filters, updateFilter, resetFilters, applyFilters } = useFilters<SlotFilters>({
    search: '',
    status: 'active',
    type: 'all',
  });
  
  // Debounced search to prevent excessive filtering
  const debouncedSearch = useDebounce(filters.search || '', 300);

  // Temporary filters for drawer
  const {
    filters: tempFilters,
    updateFilter: updateTempFilter,
    resetFilters: resetTempFilters,
  } = useFilters<SlotFilters>({
    search: '',
    status: 'active',
    type: 'all',
  });

  // Filter drawer
  const filterDrawer = useDrawer();

  // Fetch slots
  const { data: slots = [], loading, error, refetch } = useFetch<Slot[]>(
    async () => await slotsApi.list(),
    []
  );

  // Show toast on error
  useEffect(() => {
    if (error) {
      if (isApiError(error)) {
        enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
      } else {
        enqueueSnackbar(error.message || t('error.unknown'), { variant: 'error' });
      }
    }
  }, [error, enqueueSnackbar, t]);

  // Common filter functions
  const commonFilters = useCommonFilters({ getDisplayName });

  // Apply filters to slots
  const filteredSlots = useMemo(() => {
    return applyFilters(slots || [], (slot, currentFilters) => {
      const matchesCommon = commonFilters.applyCommonFilters(slot, {
        status: currentFilters.status,
        search: debouncedSearch,
      });
      
      const matchesType = currentFilters.type === 'all' || slot.type === currentFilters.type;
      
      return matchesCommon && matchesType;
    });
  }, [slots, applyFilters, debouncedSearch, commonFilters, filters.type]);

  // Sorted slots
  const sortedSlots = useMemo(() => {
    let result = [...filteredSlots];

    result.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      if (sortColumn === 'name') {
        aValue = getDisplayName(a.name);
        bValue = getDisplayName(b.name);
      } else if (sortColumn === 'type') {
        aValue = a.type;
        bValue = b.type;
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

  const { isLoading: isLoadingEdit, handleEdit } = useEditWithLoading<Slot>({
    entityName: 'slot',
    fetchById: async (id) => {
      const data = await slotsApi.getById(String(id));
      return data as any;
    },
    onSuccess: (data, slot) => {
      formDialog.openDialog({ id: slot.id, data });
    },
    getEntityId: (slot) => slot.id,
  });

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
    updateTempFilter('type', filters.type);
    filterDrawer.open();
  }, [filters, updateTempFilter, filterDrawer]);

  const handleApplyFilters = useCallback(() => {
    updateFilter('search', tempFilters.search);
    updateFilter('status', tempFilters.status);
    updateFilter('type', tempFilters.type);
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
        id: 'type',
        label: t('slots.fields.type'),
        sortable: true,
        width: '150px',
        render: (slot) => getSlotTypeLabel(slot.type),
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

  return (
    <Box>
      <Backdrop
        open={isLoadingEdit}
        sx={{ zIndex: (theme) => theme.zIndex.modal - 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {/* Header */}
      <PageHeader>
        <Typography variant="h4" component="h1">
          {t('menu.slots')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          {t('slots.addNew')}
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <FiltersContainer>
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
      </FiltersContainer>

      {/* Table */}
      {loading && (!slots || slots.length === 0) ? (
        <CenteredContainer>
          <CircularProgress />
        </CenteredContainer>
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
        <Select
          name="type"
          label={t('slots.fields.type')}
          value={tempFilters.type || 'all'}
          onChange={(value) => updateTempFilter('type', value as string)}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'MainLarge', label: t('slots.types.mainLarge') },
            { value: 'MainSmall', label: t('slots.types.mainSmall') },
            { value: 'Selection', label: t('slots.types.selection') },
            { value: 'Group', label: t('slots.types.group') },
          ]}
        />
      </FilterDrawer>

      {/* Form Dialog */}
      <ErrorBoundary>
        <SlotFormDialog
          open={formDialog.open}
          slotId={formDialog.data?.id}
          slotData={formDialog.data?.data}
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

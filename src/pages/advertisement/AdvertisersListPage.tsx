import { useMemo, useCallback, memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, Backdrop, CircularProgress } from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon, Edit as EditIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { DataTable, SearchField, Pagination, ConfirmDialog, FilterDrawer, GenericFormDialog, MultilingualNameField } from '../../components/ui/molecules';
import type { Column } from '../../components/ui/molecules/DataTable';
import { Button, IconButton, Switch, Select } from '../../components/ui/atoms';
import { useTableState, useConfirmDialog, useDrawer, useDialogState, useEditWithLoading, useEntityList, useMultilingualName, useDebounce, useCommonFilters } from '../../hooks';
import { advertisersApi } from '../../api';
import { isApiError } from '../../api/errors';
import { logger } from '../../utils/logger';
import type { Advertiser, AdvertiserFormData } from '../../types';
import { z } from 'zod';
import { PageHeader, FiltersContainer } from '../../components/ui/styled';

const createAdvertiserSchema = (t: (key: string) => string) =>
  z.object({
    name: z.object({
      ARM: z.string().min(1, t('advertisers.validation.nameRequired')),
      RUS: z.string().min(1, t('advertisers.validation.nameRequired')),
      ENG: z.string().min(1, t('advertisers.validation.nameRequired')),
    }),
    tin: z.string().min(1, t('advertisers.validation.tinRequired')),
    description: z.string().optional(),
    blocked: z.boolean(),
  });

type AdvertiserFormValues = z.infer<ReturnType<typeof createAdvertiserSchema>>;

interface AdvertiserFilters {
  status: 'all' | 'active' | 'blocked';
}

/**
 * Advertisers List Page Component
 * Manages advertisers with CRUD operations, filtering, and pagination
 * Optimized with custom hooks and memoization
 */
const AdvertisersListPage = memo(() => {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  const { enqueueSnackbar } = useSnackbar();
  const confirmDialog = useConfirmDialog();
  const filterDrawer = useDrawer();

  // Common filter functions
  const commonFilters = useCommonFilters({ getDisplayName });

  // Entity list management with custom hooks
  const entityList = useEntityList<Advertiser, AdvertiserFilters>({
    fetchList: advertisersApi.list,
    toggleBlock: (id, blocked) => advertisersApi.block(String(id), blocked),
    filterFn: useCallback((entities: Advertiser[], filters: AdvertiserFilters, searchTerm: string) => {
      return entities.filter((advertiser: Advertiser) => {
        // Status filter
        if (!commonFilters.filterByStatus(advertiser, filters.status)) return false;
        
        // Search filter (already debounced by debouncedSearchTerm below)
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          const displayName = getDisplayName(advertiser.name);
          const matchesSearch = displayName.toLowerCase().includes(search) ||
            advertiser.tin.toLowerCase().includes(search);
          if (!matchesSearch) return false;
        }
        
        return true;
      });
    }, [getDisplayName, commonFilters]),
    entityName: 'advertiser',
    initialFilters: { status: 'active' },
  });
  
  // Debounced search term to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(entityList.searchTerm, 300);
  
  // Use debounced search for filtering
  const filteredEntitiesDebounced = useMemo(() => {
    return entityList.filteredEntities.filter((advertiser: Advertiser) => {
      if (!debouncedSearchTerm) return true;
      const search = debouncedSearchTerm.toLowerCase();
      const displayName = getDisplayName(advertiser.name);
      return displayName.toLowerCase().includes(search) ||
        advertiser.tin.toLowerCase().includes(search);
    });
  }, [entityList.filteredEntities, debouncedSearchTerm, getDisplayName]);

  // Form management
  const schema = useMemo(() => createAdvertiserSchema(t), [t]);
  
  const defaultFormValues: AdvertiserFormValues = useMemo(() => ({
    name: { ARM: '', RUS: '', ENG: '' },
    tin: '',
    description: '',
    blocked: false,
  }), []);

  const [formData, setFormData] = useState<AdvertiserFormValues>(defaultFormValues);

  // Dialog state management
  const formDialog = useDialogState<{ id?: string; data?: AdvertiserFormData | null }>();
  
  // Edit with loading hook
  const { isLoading: isLoadingEdit, handleEdit } = useEditWithLoading<Advertiser>({
    entityName: 'advertiser',
    fetchById: async (id) => {
      const data = await advertisersApi.getById(String(id));
      return data as any;
    },
    onSuccess: (data, advertiser) => {
      setFormData({
        name: data.name,
        tin: data.tin,
        description: data.description || '',
        blocked: data.blocked,
      });
      formDialog.openDialog({ id: advertiser.id, data });
    },
    getEntityId: (advertiser) => advertiser.id,
  });

  // Table state with pagination and sorting
  const tableState = useTableState<Advertiser>({
    data: filteredEntitiesDebounced,
    initialRowsPerPage: 10,
    defaultSortColumn: 'name' as keyof Advertiser,
    defaultSortDirection: 'asc',
  });

  const handleOpenDialog = useCallback((advertiser?: Advertiser) => {
    if (advertiser) {
      handleEdit(advertiser);
    } else {
      setFormData(defaultFormValues);
      formDialog.openDialog();
    }
  }, [handleEdit, formDialog, defaultFormValues]);

  const handleCloseDialog = useCallback(() => {
    formDialog.closeDialog();
  }, [formDialog]);

  // Block/unblock handler with confirmation
  const handleBlock = useCallback(
    (advertiser: Advertiser) => {
      const action = advertiser.blocked ? 'unblock' : 'block';
      const advertiserName = getDisplayName(advertiser.name);
      confirmDialog.open({
        title: t(`advertisers.confirm.${action}Title`),
        message: t(`advertisers.confirm.${action}Message`, { name: advertiserName }),
        confirmText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onConfirm: async () => {
          try {
            await advertisersApi.block(String(advertiser.id), !advertiser.blocked);
            enqueueSnackbar(
              t(`common.success.${advertiser.blocked ? 'unblocked' : 'blocked'}`),
              { variant: 'success' }
            );
            await entityList.refetch();
          } catch (error) {
            logger.error('Failed to toggle advertiser block status', error as Error, {
              entityType: 'advertiser',
              advertiserId: advertiser.id,
              operation: advertiser.blocked ? 'unblock' : 'block'
            });
            enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
          }
        },
      });
    },
    [t, getDisplayName, confirmDialog, enqueueSnackbar, entityList]
  );

  // Form submission handler
  const onSubmit = useCallback(
    async (values: AdvertiserFormValues) => {
      try {
        const isEditMode = !!formDialog.data?.id;
        
        if (isEditMode && formDialog.data) {
          const advertiser = formDialog.data.data;
          const updateData: AdvertiserFormData = {
            ...values,
            ...((advertiser as any)?.hash && { hash: (advertiser as any).hash }),
          };
          await advertisersApi.update(formDialog.data.id!, updateData as any);
          enqueueSnackbar(t('common.success.updated'), { variant: 'success' });
        } else {
          await advertisersApi.create(values);
          enqueueSnackbar(t('common.success.created'), { variant: 'success' });
        }
        
        await entityList.refetch();
        handleCloseDialog();
      } catch (error) {
        logger.error('Failed to submit advertiser form', error as Error);
        
        if (isApiError(error)) {
          enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
        } else {
          enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
        }
      }
    },
    [formDialog, handleCloseDialog, entityList, enqueueSnackbar, t]
  );

  // Table columns configuration with memoization
  const columns = useMemo<Column<Advertiser>[]>(
    () => [
      {
        id: 'name',
        label: t('advertisers.fields.name'),
        sortable: true,
        render: (advertiser) => getDisplayName(advertiser.name),
      },
      {
        id: 'tin',
        label: t('advertisers.fields.tin'),
        sortable: false,
        render: (advertiser) => advertiser.tin,
      },
      {
        id: 'actions',
        label: t('common.actions'),
        sortable: false,
        align: 'right',
        render: (advertiser) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton
              icon={<EditIcon />}
              size="small"
              onClick={() => handleOpenDialog(advertiser)}
              aria-label={t('common.edit')}
            />
            <Switch
              checked={!advertiser.blocked}
              onChange={() => handleBlock(advertiser)}
            />
          </Stack>
        ),
      },
    ],
    [t, getDisplayName, handleBlock, handleOpenDialog]
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
        <Typography variant="h4">{t('advertisers.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('advertisers.addNew')}
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <FiltersContainer>
        <Box sx={{ flex: 1 }}>
          <SearchField
            value={entityList.searchTerm}
            onChange={entityList.setSearchTerm}
            placeholder={t('advertisers.search')}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={filterDrawer.open}
        >
          {t('common.filters')}
        </Button>
      </FiltersContainer>

      {/* Data Table */}
      <DataTable<Advertiser>
        columns={columns}
        data={tableState.paginatedData}
        loading={entityList.loading}
        sortColumn={tableState.sortColumn ?? undefined}
        sortDirection={tableState.sortDirection}
        onSort={(column) => tableState.handleSort(column as keyof Advertiser)}
        rowKey="id"
      />

      {/* Pagination */}
      <Pagination
        page={tableState.page}
        totalPages={tableState.totalPages}
        onPageChange={tableState.handlePageChange}
        rowsPerPage={tableState.rowsPerPage}
        onRowsPerPageChange={tableState.handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25]}
        totalCount={entityList.filteredEntities.length}
      />

      {/* Form Dialog */}
      <GenericFormDialog
        open={formDialog.open}
        title={formDialog.data?.id ? t('advertisers.editTitle') : t('advertisers.addTitle')}
        schema={schema}
        defaultValues={formData}
        onSubmit={onSubmit}
        onClose={handleCloseDialog}
        maxWidth="sm"
        submitText={t('common.save')}
        cancelText={t('common.cancel')}
        fields={[
          {
            name: 'name',
            label: t('advertisers.fields.name'),
            type: 'text',
            required: true,
            render: (control) => (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t('advertisers.fields.name')}
                </Typography>
                <MultilingualNameField
                  control={control}
                  name="name"
                  required
                />
              </Box>
            ),
          },
          {
            name: 'tin',
            label: t('advertisers.fields.tin'),
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            label: t('advertisers.fields.description'),
            type: 'text',
            multiline: true,
            rows: 3,
          },
          {
            name: 'blocked',
            label: t('advertisers.fields.blocked'),
            type: 'checkbox',
          },
        ]}
      />

      {/* Filter Drawer */}
      <FilterDrawer
        open={filterDrawer.isOpen}
        onClose={filterDrawer.close}
        onApply={() => filterDrawer.close()}
        onReset={entityList.resetFilters}
        title={t('common.filters')}
      >
        <Select
          name="status"
          label={t('common.statusLabel')}
          value={entityList.filters.status}
          onChange={(value) => entityList.updateFilter('status', value as 'active' | 'blocked' | 'all')}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'active', label: t('common.active') },
            { value: 'blocked', label: t('common.blocked') },
          ]}
        />
      </FilterDrawer>

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Box>
  );
});

AdvertisersListPage.displayName = 'AdvertisersListPage';

export default AdvertisersListPage;

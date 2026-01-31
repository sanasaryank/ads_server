import { useMemo, useCallback, memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, Dialog, DialogTitle, DialogContent, IconButton as MuiIconButton } from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { DataTable, SearchField, Pagination, ConfirmDialog, FilterDrawer, FormField, MultilingualNameField } from '../../components/ui/molecules';
import type { Column } from '../../components/ui/molecules/DataTable';
import { Button, IconButton, Switch, Select } from '../../components/ui/atoms';
import { useTableState, useConfirmDialog, useDrawer, useFormDialog, useEntityList, useMultilingualName } from '../../hooks';
import { advertisersApi } from '../../api';
import type { Advertiser, AdvertiserFormData } from '../../types';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
  const confirmDialog = useConfirmDialog();
  const filterDrawer = useDrawer();

  // Entity list management with custom hooks
  const entityList = useEntityList<Advertiser, AdvertiserFilters>({
    fetchList: advertisersApi.list,
    toggleBlock: (id, blocked) => advertisersApi.block(String(id), blocked),
    filterFn: useCallback((entities: Advertiser[], filters: AdvertiserFilters, searchTerm: string) => {
      return entities.filter((advertiser: Advertiser) => {
        // Search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          const displayName = getDisplayName(advertiser.name);
          const matchesSearch = displayName.toLowerCase().includes(search) ||
            advertiser.tin.toLowerCase().includes(search);
          if (!matchesSearch) return false;
        }
        
        // Status filter
        if (filters.status === 'active' && advertiser.blocked) return false;
        if (filters.status === 'blocked' && !advertiser.blocked) return false;
        
        return true;
      });
    }, [getDisplayName]),
    entityName: 'advertiser',
    initialFilters: { status: 'active' },
  });

  // Form management
  const schema = useMemo(() => createAdvertiserSchema(t), [t]);
  
  const form = useForm<AdvertiserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: { ARM: '', RUS: '', ENG: '' },
      tin: '',
      description: '',
      blocked: false,
    },
  });

  // Form dialog management with custom hook
  const formDialog = useFormDialog<Advertiser, AdvertiserFormData>({
    getById: (id) => advertisersApi.getById(String(id)),
    create: advertisersApi.create,
    update: (id, data) => advertisersApi.update(String(id), data as any),
    transformToForm: useCallback((entity) => ({
      name: entity.name,
      tin: entity.tin,
      description: entity.description || '',
      blocked: entity.blocked,
    }), []),
    transformToApi: useCallback((values, entity) => ({
      ...values,
      ...(entity?.hash && { hash: entity.hash }),
    }), []),
    onSuccess: entityList.refetch,
    entityName: 'advertiser',
  });

  // Update form when editing entity changes
  useEffect(() => {
    if (formDialog.editingEntity) {
      const formData = {
        name: formDialog.editingEntity.name,
        tin: formDialog.editingEntity.tin,
        description: formDialog.editingEntity.description || '',
        blocked: formDialog.editingEntity.blocked,
      };
      form.reset(formData);
    }
  }, [formDialog.editingEntity, form]);

  const handleOpenDialog = useCallback(async (advertiser?: Advertiser) => {
    if (advertiser) {
      await formDialog.openEdit(advertiser);
    } else {
      formDialog.openCreate();
      form.reset({
        name: { ARM: '', RUS: '', ENG: '' },
        tin: '',
        description: '',
        blocked: false,
      });
    }
  }, [formDialog, form]);

  const handleCloseDialog = useCallback(() => {
    formDialog.close();
    form.reset();
  }, [formDialog, form]);

  // Table state management
  const tableState = useTableState<Advertiser>({
    data: entityList.filteredEntities,
    initialRowsPerPage: 10,
    defaultSortColumn: 'name' as keyof Advertiser,
    defaultSortDirection: 'asc',
  });

  // Block/unblock handler with confirmation
  const handleBlock = useCallback(
    (advertiser: Advertiser) => {
      const action = advertiser.blocked ? 'unblock' : 'block';
      const displayName = getDisplayName(advertiser.name);
      confirmDialog.open({
        title: t(`advertisers.confirm.${action}Title`),
        message: t(`advertisers.confirm.${action}Message`, { name: displayName }),
        confirmText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onConfirm: async () => {
          try {
            const blockFn = advertisersApi.block;
            await blockFn(String(advertiser.id), !advertiser.blocked);
            await entityList.refetch();
          } catch (error) {
            console.error('Error toggling block status:', error);
          }
        },
      });
    },
    [t, getDisplayName, confirmDialog, entityList]
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('advertisers.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('advertisers.addNew')}
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
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
      </Box>

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
      <Dialog 
        open={formDialog.isOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box component="span" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            {formDialog.isEditMode ? t('advertisers.editTitle') : t('advertisers.addTitle')}
          </Box>
          <MuiIconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <CloseIcon />
          </MuiIconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 3,
            pb: 0,
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box 
            component="form" 
            onSubmit={form.handleSubmit((values) => formDialog.handleSubmit(values, form))} 
            sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 2 }}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t('advertisers.fields.name')}
                </Typography>
                
                <MultilingualNameField
                  control={form.control}
                  name="name"
                  required
                />

                <FormField
                  name="tin"
                  control={form.control}
                  type="text"
                  label={t('advertisers.fields.tin')}
                  required
                />
                <FormField
                  name="description"
                  control={form.control}
                  type="text"
                  label={t('advertisers.fields.description')}
                  multiline
                  rows={3}
                />
                <FormField
                  name="blocked"
                  control={form.control}
                  type="checkbox"
                  label={t('advertisers.fields.blocked')}
                />
              </Stack>
            </Box>
            
            {/* Form Actions */}
            <Box
              sx={{
                flexShrink: 0,
                px: 3,
                py: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                position: 'sticky',
                bottom: 0,
              }}
            >
              <Button onClick={handleCloseDialog} variant="outlined" disabled={form.formState.isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="contained" disabled={form.formState.isSubmitting}>
                {t('common.save')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

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

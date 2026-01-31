import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, Tabs, Tab, Dialog, DialogTitle, DialogContent, IconButton as MuiIconButton } from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { DataTable, SearchField, Pagination, ConfirmDialog, FilterDrawer, MultilingualNameField } from '../../components/ui/molecules';
import type { Column } from '../../components/ui/molecules/DataTable';
import { Button, IconButton, Switch, Select } from '../../components/ui/atoms';
import { useTableState, useDebounce, useConfirmDialog, useDrawer, useFilters, useMultilingualName, useDialogState } from '../../hooks';
import { useSnackbar } from 'notistack';
import { campaignsApi, advertisersApi, dictionariesApi, restaurantsApi, schedulesApi } from '../../api';
import { logger } from '../../utils/logger';
import type { Campaign, CampaignFormData, Advertiser, DictionaryItem, RestaurantListItem, Schedule, CampaignTarget, Slot, District, City } from '../../types';
import { TargetingTab } from '../../components/campaigns/TargetingTab';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '../../components/ui/molecules';
import { formatDate } from '../../utils/dateUtils';

const createCampaignSchema = (t: (key: string) => string) =>
  z.object({
    advertiserId: z.string().min(1, t('campaigns.validation.advertiserRequired')),
    name: z.object({
      ARM: z.string().min(1, t('campaigns.validation.nameRequired')),
      ENG: z.string().min(1, t('campaigns.validation.nameRequired')),
      RUS: z.string().min(1, t('campaigns.validation.nameRequired')),
    }),
    description: z.string().optional(),
    startDate: z.number().min(1, t('campaigns.validation.startDateRequired')),
    endDate: z.number().min(1, t('campaigns.validation.endDateRequired')),
    budget: z.number().min(0, t('campaigns.validation.budgetRequired')),
    budgetDaily: z.number().min(0, t('campaigns.validation.budgetDailyRequired')),
    price: z.number().min(0, t('campaigns.validation.priceRequired')),
    pricingModel: z.enum(['CPM', 'CPC', 'CPV', 'CPA']),
    spendStrategy: z.enum(['even', 'asap', 'frontload']),
    frequencyCapStrategy: z.enum(['soft', 'strict']),
    frequencyCap: z.object({
      per_user: z.object({
        impressions: z.object({
          count: z.number().min(0),
          window_sec: z.number().min(0),
        }),
        clicks: z.object({
          count: z.number().min(0),
          window_sec: z.number().min(0),
        }),
      }),
      per_session: z.object({
        impressions: z.object({
          count: z.number().min(0),
          window_sec: z.number().min(0),
        }),
        clicks: z.object({
          count: z.number().min(0),
          window_sec: z.number().min(0),
        }),
      }),
    }),
    priority: z.number().min(0),
    weight: z.number().min(0),
    overdeliveryRatio: z.number().min(0).max(100),
    locationsMode: z.enum(['allowed', 'denied']),
    locations: z.array(z.string()),
    restaurantTypesMode: z.enum(['allowed', 'denied']),
    restaurantTypes: z.array(z.string()),
    menuTypesMode: z.enum(['allowed', 'denied']),
    menuTypes: z.array(z.string()),
    placements: z.array(z.string()),
    targets: z.array(z.object({
      id: z.string(),
      slots: z.array(z.object({
        id: z.string(),
        schedules: z.array(z.string()),
        placements: z.array(z.string()),
      })),
    })),
    blocked: z.boolean(),
  });

type CampaignFormValues = z.infer<ReturnType<typeof createCampaignSchema>>;

export default memo(function CampaignsListPage() {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  const { enqueueSnackbar } = useSnackbar();
  const confirmDialog = useConfirmDialog();
  const filterDrawer = useDrawer();
  const formDialog = useDialogState<Campaign>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [locations, setLocations] = useState<District[]>([]);
  const [restaurantTypes, setRestaurantTypes] = useState<DictionaryItem[]>([]);
  const [menuTypes, setMenuTypes] = useState<DictionaryItem[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantListItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [priceSegments, setPriceSegments] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { filters, updateFilter, resetFilters } = useFilters<{
    status: string;
    advertiserId: number | string;
  }>({
    status: 'active',
    advertiserId: '',
  });

  const [activeTab, setActiveTab] = useState(0);

  const getAdvertiserName = (advertiserId: string) => {
    const advertiser = advertisers.find(a => String(a.id) === advertiserId);
    return advertiser ? advertiser.name : { ARM: '-', ENG: '-', RUS: '-' };
  };

  const filteredCampaigns = useMemo(() => campaigns.filter((campaign) => {
    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      const advertiserName = getDisplayName(getAdvertiserName(campaign.advertiserId)).toLowerCase();
      const campaignName = getDisplayName(campaign.name).toLowerCase();
      const matchesSearch = campaignName.includes(search) || advertiserName.includes(search);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status === 'active' && campaign.blocked) return false;
    if (filters.status === 'blocked' && !campaign.blocked) return false;
    
    // Advertiser filter
    if (filters.advertiserId && campaign.advertiserId !== String(filters.advertiserId)) return false;
    
    return true;
  }), [campaigns, debouncedSearch, filters, getDisplayName, getAdvertiserName]);

  const tableState = useTableState<Campaign>({
    data: filteredCampaigns,
    initialRowsPerPage: 10,
    defaultSortColumn: 'name' as keyof Campaign,
    defaultSortDirection: 'asc',
  });

  const schema = createCampaignSchema(t);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      advertiserId: '',
      name: { ARM: '', ENG: '', RUS: '' },
      description: '',
      startDate: Math.floor(Date.now() / 1000),
      endDate: Math.floor(Date.now() / 1000),
      budget: 0,
      budgetDaily: 0,
      price: 0,
      pricingModel: 'CPM',
      spendStrategy: 'even',
      frequencyCapStrategy: 'soft',
      frequencyCap: {
        per_user: {
          impressions: { count: 3, window_sec: 3600 },
          clicks: { count: 1, window_sec: 3600 },
        },
        per_session: {
          impressions: { count: 1, window_sec: 900 },
          clicks: { count: 1, window_sec: 3600 },
        },
      },
      priority: 1,
      weight: 1,
      overdeliveryRatio: 0,
      locationsMode: 'denied',
      locations: [],
      restaurantTypesMode: 'denied',
      restaurantTypes: [],
      menuTypesMode: 'denied',
      menuTypes: [],
      placements: [],
      targets: [],
      blocked: false,
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[CampaignsListPage] Loading data...');
      const [
        campaignsData, 
        advertisersData, 
        locationsResponse, 
        typesData, 
        menuTypesData, 
        slotsData,
        restaurantsData,
        schedulesData,
        priceSegmentsData
      ] = await Promise.all([
        campaignsApi.list(),
        advertisersApi.list(),
        dictionariesApi.getLocations(),
        dictionariesApi.list('restaurant-types'),
        dictionariesApi.list('menu-types'),
        (async () => {
          const { slotsApi } = await import('../../api');
          return await slotsApi.list();
        })(),
        restaurantsApi.list(),
        schedulesApi.list(),
        dictionariesApi.list('price-segments'),
      ]);
      console.log('[CampaignsListPage] Data loaded successfully:', {
        campaigns: campaignsData.length,
        advertisers: advertisersData.length,
        districts: locationsResponse.districts.length,
        types: typesData.length,
        menuTypes: menuTypesData.length,
        slots: slotsData.length,
        restaurants: restaurantsData.length,
        schedules: schedulesData.length,
        priceSegments: priceSegmentsData.length
      });
      setCampaigns(campaignsData);
      setAdvertisers(advertisersData);
      setLocations(locationsResponse.districts);
      setRestaurantTypes(typesData);
      setMenuTypes(menuTypesData);
      setSlots(slotsData);
      setRestaurants(restaurantsData);
      setSchedules(schedulesData);
      setCities(locationsResponse.cities);
      setPriceSegments(priceSegmentsData);
    } catch (error) {
      logger.error('Failed to load campaigns list data', error as Error, {
        entityType: 'campaign',
        operation: 'list'
      });
      enqueueSnackbar(t('common.error.loadFailed'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = useCallback(async (campaign?: Campaign) => {
    if (campaign) {
      try {
        console.log('[CampaignsListPage] Fetching campaign details:', campaign.id);
        const fullCampaign = await campaignsApi.getById(campaign.id);
        console.log('[CampaignsListPage] Campaign details loaded:', fullCampaign);
        formDialog.openDialog(fullCampaign);
        reset({
          advertiserId: fullCampaign.advertiserId,
          name: fullCampaign.name,
          description: fullCampaign.description || '',
          startDate: fullCampaign.startDate,
          endDate: fullCampaign.endDate,
          budget: fullCampaign.budget,
          budgetDaily: fullCampaign.budgetDaily,
          price: fullCampaign.price,
          pricingModel: fullCampaign.pricingModel,
          spendStrategy: fullCampaign.spendStrategy,
          frequencyCapStrategy: fullCampaign.frequencyCapStrategy,
          frequencyCap: fullCampaign.frequencyCap,
          priority: fullCampaign.priority,
          weight: fullCampaign.weight,
          overdeliveryRatio: fullCampaign.overdeliveryRatio,
          locationsMode: fullCampaign.locationsMode,
          locations: fullCampaign.locations,
          restaurantTypesMode: fullCampaign.restaurantTypesMode,
          restaurantTypes: fullCampaign.restaurantTypes,
          menuTypesMode: fullCampaign.menuTypesMode,
          menuTypes: fullCampaign.menuTypes,
          placements: fullCampaign.slots,
          targets: fullCampaign.targets || [],
          blocked: fullCampaign.blocked,
        });
      } catch (error) {
        logger.error('Failed to load campaign', error as Error, {
          entityType: 'campaign',
          campaignId: campaign.id,
          operation: 'getById'
        });
        enqueueSnackbar(t('common.error.loadFailed'), { variant: 'error' });
        return;
      }
    } else {
      formDialog.openDialog(undefined);
      reset({
        advertiserId: '',
        name: { ARM: '', ENG: '', RUS: '' },
        description: '',
        startDate: Math.floor(Date.now() / 1000),
        endDate: Math.floor(Date.now() / 1000),
        budget: 0,
        budgetDaily: 0,
        price: 0,
        pricingModel: 'CPM',
        spendStrategy: 'even',
        frequencyCapStrategy: 'soft',
        frequencyCap: {
          per_user: {
            impressions: { count: 3, window_sec: 3600 },
            clicks: { count: 1, window_sec: 3600 },
          },
          per_session: {
            impressions: { count: 1, window_sec: 900 },
            clicks: { count: 1, window_sec: 3600 },
          },
        },
        priority: 1,
        weight: 1,
        overdeliveryRatio: 0,
        locationsMode: 'denied',
        locations: [],
        restaurantTypesMode: 'denied',
        restaurantTypes: [],
        menuTypesMode: 'denied',
        menuTypes: [],
        placements: [],
        targets: [],
        blocked: false,
      });
    }
    setActiveTab(0);
  }, [formDialog, reset, enqueueSnackbar, t]);

  const handleCloseDialog = useCallback(() => {
    formDialog.closeDialog();
    setActiveTab(0);
    reset();
  }, [formDialog, reset]);

  const handleFormError = (errors: any) => {
    console.error('[CampaignsListPage] Form validation errors:', errors);
  };

  const handleFormSubmit = async (data: CampaignFormValues) => {
    try {
      console.log('[CampaignsListPage] Form submitted:', data);
      
      const formData: CampaignFormData = {
        advertiserId: data.advertiserId,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget,
        budgetDaily: data.budgetDaily,
        price: data.price,
        pricingModel: data.pricingModel,
        spendStrategy: data.spendStrategy,
        frequencyCapStrategy: data.frequencyCapStrategy,
        frequencyCap: data.frequencyCap,
        priority: data.priority,
        weight: data.weight,
        overdeliveryRatio: data.overdeliveryRatio,
        locationsMode: data.locationsMode,
        locations: data.locations,
        restaurantTypesMode: data.restaurantTypesMode,
        restaurantTypes: data.restaurantTypes,
        menuTypesMode: data.menuTypesMode,
        menuTypes: data.menuTypes,
        slots: data.placements,
        targets: data.targets.map(target => ({
          ...target,
          slots: target.slots.map(slot => ({
            id: slot.id,
            schedules: slot.schedules,
            placements: slot.placements || []
          }))
        })),
        blocked: data.blocked,
      };

      console.log('[CampaignsListPage] Prepared form data:', formData);

      if (formDialog.data) {
        console.log('[CampaignsListPage] Updating campaign:', formDialog.data.id);
        // Fetch current campaign to get hash
        const currentCampaign = await campaignsApi.getById(formDialog.data.id);
        await campaignsApi.update(formDialog.data.id, { ...formData, hash: currentCampaign.hash || '' });
        enqueueSnackbar(t('common.success.updated'), { variant: 'success' });
      } else {
        console.log('[CampaignsListPage] Creating new campaign');
        await campaignsApi.create(formData);
        console.log('[CampaignsListPage] Campaign created successfully');
        enqueueSnackbar(t('common.success.created'), { variant: 'success' });
      }

      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error('[CampaignsListPage] Error submitting form:', error);
      enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
    }
  };

  const handleBlock = useCallback((campaign: Campaign) => {
    const action = campaign.blocked ? 'unblock' : 'block';
    const campaignName = getDisplayName(campaign.name);
    confirmDialog.open({
      title: t(`campaigns.confirm.${action}Title`),
      message: t(`campaigns.confirm.${action}Message`, { name: campaignName }),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          await campaignsApi.block(campaign.id, !campaign.blocked);
          enqueueSnackbar(t(`common.success.${action}ed`), { variant: 'success' });
          await loadData();
        } catch (error) {
          enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
        }
      },
    });
  }, [t, getDisplayName, confirmDialog, enqueueSnackbar]);

  const columns = useMemo<Column<Campaign>[]>(() => [
    {
      id: 'advertiser',
      label: t('campaigns.fields.advertiser'),
      sortable: true,
      render: (campaign) => getDisplayName(getAdvertiserName(campaign.advertiserId)),
    },
    {
      id: 'name',
      label: t('campaigns.fields.name'),
      sortable: true,
      render: (campaign) => getDisplayName(campaign.name),
    },
    {
      id: 'startDate',
      label: t('campaigns.fields.startDate'),
      sortable: true,
      render: (campaign) => formatDate(campaign.startDate),
    },
    {
      id: 'endDate',
      label: t('campaigns.fields.endDate'),
      sortable: true,
      render: (campaign) => formatDate(campaign.endDate),
    },
    {
      id: 'budget',
      label: t('campaigns.fields.budget'),
      sortable: true,
      render: (campaign) => `$${campaign.budget.toLocaleString()}`,
    },
    {
      id: 'actions',
      label: t('common.actions'),
      sortable: false,
      align: 'right',
      render: (campaign) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton
            icon={<EditIcon />}
            size="small"
            onClick={() => handleOpenDialog(campaign)}
            aria-label={t('common.edit')}
          />
          <Switch
            checked={!campaign.blocked}
            onChange={() => handleBlock(campaign)}
          />
        </Stack>
      ),
    },
  ], [t, getDisplayName, getAdvertiserName, handleBlock, handleOpenDialog]);

  const advertiserOptions = useMemo(() => advertisers.map(a => ({ value: a.id, label: getDisplayName(a.name) })), [advertisers, getDisplayName]);
  const locationOptions = useMemo(() => locations.map(l => ({ value: l.id, label: l.name })), [locations]);
  const typeOptions = useMemo(() => restaurantTypes.map(t => ({ value: t.id, label: getDisplayName(t.name) })), [restaurantTypes, getDisplayName]);
  const menuTypeOptions = useMemo(() => menuTypes.map(m => ({ value: m.id, label: getDisplayName(m.name) })), [menuTypes, getDisplayName]);
  const slotOptions = useMemo(() => slots.map(s => ({ value: s.id, label: getDisplayName(s.name) })), [slots, getDisplayName]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('campaigns.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('campaigns.addNew')}
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('campaigns.search')}
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

      <DataTable<Campaign>
        columns={columns}
        data={tableState.paginatedData}
        loading={loading}
        sortColumn={tableState.sortColumn ?? undefined}
        sortDirection={tableState.sortDirection}
        onSort={(column) => tableState.handleSort(column as keyof Campaign)}
        rowKey="id"
      />

      <Pagination
        page={tableState.page}
        totalPages={tableState.totalPages}
        onPageChange={tableState.handlePageChange}
        rowsPerPage={tableState.rowsPerPage}
        onRowsPerPageChange={tableState.handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25]}
        totalCount={filteredCampaigns.length}
      />

      <Dialog 
        open={formDialog.open} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
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
            {formDialog.data ? t('campaigns.editTitle') : t('campaigns.addTitle')}
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
        
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 3, flexShrink: 0 }}
        >
          <Tab label={t('campaigns.tabs.general')} />
          <Tab label={t('campaigns.tabs.pricing')} />
          <Tab label={t('campaigns.tabs.frequency')} />
          <Tab label={t('campaigns.tabs.targeting')} />
          <Tab label={t('campaigns.tabs.restaurantTargeting')} />
        </Tabs>
        
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
          <Box component="form" onSubmit={handleSubmit(handleFormSubmit, handleFormError)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 2 }}>
            {activeTab === 0 && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <FormField
                  name="advertiserId"
                  control={control}
                  type="autocomplete"
                  label={t('campaigns.fields.advertiser')}
                  options={advertiserOptions}
                  required
                />
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {t('campaigns.fields.name')} *
                  </Typography>
                  <MultilingualNameField
                    control={control}
                    name="name"
                    required
                  />
                </Box>
                <FormField
                  name="description"
                  control={control}
                  type="text"
                  label={t('campaigns.fields.description')}
                  multiline
                  rows={3}
                />
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="startDate"
                    control={control}
                    type="date"
                    label={t('campaigns.fields.startDate')}
                    required
                  />
                  <FormField
                    name="endDate"
                    control={control}
                    type="date"
                    label={t('campaigns.fields.endDate')}
                    required
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="priority"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.priority')}
                    required
                  />
                  <FormField
                    name="weight"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.weight')}
                    required
                  />
                  <FormField
                    name="overdeliveryRatio"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.overdeliveryRatio')}
                    helperText={t('campaigns.fields.overdeliveryRatioHelper')}
                    required
                  />
                </Stack>
                <FormField
                  name="blocked"
                  control={control}
                  type="checkbox"
                  label={t('campaigns.fields.blocked')}
                />
              </Stack>
            )}
            
            {activeTab === 1 && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="budget"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.budget')}
                    required
                  />
                  <FormField
                    name="budgetDaily"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.budgetDaily')}
                    required
                  />
                </Stack>
                <FormField
                  name="price"
                  control={control}
                  type="number"
                  label={t('campaigns.fields.price')}
                  required
                />
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="pricingModel"
                    control={control}
                    type="select"
                    label={t('campaigns.fields.pricingModel')}
                    options={[
                      { value: 'CPM', label: 'CPM' },
                      { value: 'CPC', label: 'CPC' },
                      { value: 'CPV', label: 'CPV' },
                      { value: 'CPA', label: 'CPA' },
                    ]}
                    required
                  />
                  <FormField
                    name="spendStrategy"
                    control={control}
                    type="select"
                    label={t('campaigns.fields.spendStrategy')}
                    options={[
                      { value: 'even', label: t('campaigns.spendStrategies.even') },
                      { value: 'asap', label: t('campaigns.spendStrategies.asap') },
                      { value: 'frontload', label: t('campaigns.spendStrategies.frontload') },
                    ]}
                    required
                  />
                </Stack>
              </Stack>
            )}
            
            {activeTab === 2 && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <FormField
                  name="frequencyCapStrategy"
                  control={control}
                  type="select"
                  label={t('campaigns.fields.frequencyCapStrategy')}
                  options={[
                    { value: 'soft', label: t('campaigns.frequencyCapStrategies.soft') },
                    { value: 'strict', label: t('campaigns.frequencyCapStrategies.strict') },
                  ]}
                  required
                />
                <Typography variant="body2" sx={{ mt: 2, mb: 1, fontWeight: 500 }}>
                  {t('campaigns.fields.frequencyCapPerUser')}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="frequencyCap.per_user.impressions.count"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.impressionsCount')}
                    required
                  />
                  <FormField
                    name="frequencyCap.per_user.impressions.window_sec"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.windowSec')}
                    helperText={t('campaigns.fields.windowSecHelper')}
                    required
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="frequencyCap.per_user.clicks.count"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.clicksCount')}
                    required
                  />
                  <FormField
                    name="frequencyCap.per_user.clicks.window_sec"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.windowSec')}
                    helperText={t('campaigns.fields.windowSecHelper')}
                    required
                  />
                </Stack>
                <Typography variant="body2" sx={{ mt: 2, mb: 1, fontWeight: 500 }}>
                  {t('campaigns.fields.frequencyCapPerSession')}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="frequencyCap.per_session.impressions.count"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.impressionsCount')}
                    required
                  />
                  <FormField
                    name="frequencyCap.per_session.impressions.window_sec"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.windowSec')}
                    helperText={t('campaigns.fields.windowSecHelper')}
                    required
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="frequencyCap.per_session.clicks.count"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.clicksCount')}
                    required
                  />
                  <FormField
                    name="frequencyCap.per_session.clicks.window_sec"
                    control={control}
                    type="number"
                    label={t('campaigns.fields.windowSec')}
                    helperText={t('campaigns.fields.windowSecHelper')}
                    required
                  />
                </Stack>
              </Stack>
            )}
            
            {activeTab === 3 && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <FormField
                  name="locationsMode"
                  control={control}
                  type="radio"
                  label={t('campaigns.fields.locationsMode')}
                  options={[
                    { value: 'allowed', label: t('campaigns.modes.allowed') },
                    { value: 'denied', label: t('campaigns.modes.denied') },
                  ]}
                />
                <FormField
                  name="locations"
                  control={control}
                  type="multiselect"
                  label={t('campaigns.fields.locations')}
                  options={locationOptions}
                  helperText={t('campaigns.fields.locationsHelper')}
                />
                <FormField
                  name="restaurantTypesMode"
                  control={control}
                  type="radio"
                  label={t('campaigns.fields.restaurantTypesMode')}
                  options={[
                    { value: 'allowed', label: t('campaigns.modes.allowed') },
                    { value: 'denied', label: t('campaigns.modes.denied') },
                  ]}
                />
                <FormField
                  name="restaurantTypes"
                  control={control}
                  type="multiselect"
                  label={t('campaigns.fields.restaurantTypes')}
                  options={typeOptions}
                  helperText={t('campaigns.fields.restaurantTypesHelper')}
                />
                <FormField
                  name="menuTypesMode"
                  control={control}
                  type="radio"
                  label={t('campaigns.fields.menuTypesMode')}
                  options={[
                    { value: 'allowed', label: t('campaigns.modes.allowed') },
                    { value: 'denied', label: t('campaigns.modes.denied') },
                  ]}
                />
                <FormField
                  name="menuTypes"
                  control={control}
                  type="multiselect"
                  label={t('campaigns.fields.menuTypes')}
                  options={menuTypeOptions}
                  helperText={t('campaigns.fields.menuTypesHelper')}
                />
                <FormField
                  name="placements"
                  control={control}
                  type="multiselect"
                  label={t('campaigns.fields.placements')}
                  options={slotOptions}
                  helperText={t('campaigns.fields.placementsHelper')}
                />
              </Stack>
            )}

            {/* Tab 4: Restaurant Targeting */}
            {activeTab === 4 && (
              <TargetingTab
                targets={watch('targets')}
                onChange={(newTargets: CampaignTarget[]) => setValue('targets', newTargets, { shouldDirty: true, shouldTouch: true })}
                restaurants={restaurants as any}
                schedules={schedules}
                slots={slots}
                cities={cities as any}
                districts={locations as any}
                restaurantTypes={restaurantTypes}
                menuTypes={menuTypes}
                priceSegments={priceSegments}
                campaignTargetingRules={{
                  locationsMode: watch('locationsMode'),
                  locations: watch('locations').map((id: string) => Number(id)),
                  restaurantTypesMode: watch('restaurantTypesMode'),
                  restaurantTypes: watch('restaurantTypes').map((id: string) => Number(id)),
                  menuTypesMode: watch('menuTypesMode'),
                  menuTypes: watch('menuTypes').map((id: string) => Number(id)),
                }}
              />
            )}
            </Box>
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
              <Button onClick={handleCloseDialog} variant="outlined" disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {t('common.save')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <FilterDrawer
        open={filterDrawer.isOpen}
        onClose={filterDrawer.close}
        onApply={() => filterDrawer.close()}
        onReset={resetFilters}
        title={t('common.filters')}
      >
        <Select
          name="status"
          label={t('common.statusLabel')}
          value={filters.status}
          onChange={(value) => updateFilter('status', value as 'active' | 'blocked' | 'all')}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'active', label: t('common.active') },
            { value: 'blocked', label: t('common.blocked') },
          ]}
        />

        <Select
          name="advertiserId"
          label={t('campaigns.fields.advertiser')}
          value={filters.advertiserId}
          onChange={(value) => updateFilter('advertiserId', value ? Number(value) : '')}
          options={[
            { value: '', label: t('common.all') },
            ...advertiserOptions,
          ]}
        />
      </FilterDrawer>

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Box>
  );
});

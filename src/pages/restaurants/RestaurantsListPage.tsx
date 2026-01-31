import { useEffect, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Alert } from '@mui/material';
import {
  FilterList as FilterListIcon,
  BarChart as BarChartIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';

// API
import { restaurantsApi, dictionariesApi } from '../../api/endpoints';
import { logger } from '../../utils/logger';

// Atoms
import Button from '../../components/ui/atoms/Button';
import Select from '../../components/ui/atoms/Select';
import Link from '../../components/ui/atoms/Link';
import IconButton from '../../components/ui/atoms/IconButton';
import Switch from '../../components/ui/atoms/Switch';

// Molecules
import DataTable, { type Column } from '../../components/ui/molecules/DataTable';
import Pagination from '../../components/ui/molecules/Pagination';
import SearchField from '../../components/ui/molecules/SearchField';
import FilterDrawer from '../../components/ui/molecules/FilterDrawer';
import ConfirmDialog from '../../components/ui/molecules/ConfirmDialog';

// Common components
import { RestaurantCampaignsModal } from '../../components/restaurants/RestaurantCampaignsModal';

// Hooks
import {
  useTableState,
  useFilters,
  useConfirmDialog,
  useFetch,
  useDrawer,
  useMultilingualName,
  useDialogState,
} from '../../hooks';

// Types
import type {
  RestaurantListItem,
  RestaurantFilters,
  RestaurantType,
  PriceSegment,
  MenuType,
  IntegrationType,
} from '../../types';

type SortField =
  | 'id'
  | 'name'
  | 'cityName'
  | 'districtName';

export const RestaurantsListPage = memo(() => {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  
  // Campaign targeting modal with useDialogState
  const campaignModal = useDialogState<{ restaurantId: string; restaurantName: string }>();

  // Fetch restaurants
  const {
    data: restaurants = [],
    loading: isLoading,
    error: fetchError,
  } = useFetch<RestaurantListItem[]>(
    async () => await restaurantsApi.list(),
    []
  );

  // Fetch advertisers for campaign targeting
  const { data: advertisers = [] } = useFetch(
    async () => {
      const { advertisersApi } = await import('../../api');
      return await advertisersApi.list();
    },
    []
  );

  // Fetch dictionaries immediately
  const { data: dictionaries } = useFetch(
    async () => {
      const [
        locationsData,
        restaurantTypesData,
        priceSegmentsData,
        menuTypesData,
        integrationTypesData,
      ] = await Promise.all([
        dictionariesApi.getLocations(),
        dictionariesApi.list('restaurant-types'),
        dictionariesApi.list('price-segments'),
        dictionariesApi.list('menu-types'),
        dictionariesApi.list('integration-types'),
      ]);

      return {
        countries: locationsData.countries,
        cities: locationsData.cities,
        districts: locationsData.districts,
        restaurantTypes: restaurantTypesData as RestaurantType[],
        priceSegments: priceSegmentsData as PriceSegment[],
        menuTypes: menuTypesData as MenuType[],
        integrationTypes: integrationTypesData as IntegrationType[],
      };
    },
    []
  );

  const {
    countries = [],
    cities = [],
    districts = [],
    restaurantTypes = [],
    priceSegments = [],
    menuTypes = [],
    integrationTypes = [],
  } = dictionaries || {};

  // Filters
  const { filters, updateFilter, resetFilters, applyFilters } = useFilters<RestaurantFilters>({
    search: '',
    status: 'active',
  });

  // Temporary filters for drawer
  const {
    filters: tempFilters,
    updateFilter: updateTempFilter,
    resetFilters: resetTempFilters,
  } = useFilters<RestaurantFilters>({
    search: '',
    status: 'active',
  });

  // Filter drawer
  const filterDrawer = useDrawer();

  // Confirm dialog
  const confirmDialog = useConfirmDialog();

  // Filtered cities based on selected country
  const filteredCities = useMemo(() => {
    if (!tempFilters.countryId) return cities;
    return cities.filter((city) => city.countryId === tempFilters.countryId);
  }, [cities, tempFilters.countryId]);

  // Filtered districts based on selected city
  const filteredDistricts = useMemo(() => {
    if (!tempFilters.cityId) return districts;
    return districts.filter((district) => district.cityId === tempFilters.cityId);
  }, [districts, tempFilters.cityId]);

  // Apply filters to restaurants
  const filteredRestaurants = useMemo(() => {
    return applyFilters(restaurants || [], (restaurant, currentFilters) => {
      // Status filter
      if (currentFilters.status !== 'all') {
        const isBlocked = currentFilters.status === 'blocked';
        if (restaurant.isBlocked !== isBlocked) return false;
      }

      // Search filter
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        const matchesId = restaurant.id.toString().includes(searchLower);
        const nameInCurrentLang = getDisplayName(restaurant.name);
        const matchesName = nameInCurrentLang.toLowerCase().includes(searchLower);
        if (!matchesId && !matchesName) return false;
      }

      // Country filter
      if (currentFilters.countryId && restaurant.countryId !== currentFilters.countryId) {
        return false;
      }

      // City filter
      if (currentFilters.cityId && restaurant.cityId !== currentFilters.cityId) {
        return false;
      }

      // District filter
      if (currentFilters.districtId && restaurant.districtId !== currentFilters.districtId) {
        return false;
      }

      // Type filter (array intersection)
      if (currentFilters.typeId && currentFilters.typeId.length > 0) {
        const hasMatch = currentFilters.typeId.some(id => restaurant.typeId.includes(id));
        if (!hasMatch) return false;
      }

      // Price segment filter (array intersection)
      if (currentFilters.priceSegmentId && currentFilters.priceSegmentId.length > 0) {
        const hasMatch = currentFilters.priceSegmentId.some(id => restaurant.priceSegmentId.includes(id));
        if (!hasMatch) return false;
      }

      // Menu type filter (array intersection)
      if (currentFilters.menuTypeId && currentFilters.menuTypeId.length > 0) {
        const hasMatch = currentFilters.menuTypeId.some(id => restaurant.menuTypeId.includes(id));
        if (!hasMatch) return false;
      }

      // Integration type filter
      if (currentFilters.integrationTypeId && restaurant.integrationTypeId !== currentFilters.integrationTypeId) {
        return false;
      }

      return true;
    });
  }, [restaurants, applyFilters, filters, getDisplayName]);

  // Table state with sorting and pagination
  const tableState = useTableState<RestaurantListItem>({
    data: filteredRestaurants || [],
    initialRowsPerPage: 10,
    defaultSortColumn: 'id' as keyof RestaurantListItem,
    defaultSortDirection: 'asc',
  });

  // Custom sorting that handles city and district names
  const sortedAndPaginatedData = useMemo(() => {
    let sorted = [...filteredRestaurants];

    if (tableState.sortColumn) {
      sorted.sort((a, b) => {
        let compareValue = 0;
        const sortField = tableState.sortColumn as SortField;

        switch (sortField) {
          case 'id':
            compareValue = a.id.localeCompare(b.id);
            break;
          case 'name':
            const nameA = getDisplayName(a.name);
            const nameB = getDisplayName(b.name);
            compareValue = nameA.localeCompare(nameB);
            break;
          case 'cityName':
            compareValue = a.cityName.localeCompare(b.cityName);
            break;
          case 'districtName':
            compareValue = a.districtName.localeCompare(b.districtName);
            break;
          default:
            compareValue = 0;
        }

        return tableState.sortDirection === 'asc' ? compareValue : -compareValue;
      });
    }

    const start = tableState.page * tableState.rowsPerPage;
    return sorted.slice(start, start + tableState.rowsPerPage);
  }, [
    filteredRestaurants,
    tableState.sortColumn,
    tableState.sortDirection,
    tableState.page,
    tableState.rowsPerPage,
    getDisplayName,
  ]);

  // Handlers
  const handleApplyFilters = useCallback(() => {
    Object.keys(tempFilters).forEach((key) => {
      updateFilter(key as keyof RestaurantFilters, tempFilters[key as keyof RestaurantFilters]);
    });
    tableState.handlePageChange(0);
    filterDrawer.close();
  }, [tempFilters, updateFilter, tableState, filterDrawer]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    resetTempFilters();
    tableState.handlePageChange(0);
    filterDrawer.close();
  }, [resetFilters, resetTempFilters, tableState, filterDrawer]);

  const handleCampaignTargeting = useCallback((restaurant: RestaurantListItem) => {
    const nameInCurrentLang = getDisplayName(restaurant.name);
    campaignModal.openDialog({
      restaurantId: restaurant.id,
      restaurantName: nameInCurrentLang,
    });
  }, [getDisplayName, campaignModal]);

  const handleCloseCampaignTargeting = useCallback(() => {
    campaignModal.closeDialog();
  }, [campaignModal]);

  const handleSaveCampaignTargeting = useCallback(
    async (campaigns: { id: string; slots: { id: string; schedules: string[]; placements: string[] }[] }[]) => {
      try {
        if (!campaignModal.data?.restaurantId) return;
        
        // Use the new API to update restaurant campaigns
        await restaurantsApi.updateRestaurantCampaigns(
          campaignModal.data.restaurantId,
          campaigns
        );

        handleCloseCampaignTargeting();
        // Optionally show success message
      } catch (error) {
        logger.error('Failed to save restaurant campaign targeting', error as Error, {
          entityType: 'restaurant',
          restaurantId: campaignModal.data?.restaurantId,
          operation: 'updateCampaigns'
        });
        console.error('Failed to save campaign targeting:', error);
        // Optionally show error message
      }
    },
    [campaignModal.data, handleCloseCampaignTargeting]
  );

  const handleStatistics = useCallback(() => {
    alert('Not implemented');
  }, []);

  const handleOpenFilterDrawer = useCallback(() => {
    filterDrawer.open();
  }, [filterDrawer]);

  const handleCountryChange = useCallback(
    (value: string | number | number[]) => {
      const countryId = value && !Array.isArray(value) ? String(value) : undefined;
      updateTempFilter('countryId', countryId);
      updateTempFilter('cityId', undefined);
      updateTempFilter('districtId', undefined);
    },
    [updateTempFilter]
  );

  const handleCityChange = useCallback(
    (value: string | number | number[]) => {
      const cityId = value && !Array.isArray(value) ? String(value) : undefined;
      updateTempFilter('cityId', cityId);
      updateTempFilter('districtId', undefined);
    },
    [updateTempFilter]
  );

  // Sync temp filters when drawer opens
  useEffect(() => {
    if (filterDrawer.isOpen) {
      Object.keys(filters).forEach((key) => {
        updateTempFilter(key as keyof RestaurantFilters, filters[key as keyof RestaurantFilters]);
      });
    }
  }, [filterDrawer.isOpen]);

  // Table columns
  const columns = useMemo<Column<RestaurantListItem>[]>(
    () => [
      {
        id: 'id',
        label: 'ID',
        sortable: true,
        width: 80,
      },
      {
        id: 'name',
        label: t('restaurants.name'),
        sortable: true,
        render: (restaurant) => {
          const nameInCurrentLang = getDisplayName(restaurant.name);
          return (
            <Link href={restaurant.crmUrl} external>
              {nameInCurrentLang}
            </Link>
          );
        },
      },
      {
        id: 'cityName',
        label: t('restaurants.city'),
        sortable: true,
        render: (restaurant) => restaurant.cityName,
      },
      {
        id: 'districtName',
        label: t('restaurants.district'),
        sortable: true,
        render: (restaurant) => restaurant.districtName,
      },
      {
        id: 'actions',
        label: t('common.actions'),
        sortable: false,
        render: (restaurant) => (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Switch
              checked={!restaurant.isBlocked}
              disabled={true}
              onChange={() => {}}
            />
            <IconButton
              onClick={handleStatistics}
              tooltip={t('restaurants.statistics')}
              size="small"
              icon={<BarChartIcon />}
            />
            <IconButton
              onClick={() => handleCampaignTargeting(restaurant)}
              tooltip={t('restaurants.campaignTargeting')}
              size="small"
              icon={<CampaignIcon />}
            />
          </Box>
        ),
      },
    ],
    [
      handleCampaignTargeting,
      handleStatistics,
      t,
      getDisplayName,
    ]
  );

  const error = fetchError?.message || null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('restaurants.title')}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <SearchField
            value={filters.search || ''}
            onChange={(value) => updateFilter('search', value)}
            placeholder={t('restaurants.searchPlaceholder')}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleOpenFilterDrawer}
        >
          {t('common.filters')}
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={sortedAndPaginatedData}
        loading={isLoading}
        onSort={(column) => tableState.handleSort(column as keyof RestaurantListItem)}
        sortColumn={tableState.sortColumn ?? undefined}
        sortDirection={tableState.sortDirection}
        rowKey="id"
        emptyMessage={t('common.noData')}
      />

      <Pagination
        page={tableState.page}
        totalPages={tableState.totalPages}
        onPageChange={tableState.handlePageChange}
        rowsPerPage={tableState.rowsPerPage}
        onRowsPerPageChange={tableState.handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
        totalCount={filteredRestaurants.length}
      />

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
          name="country"
          label={t('restaurants.country')}
          value={tempFilters.countryId || ''}
          onChange={handleCountryChange}
          options={[
            { value: '', label: t('common.all') },
            ...countries.map((country) => ({
              value: country.id,
              label: country.name,
            })),
          ]}
        />

        <Select
          name="city"
          label={t('restaurants.city')}
          value={tempFilters.cityId || ''}
          onChange={handleCityChange}
          options={[
            { value: '', label: t('common.all') },
            ...filteredCities.map((city) => ({
              value: city.id,
              label: city.name,
            })),
          ]}
          disabled={!tempFilters.countryId}
        />

        <Select
          name="district"
          label={t('restaurants.district')}
          value={tempFilters.districtId || ''}
          onChange={(value) =>
            updateTempFilter('districtId', value ? String(value) : undefined)
          }
          options={[
            { value: '', label: t('common.all') },
            ...filteredDistricts.map((district) => ({
              value: district.id,
              label: district.name,
            })),
          ]}
          disabled={!tempFilters.cityId}
        />

        <Select
          name="restaurantType"
          label={t('restaurants.type')}
          value={(tempFilters.typeId || []) as any}
          onChange={(value) => updateTempFilter('typeId', Array.isArray(value) && value.length > 0 ? value.map(String) : undefined)}
          options={[
            ...restaurantTypes.map((type) => ({
              value: type.id,
              label: getDisplayName(type.name),
            })),
          ]}
          multiple={true}
        />

        <Select
          name="priceSegment"
          label={t('restaurants.priceSegment')}
          value={(tempFilters.priceSegmentId || []) as any}
          onChange={(value) =>
            updateTempFilter('priceSegmentId', Array.isArray(value) && value.length > 0 ? value.map(String) : undefined)
          }
          options={[
            ...priceSegments.map((segment) => ({
              value: segment.id,
              label: getDisplayName(segment.name),
            })),
          ]}
          multiple={true}
        />

        <Select
          name="menuType"
          label={t('restaurants.menuType')}
          value={(tempFilters.menuTypeId || []) as any}
          onChange={(value) => updateTempFilter('menuTypeId', Array.isArray(value) && value.length > 0 ? value.map(String) : undefined)}
          options={[
            ...menuTypes.map((type) => ({
              value: type.id,
              label: getDisplayName(type.name),
            })),
          ]}
          multiple={true}
        />

        <Select
          name="integrationType"
          label={t('restaurants.integrationType')}
          value={tempFilters.integrationTypeId || ''}
          onChange={(value) =>
            updateTempFilter('integrationTypeId', value ? value as string : undefined)
          }
          options={[
            { value: '', label: t('common.all') },
            ...integrationTypes.map((type) => ({
              value: type.id,
              label: getDisplayName(type.name),
            })),
          ]}
        />
      </FilterDrawer>

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog.dialogProps} />

      {/* Campaign Targeting Modal */}
      <RestaurantCampaignsModal
        open={campaignModal.open}
        onClose={handleCloseCampaignTargeting}
        onSave={handleSaveCampaignTargeting}
        restaurantId={campaignModal.data?.restaurantId || null}
        restaurantName={campaignModal.data?.restaurantName || ''}
        advertisers={advertisers || []}
      />
    </Box>
  );
});

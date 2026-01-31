import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { campaignsApi, advertisersApi, dictionariesApi, restaurantsApi, schedulesApi } from '../api';
import { logger } from '../utils/logger';
import { useDictionariesStore } from '../store/dictionariesStore';
import { useRestaurantsStore } from '../store/restaurantsStore';
import { useAdvertisersStore } from '../store/advertisersStore';
import type { Campaign, Advertiser, DictionaryItem, RestaurantListItem, Schedule, Slot, District, City } from '../types';

export interface CampaignsData {
  campaigns: Campaign[];
  advertisers: Advertiser[];
  locations: District[];
  restaurantTypes: DictionaryItem[];
  menuTypes: DictionaryItem[];
  slots: Slot[];
  restaurants: RestaurantListItem[];
  schedules: Schedule[];
  cities: City[];
  priceSegments: DictionaryItem[];
}

export const useCampaignsData = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const isMountedRef = useRef(true);
  
  // Get store actions
  const { setAllDictionaries } = useDictionariesStore();
  const { setRestaurants } = useRestaurantsStore();
  const { setAdvertisers } = useAdvertisersStore();
  
  const [data, setData] = useState<CampaignsData>({
    campaigns: [],
    advertisers: [],
    locations: [],
    restaurantTypes: [],
    menuTypes: [],
    slots: [],
    restaurants: [],
    schedules: [],
    cities: [],
    priceSegments: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [formDataLoaded, setFormDataLoaded] = useState(false);

  // Load only campaigns and advertisers initially (for table and filter)
  const loadInitialData = async () => {
    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);
      
      const [campaignsData, advertisersData] = await Promise.all([
        campaignsApi.list(),
        advertisersApi.list(),
      ]);
      
      if (!isMountedRef.current) return;
      
      setData(prev => ({
        ...prev,
        campaigns: campaignsData,
        advertisers: advertisersData,
      }));
      
      setAdvertisers(advertisersData);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const error = err as Error;
      setError(error);
      logger.error('Failed to load campaigns list data', error, {
        entityType: 'campaign',
        operation: 'list'
      });
      enqueueSnackbar(t('common.error.loadFailed'), { variant: 'error' });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Load form data on-demand
  const loadFormData = async () => {
    if (formDataLoaded) return; // Already loaded
    
    try {
      if (!isMountedRef.current) return;
      
      const [
        locationsResponse, 
        typesData, 
        menuTypesData, 
        slotsData,
        restaurantsData,
        schedulesData,
        priceSegmentsData
      ] = await Promise.all([
        dictionariesApi.getLocations(),
        dictionariesApi.list('restaurant-types'),
        dictionariesApi.list('menu-types'),
        (async () => {
          const { slotsApi } = await import('../api');
          return await slotsApi.list();
        })(),
        restaurantsApi.list(),
        schedulesApi.list(),
        dictionariesApi.list('price-segments'),
      ]);
      
      if (!isMountedRef.current) return;
      
      setData(prev => ({
        ...prev,
        locations: locationsResponse.districts,
        restaurantTypes: typesData,
        menuTypes: menuTypesData,
        slots: slotsData,
        restaurants: restaurantsData,
        schedules: schedulesData,
        cities: locationsResponse.cities,
        priceSegments: priceSegmentsData,
      }));
      
      // Populate Zustand stores
      setRestaurants(restaurantsData as any);
      setAllDictionaries({
        locations: locationsResponse.districts as any,
        restaurantTypes: typesData,
        menuTypes: menuTypesData,
        priceSegments: priceSegmentsData,
        cities: locationsResponse.cities as any,
        slots: slotsData,
        schedules: schedulesData,
      });
      
      setFormDataLoaded(true);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const error = err as Error;
      logger.error('Failed to load campaign form data', error, {
        entityType: 'campaign',
        operation: 'loadFormData'
      });
      enqueueSnackbar(t('common.error.loadFailed'), { variant: 'error' });
    }
  };

  const refetch = () => {
    loadInitialData();
  };

  const setCampaigns = (campaigns: Campaign[]) => {
    setData(prev => ({ ...prev, campaigns }));
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadInitialData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch,
    setCampaigns,
    loadFormData, // Export for on-demand loading
  };
};

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { creativesApi, campaignsApi, advertisersApi } from '../api';
import { logger } from '../utils/logger';
import type { Creative, Campaign, Advertiser } from '../types';

export interface CreativesData {
  creatives: Creative[];
  campaigns: Campaign[];
  advertisers: Advertiser[];
}

export const useCreativesData = () => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  
  const [data, setData] = useState<CreativesData>({
    creatives: [],
    campaigns: [],
    advertisers: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load all data - creatives, campaigns and advertisers are all needed for the table
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [creativesData, campaignsData, advertisersData] = await Promise.all([
        creativesApi.list(),
        campaignsApi.list(),
        advertisersApi.list(),
      ]);
      
      setData({
        creatives: creativesData,
        campaigns: campaignsData,
        advertisers: advertisersData,
      });
    } catch (err) {
      const error = err as Error;
      setError(error);
      logger.error('Failed to load creatives list data', error, {
        entityType: 'creative',
        operation: 'list'
      });
      enqueueSnackbar(t('common.error.loadFailed'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    ...data,
    loading,
    error,
    refetch,
  };
};

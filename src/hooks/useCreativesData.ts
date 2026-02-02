import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar, type VariantType } from 'notistack';
import { creativesApi, campaignsApi, advertisersApi } from '../api';
import { logger } from '../utils/logger';
import { isApiError } from '../api/errors';
import type { Creative, Campaign, Advertiser } from '../types';

/**
 * Callbacks for UI notifications (optional - decouples UI concerns)
 */
export interface UseCreativesDataCallbacks {
  onLoadError?: (error: Error) => void;
}

/**
 * Helper to create default callback using snackbar
 */
export function createCreativesDataCallback(
  enqueueSnackbar: (message: string, options?: { variant?: VariantType }) => void,
  t: (key: string) => string
): UseCreativesDataCallbacks {
  return {
    onLoadError: (error) => {
      if (isApiError(error)) {
        enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
      } else {
        enqueueSnackbar(error.message || t('error.unknown'), { variant: 'error' });
      }
    },
  };
}

export interface CreativesData {
  creatives: Creative[];
  campaigns: Campaign[];
  advertisers: Advertiser[];
}

export interface UseCreativesDataOptions {
  callbacks?: UseCreativesDataCallbacks;
}

export const useCreativesData = (options?: UseCreativesDataOptions) => {
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
      
      // Call callback if provided, otherwise show snackbar (backwards compatible)
      if (options?.callbacks?.onLoadError) {
        options.callbacks.onLoadError(error);
      } else {
        if (isApiError(error)) {
          enqueueSnackbar((error as any).getUserMessage(), { variant: 'error' });
        } else {
          enqueueSnackbar((error as Error).message || t('error.unknown'), { variant: 'error' });
        }
      }
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

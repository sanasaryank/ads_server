import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar, type VariantType } from 'notistack';
import { isApiError } from '../api/errors';
import { logger } from '../utils/logger';

/**
 * Callbacks for UI notifications (optional - decouples UI concerns from data logic)
 */
export interface UseEditWithLoadingCallbacks {
  /**
   * Called when loading fails
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;
}

/**
 * Helper to create default error callback using snackbar.
 * Decouples hook from UI while providing easy opt-in for standard behavior.
 */
export function createEditErrorCallback(
  enqueueSnackbar: (message: string, options?: { variant?: VariantType }) => void,
  t: (key: string) => string
): UseEditWithLoadingCallbacks {
  return {
    onError: (error: Error) => {
      if (isApiError(error)) {
        enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
      } else {
        enqueueSnackbar(
          error.message || t('common.error.loadFailed'),
          { variant: 'error' }
        );
      }
    },
  };
}

/**
 * Configuration for useEditWithLoading hook
 */
export interface UseEditWithLoadingConfig<T> {
  /**
   * Entity name for logging (e.g., 'advertiser', 'campaign')
   */
  entityName: string;
  
  /**
   * Function to fetch entity data by ID
   */
  fetchById: (id: string | number) => Promise<T>;
  
  /**
   * Callback to execute after successful fetch
   * @param data - The fetched data
   * @param entity - The original entity passed to handleEdit
   */
  onSuccess: (data: T, entity: T) => void;
  
  /**
   * Optional function to extract ID from entity for logging
   */
  getEntityId?: (entity: any) => string | number;
  
  /**
   * Optional callbacks for UI notifications (makes hook reusable in non-UI contexts)
   */
  callbacks?: UseEditWithLoadingCallbacks;
}

/**
 * Return type for useEditWithLoading hook
 */
export interface UseEditWithLoadingReturn<T> {
  /**
   * Whether data is currently being loaded
   */
  isLoading: boolean;
  
  /**
   * Handler to load entity data with loading state and error handling
   */
  handleEdit: (entity: T) => Promise<void>;
}

/**
 * Hook to handle edit operations with loading state and standardized error handling
 * 
 * @example
 * ```tsx
 * const { isLoading, handleEdit } = useEditWithLoading({
 *   entityName: 'slot',
 *   fetchById: slotsApi.getById,
 *   onSuccess: (data) => formDialog.openDialog(data.id),
 *   getEntityId: (slot) => slot.id,
 * });
 * ```
 */
export function useEditWithLoading<T = any>(
  config: UseEditWithLoadingConfig<T>
): UseEditWithLoadingReturn<T> {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = useCallback(
    async (entity: T) => {
      setIsLoading(true);
      
      try {
        // Get entity ID for logging
        const entityId = config.getEntityId ? config.getEntityId(entity) : (entity as any).id;
        
        // Fetch entity data
        const data = await config.fetchById(entityId);
        
        // Call success callback with both data and original entity
        config.onSuccess(data, entity);
        
        // Hide loading immediately after opening modal
        setIsLoading(false);
      } catch (error) {
        // Get entity ID for logging
        const entityId = config.getEntityId ? config.getEntityId(entity) : (entity as any).id;
        
        logger.error(`Failed to load ${config.entityName}`, error as Error, {
          [`${config.entityName}Id`]: entityId,
        });
        
        // Call callback if provided, otherwise show snackbar (backwards compatible)
        if (config.callbacks?.onError) {
          config.callbacks.onError(error as Error);
        } else {
          // Default behavior: show snackbar
          if (isApiError(error)) {
            enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
          } else {
            enqueueSnackbar(
              error instanceof Error ? error.message : t('common.error.loadFailed'),
              { variant: 'error' }
            );
          }
        }
        
        setIsLoading(false);
      }
    },
    [config, enqueueSnackbar, t]
  );

  return {
    isLoading,
    handleEdit,
  };
}

export default useEditWithLoading;

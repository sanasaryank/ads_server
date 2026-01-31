import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';

/**
 * Configuration for entity list operations
 */
export interface UseEntityListConfig<TEntity, TFilters = Record<string, any>> {
  /**
   * API function to fetch list of entities
   */
  fetchList: () => Promise<TEntity[]>;
  
  /**
   * API function to block/unblock entity
   */
  toggleBlock?: (id: string | number, blocked: boolean) => Promise<void>;
  
  /**
   * API function to delete entity
   */
  deleteEntity?: (id: string | number) => Promise<void>;
  
  /**
   * Filter function to apply client-side filtering
   */
  filterFn?: (entities: TEntity[], filters: TFilters, searchTerm: string) => TEntity[];
  
  /**
   * Sort function to apply client-side sorting
   */
  sortFn?: (entities: TEntity[], sortField: string, sortDirection: 'asc' | 'desc') => TEntity[];
  
  /**
   * Entity name for logging and messages
   */
  entityName: string;
  
  /**
   * Initial filters
   */
  initialFilters?: TFilters;
}

/**
 * Return type for useEntityList hook
 */
export interface UseEntityListReturn<TEntity, TFilters = Record<string, any>> {
  /** List of entities */
  entities: TEntity[];
  /** Filtered and sorted entities */
  filteredEntities: TEntity[];
  /** Loading state */
  loading: boolean;
  /** Refresh/refetch data */
  refetch: () => Promise<void>;
  /** Search term */
  searchTerm: string;
  /** Set search term */
  setSearchTerm: (term: string) => void;
  /** Filters */
  filters: TFilters;
  /** Update single filter */
  updateFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  /** Reset all filters */
  resetFilters: () => void;
  /** Toggle block status */
  handleToggleBlock: (entity: TEntity, onConfirm: () => void) => void;
  /** Delete entity */
  handleDelete: (entity: TEntity, onConfirm: () => void) => void;
  /** Sort field */
  sortField: string;
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
  /** Handle sort change */
  handleSort: (field: string, direction: 'asc' | 'desc') => void;
}

/**
 * Hook for managing entity list with filtering, sorting, and CRUD operations
 *
 * @example
 * ```tsx
 * const entityList = useEntityList({
 *   fetchList: advertisersApi.list,
 *   toggleBlock: advertisersApi.block,
 *   deleteEntity: advertisersApi.delete,
 *   filterFn: (entities, filters, search) => {
 *     return entities.filter(e => 
 *       e.name.toLowerCase().includes(search.toLowerCase()) &&
 *       (filters.status === 'all' || e.blocked === (filters.status === 'blocked'))
 *     );
 *   },
 *   sortFn: (entities, field, direction) => {
 *     // custom sorting logic
 *   },
 *   entityName: 'advertiser',
 *   initialFilters: { status: 'active' },
 * });
 *
 * // Use in component
 * <SearchField value={entityList.searchTerm} onChange={entityList.setSearchTerm} />
 * <DataTable data={entityList.filteredEntities} loading={entityList.loading} />
 * ```
 */
export function useEntityList<TEntity extends { id: string | number; blocked?: boolean }, TFilters = Record<string, any>>(
  config: UseEntityListConfig<TEntity, TFilters>
): UseEntityListReturn<TEntity, TFilters> {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const isMountedRef = useRef(true);
  
  const [entities, setEntities] = useState<TEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TFilters>(
    config.initialFilters || ({} as TFilters)
  );
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchData = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      const data = await config.fetchList();
      if (!isMountedRef.current) return;
      setEntities(data);
    } catch (error) {
      if (!isMountedRef.current) return;
      logger.error(`Error loading ${config.entityName} list`, error as Error);
      enqueueSnackbar(t('common.error.loadFailed'), { variant: 'error' });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [config.fetchList, config.entityName, enqueueSnackbar, t]);

  useEffect(() => {
    fetchData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const updateFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(config.initialFilters || ({} as TFilters));
  }, [config.initialFilters]);

  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  const filteredEntities = useMemo(() => {
    let result = entities;

    // Apply custom filter function if provided
    if (config.filterFn) {
      result = config.filterFn(result, filters, searchTerm);
    }

    // Apply custom sort function if provided
    if (config.sortFn) {
      result = config.sortFn(result, sortField, sortDirection);
    }

    return result;
  }, [entities, filters, searchTerm, sortField, sortDirection, config.filterFn, config.sortFn]);

  const handleToggleBlock = useCallback(
    (entity: TEntity, onConfirm: () => void) => {
      if (!config.toggleBlock) {
        logger.warn(`Toggle block not configured for ${config.entityName}`);
        return;
      }

      const confirmAction = async () => {
        try {
          await config.toggleBlock!(entity.id, !entity.blocked);
          await refetch();
          enqueueSnackbar(t('common.updatedSuccessfully'), { variant: 'success' });
          onConfirm();
        } catch (error) {
          logger.error(`Error toggling ${config.entityName} block status`, error as Error, { entityId: entity.id });
          enqueueSnackbar(t('common.error'), { variant: 'error' });
        }
      };

      confirmAction();
    },
    [config.toggleBlock, config.entityName, refetch, enqueueSnackbar, t]
  );

  const handleDelete = useCallback(
    (entity: TEntity, onConfirm: () => void) => {
      if (!config.deleteEntity) {
        logger.warn(`Delete not configured for ${config.entityName}`);
        return;
      }

      const confirmAction = async () => {
        try {
          await config.deleteEntity!(entity.id);
          await refetch();
          enqueueSnackbar(t('common.deletedSuccessfully'), { variant: 'success' });
          onConfirm();
        } catch (error) {
          logger.error(`Error deleting ${config.entityName}`, error as Error, { entityId: entity.id });
          enqueueSnackbar(t('common.error'), { variant: 'error' });
        }
      };

      confirmAction();
    },
    [config.deleteEntity, config.entityName, refetch, enqueueSnackbar, t]
  );

  return {
    entities,
    filteredEntities,
    loading,
    refetch,
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    resetFilters,
    handleToggleBlock,
    handleDelete,
    sortField,
    sortDirection,
    handleSort,
  };
}

export default useEntityList;

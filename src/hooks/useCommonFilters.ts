/**
 * useCommonFilters Hook
 * Provides reusable filter functions for common filtering scenarios
 */

import { useCallback } from 'react';
import type { DictionaryName } from '../types';

export interface CommonFilterOptions {
  /**
   * Function to get display name from multilingual object
   */
  getDisplayName: (name: DictionaryName) => string;
}

export interface StatusFilterable {
  blocked?: boolean;
  isBlocked?: boolean;
}

/**
 * Hook that provides common filter functions
 */
export function useCommonFilters(options: CommonFilterOptions) {
  const { getDisplayName } = options;

  /**
   * Filter by status (active/blocked/all)
   */
  const filterByStatus = useCallback(
    <T extends StatusFilterable>(
      entity: T,
      status: 'active' | 'blocked' | 'all'
    ): boolean => {
      if (status === 'all') return true;
      const isBlocked = entity.blocked ?? entity.isBlocked ?? false;
      return status === 'blocked' ? isBlocked : !isBlocked;
    },
    []
  );

  /**
   * Filter by search term matching ID and multilingual name
   */
  const filterBySearch = useCallback(
    <T extends { id: string | number; name: DictionaryName }>(
      entity: T,
      searchTerm: string
    ): boolean => {
      if (!searchTerm) return true;
      
      const search = searchTerm.toLowerCase();
      const matchesId = String(entity.id).toLowerCase().includes(search);
      const displayName = getDisplayName(entity.name);
      const matchesName = displayName.toLowerCase().includes(search);
      
      return matchesId || matchesName;
    },
    [getDisplayName]
  );

  /**
   * Filter by parent entity ID
   */
  const filterByParentId = useCallback(
    <T extends Record<string, any>>(
      entity: T,
      parentIdKey: string,
      parentIdValue?: string | number
    ): boolean => {
      if (!parentIdValue) return true;
      return String(entity[parentIdKey]) === String(parentIdValue);
    },
    []
  );

  /**
   * Combined filter function for entities with status and search
   */
  const applyCommonFilters = useCallback(
    <T extends StatusFilterable & { id: string | number; name: DictionaryName }>(
      entity: T,
      filters: {
        status?: 'active' | 'blocked' | 'all';
        search?: string;
      }
    ): boolean => {
      // Status filter
      if (filters.status && !filterByStatus(entity, filters.status)) {
        return false;
      }

      // Search filter
      if (filters.search && !filterBySearch(entity, filters.search)) {
        return false;
      }

      return true;
    },
    [filterByStatus, filterBySearch]
  );

  return {
    filterByStatus,
    filterBySearch,
    filterByParentId,
    applyCommonFilters,
  };
}

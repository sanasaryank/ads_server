/**
 * useDataSelection Hook
 * Generic hook for managing multi-select state with toggle functionality
 * Reusable for any list selection pattern
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseDataSelectionOptions<K = string> {
  /** Initial selected items */
  initialSelected?: K[];
  /** Callback when selection changes */
  onSelectionChange?: (selectedKeys: K[]) => void;
}

export interface UseDataSelectionReturn<K = string> {
  /** Set of selected keys */
  selectedKeys: Set<K>;
  /** Array of selected keys */
  selectedArray: K[];
  /** Toggle selection of an item */
  toggle: (key: K) => void;
  /** Select an item */
  select: (key: K) => void;
  /** Deselect an item */
  deselect: (key: K) => void;
  /** Check if item is selected */
  isSelected: (key: K) => boolean;
  /** Select all items */
  selectAll: (keys: K[]) => void;
  /** Deselect all items */
  deselectAll: () => void;
  /** Toggle all items */
  toggleAll: (keys: K[]) => void;
  /** Clear selection */
  clear: () => void;
  /** Set selection */
  setSelection: (keys: K[]) => void;
  /** Get selection count */
  count: number;
  /** Check if all items are selected */
  allSelected: (keys: K[]) => boolean;
  /** Check if some items are selected */
  someSelected: (keys: K[]) => boolean;
}

export function useDataSelection<K = string>(
  options: UseDataSelectionOptions<K> = {}
): UseDataSelectionReturn<K> {
  const { initialSelected = [], onSelectionChange } = options;
  
  const [selectedKeys, setSelectedKeys] = useState<Set<K>>(
    new Set(initialSelected)
  );

  const selectedArray = useMemo(() => Array.from(selectedKeys), [selectedKeys]);

  const count = selectedKeys.size;

  const setSelection = useCallback(
    (keys: K[]) => {
      const newSet = new Set(keys);
      setSelectedKeys(newSet);
      onSelectionChange?.(Array.from(newSet));
    },
    [onSelectionChange]
  );

  const toggle = useCallback(
    (key: K) => {
      setSelectedKeys((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        onSelectionChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [onSelectionChange]
  );

  const select = useCallback(
    (key: K) => {
      setSelectedKeys((prev) => {
        if (prev.has(key)) return prev;
        const newSet = new Set(prev);
        newSet.add(key);
        onSelectionChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [onSelectionChange]
  );

  const deselect = useCallback(
    (key: K) => {
      setSelectedKeys((prev) => {
        if (!prev.has(key)) return prev;
        const newSet = new Set(prev);
        newSet.delete(key);
        onSelectionChange?.(Array.from(newSet));
        return newSet;
      });
    },
    [onSelectionChange]
  );

  const isSelected = useCallback((key: K) => selectedKeys.has(key), [selectedKeys]);

  const selectAll = useCallback(
    (keys: K[]) => {
      const newSet = new Set(keys);
      setSelectedKeys(newSet);
      onSelectionChange?.(Array.from(newSet));
    },
    [onSelectionChange]
  );

  const deselectAll = useCallback(() => {
    setSelectedKeys(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const toggleAll = useCallback(
    (keys: K[]) => {
      const allSelected = keys.every((key) => selectedKeys.has(key));
      if (allSelected) {
        deselectAll();
      } else {
        selectAll(keys);
      }
    },
    [selectedKeys, selectAll, deselectAll]
  );

  const clear = useCallback(() => {
    setSelectedKeys(new Set());
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const allSelected = useCallback(
    (keys: K[]) => {
      if (keys.length === 0) return false;
      return keys.every((key) => selectedKeys.has(key));
    },
    [selectedKeys]
  );

  const someSelected = useCallback(
    (keys: K[]) => {
      if (keys.length === 0) return false;
      return keys.some((key) => selectedKeys.has(key)) && !allSelected(keys);
    },
    [selectedKeys, allSelected]
  );

  return {
    selectedKeys,
    selectedArray,
    toggle,
    select,
    deselect,
    isSelected,
    selectAll,
    deselectAll,
    toggleAll,
    clear,
    setSelection,
    count,
    allSelected,
    someSelected,
  };
}

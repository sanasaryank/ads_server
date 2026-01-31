/**
 * Custom React hooks library
 *
 * This module exports all custom hooks for state management,
 * data fetching, form handling, and UI interactions.
 */

// Table and data management
export { default as useTableState } from './useTableState';
export type { UseTableStateProps, UseTableStateReturn } from './useTableState';

export { default as useFilters } from './useFilters';
export type { UseFiltersReturn } from './useFilters';

// API and data fetching
export { default as useFetch } from './useFetch';
export type { UseFetchReturn } from './useFetch';

export { useCampaignsData } from './useCampaignsData';
export type { CampaignsData } from './useCampaignsData';

export { useCreativesData } from './useCreativesData';
export type { CreativesData } from './useCreativesData';

export { default as useAuditLog } from './useAuditLog';
export type { UseAuditLogProps, UseAuditLogReturn } from './useAuditLog';

// Form handling
export { default as useFormSubmit } from './useFormSubmit';
export type { UseFormSubmitReturn } from './useFormSubmit';

// UI state management
export { default as useDrawer } from './useDrawer';
export type { UseDrawerReturn } from './useDrawer';

export { default as useConfirmDialog } from './useConfirmDialog';
export type {
  ConfirmDialogConfig,
  ConfirmDialogProps,
  UseConfirmDialogReturn,
} from './useConfirmDialog';

export { default as useToggle } from './useToggle';

// Utility hooks
export { default as useDebounce } from './useDebounce';
export { default as useLocalStorage } from './useLocalStorage';
export { useCommonFilters } from './useCommonFilters';
export type { CommonFilterOptions } from './useCommonFilters';

// Advanced hooks for entity management
export { default as useFormDialog } from './useFormDialog';
export type { UseFormDialogConfig, UseFormDialogReturn } from './useFormDialog';
export { default as useEditWithLoading } from './useEditWithLoading';
export type { UseEditWithLoadingConfig, UseEditWithLoadingReturn } from './useEditWithLoading';

export { default as useEntityList } from './useEntityList';
export type { UseEntityListConfig, UseEntityListReturn } from './useEntityList';

export { default as usePagination } from './usePagination';

// Domain-specific hooks
export { useCampaignTargeting } from './useCampaignTargeting';
export type { UseCampaignTargetingOptions, UseCampaignTargetingReturn } from './useCampaignTargeting';

export { useMultilingualName } from './useMultilingualName';
export type { UseMultilingualNameReturn } from './useMultilingualName';

export { useDataSelection } from './useDataSelection';
export type { UseDataSelectionOptions, UseDataSelectionReturn } from './useDataSelection';

export { useDialogState } from './useDialogState';
export type { UseDialogStateOptions, UseDialogStateReturn } from './useDialogState';
export type { UsePaginationConfig, UsePaginationReturn } from './usePagination';

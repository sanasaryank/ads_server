import { useState, useCallback } from 'react';
import { type UseFormReturn, type FieldValues } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';
import { isApiError } from '../api/errors';

/**
 * Configuration for form dialog operations
 */
export interface UseFormDialogConfig<TEntity, TFormData extends FieldValues> {
  /**
   * API function to fetch entity by ID (for edit mode)
   */
  getById?: (id: string | number) => Promise<TEntity & { hash?: string }>;
  
  /**
   * API function to create new entity
   */
  create: (data: TFormData) => Promise<TEntity>;
  
  /**
   * API function to update existing entity
   */
  update: (id: string | number, data: TFormData) => Promise<TEntity>;
  
  /**
   * Transform entity data to form values
   */
  transformToForm: (entity: TEntity & { hash?: string }) => TFormData;
  
  /**
   * Transform form values to API request data
   */
  transformToApi: (values: TFormData, entity?: TEntity & { hash?: string }) => TFormData;
  
  /**
   * Callback after successful save
   */
  onSuccess?: () => void;
  
  /**
   * Entity name for logging and messages
   */
  entityName: string;
}

/**
 * Return type for useFormDialog hook
 */
export interface UseFormDialogReturn<TEntity, TFormData extends FieldValues> {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Current editing entity */
  editingEntity: (TEntity & { hash?: string }) | null;
  /** Whether in edit mode */
  isEditMode: boolean;
  /** Open dialog for creating new entity */
  openCreate: () => void;
  /** Open dialog for editing entity */
  openEdit: (entity: TEntity) => Promise<void>;
  /** Close dialog */
  close: () => void;
  /** Submit form handler */
  handleSubmit: (values: TFormData, form: UseFormReturn<TFormData>) => Promise<void>;
}

/**
 * Hook for managing form dialog state and operations
 * Handles create/edit operations with API integration
 *
 * @example
 * ```tsx
 * const formDialog = useFormDialog({
 *   getById: advertisersApi.getById,
 *   create: advertisersApi.create,
 *   update: advertisersApi.update,
 *   transformToForm: (entity) => ({
 *     name: entity.name,
 *     tin: entity.tin,
 *     description: entity.description || '',
 *     blocked: entity.blocked,
 *   }),
 *   transformToApi: (values, entity) => ({
 *     ...values,
 *     hash: entity?.hash,
 *   }),
 *   onSuccess: refetchData,
 *   entityName: 'advertiser',
 * });
 *
 * // In component:
 * <Button onClick={formDialog.openCreate}>Add</Button>
 * <Button onClick={() => formDialog.openEdit(item)}>Edit</Button>
 * <Dialog open={formDialog.isOpen} onClose={formDialog.close}>
 *   <form onSubmit={form.handleSubmit(formDialog.handleSubmit)}>
 *     {/* form fields *\/}
 *   </form>
 * </Dialog>
 * ```
 */
export function useFormDialog<TEntity, TFormData extends FieldValues>(
  config: UseFormDialogConfig<TEntity, TFormData>
): UseFormDialogReturn<TEntity, TFormData> {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<(TEntity & { hash?: string }) | null>(null);

  const isEditMode = editingEntity !== null;

  const openCreate = useCallback(() => {
    setEditingEntity(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback(
    async (entity: TEntity) => {
      try {
        // Fetch full entity with hash if getById is provided
        const fullEntity = config.getById
          ? await config.getById((entity as any).id)
          : (entity as TEntity & { hash?: string });
        
        setEditingEntity(fullEntity);
        setIsOpen(true);
      } catch (error) {
        logger.error(`Error loading ${config.entityName}`, error as Error, { entity });
        enqueueSnackbar(t('common.error.loadFailed'), { variant: 'error' });
      }
    },
    [config.getById, config.entityName, enqueueSnackbar, t]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setEditingEntity(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: TFormData, form: UseFormReturn<TFormData>) => {
      try {
        const apiData = config.transformToApi(values, editingEntity || undefined);
        
        if (isEditMode && editingEntity) {
          await config.update((editingEntity as any).id, apiData);
          enqueueSnackbar(t('common.savedSuccessfully'), { variant: 'success' });
        } else {
          await config.create(apiData);
          enqueueSnackbar(t('common.createdSuccessfully'), { variant: 'success' });
        }

        config.onSuccess?.();
        close();
        form.reset();
      } catch (error) {
        logger.error(`Error saving ${config.entityName}`, error as Error, { values });
        
        if (isApiError(error)) {
          if (error.isObjectNotUnique()) {
            enqueueSnackbar(t('error.duplicate'), { variant: 'error' });
          } else if (error.isObjectNotFound()) {
            enqueueSnackbar(t('error.notFound'), { variant: 'error' });
          } else if (error.isObjectChanged()) {
            enqueueSnackbar(t('error.changed'), { variant: 'error' });
          } else {
            enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
          }
        } else {
          const errorMessage = error instanceof Error ? error.message : t('error.unknown');
          enqueueSnackbar(errorMessage, { variant: 'error' });
        }
        
        throw error; // Re-throw to allow form to handle error state
      }
    },
    [config, editingEntity, isEditMode, close, enqueueSnackbar, t]
  );

  return {
    isOpen,
    editingEntity,
    isEditMode,
    openCreate,
    openEdit,
    close,
    handleSubmit,
  };
}

export default useFormDialog;

/**
 * Slot Form Dialog
 * Form for creating/editing advertising slots with multilingual names
 */

import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Typography,
  DialogActions,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { slotsApi } from '../../api/endpoints';
import { logger } from '../../utils/logger';
import type { SlotFormData } from '../../types';

// Reusable components
import Button from '../ui/atoms/Button';
import { FormField, MultilingualNameField, SwitchField } from '../ui/molecules';

interface SlotFormDialogProps {
  open: boolean;
  slotId?: string;
  slotData?: SlotFormData | null;
  onClose: () => void;
  onSave: () => void;
}

const createValidationSchema = (t: (key: string) => string) => {
  return z.object({
    name: z.object({
      ARM: z.string().min(1, t('validation.nameRequired')),
      RUS: z.string().min(1, t('validation.nameRequired')),
      ENG: z.string().min(1, t('validation.nameRequired')),
    }),
    type: z.enum(['MainLarge', 'MainSmall', 'Selection', 'Group']),
    rotationPeriod: z.number().min(1, t('validation.required')),
    refreshTTL: z.number().min(1, t('validation.required')),
    noAdjacentSameAdvertiser: z.boolean(),
    isBlocked: z.boolean(),
    description: z.string().optional(),
  });
};

export const SlotFormDialog = memo(({
  open,
  slotId,
  slotData = null,
  onClose,
  onSave,
}: SlotFormDialogProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = slotId !== undefined;

  const [error, setError] = useState<string | null>(null);

  const validationSchema = useMemo(() => createValidationSchema(t), [t]);
  type FormData = z.infer<typeof validationSchema>;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: { ARM: '', RUS: '', ENG: '' },
      type: 'MainLarge',
      rotationPeriod: 30,
      refreshTTL: 300,
      noAdjacentSameAdvertiser: false,
      isBlocked: false,
      description: '',
    },
  });

  const isLoading = false;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      reset({
        name: { ARM: '', RUS: '', ENG: '' },
        type: 'MainLarge',
        rotationPeriod: 30,
        refreshTTL: 300,
        noAdjacentSameAdvertiser: false,
        isBlocked: false,
        description: '',
      });
      setError(null);
    } else if (!isEditMode) {
      reset({
        name: { ARM: '', RUS: '', ENG: '' },
        type: 'MainLarge',
        rotationPeriod: 30,
        refreshTTL: 300,
        noAdjacentSameAdvertiser: false,
        isBlocked: false,
        description: '',
      });
    }
  }, [open, reset, isEditMode]);

  // Update form when slot data is loaded
  useEffect(() => {
    if (slotData && isEditMode) {
      reset({
        name: slotData.name,
        type: slotData.type,
        rotationPeriod: slotData.rotationPeriod,
        refreshTTL: slotData.refreshTTL,
        noAdjacentSameAdvertiser: slotData.noAdjacentSameAdvertiser,
        isBlocked: slotData.isBlocked,
        description: slotData.description || '',
      });
    }
  }, [slotData, isEditMode, reset]);

  // Submit handler
  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const formData: Partial<SlotFormData> = {
          name: data.name,
          type: data.type,
          rotationPeriod: data.rotationPeriod,
          refreshTTL: data.refreshTTL,
          noAdjacentSameAdvertiser: data.noAdjacentSameAdvertiser,
          isBlocked: data.isBlocked,
          description: data.description,
        };

        // Add hash for updates (required by backend)
        if (isEditMode && slotData?.hash) {
          formData.hash = slotData.hash;
          formData.id = slotId;
        }

        if (isEditMode) {
          await slotsApi.update(slotId!, formData as SlotFormData);
          enqueueSnackbar(t('common.savedSuccessfully'), { variant: 'success' });
        } else {
          await slotsApi.create(formData as Omit<SlotFormData, 'id' | 'hash'>);
          enqueueSnackbar(t('common.createdSuccessfully'), { variant: 'success' });
        }

        onSave();
        onClose();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('common.error');
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
        logger.error('Error saving slot', err as Error, { slotId });
      }
    },
    [isEditMode, slotId, slotData, onSave, onClose, t, enqueueSnackbar]
  );

  return (
    <ErrorBoundary>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
        hideBackdrop
        container={() => document.getElementById('modal-root')}
        TransitionProps={{
          timeout: 0,
        }}
        sx={{
          '& .MuiDialog-container': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
          },
        }}
      >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box component="span" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {isEditMode ? t('common.edit') : t('slots.addNew')}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 3,
          pb: 0,
          flexGrow: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                {/* Multilingual Name Inputs */}
                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
                    {t('dictionaries.name')} *
                  </Typography>
                  <MultilingualNameField
                    control={control}
                    name="name"
                    required
                  />
                </Box>

                {/* Type */}
                <FormField
                  name="type"
                  control={control}
                  label={t('slots.fields.type')}
                  type="select"
                  required
                  options={[
                    { value: 'MainLarge', label: t('slots.types.mainLarge') },
                    { value: 'MainSmall', label: t('slots.types.mainSmall') },
                    { value: 'Selection', label: t('slots.types.selection') },
                    { value: 'Group', label: t('slots.types.group') },
                  ]}
                />

                {/* Rotation Period */}
                <FormField
                  name="rotationPeriod"
                  control={control}
                  label={t('slots.fields.rotationPeriod')}
                  type="number"
                  required
                />

                {/* Refresh TTL */}
                <FormField
                  name="refreshTTL"
                  control={control}
                  label={t('slots.fields.refreshTTL')}
                  type="number"
                  required
                />

                {/* No Adjacent Same Advertiser */}
                <SwitchField
                  control={control}
                  name="noAdjacentSameAdvertiser"
                  label={t('slots.fields.noAdjacentSameAdvertiser')}
                />

                {/* Description */}
                <FormField
                  name="description"
                  control={control}
                  label={t('dictionaries.description')}
                  type="text"
                  multiline
                  rows={3}
                />

                {/* Blocked Status */}
                <SwitchField
                  control={control}
                  name="isBlocked"
                  label={t('common.blocked')}
                  colorOnTrue="error.main"
                  colorOnFalse="text.secondary"
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? <CircularProgress size={24} /> : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
    </ErrorBoundary>
  );
});

SlotFormDialog.displayName = 'SlotFormDialog';

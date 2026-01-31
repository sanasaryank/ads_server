import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Alert, CircularProgress, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { dictionariesApi } from '../../api/endpoints';
import { getDictionaryFieldsConfig } from '../../utils/dictionaryUtils';
import type { DictionaryKey, City, District, LocationsResponse } from '../../types';

// Reusable components
import Button from '../ui/atoms/Button';
import FormField from '../ui/molecules/FormField';
import Select from '../ui/atoms/Select';

// Reusable hooks
import useFetch from '../../hooks/useFetch';

interface DictionaryFormDialogProps {
  open: boolean;
  dictKey: DictionaryKey;
  itemId?: number;
  onClose: () => void;
  onSave: () => void;
}

const createValidationSchema = (dictKey: DictionaryKey, t: (key: string) => string) => {
  const config = getDictionaryFieldsConfig(dictKey);

  let schema = z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    blocked: z.boolean(),
  });

  if (config.hasCountrySelector) {
    schema = schema.extend({
      countryId: z.number().min(1, t('validation.required')),
    });
  }

  if (config.hasCitySelector) {
    schema = schema.extend({
      cityId: z.number().min(1, t('validation.required')),
    });
  }

  if (config.hasSlotFields) {
    schema = schema.extend({
      rotation: z.number().min(1, t('validation.required')),
      refreshTtl: z.number().min(1, t('validation.required')),
      noAdjacentSameAdvertiser: z.boolean(),
    });
  }

  return schema;
};

export const DictionaryFormDialog = ({
  open,
  dictKey,
  itemId,
  onClose,
  onSave,
}: DictionaryFormDialogProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = itemId !== undefined;
  const config = useMemo(() => getDictionaryFieldsConfig(dictKey), [dictKey]);

  const [error, setError] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  const validationSchema = useMemo(() => createValidationSchema(dictKey, t), [dictKey, t]);
  type FormData = z.infer<typeof validationSchema>;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      name: '',
      blocked: false,
      ...(config.hasCountrySelector && { countryId: 0 }),
      ...(config.hasCitySelector && { cityId: 0 }),
      ...(config.hasSlotFields && { rotation: 30, refreshTtl: 300, noAdjacentSameAdvertiser: false }),
    },
  });

  // Watch countryId for districts to filter cities  
  const watchedCountryId = config.hasCountrySelector 
    ? watch('countryId' as any) as number | undefined
    : undefined;

  // Fetch locations (countries, cities, districts) from single endpoint
  const { data: locationsData, loading: locationsLoading } = useFetch<LocationsResponse>(
    async () => {
      if (!config.hasCountrySelector && !config.hasCitySelector) {
        return { countries: [], cities: [], districts: [] };
      }
      return await dictionariesApi.getLocations();
    },
    [open, config.hasCountrySelector, config.hasCitySelector]
  );

  // Extract and filter active countries and cities
  const countries = useMemo(() => {
    return (locationsData?.countries || []).filter((c) => !c.isBlocked);
  }, [locationsData]);

  const cities = useMemo(() => {
    return (locationsData?.cities || []).filter((c) => !c.isBlocked);
  }, [locationsData]);

  // Fetch item data in edit mode
  // Note: dictionariesApi.getById not implemented - this component is incomplete
  const { data: itemData, loading: itemLoading } = useFetch(
    async () => {
      if (!isEditMode || !open) return null;
      // TODO: Implement dictionariesApi.getById
      return null;
    },
    [open, isEditMode, itemId, dictKey]
  );

  const isLoading = locationsLoading || itemLoading;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      reset();
      setError(null);
      setSelectedCountryId(null);
    }
  }, [open, reset]);

  // Update form when item data is loaded
  useEffect(() => {
    if (itemData && isEditMode) {
      const resetData: Record<string, unknown> = {
        name: (itemData as any)?.name || '',
        blocked: (itemData as any)?.blocked || false,
      };
      
      if (config.hasCountrySelector && 'countryId' in itemData) {
        resetData.countryId = (itemData as City).countryId;
      }
      
      if (config.hasCitySelector && 'cityId' in itemData) {
        resetData.cityId = (itemData as District).cityId;
      }
      
      if (config.hasSlotFields && 'rotationPeriod' in itemData) {
        const slot = itemData as import('../../types').SlotFormData;
        resetData.rotation = slot.rotationPeriod;
        resetData.refreshTtl = slot.refreshTTL;
        resetData.noAdjacentSameAdvertiser = slot.noAdjacentSameAdvertiser;
      }
      
      reset(resetData);

      // Set selected country for districts
      if (config.hasCitySelector && 'cityId' in itemData && cities) {
        const city = cities.find((c) => c.id === (itemData as District).cityId);
        if (city) {
          setSelectedCountryId(Number(city.countryId));
        }
      }
    }
  }, [itemData, isEditMode, reset, config, cities]);

  // Update selected country when watchedCountryId changes
  useEffect(() => {
    if (config.hasCitySelector && watchedCountryId) {
      setSelectedCountryId(watchedCountryId);
    }
  }, [watchedCountryId, config.hasCitySelector]);

  // Submit handler
  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const formData: Record<string, unknown> = {
          name: data.name,
          blocked: data.blocked,
        };
        
        if (config.hasCountrySelector && 'countryId' in data) {
          formData.countryId = data.countryId;
        }
        
        if (config.hasCitySelector && 'cityId' in data) {
          formData.cityId = data.cityId;
        }
        
        if (config.hasSlotFields && 'rotation' in data) {
          formData.rotation = data.rotation;
          formData.refreshTtl = (data as any).refreshTtl;
          formData.noAdjacentSameAdvertiser = (data as any).noAdjacentSameAdvertiser;
        }

        if (isEditMode) {
          // TODO: Implement dictionariesApi.update
          // await dictionariesApi.update(dictKey, itemId, formData as unknown as DictionaryFormData);
          enqueueSnackbar(t('common.savedSuccessfully'), { variant: 'success' });
        } else {
          // TODO: Implement dictionariesApi.create
          // await dictionariesApi.create(dictKey, formData as unknown as DictionaryFormData);
          enqueueSnackbar(t('common.createdSuccessfully'), { variant: 'success' });
        }

        onSave();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.error'));
        enqueueSnackbar(t('common.error'), { variant: 'error' });
      }
    },
    [config, isEditMode, dictKey, itemId, onSave, onClose, t, enqueueSnackbar]
  );

  // Country change handler for districts
  const handleCountryChange = useCallback(
    (countryId: number) => {
      setSelectedCountryId(countryId);
      // Reset city selection when country changes
      if (config.hasCitySelector) {
        setValue('cityId' as any, 0);
      }
    },
    [config.hasCitySelector, setValue]
  );

  // Filtered cities based on selected country
  const filteredCities = useMemo(() => {
    if (!cities) return [];
    return selectedCountryId ? cities.filter((city) => Number(city.countryId) === selectedCountryId) : cities;
  }, [cities, selectedCountryId]);

  // Country options for select
  const countryOptions = useMemo(() => {
    if (!countries) return [];
    return countries.map((country) => ({
      value: country.id,
      label: country.name,
    }));
  }, [countries]);

  // City options for select (for cities dictionary)
  const cityOptionsForCities = useMemo(() => {
    if (!cities) return [];
    return filteredCities.map((city) => ({
      value: city.id,
      label: city.name,
    }));
  }, [filteredCities, cities]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
          {isEditMode ? t('common.edit') : t('dictionaries.addEntry')}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
            {/* Name field */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <FormField name="name" control={control as any} label={t('dictionaries.name')} type="text" required />

            {/* Country selector for cities */}
            {config.hasCountrySelector && (
              <Controller
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={'countryId' as any}
                control={control}
                render={({ field }) => (
                  <Select
                    name={field.name}
                    label={t('dictionaries.country')}
                    value={typeof field.value === 'number' ? field.value : 0}
                    onChange={(value) => {
                      field.onChange(value);
                      handleCountryChange(value as number);
                    }}
                    options={[
                      { value: 0, label: t('restaurants.selectCountry') },
                      ...countryOptions,
                    ]}
                    error={!!(errors as any).countryId}
                    helperText={(errors as any).countryId?.message}
                    required
                  />
                )}
              />
            )}

            {/* City selector for districts */}
            {config.hasCitySelector && (
              <>
                {/* Country filter for districts */}
                <Select
                  name="countryFilter"
                  label={t('dictionaries.country')}
                  value={selectedCountryId || ''}
                  onChange={(value) => handleCountryChange(value as number)}
                  options={[
                    { value: '', label: t('common.all') },
                    ...countryOptions,
                  ]}
                />

                {/* City selector */}
                <Controller
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  name={'cityId' as any}
                  control={control}
                  render={({ field }) => (
                    <Select
                      name={field.name}
                      label={t('dictionaries.city')}
                      value={field.value || 0}
                      onChange={(value) => field.onChange(value)}
                      options={[
                        { value: 0, label: t('restaurants.selectCity') },
                        ...cityOptionsForCities,
                      ]}
                      error={!!(errors as any).cityId}
                      helperText={(errors as any).cityId?.message}
                      required
                    />
                  )}
                />
              </>
            )}

            {/* Placement fields */}
            {config.hasSlotFields && (
              <>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <FormField 
                  name="rotation" 
                  control={control as any} 
                  label={t('dictionaries.rotation')} 
                  type="number" 
                  required 
                  helperText={t('dictionaries.rotationHelper')}
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <FormField 
                  name="refreshTtl" 
                  control={control as any} 
                  label={t('dictionaries.refreshTtl')} 
                  type="number" 
                  required 
                  helperText={t('dictionaries.refreshTtlHelper')}
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <FormField 
                  name="noAdjacentSameAdvertiser" 
                  control={control as any} 
                  label={t('dictionaries.noAdjacentSameAdvertiser')} 
                  type="switch"
                />
              </>
            )}

            {/* Blocked switch */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <FormField name="blocked" control={control as any} label={t('common.blocked')} type="switch" />
          </Box>
        )}
          </Box>

        <Box
          sx={{
            flexShrink: 0,
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            position: 'sticky',
            bottom: 0,
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isLoading}
          >
            {t('common.save')}
          </Button>
        </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

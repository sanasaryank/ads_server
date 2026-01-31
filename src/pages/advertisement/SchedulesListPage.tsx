import { useMemo, useCallback, memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as MuiIconButton,
  useTheme,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { Button, IconButton, Switch, Select } from '../../components/ui/atoms';
import { FormField, FilterDrawer, SearchField, MultilingualNameField, SwitchField, TimeSelectField, ConfirmDialog } from '../../components/ui/molecules';
import { useSnackbar } from 'notistack';
import { useFilters, useDrawer, useFetch, useMultilingualName, useDialogState, useConfirmDialog, useDebounce, useEditWithLoading, useCommonFilters } from '../../hooks';
import { schedulesApi } from '../../api';
import { isApiError } from '../../api/errors';
import { logger } from '../../utils/logger';
import type { Schedule, ScheduleFormData, DaySchedule } from '../../types';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader, FiltersContainer, FlexRowCenter } from '../../components/ui/styled';

const DAYS: Array<DaySchedule['day']> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Convert hour number to HH:mm string format
const hourToTimeString = (hour: number): string => {
  return `${String(hour).padStart(2, '0')}:00`;
};

// Convert HH:mm string to hour number
const timeStringToHour = (time: string): number => {
  return parseInt(time.split(':')[0], 10);
};

const createScheduleSchema = (t: (key: string) => string) =>
  z.object({
    name: z.object({
      ARM: z.string().min(1, t('validation.nameRequired')),
      RUS: z.string().min(1, t('validation.nameRequired')),
      ENG: z.string().min(1, t('validation.nameRequired')),
    }),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, t('schedules.validation.colorInvalid')),
    weekSchedule: z.array(
      z.object({
        day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
        enabled: z.boolean(),
        startTime: z.string(),
        endTime: z.string(),
      })
    ),
    blocked: z.boolean(),
  });

type ScheduleFormValues = z.infer<ReturnType<typeof createScheduleSchema>>;

interface ScheduleFilters {
  search: string;
  status: 'active' | 'blocked' | 'all';
}

const calculateDuration = (startTime: string, endTime: string): string => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Add 24 hours if end time is next day
  }
  
  const hours = Math.floor(totalMinutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
};

const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 60) {
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return options;
};

const SchedulesListPage = memo(() => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const { getDisplayName } = useMultilingualName();
  const theme = useTheme();
  const confirmDialog = useConfirmDialog();
  
  // Fetch schedules with useFetch hook
  const { data: schedules = [], loading, error, refetch } = useFetch<Schedule[]>(
    async () => await schedulesApi.list(),
    []
  );

  // Show toast on error
  useEffect(() => {
    if (error) {
      if (isApiError(error)) {
        enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
      } else {
        enqueueSnackbar(error.message || t('common.error.loadFailed'), { variant: 'error' });
      }
    }
  }, [error, enqueueSnackbar, t]);
  
  // Dialog state with useDialogState hook
  const formDialog = useDialogState<{ id?: string; data?: Schedule & { hash?: string } | null }>();
  
  // Edit with loading hook
  const { isLoading: isLoadingEdit, handleEdit } = useEditWithLoading<Schedule>({
    entityName: 'schedule',
    fetchById: async (id) => {
      const data = await schedulesApi.getById(String(id));
      return data as any;
    },
    onSuccess: (data, schedule) => {
      formDialog.openDialog({ id: String(schedule.id), data: data as Schedule & { hash: string } });
    },
    getEntityId: (schedule) => schedule.id,
  });

  // Filters
  const { filters, updateFilter, resetFilters, applyFilters } = useFilters<ScheduleFilters>({
    search: '',
    status: 'active',
  });
  
  // Debounced search to prevent excessive filtering
  const debouncedSearch = useDebounce(filters.search || '', 300);

  // Temporary filters for drawer
  const {
    filters: tempFilters,
    updateFilter: updateTempFilter,
    resetFilters: resetTempFilters,
  } = useFilters<ScheduleFilters>({
    search: '',
    status: 'active',
  });

  // Filter drawer
  const filterDrawer = useDrawer();

  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const schema = createScheduleSchema(t);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: { ARM: '', RUS: '', ENG: '' },
      color: '#28282E',
      weekSchedule: DAYS.map((day) => ({
        day,
        enabled: true,
        startTime: '09:00',
        endTime: '17:00',
      })),
      blocked: false,
    },
  });

  const weekSchedule = watch('weekSchedule');

  // Load data is now handled by useFetch hook

  const handleOpenDialog = useCallback(async (schedule?: Schedule) => {
    if (schedule) {
      handleEdit(schedule);
    } else {
      formDialog.openDialog();
      reset({
        name: { ARM: '', RUS: '', ENG: '' },
        color: '#28282E',
        weekSchedule: DAYS.map((day) => ({
          day,
          enabled: true,
          startTime: '09:00',
          endTime: '17:00',
        })),
        blocked: false,
      });
    }
  }, [formDialog, reset, handleEdit]);

  const handleCloseDialog = useCallback(() => {
    formDialog.closeDialog();
    reset();
  }, [formDialog, reset]);

  // Load form data when dialog opens in edit mode
  useEffect(() => {
    if (formDialog.open && formDialog.data?.data) {
      const fullSchedule = formDialog.data.data;
      reset({
        name: fullSchedule.name,
        color: fullSchedule.color,
        weekSchedule: fullSchedule.weekSchedule.map(day => ({
          ...day,
          startTime: hourToTimeString(day.startTime),
          endTime: hourToTimeString(day.endTime),
        })),
        blocked: fullSchedule.blocked,
      });
    }
  }, [formDialog.open, formDialog.data, reset]);

  const handleOpenFilters = useCallback(() => {
    updateTempFilter('search', filters.search);
    updateTempFilter('status', filters.status);
    filterDrawer.open();
  }, [filters, updateTempFilter, filterDrawer]);

  const handleApplyFilters = useCallback(() => {
    updateFilter('search', tempFilters.search);
    updateFilter('status', tempFilters.status);
    filterDrawer.close();
  }, [tempFilters, updateFilter, filterDrawer]);

  const handleResetFilters = useCallback(() => {
    resetTempFilters();
    resetFilters();
    filterDrawer.close();
  }, [resetFilters, resetTempFilters, filterDrawer]);

  const handleFormSubmit = useCallback(async (data: ScheduleFormValues) => {
    try {
      const formData: ScheduleFormData = {
        name: data.name,
        color: data.color,
        weekSchedule: data.weekSchedule.map(day => ({
          day: day.day,
          enabled: day.enabled,
          startTime: timeStringToHour(day.startTime),
          endTime: timeStringToHour(day.endTime),
        })),
        blocked: data.blocked,
      };

      if (formDialog.data?.id) {
        const scheduleData = formDialog.data.data;
        await schedulesApi.update(
          formDialog.data.id,
          formData,
          scheduleData?.hash || ''
        );
        enqueueSnackbar(t('common.success.updated'), { variant: 'success' });
      } else {
        await schedulesApi.create(formData);
        enqueueSnackbar(t('common.success.created'), { variant: 'success' });
      }

      handleCloseDialog();
      await refetch();
    } catch (error) {
      logger.error('Failed to save schedule', error as Error, {
        entityType: 'schedule',
        scheduleId: formDialog.data?.id,
        operation: formDialog.data?.id ? 'update' : 'create'
      });
      
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
        enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
      }
    }
  }, [formDialog.data?.id, formDialog.data?.data, enqueueSnackbar, t, handleCloseDialog, refetch]);

  const handleBlock = useCallback(
    (schedule: Schedule) => {
      const action = schedule.blocked ? 'unblock' : 'block';
      const scheduleName = getDisplayName(schedule.name);
      confirmDialog.open({
        title: t(`schedules.confirm.${action}Title`),
        message: t(`schedules.confirm.${action}Message`, { name: scheduleName }),
        confirmText: t('common.confirm'),
        cancelText: t('common.cancel'),
        onConfirm: async () => {
          try {
            await schedulesApi.block(String(schedule.id), !schedule.blocked);
            enqueueSnackbar(
              t(`common.success.${schedule.blocked ? 'unblocked' : 'blocked'}`),
              { variant: 'success' }
            );
            await refetch();
          } catch (error) {
            logger.error('Failed to block/unblock schedule', error as Error, {
              entityType: 'schedule',
              scheduleId: schedule.id,
              operation: schedule.blocked ? 'unblock' : 'block'
            });
            enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
          }
        },
      });
    },
    [t, getDisplayName, confirmDialog, enqueueSnackbar, refetch]
  );

  // Common filter functions
  const commonFilters = useCommonFilters({ getDisplayName });

  // Apply filters to schedules with debounced search
  const filteredSchedules = useMemo(() => {
    return applyFilters(schedules || [], (schedule, currentFilters) => {
      return commonFilters.applyCommonFilters(schedule, {
        status: currentFilters.status,
        search: debouncedSearch,
      });
    });
  }, [schedules, applyFilters, debouncedSearch, commonFilters]);

  return (
    <Box>
      <Backdrop
        open={isLoadingEdit}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <PageHeader>
        <Typography variant="h4">{t('schedules.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('schedules.addNew')}
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <FiltersContainer>
        <Box sx={{ flex: 1 }}>
          <SearchField
            value={filters.search}
            onChange={(value) => updateFilter('search', value)}
            placeholder={t('dictionaries.searchPlaceholder')}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleOpenFilters}
        >
          {t('common.filters')}
        </Button>
      </FiltersContainer>

      {loading ? (
        <Typography>{t('common.loading')}</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {filteredSchedules.map((schedule) => (
            <Card
              key={schedule.id}
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
                <CardContent>
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: schedule.color,
                        color: '#fff',
                        borderRadius: 10,
                        py: 1,
                        px: 3,
                        width: 'fit-content',
                        mx: 'auto',
                        filter: 'contrast(1.2)',
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{
                          color: '#fff',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        }}
                      >
                        {getDisplayName(schedule.name)}
                      </Typography>
                    </Box>

                    <Stack spacing={0.5}>
                      {schedule.weekSchedule.map((daySchedule) => (
                        <Box
                          key={daySchedule.day}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ minWidth: 40, fontWeight: 500 }}
                          >
                            {daySchedule.day}
                          </Typography>
                          {daySchedule.enabled ? (
                            <FlexRowCenter>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: schedule.color,
                                }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {hourToTimeString(daySchedule.startTime)} - {hourToTimeString(daySchedule.endTime)}
                              </Typography>
                            </FlexRowCenter>
                          ) : (
                            <Typography variant="body2" color="text.disabled">
                              {t('schedules.disabled')}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pt: 1,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <IconButton
                        icon={<EditIcon />}
                        size="small"
                        onClick={() => handleOpenDialog(schedule)}
                        aria-label={t('common.edit')}
                      />
                      <Switch
                        checked={!schedule.blocked}
                        onChange={() => handleBlock(schedule)}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

      <Dialog
        open={formDialog.open}
        onClose={handleCloseDialog}
        maxWidth="md"
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
            {formDialog.data?.id ? t('schedules.editTitle') : t('schedules.addTitle')}
          </Box>
          <MuiIconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <CloseIcon />
          </MuiIconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            pt: 0,
            pb: 0,
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit(handleFormSubmit)}
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 2, pt: 3, px: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {t('schedules.fields.name')} *
                  </Typography>
                  <MultilingualNameField
                    control={control}
                    name="name"
                    required
                  />
                </Box>

                <Controller
                  name="color"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {t('schedules.fields.color')}
                      </Typography>
                      <input
                        {...field}
                        type="color"
                        style={{
                          width: '100%',
                          height: '40px',
                          border: error ? `1px solid ${theme.palette.error.main}` : `1px solid ${theme.palette.divider}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      />
                      {error && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                          {error.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    {t('schedules.fields.weekSchedule')}
                  </Typography>
                  <Stack spacing={2}>
                    {DAYS.map((day, index) => (
                      <Box key={day}>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 100px 100px 100px 100px',
                            alignItems: 'center',
                            gap: 2,
                            mb: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SwitchField
                              control={control}
                              name={`weekSchedule.${index}.enabled`}
                              label={t(`schedules.days.${day.toLowerCase()}`)}
                            />
                          </Box>
                          {weekSchedule[index]?.enabled ? (
                            <>
                              <TimeSelectField
                                control={control}
                                name={`weekSchedule.${index}.startTime`}
                                options={timeOptions}
                              />
                              <TimeSelectField
                                control={control}
                                name={`weekSchedule.${index}.endTime`}
                                options={timeOptions}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  bgcolor: 'action.hover',
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: 10,
                                  textAlign: 'center',
                                }}
                              >
                                {calculateDuration(
                                  weekSchedule[index]?.startTime || '00:00',
                                  weekSchedule[index]?.endTime || '00:00'
                                )}
                              </Typography>
                            </>
                          ) : (
                            <Box sx={{ gridColumn: 'span 3' }} />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <FormField
                  name="blocked"
                  control={control}
                  type="checkbox"
                  label={t('schedules.fields.blocked')}
                />
              </Stack>
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
                onClick={handleCloseDialog}
                variant="outlined"
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {formDialog.data ? t('common.save') : t('common.add')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Filters Drawer */}
      <FilterDrawer
        open={filterDrawer.isOpen}
        onClose={filterDrawer.close}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        title={t('common.filters')}
      >
        <Select
          name="status"
          label={t('common.statusLabel')}
          value={tempFilters.status || 'active'}
          onChange={(value) => updateTempFilter('status', value as 'active' | 'blocked' | 'all')}
          options={[
            { value: 'active', label: t('common.active') },
            { value: 'blocked', label: t('common.blocked') },
            { value: 'all', label: t('common.all') },
          ]}
        />
      </FilterDrawer>

      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Box>
  );
});

SchedulesListPage.displayName = 'SchedulesListPage';

export default SchedulesListPage;

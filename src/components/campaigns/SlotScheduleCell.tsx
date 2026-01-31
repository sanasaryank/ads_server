/**
 * SlotScheduleCell Component
 * Displays slot toggle with schedule and placement selection dialogs
 * Optimized with proper memoization and hooks
 */

import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';
import { Schedule as ScheduleIcon, Close as CloseIcon, Category as CategoryIcon } from '@mui/icons-material';
import { Switch, Button } from '../ui/atoms';
import { PlacementsDialog } from './PlacementsDialog';
import { useDialogState, useDataSelection, useMultilingualName } from '../../hooks';
import type { Schedule, SlotType } from '../../types';

interface SlotScheduleCellProps {
  restaurantId: string | number;
  slotId: string | number;
  slotType: SlotType;
  enabled: boolean;
  selectedSchedules: string[];
  selectedPlacements: string[];
  schedules: Schedule[];
  onToggle: (restaurantId: string | number, slotId: string | number, enabled: boolean) => void;
  onSchedulesChange: (restaurantId: string | number, slotId: string | number, scheduleIds: string[]) => void;
  onPlacementsChange: (restaurantId: string | number, slotId: string | number, placementIds: string[]) => void;
  disabled?: boolean;
}

export const SlotScheduleCell = memo<SlotScheduleCellProps>(function SlotScheduleCell({
  restaurantId,
  slotId,
  slotType,
  enabled,
  selectedSchedules,
  selectedPlacements,
  schedules,
  onToggle,
  onSchedulesChange,
  onPlacementsChange,
  disabled = false,
}) {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();

  // Dialog state management
  const scheduleDialog = useDialogState();
  const placementsDialog = useDialogState();

  // Schedule selection state
  const scheduleSelection = useDataSelection<string>({
    initialSelected: selectedSchedules,
  });

  // Memoized values
  const activeSchedules = useMemo(
    () => schedules.filter((s) => !s.blocked),
    [schedules]
  );

  const showPlacementsIcon = useMemo(
    () => slotType === 'Selection' || slotType === 'Group',
    [slotType]
  );

  // Handlers
  const handleToggle = useCallback(() => {
    onToggle(restaurantId, slotId, !enabled);
  }, [restaurantId, slotId, enabled, onToggle]);

  const handleOpenScheduleDialog = useCallback(() => {
    scheduleSelection.setSelection(selectedSchedules);
    scheduleDialog.openDialog();
  }, [selectedSchedules, scheduleDialog, scheduleSelection]);

  const handleSaveSchedules = useCallback(() => {
    onSchedulesChange(restaurantId, slotId, scheduleSelection.selectedArray);
    scheduleDialog.closeDialog();
  }, [restaurantId, slotId, scheduleSelection.selectedArray, onSchedulesChange, scheduleDialog]);

  const handleSavePlacements = useCallback(
    (placementIds: string[]) => {
      onPlacementsChange(restaurantId, slotId, placementIds);
    },
    [restaurantId, slotId, onPlacementsChange]
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Switch
        checked={enabled}
        onChange={handleToggle}
        disabled={disabled}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={handleOpenScheduleDialog}
          disabled={disabled || !enabled}
          aria-label={t('campaigns.targeting.selectSchedules')}
        >
          <ScheduleIcon fontSize="small" />
        </IconButton>
        {enabled && selectedSchedules.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            ({selectedSchedules.length})
          </Typography>
        )}
      </Box>

      {showPlacementsIcon && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={placementsDialog.openDialog}
            disabled={disabled || !enabled}
            aria-label={t('campaigns.targeting.selectPlacements', 'Select Placements')}
          >
            <CategoryIcon fontSize="small" />
          </IconButton>
          {enabled && selectedPlacements.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              ({selectedPlacements.length})
            </Typography>
          )}
        </Box>
      )}

      <Dialog open={scheduleDialog.open} onClose={scheduleDialog.closeDialog} maxWidth="sm" fullWidth disableRestoreFocus container={() => document.getElementById('modal-root')}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('campaigns.targeting.selectSchedules')}
          <IconButton size="small" onClick={scheduleDialog.closeDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FormGroup>
            {activeSchedules.length > 0 ? (
              activeSchedules.map((schedule) => (
                <FormControlLabel
                  key={schedule.id}
                  control={
                    <Checkbox
                      checked={scheduleSelection.isSelected(schedule.id)}
                      onChange={() => scheduleSelection.toggle(schedule.id)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: schedule.color,
                        }}
                      />
                      <Typography>{getDisplayName(schedule.name)}</Typography>
                    </Box>
                  }
                />
              ))
            ) : (
              <Typography color="text.secondary">
                {t('campaigns.targeting.noSchedules')}
              </Typography>
            )}
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={scheduleDialog.closeDialog} variant="outlined">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSaveSchedules} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <PlacementsDialog
        open={placementsDialog.open}
        onClose={placementsDialog.closeDialog}
        onSave={handleSavePlacements}
        restaurantId={String(restaurantId)}
        slotType={slotType}
        selectedPlacements={selectedPlacements}
      />
    </Box>
  );
});

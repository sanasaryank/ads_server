import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import { Close as CloseIcon, Schedule as ScheduleIcon, Category as CategoryIcon } from '@mui/icons-material';
import { Button, Switch } from '../ui/atoms';
import { SearchField } from '../ui/molecules';
import { Select } from '../ui/atoms';
import { useFetch, useMultilingualName, useDialogState, useDataSelection } from '../../hooks';
import { formatTimestamp } from '../../utils/dateUtils';
import { PlacementsDialog } from '../campaigns/PlacementsDialog';
import { useAdvertisersStore } from '../../store/advertisersStore';
import { useDictionariesStore } from '../../store/dictionariesStore';
import type { RestaurantCampaign } from '../../types';

interface RestaurantCampaignsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (campaigns: { id: string; slots: { id: string; schedules: string[]; placements: string[] }[] }[]) => void;
  restaurantId: string | null;
  restaurantName: string;
}

export const RestaurantCampaignsModal = memo(({
  open,
  onClose,
  onSave,
  restaurantId,
  restaurantName,
}: RestaurantCampaignsModalProps) => {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  
  // Get data from stores instead of props
  const { advertisers } = useAdvertisersStore();
  const { slots, schedules } = useDictionariesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAdvertiserId, setFilterAdvertiserId] = useState<string | ''>('');
  const [filterSlotId, setFilterSlotId] = useState<string | ''>('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<Map<string, Map<string, { schedules: string[]; placements: string[] }>>>(new Map());
  
  // Dialog states using useDialogState
  const scheduleDialog = useDialogState<{ campaignId: string; slotId: string }>();
  const placementsDialog = useDialogState<{ campaignId: string; slotId: string }>();
  
  // Schedule selection using useDataSelection
  const scheduleSelection = useDataSelection<string>();

  // Fetch restaurant campaigns from API
  const { data: restaurantCampaigns = [] } = useFetch<RestaurantCampaign[]>(
    async () => {
      if (!open || !restaurantId) return [];
      const { restaurantsApi } = await import('../../api');
      return await restaurantsApi.getRestaurantCampaigns(restaurantId);
    },
    [open, restaurantId]
  );

  // Initialize selected campaigns with their slots and schedules when data loads
  useEffect(() => {
    if (restaurantCampaigns && restaurantCampaigns.length > 0) {
      const campaignMap = new Map<string, Map<string, { schedules: string[]; placements: string[] }>>();
      restaurantCampaigns.forEach(c => {
        if (!campaignMap.has(c.id)) {
          campaignMap.set(c.id, new Map());
        }
        const slotsMap = campaignMap.get(c.id)!;
        slotsMap.set(c.slot.id, { schedules: c.slot.schedules || [], placements: c.slot.placements || [] });
      });
      setSelectedCampaigns(campaignMap);
    }
  }, [restaurantCampaigns]);

  // Memoize filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (!restaurantCampaigns) return [];
    return restaurantCampaigns.filter((c) => {
      // Search filter
      if (searchTerm) {
        const nameInLang = getDisplayName(c.name).toLowerCase();
        if (!nameInLang.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }
      // Advertiser filter
      if (filterAdvertiserId && c.advertiserId !== filterAdvertiserId) {
        return false;
      }
      // Slot filter
      if (filterSlotId && c.slot.id !== filterSlotId) {
        return false;
      }
      return true;
    });
  }, [restaurantCampaigns, searchTerm, filterAdvertiserId, filterSlotId, getDisplayName]);

  // Memoized helper functions
  const getSlotName = useCallback((slotId: string) => {
    // Handle invalid IDs
    if (!slotId || slotId === 'undefined' || slotId === 'null') {
      return t('common.noData');
    }
    const slot = slots?.find((s) => s.id === slotId);
    return slot ? getDisplayName(slot.name) : t('common.noData');
  }, [slots, getDisplayName, t]);

  const getAdvertiserName = useCallback((advertiserId: string) => {
    const advertiser = advertisers?.find((a) => String(a.id) === advertiserId);
    return advertiser ? getDisplayName(advertiser.name) : `ID: ${advertiserId}`;
  }, [advertisers, getDisplayName]);

  const getSlotType = useCallback((slotId: string) => {
    const slot = slots?.find((s) => s.id === slotId);
    return slot?.type;
  }, [slots]);

  const shouldShowPlacementsIcon = useCallback((slotId: string) => {
    const slotType = getSlotType(slotId);
    return slotType === 'Selection' || slotType === 'Group';
  }, [getSlotType]);

  // Event handlers with useCallback
  const handleToggleCampaignSlot = useCallback((campaignId: string, slotId: string, schedules: string[], placements: string[]) => {
    setSelectedCampaigns((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(campaignId)) {
        newMap.set(campaignId, new Map());
      }
      const campaignSlots = newMap.get(campaignId)!;
      
      if (campaignSlots.has(slotId)) {
        campaignSlots.delete(slotId);
        // Remove campaign entirely if no slots left
        if (campaignSlots.size === 0) {
          newMap.delete(campaignId);
        }
      } else {
        campaignSlots.set(slotId, { schedules: schedules || [], placements: placements || [] });
      }
      return newMap;
    });
  }, []);

  const handleOpenScheduleDialog = useCallback((campaignId: string, slotId: string) => {
    const campaignSlots = selectedCampaigns.get(campaignId);
    const currentSlotData = campaignSlots?.get(slotId);
    const currentSchedules = currentSlotData?.schedules || [];
    
    // Set selection state
    scheduleSelection.deselectAll();
    currentSchedules.forEach(id => scheduleSelection.select(id));
    
    // Open dialog with context
    scheduleDialog.openDialog({ campaignId, slotId });
  }, [selectedCampaigns, scheduleSelection, scheduleDialog]);

  const handleSaveSchedules = useCallback(() => {
    if (scheduleDialog.data) {
      const { campaignId, slotId } = scheduleDialog.data;
      setSelectedCampaigns((prev) => {
        const newMap = new Map(prev);
        const campaignSlots = newMap.get(campaignId);
        if (campaignSlots) {
          const currentSlotData = campaignSlots.get(slotId);
          campaignSlots.set(slotId, {
            schedules: scheduleSelection.selectedArray,
            placements: currentSlotData?.placements || []
          });
        }
        return newMap;
      });
    }
    scheduleDialog.closeDialog();
  }, [scheduleDialog, scheduleSelection]);

  const handleOpenPlacementsDialog = useCallback((campaignId: string, slotId: string) => {
    placementsDialog.openDialog({ campaignId, slotId });
  }, [placementsDialog]);

  const handleSavePlacements = useCallback((placementIds: string[]) => {
    if (placementsDialog.data) {
      const { campaignId, slotId } = placementsDialog.data;
      setSelectedCampaigns((prev) => {
        const newMap = new Map(prev);
        const campaignSlots = newMap.get(campaignId);
        if (campaignSlots) {
          const currentSlotData = campaignSlots.get(slotId);
          campaignSlots.set(slotId, {
            schedules: currentSlotData?.schedules || [],
            placements: placementIds
          });
        }
        return newMap;
      });
    }
    placementsDialog.closeDialog();
  }, [placementsDialog, setSelectedCampaigns]);

  const handleSave = useCallback(() => {
    const campaigns = Array.from(selectedCampaigns.entries()).map(([campaignId, slotsMap]) => ({
      id: campaignId,
      slots: Array.from(slotsMap.entries()).map(([slotId, slotData]) => ({
        id: slotId,
        schedules: slotData.schedules,
        placements: slotData.placements,
      })),
    }));
    onSave(campaigns);
  }, [selectedCampaigns, onSave]);

  const handleClose = useCallback(() => {
    // Reset state on close
    setSearchTerm('');
    setFilterAdvertiserId('');
    setFilterSlotId('');
    if (restaurantCampaigns) {
      const campaignMap = new Map<string, Map<string, { schedules: string[]; placements: string[] }>>();
      restaurantCampaigns.forEach(c => {
        if (!campaignMap.has(c.id)) {
          campaignMap.set(c.id, new Map());
        }
        const slotsMap = campaignMap.get(c.id)!;
        slotsMap.set(c.slot.id, { schedules: c.slot.schedules || [], placements: c.slot.placements || [] });
      });
      setSelectedCampaigns(campaignMap);
    }
    onClose();
  }, [restaurantCampaigns, onClose]);

  const handleToggleAll = useCallback(() => {
    const allSelected = filteredCampaigns.every((c) => {
      const campaignSlots = selectedCampaigns.get(c.id);
      return campaignSlots?.has(c.slot.id);
    });
    
    if (allSelected) {
      // Deselect all filtered campaign-slot combinations
      setSelectedCampaigns((prev) => {
        const newMap = new Map(prev);
        filteredCampaigns.forEach(c => {
          const campaignSlots = newMap.get(c.id);
          if (campaignSlots) {
            campaignSlots.delete(c.slot.id);
            if (campaignSlots.size === 0) {
              newMap.delete(c.id);
            }
          }
        });
        return newMap;
      });
    } else {
      // Select all filtered campaign-slot combinations
      setSelectedCampaigns((prev) => {
        const newMap = new Map(prev);
        filteredCampaigns.forEach(c => {
          if (!newMap.has(c.id)) {
            newMap.set(c.id, new Map());
          }
          const campaignSlots = newMap.get(c.id)!;
          campaignSlots.set(c.slot.id, { schedules: c.slot.schedules || [], placements: c.slot.placements || [] });
        });
        return newMap;
      });
    }
  }, [filteredCampaigns, selectedCampaigns]);

  // Memoize computed values
  const allSelected = useMemo(() => {
    return filteredCampaigns.length > 0 && filteredCampaigns.every((c) => {
      const campaignSlots = selectedCampaigns.get(c.id);
      return campaignSlots?.has(c.slot.id);
    });
  }, [filteredCampaigns, selectedCampaigns]);

  const someSelected = useMemo(() => {
    return filteredCampaigns.some((c) => {
      const campaignSlots = selectedCampaigns.get(c.id);
      return campaignSlots?.has(c.slot.id);
    }) && !allSelected;
  }, [filteredCampaigns, selectedCampaigns, allSelected]);

  // Get active schedules for the dialog
  const activeSchedules = useMemo(() => {
    return (schedules || []).filter((s) => !s.blocked);
  }, [schedules]);

  // Memoize options to prevent unnecessary recalculations
  const advertiserOptions = useMemo(() => [
    { value: '', label: t('common.all') },
    ...(advertisers || []).map((a) => ({ 
      value: a.id, 
      label: getDisplayName(a.name) 
    })),
  ], [advertisers, getDisplayName, t]);

  const slotOptions = useMemo(() => [
    { value: '', label: t('common.all') },
    ...(slots || []).map((s) => ({ 
      value: s.id, 
      label: getDisplayName(s.name) 
    })),
  ], [slots, getDisplayName, t]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {t('restaurants.campaignTargeting')} - {restaurantName}
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('campaigns.searchPlaceholder')}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ minWidth: 200 }}>
              <Select
                name="advertiser"
                label={t('campaigns.fields.advertiser')}
                value={filterAdvertiserId}
                onChange={(value) => setFilterAdvertiserId(value as string)}
                options={advertiserOptions}
              />
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Select
                name="slot"
                label={t('campaigns.fields.slot')}
                value={filterSlotId}
                onChange={(value) => setFilterSlotId(value as string)}
                options={slotOptions}
              />
            </Box>
          </Box>

          {filteredCampaigns.length > 0 ? (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={handleToggleAll}
                      />
                    </TableCell>
                    <TableCell>{t('campaigns.fields.name')}</TableCell>
                    <TableCell>{t('campaigns.fields.advertiser')}</TableCell>
                    <TableCell>{t('campaigns.fields.slot')}</TableCell>
                    <TableCell>{t('campaigns.fields.startDate')}</TableCell>
                    <TableCell>{t('campaigns.fields.endDate')}</TableCell>
                    <TableCell align="center">{t('common.active')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCampaigns.map((campaign) => {
                    const campaignSlots = selectedCampaigns.get(campaign.id);
                    const isSelected = campaignSlots?.has(campaign.slot.id) || false;
                    const slotData = campaignSlots?.get(campaign.slot.id);
                    const scheduleCount = slotData?.schedules.length || 0;
                    
                    return (
                      <TableRow key={`${campaign.id}-${campaign.slot.id}`} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleCampaignSlot(campaign.id, campaign.slot.id, campaign.slot.schedules, campaign.slot.placements)}
                          />
                        </TableCell>
                        <TableCell>{getDisplayName(campaign.name)}</TableCell>
                        <TableCell>{getAdvertiserName(campaign.advertiserId)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{getSlotName(campaign.slot.id)}</Typography>
                            {isSelected && (
                              <>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenScheduleDialog(campaign.id, campaign.slot.id)}
                                    aria-label={t('campaigns.targeting.selectSchedules')}
                                  >
                                    <ScheduleIcon fontSize="small" />
                                  </IconButton>
                                  {scheduleCount > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      ({scheduleCount})
                                    </Typography>
                                  )}
                                </Box>
                                {shouldShowPlacementsIcon(campaign.slot.id) && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenPlacementsDialog(campaign.id, campaign.slot.id)}
                                      aria-label={t('campaigns.targeting.selectPlacements', 'Select Placements')}
                                    >
                                      <CategoryIcon fontSize="small" />
                                    </IconButton>
                                    {(slotData?.placements.length || 0) > 0 && (
                                      <Typography variant="caption" color="text.secondary">
                                        ({slotData?.placements.length || 0})
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{formatTimestamp(campaign.startDate)}</TableCell>
                        <TableCell>{formatTimestamp(campaign.endDate)}</TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={!campaign.isBlocked}
                            onChange={() => {}}
                            disabled
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <Typography color="text.secondary">
                {t('campaigns.noCampaignsFound')}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>

      {/* Schedule Selection Dialog */}
      <Dialog open={scheduleDialog.open} onClose={scheduleDialog.closeDialog} maxWidth="sm" fullWidth>
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
                      checked={scheduleSelection.isSelected(String(schedule.id))}
                      onChange={() => scheduleSelection.toggle(String(schedule.id))}
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

      {/* Placements Selection Dialog */}
      {placementsDialog.data && restaurantId && (
        <PlacementsDialog
          open={placementsDialog.open}
          onClose={placementsDialog.closeDialog}
          onSave={handleSavePlacements}
          restaurantId={restaurantId}
          slotType={getSlotType(placementsDialog.data.slotId) || 'MainLarge'}
          selectedPlacements={
            selectedCampaigns.get(placementsDialog.data.campaignId)?.get(placementsDialog.data.slotId)?.placements || []
          }
        />
      )}
    </Dialog>
  );
});

/**
 * PlacementsDialog component
 * Dialog for selecting placements (Selections or Groups) for campaign targeting
 * Optimized with proper hooks and memoization
 */

import { memo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  CircularProgress,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { realPlacementsApi } from '../../api/real/placements';
import { useFetch, useDataSelection, useMultilingualName } from '../../hooks';
import type { Placement, SlotType } from '../../types';

interface PlacementsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (placementIds: string[]) => void;
  restaurantId: string;
  slotType: SlotType;
  selectedPlacements: string[];
}

export const PlacementsDialog = memo<PlacementsDialogProps>(function PlacementsDialog({
  open,
  onClose,
  onSave,
  restaurantId,
  slotType,
  selectedPlacements,
}) {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();

  // Fetch placements data
  const { data: placements, loading, error } = useFetch<Placement[]>(
    async () => {
      if (!open) return [];
      const type = slotType === 'Selection' ? 'selections' : 'groups';
      return await realPlacementsApi.getPlacements(type, restaurantId);
    },
    [open, restaurantId, slotType]
  );

  const placementsList = placements || [];

  // Manage placement selection
  const selection = useDataSelection<string>({
    initialSelected: selectedPlacements,
  });

  // Manage expanded accordion state
  const expandedAccordions = useDataSelection<string>();

  // Sync selection with props when dialog opens
  useEffect(() => {
    if (open) {
      selection.setSelection(selectedPlacements);
    }
  }, [open, selectedPlacements]);

  const handleSave = () => {
    onSave(selection.selectedArray);
    onClose();
  };

  const handleCancel = () => {
    selection.setSelection(selectedPlacements);
    onClose();
  };

  const getDialogTitle = () => {
    return slotType === 'Selection'
      ? t('campaigns.selectSelections', 'Select Selections')
      : t('campaigns.selectGroups', 'Select Groups');
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error.message}
          </Typography>
        )}

        {!loading && !error && placementsList.length === 0 && (
          <Typography color="text.secondary">
            {t('campaigns.noPlacementsAvailable', 'No placements available')}
          </Typography>
        )}

        {!loading && !error && placementsList.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {placementsList.map((placement) => {
              const isExpanded = expandedAccordions.isSelected(placement.id);
              const isSelected = selection.isSelected(placement.id);
              const dishesCount = placement.dishes?.length || 0;

              return (
                <Accordion
                  key={placement.id}
                  expanded={isExpanded}
                  onChange={() => expandedAccordions.toggle(placement.id)}
                  disabled={placement.isBlocked}
                  sx={{
                    '&:before': { display: 'none' },
                    boxShadow: 1,
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      '&.Mui-disabled': {
                        opacity: 0.6,
                      },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            selection.toggle(placement.id);
                          }}
                          disabled={placement.isBlocked}
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {getDisplayName(placement.name)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dishesCount} {t('campaigns.dishes', 'dishes')}
                          </Typography>
                        </Box>
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ pl: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {(placement.dishes || []).map((dish) => (
                        <Box key={dish.id} sx={{ py: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {getDisplayName(dish.name)}
                            {dish.isOver18 && (
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{ ml: 1, color: 'warning.main', fontWeight: 600 }}
                              >
                                18+
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {t('campaigns.menu', 'Menu')}: {getDisplayName(dish.menu?.name)} | {t('campaigns.group', 'Group')}: {getDisplayName(dish.group?.name)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('campaigns.price', 'Price')}: {dish.price}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>{t('common.cancel', 'Cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {t('common.save', 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

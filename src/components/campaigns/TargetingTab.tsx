import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  Paper,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Button } from '../ui/atoms';
import { SearchField } from '../ui/molecules';
import { RestaurantInfoPopover } from './RestaurantInfoPopover';
import { SlotScheduleCell } from './SlotScheduleCell';
import { AddRestaurantsModal } from './AddRestaurantsModal';
import { useCampaignTargeting, useMultilingualName } from '../../hooks';
import type {
  Restaurant,
  DictionaryItem,
  CampaignTarget,
  Schedule,
  Slot,
} from '../../types';

interface TargetingTabProps {
  targets: CampaignTarget[];
  onChange: (targets: CampaignTarget[]) => void;
  restaurants: Restaurant[];
  cities: DictionaryItem[];
  districts: DictionaryItem[];
  restaurantTypes: DictionaryItem[];
  menuTypes: DictionaryItem[];
  priceSegments: DictionaryItem[];
  slots: Slot[];
  schedules: Schedule[];
  campaignTargetingRules?: {
    locationsMode: 'allowed' | 'denied';
    locations: number[];
    restaurantTypesMode: 'allowed' | 'denied';
    restaurantTypes: number[];
    menuTypesMode: 'allowed' | 'denied';
    menuTypes: number[];
  };
}

export const TargetingTab = memo(({
  targets,
  onChange,
  restaurants,
  cities,
  districts,
  restaurantTypes,
  menuTypes,
  priceSegments,
  slots,
  schedules,
  campaignTargetingRules,
}: TargetingTabProps) => {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Use campaign targeting hook
  const targeting = useCampaignTargeting({
    initialTargets: targets,
    onTargetsChange: onChange,
  });

  // Memoize targeted restaurants
  const targetedRestaurants = useMemo(
    () => restaurants.filter((r) => targeting.targetedRestaurantIds.includes(String(r.id))),
    [restaurants, targeting.targetedRestaurantIds]
  );

  // Memoize filtered restaurants based on search
  const filteredRestaurants = useMemo(() => {
    if (!searchTerm) return targetedRestaurants;
    return targetedRestaurants.filter((r) => {
      const name = typeof r.name === 'string' ? r.name : getDisplayName(r.name as any);
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [targetedRestaurants, searchTerm, getDisplayName]);

  // Memoize selection states
  const allSelected = useMemo(
    () => filteredRestaurants.length > 0 && filteredRestaurants.every((r) => targeting.targetedRestaurantIds.includes(String(r.id))),
    [filteredRestaurants, targeting.targetedRestaurantIds]
  );

  const someSelected = useMemo(
    () => filteredRestaurants.some((r) => targeting.targetedRestaurantIds.includes(String(r.id))) && !allSelected,
    [filteredRestaurants, targeting.targetedRestaurantIds, allSelected]
  );

  // Handlers with useCallback
  const handleToggleAll = useCallback(() => {
    filteredRestaurants.forEach((r) => {
      const idStr = String(r.id);
      const isTargeted = targeting.targetedRestaurantIds.includes(idStr);
      if (allSelected && isTargeted) {
        targeting.toggleRestaurant(idStr);
      } else if (!allSelected && !isTargeted) {
        targeting.toggleRestaurant(idStr);
      }
    });
  }, [allSelected, filteredRestaurants, targeting]);

  const handleAddRestaurants = useCallback((restaurantIds: number[]) => {
    restaurantIds.forEach((id) => {
      const idStr = String(id);
      if (!targeting.targetedRestaurantIds.includes(idStr)) {
        targeting.toggleRestaurant(idStr);
      }
    });
  }, [targeting]);

  const handleOpenAddModal = useCallback(() => setAddModalOpen(true), []);
  const handleCloseAddModal = useCallback(() => setAddModalOpen(false), []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('campaigns.targeting.searchRestaurants')}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddModal}
        >
          {t('common.add')}
        </Button>
      </Box>

      {filteredRestaurants.length > 0 ? (
        <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={handleToggleAll}
                  />
                </TableCell>
                <TableCell>{t('restaurants.fields.name')}</TableCell>
                {slots.map((slot) => (
                  <TableCell key={slot.id} align="center">
                    {getDisplayName(slot.name)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRestaurants.map((restaurant) => {
                const isTargeted = targeting.isRestaurantTargeted(String(restaurant.id));
                return (
                  <TableRow key={restaurant.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isTargeted}
                        onChange={() => targeting.toggleRestaurant(String(restaurant.id))}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>
                          {typeof restaurant.name === 'string' ? restaurant.name : getDisplayName(restaurant.name as any)}
                        </Typography>
                        <RestaurantInfoPopover
                          restaurant={restaurant}
                          cities={cities}
                          districts={districts}
                          restaurantTypes={restaurantTypes}
                          menuTypes={menuTypes}
                          priceSegments={priceSegments}
                        />
                      </Box>
                    </TableCell>
                    {slots.map((slot) => {
                      const slotInfo = targeting.getSlotInfo(String(restaurant.id), String(slot.id));
                      return (
                        <TableCell key={`${restaurant.id}-${slot.id}`} align="center">
                          <SlotScheduleCell
                            key={`cell-${restaurant.id}-${slot.id}`}
                            restaurantId={restaurant.id}
                            slotId={slot.id}
                            slotType={slot.type}
                            enabled={slotInfo.enabled}
                            selectedSchedules={slotInfo.schedules}
                            selectedPlacements={slotInfo.placements}
                            schedules={schedules}
                            onToggle={targeting.toggleSlot}
                            onSchedulesChange={targeting.updateSchedules}
                            onPlacementsChange={targeting.updatePlacements}
                            disabled={!isTargeted}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">
            {targetedRestaurants.length === 0
              ? t('campaigns.targeting.noRestaurantsAdded')
              : t('campaigns.targeting.noRestaurantsFound')}
          </Typography>
        </Box>
      )}

      <AddRestaurantsModal
        open={addModalOpen}
        onClose={handleCloseAddModal}
        onAdd={handleAddRestaurants}
        restaurants={restaurants}
        districts={districts}
        restaurantTypes={restaurantTypes}
        menuTypes={menuTypes}
        excludeIds={targeting.targetedRestaurantIds.map(id => Number(id))}
        defaultFilters={campaignTargetingRules}
      />
    </Box>
  );
});

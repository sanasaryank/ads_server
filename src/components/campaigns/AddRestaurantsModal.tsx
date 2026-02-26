import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../common/ErrorBoundary';
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Button, Select } from '../ui/atoms';
import { SearchField } from '../ui/molecules';
import { useMultilingualName, useDataSelection } from '../../hooks';
import { useDictionariesStore } from '../../store/dictionariesStore';
import { useRestaurantsStore } from '../../store/restaurantsStore';

interface AddRestaurantsModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (restaurantIds: string[]) => void;
  excludeIds?: string[];
  defaultFilters?: {
    locationsMode: 'allowed' | 'denied';
    locations: string[];
    restaurantTypesMode: 'allowed' | 'denied';
    restaurantTypes: string[];
    menuTypesMode: 'allowed' | 'denied';
    menuTypes: string[];
  };
}

export const AddRestaurantsModal = memo(({
  open,
  onClose,
  onAdd,
  excludeIds = [],
  defaultFilters,
}: AddRestaurantsModalProps) => {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  
  // Get data from stores instead of props
  const { restaurants } = useRestaurantsStore();
  const { locations, restaurantTypes, menuTypes } = useDictionariesStore();
  const districts = locations;
  
  // Use useDataSelection for restaurant selection
  const restaurantSelection = useDataSelection<string>();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    locationsMode: (defaultFilters?.locationsMode || 'allowed') as 'allowed' | 'denied',
    locations: defaultFilters?.locations || [],
    restaurantTypesMode: (defaultFilters?.restaurantTypesMode || 'allowed') as 'allowed' | 'denied',
    restaurantTypes: defaultFilters?.restaurantTypes || [],
    menuTypesMode: (defaultFilters?.menuTypesMode || 'allowed') as 'allowed' | 'denied',
    menuTypes: defaultFilters?.menuTypes || [],
  });

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      // Exclude already added restaurants
      if (excludeIds.includes(restaurant.id)) return false;

      // Search filter
      if (searchTerm) {
        const name = typeof restaurant.name === 'string' ? restaurant.name : getDisplayName(restaurant.name as any);
        if (!name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Location filter (districts)
      if (filters.locations.length > 0) {
        const matchesLocation = filters.locations.includes(restaurant.districtId);
        if (filters.locationsMode === 'allowed' && !matchesLocation) return false;
        if (filters.locationsMode === 'denied' && matchesLocation) return false;
      }

      // Restaurant type filter
      if (filters.restaurantTypes.length > 0) {
        const typeIds = Array.isArray(restaurant.typeId) ? restaurant.typeId : [restaurant.typeId];
        const matchesType = typeIds.some((typeId: string) => filters.restaurantTypes.includes(typeId));
        if (filters.restaurantTypesMode === 'allowed' && !matchesType) return false;
        if (filters.restaurantTypesMode === 'denied' && matchesType) return false;
      }

      // Menu type filter
      if (filters.menuTypes.length > 0) {
        const menuTypeIds = Array.isArray(restaurant.menuTypeId) ? restaurant.menuTypeId : [restaurant.menuTypeId];
        const matchesMenuType = menuTypeIds.some((menuTypeId: string) => filters.menuTypes.includes(menuTypeId));
        if (filters.menuTypesMode === 'allowed' && !matchesMenuType) return false;
        if (filters.menuTypesMode === 'denied' && matchesMenuType) return false;
      }

      return true;
    });
  }, [restaurants, excludeIds, searchTerm, filters, getDisplayName]);

  // Memoize options to prevent unnecessary recalculations
  const districtOptions = useMemo(() => 
    districts.map((d) => ({ value: d.id, label: getDisplayName(d.name) })),
  [districts, getDisplayName]);

  const restaurantTypeOptions = useMemo(() => 
    restaurantTypes.map((t) => ({ value: t.id, label: getDisplayName(t.name) })),
  [restaurantTypes, getDisplayName]);

  const menuTypeOptions = useMemo(() => 
    menuTypes.map((m) => ({ value: m.id, label: getDisplayName(m.name) })),
  [menuTypes, getDisplayName]);

  const handleToggleAll = useCallback(() => {
    if (restaurantSelection.count === filteredRestaurants.length) {
      restaurantSelection.deselectAll();
    } else {
      filteredRestaurants.forEach(r => restaurantSelection.select(r.id));
    }
  }, [restaurantSelection, filteredRestaurants]);

  const handleToggle = useCallback((id: string) => {
    restaurantSelection.toggle(id);
  }, [restaurantSelection]);

  const handleClose = useCallback(() => {
    restaurantSelection.deselectAll();
    setSearchTerm('');
    setFilters({
      locationsMode: (defaultFilters?.locationsMode || 'allowed') as 'allowed' | 'denied',
      locations: defaultFilters?.locations || [],
      restaurantTypesMode: (defaultFilters?.restaurantTypesMode || 'allowed') as 'allowed' | 'denied',
      restaurantTypes: defaultFilters?.restaurantTypes || [],
      menuTypesMode: (defaultFilters?.menuTypesMode || 'allowed') as 'allowed' | 'denied',
      menuTypes: defaultFilters?.menuTypes || [],
    });
    onClose();
  }, [restaurantSelection, defaultFilters, onClose]);

  const handleAdd = useCallback(() => {
    onAdd(restaurantSelection.selectedArray);
    handleClose();
  }, [onAdd, restaurantSelection, handleClose]);

  // No need for city filtering since we use districts directly

  return (
    <ErrorBoundary>
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableRestoreFocus container={() => document.getElementById('modal-root')}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t('campaigns.targeting.addRestaurants')}
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('campaigns.targeting.searchRestaurants')}
          />

          {/* Locations (Districts) Filter */}
          <Box>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 1 }}>{t('campaigns.fields.locations')}</FormLabel>
              <RadioGroup
                row
                value={filters.locationsMode}
                onChange={(e) => setFilters((prev) => ({ ...prev, locationsMode: e.target.value as 'allowed' | 'denied' }))}
                sx={{ mb: 1 }}
              >
                <FormControlLabel value="allowed" control={<Radio />} label={t('campaigns.modes.allowed')} />
                <FormControlLabel value="denied" control={<Radio />} label={t('campaigns.modes.denied')} />
              </RadioGroup>
              <Select
                name="locations"
                label={t('restaurants.fields.district')}
                value={filters.locations}
                onChange={(value) => setFilters((prev) => ({ ...prev, locations: Array.isArray(value) ? value.map(String) : [String(value)] }))}
                options={districtOptions}
                multiple
              />
            </FormControl>
          </Box>

          {/* Restaurant Types Filter */}
          <Box>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 1 }}>{t('campaigns.fields.restaurantTypes')}</FormLabel>
              <RadioGroup
                row
                value={filters.restaurantTypesMode}
                onChange={(e) => setFilters((prev) => ({ ...prev, restaurantTypesMode: e.target.value as 'allowed' | 'denied' }))}
                sx={{ mb: 1 }}
              >
                <FormControlLabel value="allowed" control={<Radio />} label={t('campaigns.modes.allowed')} />
                <FormControlLabel value="denied" control={<Radio />} label={t('campaigns.modes.denied')} />
              </RadioGroup>
              <Select
                name="restaurantTypes"
                label={t('restaurants.fields.types')}
                value={filters.restaurantTypes}
                onChange={(value) => setFilters((prev) => ({ ...prev, restaurantTypes: Array.isArray(value) ? value.map(String) : [String(value)] }))}
                options={restaurantTypeOptions}
                multiple
              />
            </FormControl>
          </Box>

          {/* Menu Types Filter */}
          <Box>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 1 }}>{t('campaigns.fields.menuTypes')}</FormLabel>
              <RadioGroup
                row
                value={filters.menuTypesMode}
                onChange={(e) => setFilters((prev) => ({ ...prev, menuTypesMode: e.target.value as 'allowed' | 'denied' }))}
                sx={{ mb: 1 }}
              >
                <FormControlLabel value="allowed" control={<Radio />} label={t('campaigns.modes.allowed')} />
                <FormControlLabel value="denied" control={<Radio />} label={t('campaigns.modes.denied')} />
              </RadioGroup>
              <Select
                name="menuTypes"
                label={t('restaurants.fields.menuTypes')}
                value={filters.menuTypes}
                onChange={(value) => setFilters((prev) => ({ ...prev, menuTypes: Array.isArray(value) ? value.map(String) : [String(value)] }))}
                options={menuTypeOptions}
                multiple
              />
            </FormControl>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Checkbox
                checked={restaurantSelection.count === filteredRestaurants.length && filteredRestaurants.length > 0}
                indeterminate={restaurantSelection.count > 0 && restaurantSelection.count < filteredRestaurants.length}
                onChange={handleToggleAll}
              />
              <Typography variant="subtitle2">
                {t('campaigns.targeting.selectAll')} ({restaurantSelection.count}/{filteredRestaurants.length})
              </Typography>
            </Box>

            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredRestaurants.length > 0 ? (
                <Stack spacing={0.5}>
                  {filteredRestaurants.map((restaurant) => (
                    <Box
                      key={restaurant.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Checkbox
                        checked={restaurantSelection.isSelected(restaurant.id)}
                        onChange={() => handleToggle(restaurant.id)}
                      />
                      <Typography>
                        {typeof restaurant.name === 'string' ? restaurant.name : getDisplayName(restaurant.name as any)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  {t('campaigns.targeting.noRestaurantsFound')}
                </Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          {t('common.cancel')}
        </Button>
        <Button onClick={handleAdd} variant="contained" disabled={restaurantSelection.count === 0}>
          {t('campaigns.targeting.addSelected')} ({restaurantSelection.count})
        </Button>
      </DialogActions>
    </Dialog>
    </ErrorBoundary>
  );
});

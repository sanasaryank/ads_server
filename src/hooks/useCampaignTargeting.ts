/**
 * useCampaignTargeting Hook
 * Manages campaign targeting state (restaurants, slots, schedules, placements)
 * Reusable across TargetingTab and RestaurantCampaignsModal
 */

import { useState, useCallback, useMemo } from 'react';
import type { CampaignTarget } from '../types';

export interface UseCampaignTargetingOptions {
  initialTargets?: CampaignTarget[];
  onTargetsChange?: (targets: CampaignTarget[]) => void;
}

export interface UseCampaignTargetingReturn {
  targets: CampaignTarget[];
  setTargets: (targets: CampaignTarget[]) => void;
  toggleRestaurant: (restaurantId: number | string) => void;
  toggleSlot: (restaurantId: string | number, slotId: string | number, enabled: boolean) => void;
  updateSchedules: (restaurantId: string | number, slotId: string | number, scheduleIds: string[]) => void;
  updatePlacements: (restaurantId: string | number, slotId: string | number, placementIds: string[]) => void;
  getSlotInfo: (restaurantId: string | number, slotId: string | number) => {
    enabled: boolean;
    schedules: string[];
    placements: string[];
  };
  isRestaurantTargeted: (restaurantId: number | string) => boolean;
  targetedRestaurantIds: string[];
}

export function useCampaignTargeting(options: UseCampaignTargetingOptions = {}): UseCampaignTargetingReturn {
  const { initialTargets = [], onTargetsChange } = options;
  const [targets, setTargetsInternal] = useState<CampaignTarget[]>(initialTargets);

  const setTargets = useCallback((newTargets: CampaignTarget[]) => {
    setTargetsInternal(newTargets);
    onTargetsChange?.(newTargets);
  }, [onTargetsChange]);

  const targetedRestaurantIds = useMemo(
    () => targets.map((t) => t.id),
    [targets]
  );

  const isRestaurantTargeted = useCallback(
    (restaurantId: number | string) => {
      return targetedRestaurantIds.includes(String(restaurantId));
    },
    [targetedRestaurantIds]
  );

  const toggleRestaurant = useCallback(
    (restaurantId: number | string) => {
      const restaurantIdStr = String(restaurantId);
      const isTargeted = targetedRestaurantIds.includes(restaurantIdStr);
      
      const newTargets = isTargeted
        ? targets.filter((t) => t.id !== restaurantIdStr)
        : [...targets, { id: restaurantIdStr, slots: [] }];
      
      setTargets(newTargets);
    },
    [targets, targetedRestaurantIds, setTargets]
  );

  const toggleSlot = useCallback(
    (restaurantId: string | number, slotId: string | number, enabled: boolean) => {
      const restaurantIdStr = String(restaurantId);
      const slotIdStr = String(slotId);
      const targetIndex = targets.findIndex((t) => t.id === restaurantIdStr);

      if (targetIndex === -1) {
        if (enabled) {
          setTargets([
            ...targets,
            {
              id: restaurantIdStr,
              slots: [{ id: slotIdStr, schedules: [], placements: [] }],
            },
          ]);
        }
        return;
      }

      const target = targets[targetIndex];
      const slotIndex = target.slots.findIndex((s) => s.id === slotIdStr);

      let newSlots;
      if (enabled) {
        if (slotIndex === -1) {
          newSlots = [...target.slots, { id: slotIdStr, schedules: [], placements: [] }];
        } else {
          newSlots = target.slots;
        }
      } else {
        if (slotIndex !== -1) {
          newSlots = target.slots.filter((s) => s.id !== slotIdStr);
        } else {
          newSlots = target.slots;
        }
      }

      if (newSlots !== target.slots) {
        const newTargets = [
          ...targets.slice(0, targetIndex),
          { ...target, slots: newSlots },
          ...targets.slice(targetIndex + 1),
        ];
        setTargets(newTargets);
      }
    },
    [targets, setTargets]
  );

  const updateSchedules = useCallback(
    (restaurantId: string | number, slotId: string | number, scheduleIds: string[]) => {
      const restaurantIdStr = String(restaurantId);
      const slotIdStr = String(slotId);
      
      const newTargets = targets.map((target) => {
        if (target.id !== restaurantIdStr) return target;
        
        return {
          ...target,
          slots: target.slots.map((slot) => {
            if (slot.id !== slotIdStr) return slot;
            return { ...slot, schedules: scheduleIds };
          }),
        };
      });
      
      setTargets(newTargets);
    },
    [targets, setTargets]
  );

  const updatePlacements = useCallback(
    (restaurantId: string | number, slotId: string | number, placementIds: string[]) => {
      const restaurantIdStr = String(restaurantId);
      const slotIdStr = String(slotId);
      
      const newTargets = targets.map((target) => {
        if (target.id !== restaurantIdStr) return target;
        
        return {
          ...target,
          slots: target.slots.map((slot) => {
            if (slot.id !== slotIdStr) return slot;
            return { ...slot, placements: placementIds };
          }),
        };
      });
      
      setTargets(newTargets);
    },
    [targets, setTargets]
  );

  const getSlotInfo = useCallback(
    (restaurantId: string | number, slotId: string | number) => {
      const restaurantIdStr = String(restaurantId);
      const slotIdStr = String(slotId);
      const target = targets.find((t) => t.id === restaurantIdStr);
      
      if (!target) {
        return { enabled: false, schedules: [], placements: [] };
      }

      const slot = target.slots.find((s) => s.id === slotIdStr);
      return {
        enabled: !!slot,
        schedules: slot?.schedules || [],
        placements: slot?.placements || [],
      };
    },
    [targets]
  );

  return {
    targets,
    setTargets,
    toggleRestaurant,
    toggleSlot,
    updateSchedules,
    updatePlacements,
    getSlotInfo,
    isRestaurantTargeted,
    targetedRestaurantIds,
  };
}

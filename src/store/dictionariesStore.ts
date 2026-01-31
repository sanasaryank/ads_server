/**
 * Dictionaries Store
 * 
 * Central store for dictionary data to avoid prop drilling.
 * Stores locations, restaurant types, menu types, price segments, cities, slots, and schedules.
 */

import { create } from 'zustand';
import type { Slot, Schedule, District, City, DictionaryItem } from '../types';

interface DictionariesState {
  // Data
  locations: District[];
  restaurantTypes: DictionaryItem[];
  menuTypes: DictionaryItem[];
  priceSegments: DictionaryItem[];
  cities: City[];
  slots: Slot[];
  schedules: Schedule[];
  
  // Loading states
  loading: boolean;
  
  // Actions
  setLocations: (locations: District[]) => void;
  setRestaurantTypes: (types: DictionaryItem[]) => void;
  setMenuTypes: (types: DictionaryItem[]) => void;
  setPriceSegments: (segments: DictionaryItem[]) => void;
  setCities: (cities: City[]) => void;
  setSlots: (slots: Slot[]) => void;
  setSchedules: (schedules: Schedule[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Batch update for initial load
  setAllDictionaries: (data: {
    locations?: District[];
    restaurantTypes?: DictionaryItem[];
    menuTypes?: DictionaryItem[];
    priceSegments?: DictionaryItem[];
    cities?: City[];
    slots?: Slot[];
    schedules?: Schedule[];
  }) => void;
  
  // Clear all data
  clear: () => void;
}

export const useDictionariesStore = create<DictionariesState>((set) => ({
  // Initial state
  locations: [],
  restaurantTypes: [],
  menuTypes: [],
  priceSegments: [],
  cities: [],
  slots: [],
  schedules: [],
  loading: false,
  
  // Actions
  setLocations: (locations) => set({ locations }),
  setRestaurantTypes: (types) => set({ restaurantTypes: types }),
  setMenuTypes: (types) => set({ menuTypes: types }),
  setPriceSegments: (segments) => set({ priceSegments: segments }),
  setCities: (cities) => set({ cities }),
  setSlots: (slots) => set({ slots }),
  setSchedules: (schedules) => set({ schedules }),
  setLoading: (loading) => set({ loading }),
  
  setAllDictionaries: (data) => set((state) => ({
    ...state,
    ...data,
  })),
  
  clear: () => set({
    locations: [],
    restaurantTypes: [],
    menuTypes: [],
    priceSegments: [],
    cities: [],
    slots: [],
    schedules: [],
    loading: false,
  }),
}));

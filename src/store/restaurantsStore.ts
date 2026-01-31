/**
 * Restaurants Store
 * 
 * Central store for restaurants data to avoid prop drilling.
 */

import { create } from 'zustand';

interface RestaurantsState {
  // Data
  restaurants: any[];
  
  // Loading state
  loading: boolean;
  
  // Actions
  setRestaurants: (restaurants: any[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Helper to get restaurant by ID
  getRestaurantById: (id: string) => any;
  
  // Clear data
  clear: () => void;
}

export const useRestaurantsStore = create<RestaurantsState>((set, get) => ({
  // Initial state
  restaurants: [],
  loading: false,
  
  // Actions
  setRestaurants: (restaurants) => set({ restaurants }),
  setLoading: (loading) => set({ loading }),
  
  getRestaurantById: (id) => {
    return get().restaurants.find((r) => String(r.id) === String(id));
  },
  
  clear: () => set({
    restaurants: [],
    loading: false,
  }),
}));

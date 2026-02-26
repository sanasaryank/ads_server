/**
 * Advertisers Store
 * 
 * Central store for advertisers data to avoid prop drilling.
 */

import { create } from 'zustand';
import type { Advertiser } from '../types';

interface AdvertisersState {
  // Data
  advertisers: Advertiser[];
  
  // Loading state
  loading: boolean;
  
  // Actions
  setAdvertisers: (advertisers: Advertiser[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Helper to get advertiser by ID
  getAdvertiserById: (id: string) => Advertiser | undefined;
  
  // Clear data
  clear: () => void;
}

export const useAdvertisersStore = create<AdvertisersState>((set, get) => ({
  // Initial state
  advertisers: [],
  loading: false,
  
  // Actions
  setAdvertisers: (advertisers) => set({ advertisers }),
  setLoading: (loading) => set({ loading }),
  
  getAdvertiserById: (id) => {
    return get().advertisers.find((a) => a.id === id);
  },
  
  clear: () => set({
    advertisers: [],
    loading: false,
  }),
}));

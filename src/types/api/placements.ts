/**
 * API types for Placements (Selections and Groups)
 * These types represent the structure returned by the backend API
 */

import type { DictionaryName, PlacementImageData } from '../index';

/**
 * Dish structure from API
 */
export interface ApiDish {
  id: string;
  name: DictionaryName;
  menu: {
    id: string;
    name: DictionaryName;
  };
  group: {
    id: string;
    name: DictionaryName;
  };
  isOver18: boolean;
  price: number;
  imageData?: PlacementImageData[] | null;
}

/**
 * Placement structure from API
 * Used for both /ads/selections/{id} and /ads/groups/{id} endpoints
 * 
 * Note: imageData is on each dish, not on the placement itself
 * Each dish can have an imageData array with image or video objects
 * - For videos: { link: "video_url" }
 * - For images: { image: "image_url" } or { image: "image_url", rect: {...} }
 * - rect contains x, y, width, height (all in percent 0-100)
 * - If rect.width > 0 and rect.height > 0, crop the image by rect
 */
export interface ApiPlacement {
  id: string;
  name: DictionaryName;
  dishes: ApiDish[];
  isBlocked: boolean;
}

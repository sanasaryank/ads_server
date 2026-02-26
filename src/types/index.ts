// Base types
export interface BaseEntity {
  id: number;
  blocked: boolean;
}

// Export API types
export * from './api';

// Employee
export interface Employee extends BaseEntity {
  firstName: string;
  lastName: string;
  username: string;
  password?: string; // Optional when fetching, required when creating
}

// Dictionary types
export interface DictionaryName {
  ARM: string;
  ENG: string;
  RUS: string;
}

export interface DictionaryItem {
  id: string;
  name: DictionaryName;
  isBlocked: boolean;
  description?: string;
}

export interface Country {
  id: string;
  name: string;
  isBlocked: boolean;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  isBlocked: boolean;
}

export interface District {
  id: string;
  name: string;
  cityId: string;
  isBlocked: boolean;
}

export interface RestaurantType extends DictionaryItem {}
export interface PriceSegment extends DictionaryItem {}
export interface MenuType extends DictionaryItem {}
export interface IntegrationType extends DictionaryItem {}

// Slot (formerly Placement) - for list view
export type SlotType = 'MainLarge' | 'MainSmall' | 'Selection' | 'Group';

export interface Slot {
  id: string;
  name: DictionaryName;
  type: SlotType;
  isBlocked: boolean;
}

// Slot form data - for create/edit
export interface SlotFormData {
  id?: string;
  name: DictionaryName;
  type: SlotType;
  rotationPeriod: number;
  refreshTTL: number;
  noAdjacentSameAdvertiser: boolean;
  isBlocked: boolean;
  description?: string;
  hash?: string;
}

// Dish (for placements)
export interface Dish {
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

// Image data for dishes (can be image or video)
export interface PlacementImageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacementImageData {
  link?: string; // Video URL
  image?: string; // Image URL
  rect?: PlacementImageRect; // Optional crop rectangle
}

// Placement (unified for selections and groups)
export interface Placement {
  id: string;
  name: DictionaryName;
  dishes: Dish[];
  isBlocked: boolean;
}

export type DictionaryKey =
  | 'restaurant-types'
  | 'price-segments'
  | 'menu-types'
  | 'integration-types'
  | 'cities'
  | 'districts'
  | 'countries'
  | 'slots';

export type Dictionary = DictionaryItem;

export type DictionaryItemType =
  | RestaurantType
  | PriceSegment
  | MenuType
  | IntegrationType;

// Locations response
export interface LocationsResponse {
  countries: Country[];
  cities: City[];
  districts: District[];
}

// Restaurant
export interface ConnectionData {
  host: string;
  port: number;
  username: string;
  password?: string; // Optional when editing
}

// Restaurant list item (simplified for list view)
export interface RestaurantListItem {
  id: string;
  name: DictionaryName;
  crmUrl: string;
  cityName: string;
  districtName: string;
  countryId: string;
  cityId: string;
  districtId: string;
  typeId: string[];
  priceSegmentId: string[];
  menuTypeId: string[];
  integrationTypeId: string;
  isBlocked?: boolean;
}

// Restaurant detail (full data for edit/view) - keeping for backwards compatibility
export interface Restaurant extends BaseEntity {
  name: string;
  crmUrl: string;
  countryId: number;
  cityId: number;
  districtId: number;
  address: string;
  lat: number;
  lng: number;
  typeId: number[]; // restaurant-types
  priceSegmentId: number[]; // price-segments
  menuTypeId: number[]; // menu-types
  integrationTypeId: number; // integration-types
  adminEmail: string;
  connectionData: ConnectionData;
  lastClientActivityAt?: number; // Unix timestamp (seconds)
  lastRestaurantActivityAt?: number; // Unix timestamp (seconds)
}

// QR Code
export interface QRCode extends BaseEntity {
  restaurantId: number;
  qrText: string;
  tableNumber?: string; // Comes from integration, not editable
}

// Audit Log
export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'block'
  | 'unblock'
  | 'batch_create_qr';

export type AuditEntityType =
  | 'employee'
  | 'restaurant'
  | 'qr'
  | 'dictionary'
  | 'user'
  | 'advertiser'
  | 'campaign'
  | 'creative';

export interface AuditEvent {
  id: number;
  timestamp: number; // Unix timestamp (seconds)
  actorId: number;
  actorName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: number | string;
  entityLabel: string;
  metadata?: Record<string, unknown>;
}

// Auth
export interface User {
  id?: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  username: string;
  firstName: string;
  lastName: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  message: string;
  code?: string;
}

// Filter types
export interface EmployeeFilters {
  search: string;
  status: 'active' | 'blocked' | 'all';
}

export interface RestaurantFilters {
  search: string;
  status: 'active' | 'blocked' | 'all';
  countryId?: string;
  cityId?: string;
  districtId?: string;
  typeId?: string[];
  priceSegmentId?: string[];
  menuTypeId?: string[];
  integrationTypeId?: string;
}

export interface DictionaryFilters {
  status: 'active' | 'blocked' | 'all';
}

// Form types
export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  username: string;
  password?: string; // Optional when editing
  changePassword?: boolean; // Flag for edit mode
  blocked: boolean;
}

export interface RestaurantFormData {
  name: string;
  crmUrl: string;
  countryId: number;
  cityId: number;
  districtId: number;
  address: string;
  lat: number;
  lng: number;
  typeId: number[];
  priceSegmentId: number[];
  menuTypeId: number[];
  integrationTypeId: number;
  adminEmail: string;
  connectionData: {
    host: string;
    port: number;
    username: string;
    password: string;
    changePassword: boolean;
  };
  blocked: boolean;
}

export interface DictionaryFormData {
  name: string;
  blocked: boolean;
  countryId?: number; // For cities
  cityId?: number; // For districts
}

export interface QRBatchCreateRequest {
  count: number;
}

// Advertisement types
export interface Advertiser {
  id: string;
  name: DictionaryName;
  tin: string; // Tax Identification Number
  description?: string;
  blocked: boolean;
}

export interface Campaign extends Omit<BaseEntity, 'id'> {
  id: string | number;
  advertiserId: string;
  name: DictionaryName;
  description?: string;
  startDate: number; // Unix timestamp (seconds)
  endDate: number; // Unix timestamp (seconds)
  budget: number;
  budgetDaily: number;
  price: number;
  pricingModel: 'CPM' | 'CPC' | 'CPV' | 'CPA';
  spendStrategy: 'even' | 'asap' | 'frontload';
  frequencyCapStrategy: 'soft' | 'strict';
  frequencyCap: {
    per_user: {
      impressions: { count: number; window_sec: number };
      clicks: { count: number; window_sec: number };
    };
    per_session: {
      impressions: { count: number; window_sec: number };
      clicks: { count: number; window_sec: number };
    };
  };
  priority: number;
  weight: number;
  overdeliveryRatio: number; // percentage
  locationsMode: 'allowed' | 'denied';
  locations: string[]; // district IDs, empty = All
  restaurantTypesMode: 'allowed' | 'denied';
  restaurantTypes: string[]; // restaurant type IDs, empty = All
  menuTypesMode: 'allowed' | 'denied';
  menuTypes: string[]; // menu type IDs, empty = All
  slots: string[]; // ads slot IDs, empty = All
  targets: CampaignTarget[];
}

export interface CampaignTarget {
  id: string; // restaurant id
  slots: CampaignTargetSlot[];
}

export interface CampaignTargetSlot {
  id: string; // slot id
  schedules: string[]; // schedule ids
  placements: string[]; // placement ids
}

export interface Creative {
  id: string;
  campaignId: string;
  name: DictionaryName;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  dataUrl: string;
  previewWidth: number;
  previewHeight: number;
  blocked: boolean;
  hash?: string; // Only present in getById response
}

export interface DaySchedule {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  enabled: boolean;
  startTime: number; // Hour (0-23)
  endTime: number; // Hour (0-23)
}

export interface Schedule {
  id: string;
  name: DictionaryName;
  color: string; // hex color
  weekSchedule: DaySchedule[];
  blocked: boolean;
}

// Advertisement filters
export interface AdvertiserFilters {
  search: string;
  status: 'active' | 'blocked' | 'all';
}

export interface CampaignFilters {
  search: string;
  status: 'active' | 'blocked' | 'all';
  advertiserId?: number;
}

export interface CreativeFilters {
  status: 'active' | 'blocked' | 'all';
  campaignId?: number;
  advertiserId?: number;
}

// Advertisement form data
export interface AdvertiserFormData {
  name: DictionaryName;
  tin: string;
  blocked: boolean;
  description?: string;
}

export interface CampaignFormData {
  advertiserId: string;
  name: DictionaryName;
  description?: string;
  startDate: number;
  endDate: number;
  budget: number;
  budgetDaily: number;
  price: number;
  pricingModel: 'CPM' | 'CPC' | 'CPV' | 'CPA';
  spendStrategy: 'even' | 'asap' | 'frontload';
  frequencyCapStrategy: 'soft' | 'strict';
  frequencyCap: {
    per_user: {
      impressions: { count: number; window_sec: number };
      clicks: { count: number; window_sec: number };
    };
    per_session: {
      impressions: { count: number; window_sec: number };
      clicks: { count: number; window_sec: number };
    };
  };
  priority: number;
  weight: number;
  overdeliveryRatio: number;
  locationsMode: 'allowed' | 'denied';
  locations: string[];
  restaurantTypesMode: 'allowed' | 'denied';
  restaurantTypes: string[];
  menuTypesMode: 'allowed' | 'denied';
  menuTypes: string[];
  slots: string[];
  targets: CampaignTarget[];
  blocked: boolean;
}

export interface CreativeFormData {
  id?: string;
  campaignId: string;
  name: DictionaryName;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  dataUrl: string;
  previewWidth: number;
  previewHeight: number;
  blocked: boolean;
  hash?: string; // Required for updates
}

export interface ScheduleFormData {
  name: DictionaryName;
  color: string;
  weekSchedule: DaySchedule[];
  blocked: boolean;
}

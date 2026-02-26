# API Documentation

Complete API reference for the Trio Ad Server Admin Dashboard.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Advertisers](#advertisers-api)
  - [Campaigns](#campaigns-api)
  - [Creatives](#creatives-api)
  - [Restaurants](#restaurants-api)
  - [Schedules](#schedules-api)
  - [Slots](#slots-api)
  - [Dictionaries](#dictionaries-api)
  - [Audit](#audit-api)
- [Data Types](#data-types)
- [Data Transformers](#data-transformers)

---

## Overview

The Trio Ad Server API is a RESTful API that uses:
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Content Type**: `application/json`
- **Authentication**: Cookie-based (HttpOnly cookies)
- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable

### Base Configuration

```typescript
const apiConfig = {
  baseURL: env.apiBaseUrl, // Default: http://localhost:3000/api
  timeout: env.apiTimeout,  // Default: 30000ms
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};
```

### Request Flow

1. Client sends request with credentials included
2. Server validates cookie authentication
3. Server processes request
4. Server sends response with updated cookie (if needed)
5. Client handles response or error

---

## Authentication

### Cookie-Based Authentication

The API uses HttpOnly cookies for secure authentication:

- **Cookie Name**: `ads_token`
- **Security**: HttpOnly, Secure (HTTPS only in production)
- **SameSite**: Strict
- **Expiration**: Configured on server

All API requests automatically include cookies using:
```typescript
credentials: 'include'
```

### Authorization Header

For login endpoint, Basic Authentication is used:
```typescript
Authorization: Basic base64(username:password)
```

For all other endpoints, authentication is handled via cookies.

---

## Error Handling

### Error Response Format

```typescript
interface ApiErrorResponse {
  code: number;      // Application-specific error code
  message: string;   // Human-readable error message
}
```

### Error Codes

| Status  | Code | Description |
|--------|------|-------------|
| 400 | - | Bad Request |
| 401 | - | Unauthorized - Authentication required |
| 403 | - | Forbidden - Insufficient permissions |
| 404 | - | Not Found |
| 405 | - | Method Not Allowed |
| 413 | - | Content Too Large |
| 455 | - | Application Error |
| 456 | - | Restaurant Not Found |
| 457 | - | Object Not Unique |
| 458 | - | Object Not Found |
| 460 | - | Object Changed (Optimistic Lock Conflict) |
| 461 | - | Server Data Error |
| 500 | - | Internal Server Error |
| 502 | - | Bad Gateway |
| 503 | - | Service Unavailable |

### ApiError Class

```typescript
class ApiError extends Error {
  statusCode: number;
  errorCode: number;
  errorMessage: string;
  
  getUserMessage(): string;
  isRestaurantNotFound(): boolean;
  isObjectChanged(): boolean;
  isNotFound(): boolean;
  isUnauthorized(): boolean;
  isServerError(): boolean;
  isRetryable(): boolean;
}
```

### Retry Logic

The API client automatically retries failed requests:

- **Retryable errors**: Network errors, 5xx errors, timeouts
- **Max retries**: 3 attempts
- **Backoff strategy**: Exponential (1s, 2s, 4s)
- **Non-retryable**: 4xx errors (except network failures)

---

## API Endpoints

### Authentication Endpoints

#### POST `/auth/login`

Authenticate user and receive session cookie.

**Request:**
```http
POST /api/auth/login
Authorization: Basic base64(username:password)
Content-Type: application/json
```

**Response:**
```typescript
interface LoginResponse {
  username: string;
  firstName: string;
  lastName: string;
}
```

**Example:**
```typescript
const response = await authApi.login({
  username: 'admin',
  password: 'password123'
});
// Cookie is automatically set by server
```

**Status Codes:**
- `200`: Success
- `401`: Invalid credentials
- `500`: Server error

---

#### GET `/auth/me`

Get current authenticated user information.

**Request:**
```http
GET /api/auth/me
Cookie: ads_token=...
```

**Response:**
```typescript
interface User {
  username: string;
  firstName: string;
  lastName: string;
}
```

**Example:**
```typescript
const user = await authApi.me();
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `500`: Server error

---

#### POST `/auth/logout`

Logout user and clear session cookie.

**Request:**
```http
POST /api/auth/logout
Cookie: ads_token=...
```

**Response:**
```
204 No Content
```

**Example:**
```typescript
await authApi.logout();
// Cookie is cleared by server
```

**Status Codes:**
- `204`: Success
- `500`: Server error

---

### Advertisers API

#### GET `/advertisers`

Get list of all advertisers.

**Request:**
```http
GET /api/advertisers
Cookie: ads_token=...
```

**Response:**
```typescript
ApiAdvertiser[]
```

**Example:**
```typescript
const advertisers = await advertisersApi.list();
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `500`: Server error

---

#### GET `/advertisers/:id`

Get single advertiser by ID (includes hash for editing).

**Request:**
```http
GET /api/advertisers/123
Cookie: ads_token=...
```

**Response:**
```typescript
interface ApiAdvertiser {
  id: number;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  TIN: string;
  isBlocked: boolean;
  description?: string;
  hash?: string;  // For optimistic locking
}
```

**Example:**
```typescript
const advertiser = await advertisersApi.getById('123');
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `404`: Advertiser not found
- `500`: Server error

---

#### POST `/advertisers`

Create new advertiser.

**Request:**
```http
POST /api/advertisers
Cookie: ads_token=...
Content-Type: application/json

{
  "name": {
    "ARM": "Ակմե Կորպորացիա",
    "ENG": "Acme Corporation",
    "RUS": "Акме Корпорация"
  },
  "TIN": "12345678",
  "isBlocked": false,
  "description": "Technology company"
}
```

**Response:**
```typescript
ApiAdvertiser
```

**Example:**
```typescript
const newAdvertiser = await advertisersApi.create({
  name: 'Acme Corporation',
  tin: '12345678',
  blocked: false,
  description: 'Technology company'
});
```

**Status Codes:**
- `201`: Created successfully
- `400`: Invalid data
- `401`: Not authenticated
- `457`: Advertiser with TIN already exists
- `500`: Server error

---

#### PUT `/advertisers/:id`

Update existing advertiser.

**Request:**
```http
PUT /api/advertisers/123
Cookie: ads_token=...
Content-Type: application/json

{
  "id": 123,
  "name": "Acme Corp Updated",
  "TIN": "12345678",
  "isBlocked": false,
  "description": "Updated description",
  "hash": "abc123def"
}
```

**Response:**
```typescript
ApiAdvertiser
```

**Example:**
```typescript
const updated = await advertisersApi.update('123', {
  name: 'Acme Corp Updated',
  tin: '12345678',
  blocked: false,
  description: 'Updated description',
  hash: 'abc123def'  // Required for optimistic locking
});
```

**Status Codes:**
- `200`: Updated successfully
- `400`: Invalid data
- `401`: Not authenticated
- `404`: Advertiser not found
- `460`: Optimistic lock conflict (entity was modified)
- `500`: Server error

---

#### PATCH `/advertisers/:id/block`

Block or unblock advertiser.

**Request:**
```http
PATCH /api/advertisers/123/block
Cookie: ads_token=...
Content-Type: application/json

{
  "isBlocked": true
}
```

**Response:**
```
204 No Content
```

**Example:**
```typescript
await advertisersApi.block('123', true);  // Block
await advertisersApi.block('123', false); // Unblock
```

**Status Codes:**
- `204`: Success
- `401`: Not authenticated
- `404`: Advertiser not found
- `500`: Server error

---

### Campaigns API

#### GET `/campaigns`

Get list of all campaigns.

**Request:**
```http
GET /api/campaigns
Cookie: ads_token=...
```

**Response:**
```typescript
ApiCampaign[]
```

**Example:**
```typescript
const campaigns = await campaignsApi.list();
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `500`: Server error

---

#### GET `/campaigns/:id`

Get single campaign by ID.

**Request:**
```http
GET /api/campaigns/456
Cookie: ads_token=...
```

**Response:**
```typescript
interface ApiCampaign {
  id: string;
  advertiserId: string;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  description?: string;
  startDate: number;        // Unix timestamp
  endDate: number;          // Unix timestamp
  budget: number;
  budgetDaily: number;
  price: number;
  pricingModel: 'CPM' | 'CPC' | 'CPA';
  spendStrategy: 'ASAP' | 'EVEN';
  frequencyCapStrategy: 'NONE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  frequencyCap?: number;
  priority: number;
  weight: number;
  overdeliveryRatio: number;
  locationsMode: 'INCLUDE' | 'EXCLUDE';
  locations: string[];
  restaurantTypesMode: 'INCLUDE' | 'EXCLUDE';
  restaurantTypes: string[];
  menuTypesMode: 'INCLUDE' | 'EXCLUDE';
  menuTypes: string[];
  slots: string[];
  targets: CampaignTarget[];
  isBlocked: boolean;
  hash?: string;
}

interface CampaignTarget {
  restaurantId: string;
  slots: {
    slotId: string;
    schedules: string[];
    placements: string[];
  }[];
}
```

**Example:**
```typescript
const campaign = await campaignsApi.getById('456');
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `404`: Campaign not found
- `500`: Server error

---

#### POST `/campaigns`

Create new campaign.

**Request:**
```http
POST /api/campaigns
Cookie: ads_token=...
Content-Type: application/json

{
  "advertiserId": "123",
  "name": {
    "ARM": "Ամառային Զեղչեր 2026",
    "ENG": "Summer Sale 2026",
    "RUS": "Летняя Распродажа 2026"
  },
  "description": "Promotional campaign",
  "startDate": 1748995200,
  "endDate": 1751673600,
  "budget": 10000,
  "budgetDaily": 500,
  "price": 5.0,
  "pricingModel": "CPM",
  "spendStrategy": "EVEN",
  "frequencyCapStrategy": "DAILY",
  "frequencyCap": 5,
  "priority": 10,
  "weight": 100,
  "overdeliveryRatio": 1.1,
  "locationsMode": "INCLUDE",
  "locations": ["loc1", "loc2"],
  "restaurantTypesMode": "INCLUDE",
  "restaurantTypes": ["type1"],
  "menuTypesMode": "INCLUDE",
  "menuTypes": ["menu1"],
  "slots": ["slot1", "slot2"],
  "targets": [],
  "isBlocked": false
}
```

**Response:**
```typescript
ApiCampaign
```

**Example:**
```typescript
const newCampaign = await campaignsApi.create({
  advertiserId: '123',
  name: 'Summer Sale 2026',
  // ... other fields
});
```

**Status Codes:**
- `201`: Created successfully
- `400`: Invalid data
- `401`: Not authenticated
- `404`: Referenced advertiser not found
- `500`: Server error

---

#### PUT `/campaigns/:id`

Update existing campaign.

**Request:**
```http
PUT /api/campaigns/456
Cookie: ads_token=...
Content-Type: application/json

{
  "id": "456",
  "advertiserId": "123",
  "name": "Summer Sale 2026 Updated",
  // ... other fields
  "hash": "xyz789"
}
```

**Response:**
```typescript
ApiCampaign
```

**Example:**
```typescript
const updated = await campaignsApi.update('456', {
  ...campaignData,
  hash: 'xyz789'
});
```

**Status Codes:**
- `200`: Updated successfully
- `400`: Invalid data
- `401`: Not authenticated
- `404`: Campaign not found
- `460`: Optimistic lock conflict
- `500`: Server error

---

#### PATCH `/campaigns/:id/block`

Block or unblock campaign.

**Request:**
```http
PATCH /api/campaigns/456/block
Cookie: ads_token=...
Content-Type: application/json

{
  "isBlocked": true
}
```

**Response:**
```
204 No Content
```

**Example:**
```typescript
await campaignsApi.block('456', true);
```

**Status Codes:**
- `204`: Success
- `401`: Not authenticated
- `404`: Campaign not found
- `500`: Server error

---

### Creatives API

#### GET `/creatives`

Get list of all creatives.

**Request:**
```http
GET /api/creatives
Cookie: ads_token=...
```

**Response:**
```typescript
ApiCreative[]
```

**Example:**
```typescript
const creatives = await creativesApi.list();
```

---

#### GET `/creatives/:id`

Get single creative by ID.

**Request:**
```http
GET /api/creatives/789
Cookie: ads_token=...
```

**Response:**
```typescript
interface ApiCreative {
  id: string;
  campaignId: string;
  name: DictionaryName;   // Multilingual: { ARM: string; ENG: string; RUS: string }
  dataUrl: string;        // Base64 encoded content
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  previewWidth: number;
  previewHeight: number;
  isBlocked: boolean;
  hash?: string;
}
```

**Example:**
```typescript
const creative = await creativesApi.getById('789');
```

---

#### POST `/creatives`

Create new creative.

**Request:**
```http
POST /api/creatives
Cookie: ads_token=...
Content-Type: application/json

{
  "campaignId": "456",
  "name": {
    "ARM": "Բաններ Գովազդ",
    "ENG": "Banner Ad",
    "RUS": "Баннер Реклама"
  },
  "dataUrl": "data:text/html;base64,...",
  "minHeight": 50,
  "maxHeight": 250,
  "minWidth": 300,
  "maxWidth": 970,
  "previewWidth": 728,
  "previewHeight": 90,
  "isBlocked": false
}
```

**Response:**
```typescript
ApiCreative
```

**Example:**
```typescript
const newCreative = await creativesApi.create({
  campaignId: '456',
  name: 'Banner Ad',
  dataUrl: 'data:text/html;base64,...',
  minHeight: 50,
  maxHeight: 250,
  minWidth: 300,
  maxWidth: 970,
  previewWidth: 728,
  previewHeight: 90,
  blocked: false
});
```

---

#### PUT `/creatives/:id`

Update existing creative.

**Request:**
```http
PUT /api/creatives/789
Cookie: ads_token=...
Content-Type: application/json

{
  "id": "789",
  "campaignId": "456",
  "name": "Banner Ad Updated",
  // ... other fields
  "hash": "creative_hash"
}
```

**Response:**
```typescript
ApiCreative
```

**Example:**
```typescript
const updated = await creativesApi.update('789', {
  ...creativeData,
  hash: 'creative_hash'
});
```

---

#### PATCH `/creatives/:id/block`

Block or unblock creative.

**Request:**
```http
PATCH /api/creatives/789/block
Cookie: ads_token=...
Content-Type: application/json

{
  "isBlocked": true
}
```

**Response:**
```typescript
ApiCreative
```

**Example:**
```typescript
await creativesApi.block('789', true);
```

---

### Restaurants API

#### GET `/restaurants`

Get list of all restaurants.

**Request:**
```http
GET /api/restaurants
Cookie: ads_token=...
```

**Response:**
```typescript
interface RestaurantListItem {
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
  latitude: number;
  longitude: number;
  isBlocked: boolean;
}

interface DictionaryName {
  ARM: string;
  ENG: string;
  RUS: string;
}
```

**Example:**
```typescript
const restaurants = await restaurantsApi.list();
```

---

#### PATCH `/restaurants/:id/block`

Block or unblock restaurant.

**Request:**
```http
PATCH /api/restaurants/rest123/block
Cookie: ads_token=...
Content-Type: application/json

{
  "isBlocked": true
}
```

**Response:**
```typescript
RestaurantListItem
```

**Example:**
```typescript
await restaurantsApi.block('rest123', true);
```

---

#### GET `/restaurants/campaigns/:restaurantId`

Get campaigns assigned to specific restaurant.

**Request:**
```http
GET /api/restaurants/campaigns/rest123
Cookie: ads_token=...
```

**Response:**
```typescript
interface RestaurantCampaign {
  id: string;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  advertiserId: string;
  advertiserName: DictionaryName;  // Multilingual
  slot: {
    id: string;
    name: DictionaryName;
    schedules: {
      id: string;
      name: DictionaryName;  // Multilingual
      color: string;
    }[];
    placements: {
      id: string;
      name: DictionaryName;
    }[];
  };
}[]
```

**Example:**
```typescript
const campaigns = await restaurantsApi.getRestaurantCampaigns('rest123');
```

---

#### PUT `/restaurants/campaigns/:restaurantId`

Update campaign assignments for restaurant.

**Request:**
```http
PUT /api/restaurants/campaigns/rest123
Cookie: ads_token=...
Content-Type: application/json

{
  "campaigns": [
    {
      "id": "campaign1",
      "slots": [
        {
          "id": "slot1",
          "schedules": ["sched1", "sched2"],
          "placements": ["place1", "place2"]
        }
      ]
    }
  ]
}
```

**Response:**
```
204 No Content
```

**Example:**
```typescript
await restaurantsApi.updateRestaurantCampaigns('rest123', [
  {
    id: 'campaign1',
    slots: [
      {
        id: 'slot1',
        schedules: ['sched1', 'sched2'],
        placements: ['place1', 'place2']
      }
    ]
  }
]);
```

---

### Schedules API

#### GET `/schedules`

Get list of all schedules.

**Request:**
```http
GET /api/schedules
Cookie: ads_token=...
```

**Response:**
```typescript
ApiSchedule[]
```

**Example:**
```typescript
const schedules = await schedulesApi.list();
```

---

#### GET `/schedules/:id`

Get single schedule by ID.

**Request:**
```http
GET /api/schedules/sched1
Cookie: ads_token=...
```

**Response:**
```typescript
interface ApiSchedule {
  id: string;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  color: string;
  isBlocked: boolean;
  weekSchedule: ApiDaySchedule[];
  hash?: string;
}

interface ApiDaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  enabled: boolean;
  start: string;  // HH:mm format
  end: string;    // HH:mm format
}
```

**Example:**
```typescript
const schedule = await schedulesApi.getById('sched1');
```

---

#### POST `/schedules`

Create new schedule.

**Request:**
```http
POST /api/schedules
Cookie: ads_token=...
Content-Type: application/json

{
  "name": {
    "ARM": "Աշխատանքային Ժամեր",
    "ENG": "Business Hours",
    "RUS": "Рабочие Часы"
  },
  "color": "#4CAF50",
  "isBlocked": false,
  "weekSchedule": [
    {
      "day": "Monday",
      "enabled": true,
      "start": "09:00",
      "end": "18:00"
    },
    // ... other days
  ]
}
```

**Response:**
```typescript
ApiSchedule
```

**Example:**
```typescript
const newSchedule = await schedulesApi.create({
  name: {
    ARM: 'Աշխատանքային Ժամեր',
    ENG: 'Business Hours',
    RUS: 'Рабочие Часы'
  },
  color: '#4CAF50',
  blocked: false,
  weekSchedule: [
    {
      day: 'Monday',
      enabled: true,
      startTime: '09:00',
      endTime: '18:00'
    },
    // ... other days
  ]
});
```

---

#### PUT `/schedules/:id`

Update existing schedule.

**Request:**
```http
PUT /api/schedules/sched1
Cookie: ads_token=...
Content-Type: application/json

{
  "name": {
    "ARM": "Աշխատանքային Ժամեր Թարմացված",
    "ENG": "Business Hours Updated",
    "RUS": "Рабочие Часы Обновлено"
  },
  "color": "#4CAF50",
  "isBlocked": false,
  "weekSchedule": [...],
  "hash": "schedule_hash"
}
```

**Response:**
```typescript
ApiSchedule
```

**Example:**
```typescript
const updated = await schedulesApi.update('sched1', {
  ...scheduleData
}, 'schedule_hash');
```

---

#### DELETE `/schedules/:id`

Delete schedule.

**Request:**
```http
DELETE /api/schedules/sched1
Cookie: ads_token=...
```

**Response:**
```
204 No Content
```

**Example:**
```typescript
await schedulesApi.delete('sched1');
```

---

#### PATCH `/schedules/:id/block`

Block or unblock schedule.

**Request:**
```http
PATCH /api/schedules/sched1/block
Cookie: ads_token=...
Content-Type: application/json

{
  "isBlocked": true
}
```

**Response:**
```typescript
ApiSchedule
```

**Example:**
```typescript
await schedulesApi.block('sched1', true);
```

---

### Slots API

#### GET `/adslots`

Get list of all ad slots.

**Request:**
```http
GET /api/adslots
Cookie: ads_token=...
```

**Response:**
```typescript
interface Slot {
  id: string;
  name: DictionaryName;
  type: 'MainLarge' | 'MainSmall' | 'Selection' | 'Group';
  isBlocked: boolean;
}[]
```

**Example:**
```typescript
const slots = await slotsApi.list();
```

---

#### GET `/adslots/:id`

Get single slot by ID with full configuration.

**Request:**
```http
GET /api/adslots/slot1
Cookie: ads_token=...
```

**Response:**
```typescript
interface SlotFormData {
  id: string;
  name: DictionaryName;
  type: 'MainLarge' | 'MainSmall' | 'Selection' | 'Group';
  rotationPeriod: number;
  refreshTTL: number;
  noAdjacentSameAdvertiser: boolean;
  isBlocked: boolean;
  description?: string;
  hash?: string;
}
```

**Example:**
```typescript
const slot = await slotsApi.getById('slot1');
```

---

#### POST `/adslots`

Create new slot.

**Request:**
```http
POST /api/adslots
Cookie: ads_token=...
Content-Type: application/json

{
  "name": {
    "ARM": "Հիմնական տեղ",
    "ENG": "Main Slot",
    "RUS": "Основной слот"
  },
  "type": "MainLarge",
  "rotationPeriod": 30,
  "refreshTTL": 300,
  "noAdjacentSameAdvertiser": true,
  "isBlocked": false,
  "description": "Primary ad slot"
}
```

**Response:**
```typescript
Slot
```

**Example:**
```typescript
const newSlot = await slotsApi.create({
  name: {
    ARM: 'Հիմնական տեղ',
    ENG: 'Main Slot',
    RUS: 'Основной слот'
  },
  type: 'MainLarge',
  rotationPeriod: 30,
  refreshTTL: 300,
  noAdjacentSameAdvertiser: true,
  isBlocked: false
});
```

---

#### PUT `/adslots/:id`

Update existing slot.

**Request:**
```http
PUT /api/adslots/slot1
Cookie: ads_token=...
Content-Type: application/json

{
  "id": "slot1",
  "name": {...},
  "type": "MainLarge",
  // ... other fields
  "hash": "slot_hash"
}
```

**Response:**
```typescript
Slot
```

**Example:**
```typescript
const updated = await slotsApi.update('slot1', slotData);
```

---

#### PATCH `/adslots/:id/block`

Block or unblock slot.

**Request:**
```http
PATCH /api/adslots/slot1/block
Cookie: ads_token=...
Content-Type: application/json

{
  "isBlocked": true
}
```

**Response:**
```typescript
Slot
```

**Example:**
```typescript
await slotsApi.block('slot1', true);
```

---

### Placements API

#### GET `/adslots/:slotType/:restaurantId`

Get placements (selections or groups) for a specific slot type and restaurant.

**Request:**
```http
GET /api/adslots/Selection/rest123
Cookie: ads_token=...
```

**Parameters:**
- `slotType`: 'Selection' | 'Group'
- `restaurantId`: Restaurant identifier

**Response:**
```typescript
interface Placement {
  id: string;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  dishes: Dish[];
}

interface Dish {
  id: string;
  name: DictionaryName;  // Multilingual
  description: DictionaryName;  // Multilingual
  imageData?: PlacementImageData[] | null;
}

interface PlacementImageData {
  link?: string;   // Video URL (YouTube, etc.)
  image?: string;  // Image URL
  rect?: PlacementImageRect;  // Crop region in pixels
}

interface PlacementImageRect {
  x: number;      // Crop start X position in pixels
  y: number;      // Crop start Y position in pixels
  width: number;  // Crop width in pixels
  height: number; // Crop height in pixels
}
```

**Image Data Details:**
- Each dish can have multiple image/video entries in the `imageData` array
- For images: `image` field contains the URL, optional `rect` specifies the crop region
- For videos: `link` field contains the video URL (e.g., YouTube link)
- Crop rectangle values are in **pixels** (not percentages)
- If no `rect` is provided, the full image is displayed
- The UI automatically crops and scales images to fit display areas

**Example:**
```typescript
const placements = await placementsApi.getPlacements('Selection', 'rest123');

// Sample response:
[
  {
    id: 'sel1',
    name: { ARM: 'Հիմնական ընտրանի', ENG: 'Main Selection', RUS: 'Основной выбор' },
    dishes: [
      {
        id: 'dish1',
        name: { ARM: 'Պիցցա', ENG: 'Pizza', RUS: 'Пицца' },
        description: { ARM: 'Համեղ պիցցա', ENG: 'Delicious pizza', RUS: 'Вкусная пицца' },
        imageData: [
          {
            image: 'https://example.com/pizza.jpg',
            rect: { x: 0, y: 0, width: 553, height: 406 }
          }
        ]
      },
      {
        id: 'dish2',
        name: { ARM: 'Բուրգեր', ENG: 'Burger', RUS: 'Бургер' },
        description: { ARM: 'Սիրուն բուրգեր', ENG: 'Nice burger', RUS: 'Хороший бургер' },
        imageData: null  // No image available
      }
    ]
  }
]
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `404`: Restaurant or slot type not found
- `500`: Server error

---

### Dictionaries API

#### GET `/dictionaries/:dictKey`

Get dictionary items by key.

**Request:**
```http
GET /api/dictionaries/restaurant-types
Cookie: ads_token=...
```

**Dictionary Keys:**
- `restaurant-types`
- `price-segments`
- `menu-types`
- `integration-types`
- `cities`
- `districts`
- `countries`
- `slots`

**Response:**
```typescript
interface DictionaryItem {
  id: string;
  name: DictionaryName;
  isBlocked: boolean;
  description?: string;
}[]
```

**Example:**
```typescript
const restaurantTypes = await dictionariesApi.list('restaurant-types');
```

---

#### GET `/locations`

Get all location data (countries, cities, districts).

**Request:**
```http
GET /api/locations
Cookie: ads_token=...
```

**Response:**
```typescript
interface LocationsResponse {
  countries: Country[];
  cities: City[];
  districts: District[];
}

interface Country {
  id: string;
  name: string;
  isBlocked: boolean;
}

interface City {
  id: string;
  name: string;
  countryId: string;
  isBlocked: boolean;
}

interface District {
  id: string;
  name: string;
  cityId: string;
  isBlocked: boolean;
}
```

**Example:**
```typescript
const locations = await dictionariesApi.getLocations();
```

---

### Audit API

#### GET `/audit`

Get audit log events with optional filtering.

**Request:**
```http
GET /api/audit?entityType=campaign&entityId=456
Cookie: ads_token=...
```

**Query Parameters:**
- `entityType` (optional): Filter by entity type
  - Values: `advertiser`, `campaign`, `creative`, `restaurant`, `schedule`, `slot`, `dictionary`
- `entityId` (optional): Filter by entity ID

**Response:**
```typescript
interface AuditEvent {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'BLOCK' | 'UNBLOCK';
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  changes?: Record<string, {
    old: any;
    new: any;
  }>;
  metadata?: Record<string, any>;
}[]
```

**Example:**
```typescript
// Get all audit events
const allEvents = await auditApi.getEvents();

// Get events for specific campaign
const campaignEvents = await auditApi.getEvents({
  entityType: 'campaign',
  entityId: '456'
});

// Get events for all campaigns
const allCampaignEvents = await auditApi.getEvents({
  entityType: 'campaign'
});
```

**Status Codes:**
- `200`: Success
- `401`: Not authenticated
- `400`: Invalid query parameters
- `500`: Server error

---

## Data Types

### Core Types

```typescript
// Base entity interface
interface BaseEntity {
  id: number;
  blocked: boolean;
}

// Multilingual name
interface DictionaryName {
  ARM: string;  // Armenian
  ENG: string;  // English
  RUS: string;  // Russian
}
```

### Advertiser Types

```typescript
// Internal format (camelCase, consistent naming)
interface Advertiser extends BaseEntity {
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  tin: string;               // Tax Identification Number
  description?: string;
}

// API format (API-specific naming)
interface ApiAdvertiser {
  id: number;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  TIN: string;
  isBlocked: boolean;
  description?: string;
  hash?: string;
}

// Form data (for create/update)
interface AdvertiserFormData {
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  tin: string;
  blocked: boolean;
  description?: string;
  hash?: string;  // Required for updates
}
```

### Campaign Types

```typescript
interface Campaign extends BaseEntity {
  advertiserId: string;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  description?: string;
  startDate: number;
  endDate: number;
  budget: number;
  budgetDaily: number;
  price: number;
  pricingModel: 'CPM' | 'CPC' | 'CPA';
  spendStrategy: 'ASAP' | 'EVEN';
  frequencyCapStrategy: 'NONE' | 'HOURLY' | 'DAILY' | 'WEEKLY';
  frequencyCap?: number;
  priority: number;
  weight: number;
  overdeliveryRatio: number;
  locationsMode: 'INCLUDE' | 'EXCLUDE';
  locations: string[];
  restaurantTypesMode: 'INCLUDE' | 'EXCLUDE';
  restaurantTypes: string[];
  menuTypesMode: 'INCLUDE' | 'EXCLUDE';
  menuTypes: string[];
  slots: string[];
  targets: CampaignTarget[];
}

interface CampaignTarget {
  restaurantId: string;
  slots: {
    slotId: string;
    schedules: string[];
    placements: string[];
  }[];
}
```

### Creative Types

```typescript
interface Creative {
  id: string;
  campaignId: string;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  dataUrl: string;        // Base64 encoded HTML/CSS
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  previewWidth: number;
  previewHeight: number;
  blocked: boolean;
  hash?: string;
}
```

### Schedule Types

```typescript
interface Schedule {
  id: string;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  color: string;          // Hex color code
  blocked: boolean;
  weekSchedule: DaySchedule[];
  hash?: string;
}

interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 
       'Friday' | 'Saturday' | 'Sunday';
  enabled: boolean;
  startTime: string;      // HH:mm format
  endTime: string;        // HH:mm format
}
```

---

## Data Transformers

The API uses transformers to convert between API format and internal format.

### Transformer Pattern

```typescript
interface ApiTransformer<TApi, TInternal> {
  fromApi: (apiData: TApi) => TInternal;
  toApi: (internalData: TInternal) => TApi;
  fromApiList: (apiList: TApi[]) => TInternal[];
  toApiList: (internalList: TInternal[]) => TApi[];
}
```

### Creating a Transformer

```typescript
const advertiserTransformer = createApiTransformer<ApiAdvertiser, Advertiser>(
  // From API to internal
  (apiAdvertiser) => ({
    id: apiAdvertiser.id,
    name: apiAdvertiser.name,
    tin: apiAdvertiser.TIN,           // TIN → tin
    blocked: apiAdvertiser.isBlocked,  // isBlocked → blocked
    description: apiAdvertiser.description,
    hash: apiAdvertiser.hash,
  }),
  // From internal to API
  (advertiser) => ({
    id: advertiser.id,
    name: advertiser.name,
    TIN: advertiser.tin,              // tin → TIN
    isBlocked: advertiser.blocked,     // blocked → isBlocked
    description: advertiser.description,
    hash: advertiser.hash,
  })
);
```

### Using Transformers

```typescript
// Transform single item
const internalAdvertiser = advertiserTransformer.fromApi(apiAdvertiser);

// Transform list
const internalAdvertisers = advertiserTransformer.fromApiList(apiAdvertisers);

// Transform back to API format
const apiAdvertiser = advertiserTransformer.toApi(internalAdvertiser);
```

### Why Transformers?

1. **Consistency**: Internal code uses consistent naming conventions
2. **Decoupling**: API changes don't affect internal code
3. **Type Safety**: TypeScript ensures correct transformations
4. **Maintainability**: Single source of truth for data conversions
5. **Testing**: Easy to test transformations independently

---

## Best Practices

### 1. Always Use Transformers

```typescript
// ❌ Bad: Using API format directly
const advertiser: ApiAdvertiser = await fetch(...);
logger.debug('Advertiser TIN:', advertiser.TIN);

// ✅ Good: Using transformed data
const advertiser = advertiserTransformer.fromApi(apiResponse);
logger.debug('Advertiser TIN:', advertiser.tin);
```

### 2. Handle Errors Properly

```typescript
try {
  const result = await advertisersApi.create(data);
  showSuccessMessage();
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isUnauthorized()) {
      redirectToLogin();
    } else {
      showErrorMessage(error.getUserMessage());
    }
  } else {
    showErrorMessage('Unexpected error');
  }
}
```

### 3. Use Optimistic Locking

```typescript
// Get entity with hash
const entity = await api.getById(id);

// Update with hash
await api.update(id, {
  ...data,
  hash: entity.hash  // Include hash to prevent conflicts
});
```

### 4. Leverage Automatic Retries

```typescript
// API client automatically retries on:
// - Network errors
// - 5xx server errors
// - Timeout errors

// No retry on:
// - 4xx client errors
// - Authentication errors
```

### 5. Use Type Guards

```typescript
function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

if (isApiError(error)) {
  logger.error('API Error:', error);
  logger.debug('Status code:', error.statusCode);
  logger.debug('Error message:', error.getUserMessage());
}
```

---

## Rate Limiting

Currently, there are no rate limits enforced by the API. However, the client implements:

- Request timeouts (30 seconds default)
- Automatic retry with exponential backoff
- Maximum 3 retry attempts

---

## Versioning

The API currently does not use versioning. All endpoints are available at:

```
{baseUrl}/api/{endpoint}
```

Future versions may implement versioning:

```
{baseUrl}/api/v1/{endpoint}
{baseUrl}/api/v2/{endpoint}
```

---

## Support

For API issues or questions:
- Check error messages and status codes
- Review audit logs for debugging
- Consult this documentation
- Contact backend team for server-side issues

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026  
**API Version**: 1.0.0

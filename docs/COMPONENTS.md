# Components and Features Documentation

Detailed documentation of all components and features in the Trio Ad Server Admin Dashboard.

## Table of Contents

- [Pages](#pages)
- [Feature Components](#feature-components)
- [Common Components](#common-components)
- [Custom Hooks](#custom-hooks)
- [Utilities](#utilities)
- [Features Overview](#features-overview)

---

## Pages

### Authentication Pages

#### LoginPage
**Location**: `src/pages/auth/LoginPage.tsx`

**Purpose**: User authentication interface

**Features**:
- Basic authentication form
- Username and password fields
- Remember me option
- Error handling
- Redirect after login

**Usage**:
```typescript
// Route: /login
// Public route, redirects to /restaurants if authenticated
```

---

### Advertisement Pages

#### AdvertisersListPage
**Location**: `src/pages/advertisement/AdvertisersListPage.tsx`

**Purpose**: Manage advertiser entities

**Features**:
- List all advertisers
- Search and filter
- Create new advertiser
- Edit existing advertiser
- Block/unblock advertiser
- View advertiser details

**Data Fields**:
- Name
- TIN (Tax Identification Number)
- Description
- Blocked status
- Created/Updated timestamps

---

#### CampaignsListPage
**Location**: `src/pages/advertisement/CampaignsListPage.tsx`

**Purpose**: Manage advertising campaigns

**Features**:
- List all campaigns
- Filter by advertiser
- Search campaigns
- Create campaign
- Edit campaign
- Campaign targeting settings
- Schedule assignment
- Restaurant targeting

**Data Fields**:
- Basic Info: Name, description, advertiser
- Budget: Total budget, daily budget
- Pricing: Price, pricing model (CPM/CPC/CPA)
- Dates: Start date, end date
- Strategy: Spend strategy, frequency cap
- Priority: Priority level, weight
- Targeting: Locations, restaurant types, menu types
- Slots: Ad placement slots
- Targets: Restaurant-specific assignments

---

#### CreativesListPage
**Location**: `src/pages/advertisement/CreativesListPage.tsx`

**Purpose**: Manage ad creative content

**Features**:
- List all creatives
- Filter by campaign
- Create creative
- Edit creative HTML/CSS
- Preview creative
- Monaco editor integration
- Dimension constraints

**Data Fields**:
- Name
- Campaign
- HTML/CSS content (Base64 encoded)
- Dimensions (min/max width/height)
- Preview dimensions
- Blocked status

---

#### SchedulesListPage
**Location**: `src/pages/advertisement/SchedulesListPage.tsx`

**Purpose**: Manage time-based schedules

**Features**:
- List all schedules
- Create schedule
- Edit schedule
- Weekly schedule configuration
- Color coding
- Block/unblock schedule

**Data Fields**:
- Name
- Color
- Week schedule (7 days)
  - Day enabled/disabled
  - Start time
  - End time
- Blocked status

---

### Restaurant Pages

#### RestaurantsListPage
**Location**: `src/pages/restaurants/RestaurantsListPage.tsx`

**Purpose**: Manage restaurant partners

**Features**:
- List all restaurants
- Search by name, city, district
- Filter by location, type
- Map view (Leaflet integration)
- Block/unblock restaurants
- Campaign assignments
- View restaurant campaigns

**Data Fields**:
- Name (multilingual)
- Location: Country, city, district
- Coordinates (lat/lng)
- Types: Restaurant types, price segments, menu types
- Integration type
- CRM URL
- Blocked status

---

### Slots Pages

#### SlotsListPage
**Location**: `src/pages/slots/SlotsListPage.tsx`

**Purpose**: Manage ad slot configurations

**Features**:
- List all ad slots
- Create slot
- Edit slot configuration
- Configure rotation settings
- Manage placements

**Data Fields**:
- Name (multilingual)
- Type (MainLarge, MainSmall, Selection, Group)
- Rotation period
- Refresh TTL
- No adjacent same advertiser flag
- Description
- Blocked status

---

### Dictionaries Pages

#### DictionariesPage
**Location**: `src/pages/dictionaries/DictionariesPage.tsx`

**Purpose**: Manage system reference data

**Features**:
- View dictionary items
- Filter and search
- CRUD operations for dictionary items

**Dictionary Types**:
- Restaurant Types
- Price Segments
- Menu Types
- Integration Types
- Locations (Countries, Cities, Districts)
- Slots

---

### Statistics Pages

#### StatisticsPage
**Location**: `src/pages/statistics/StatisticsPage.tsx`

**Purpose**: View analytics and metrics

**Features**:
- Campaign performance metrics
- Impression tracking
- Click-through rates
- Budget utilization
- Date range filtering
- Export reports

---

## Feature Components

### Campaign Components

#### AddRestaurantsModal
**Location**: `src/components/campaigns/AddRestaurantsModal.tsx`

**Purpose**: Add restaurants to campaign targeting

**Features**:
- Restaurant search and selection
- Multi-select functionality
- Location filtering
- Map view

---

#### PlacementsDialog
**Location**: `src/components/campaigns/PlacementsDialog.tsx`

**Purpose**: Configure placements for campaign slots

**Features**:
- Select placements (selections or groups)
- Preview placement dishes with images
- Multi-selection with checkboxes
- Visual dish display with image thumbnails
- Accordion UI for placement organization
- Automatic image cropping based on rect data

**Implementation Details**:
- Fetches placements dynamically based on slot type (Selection/Group)
- Displays each dish with its image (or placeholder if no image)
- Uses `PlacementImageDisplay` component for image rendering
- Handles both image URLs and video links
- Shows dish count in accordion summary
- 60x60px image display area for each dish

**Props**:
```typescript
interface PlacementsDialogProps {
  open: boolean;
  onClose: () => void;
  slotType: 'Selection' | 'Group';
  restaurantId: string;
  selectedPlacements: string[];
  onSave: (placements: string[]) => void;
}
```

---

#### PlacementImageDisplay
**Location**: `src/components/campaigns/PlacementImageDisplay.tsx`

**Purpose**: Display dish images/videos with automatic cropping and fallback

**Features**:
- Image display with pixel-based cropping
- Video link display with icon
- NoImage placeholder for dishes without images
- Automatic aspect ratio calculation
- Responsive sizing within fixed dimensions
- CSS clip-path for precise cropping

**Implementation Details**:
- Displays images cropped according to `rect` parameters (x, y, width, height in pixels)
- Calculates optimal container dimensions based on crop aspect ratio
- Falls back to NoImage icon (ImageNotSupported from MUI) when no image available
- Shows video icon with URL text for video links
- All rect values are treated as pixel coordinates/dimensions
- Images are scaled to fit within rowHeight (default 60px) while maintaining aspect ratio

**Props**:
```typescript
interface PlacementImageDisplayProps {
  imageData: PlacementImageData | null | undefined;
  rowHeight?: number; // Default: 60px
}

interface PlacementImageData {
  link?: string;   // Video URL
  image?: string;  // Image URL
  rect?: PlacementImageRect;  // Crop region
}

interface PlacementImageRect {
  x: number;      // Crop X position (pixels)
  y: number;      // Crop Y position (pixels)
  width: number;  // Crop width (pixels)
  height: number; // Crop height (pixels)
}
```

**Rendering Logic**:
1. **No imageData**: Shows NoImage placeholder (gray box with icon)
2. **Video link present**: Shows video icon with URL text
3. **Image with rect**: Crops image using CSS clip-path and positioning
   - Calculates aspect ratio from rect dimensions
   - Creates container sized to fit within rowHeight
   - Applies clip-path with pixel values for precise cropping
4. **Image without rect**: Displays full image centered in container

**Example Usage**:
```typescript
<PlacementImageDisplay 
  imageData={{
    image: 'https://example.com/dish.jpg',
    rect: { x: 0, y: 0, width: 553, height: 406 }
  }}
  rowHeight={60}
/>
```

---

#### RestaurantInfoPopover
**Location**: `src/components/campaigns/RestaurantInfoPopover.tsx`

**Purpose**: Display restaurant information in popover

**Features**:
- Restaurant details
- Location information
- Quick view of campaigns

---

#### SlotScheduleCell
**Location**: `src/components/campaigns/SlotScheduleCell.tsx`

**Purpose**: Display and edit schedule assignments for slots

**Features**:
- Visual schedule representation
- Quick schedule toggle
- Color-coded schedules

---

#### TargetingTab
**Location**: `src/components/campaigns/TargetingTab.tsx`

**Purpose**: Campaign targeting configuration

**Features**:
- Location targeting (include/exclude)
- Restaurant type targeting
- Menu type targeting
- Slot selection

---

### Restaurant Components

#### RestaurantCampaignsModal
**Location**: `src/components/restaurants/RestaurantCampaignsModal.tsx`

**Purpose**: Manage campaigns for specific restaurant

**Features**:
- View assigned campaigns
- Modify schedule assignments
- Configure placement selections
- Save campaign configurations

---

### Slots Components

#### SlotFormDialog
**Location**: `src/components/slots/SlotFormDialog.tsx`

**Purpose**: Create/edit slot configuration

**Features**:
- Multilingual name input
- Slot type selection
- Rotation settings
- Refresh configuration

---

### Dictionaries Components

#### DictionaryFormDialog
**Location**: `src/components/dictionaries/DictionaryFormDialog.tsx`

**Purpose**: Create/edit dictionary items

**Features**:
- Multilingual name input
- Description field
- Block status toggle

---

## Common Components

### ErrorBoundary
**Location**: `src/components/common/ErrorBoundary.tsx`

**Purpose**: Catch and handle React errors

**Features**:
- Error catching
- Error fallback UI
- Error logging
- Reset functionality

---

### ErrorFallback
**Location**: `src/components/common/ErrorFallback.tsx`

**Purpose**: Display error states

**Variants**:
- RestaurantsErrorFallback
- AdvertisementErrorFallback
- DictionariesErrorFallback
- StatisticsErrorFallback

**Features**:
- User-friendly error messages
- Retry action
- Navigation to safety

---

### ProtectedRoute
**Location**: `src/components/common/ProtectedRoute.tsx`

**Purpose**: Route authentication guard

**Features**:
- Check authentication status
- Redirect to login if needed
- Loading state during auth check

---

### LanguageSwitcher
**Location**: `src/components/common/LanguageSwitcher.tsx`

**Purpose**: Switch application language

**Features**:
- Select from Armenian, Russian, English
- Persist selection to localStorage
- Update all i18n content

---

### ConfirmDialog
**Location**: `src/components/common/ConfirmDialog.tsx`

**Purpose**: Confirmation dialog for destructive actions

**Features**:
- Customizable title and message
- Confirm/cancel actions
- Material-UI dialog

---

## Custom Hooks

### useEntityList
**Location**: `src/hooks/useEntityList.ts`

**Purpose**: Generic CRUD list management

**Features**:
- Data fetching
- Loading states
- Search functionality
- Filtering
- Sorting
- Block/unblock operations
- Delete operations
- Refresh/refetch

**Usage**:
```typescript
const entityList = useEntityList({
  fetchList: advertisersApi.list,
  toggleBlock: advertisersApi.block,
  deleteEntity: advertisersApi.delete,
  filterFn: customFilterFunction,
  sortFn: customSortFunction,
  entityName: 'advertiser',
  callbacks: createSnackbarCallbacks(enqueueSnackbar, t),
});
```

---

### useCampaignsData
**Location**: `src/hooks/useCampaignsData.ts`

**Purpose**: Campaign-specific data management

**Features**:
- Fetch campaigns with related data
- Filter by advertiser
- Enrich campaign data with advertiser names
- Handle loading and errors

---

### useFormDialog
**Location**: `src/hooks/useFormDialog.ts`

**Purpose**: Dialog form state management

**Features**:
- Open/close state
- Selected item tracking
- Create/edit mode handling

**Usage**:
```typescript
const dialog = useFormDialog<Advertiser>();

// Open for create
dialog.handleCreate();

// Open for edit
dialog.handleEdit(advertiser);

// Close dialog
dialog.handleClose();
```

---

### useDebounce
**Location**: `src/hooks/useDebounce.ts`

**Purpose**: Debounce value changes

**Usage**:
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  searchApi(debouncedSearch);
}, [debouncedSearch]);
```

---

### usePagination
**Location**: `src/hooks/usePagination.ts`

**Purpose**: Pagination logic

**Features**:
- Current page tracking
- Page size management
- Total pages calculation
- Navigation helpers

---

### useFilters
**Location**: `src/hooks/useFilters.ts`

**Purpose**: Filter state management

**Features**:
- Multiple filter values
- Update individual filters
- Reset all filters
- Type-safe filter values

---

### useTableState
**Location**: `src/hooks/useTableState.ts`

**Purpose**: Table state management (sorting, pagination, etc.)

**Features**:
- Sort field and direction
- Page and page size
- Combined state management

---

### useAuditLog
**Location**: `src/hooks/useAuditLog.ts`

**Purpose**: Fetch and display audit log events

**Features**:
- Fetch events with filters
- Entity type filtering
- Entity ID filtering
- Real-time updates

---

### useLocalStorage
**Location**: `src/hooks/useLocalStorage.ts`

**Purpose**: Persist state to localStorage

**Usage**:
```typescript
const [value, setValue] = useLocalStorage('key', defaultValue);
```

---

## Utilities

### logger
**Location**: `src/utils/logger.ts`

**Purpose**: Centralized logging

**Methods**:
- `debug(message, data)`: Debug logging
- `info(message, data)`: Info logging
- `warn(message, data)`: Warning logging
- `error(message, error, context)`: Error logging
- `api(method, url, status, duration)`: API request logging
- `perf(label, duration)`: Performance logging
- `userAction(action, data)`: User action logging

**Usage**:
```typescript
import { logger } from '@utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('API call failed', error, { endpoint: '/api/advertisers' });
logger.api('GET', '/api/campaigns', 200, 150);
```

---

### dateUtils
**Location**: `src/utils/dateUtils.ts`

**Purpose**: Date formatting and manipulation

**Functions**:
- Format dates for display
- Parse timestamps
- Date range calculations
- Timezone handling

---

### dictionaryUtils
**Location**: `src/utils/dictionaryUtils.ts`

**Purpose**: Dictionary data helpers

**Functions**:
- Get localized names
- Filter dictionary items
- Sort dictionary items

---

### htmlSanitizer
**Location**: `src/utils/htmlSanitizer.ts`

**Purpose**: XSS protection for HTML content

**Usage**:
```typescript
import { sanitizeHtml } from '@utils/htmlSanitizer';

const cleanHtml = sanitizeHtml(userProvidedHtml);
```

---

### navigationService
**Location**: `src/utils/navigationService.ts`

**Purpose**: Programmatic navigation outside components

**Usage**:
```typescript
import { navigationService } from '@utils/navigationService';

// Navigate from non-component code
navigationService.navigate('/login');
```

---

## Features Overview

### 1. Advertiser Management
- **CRUD Operations**: Create, read, update, delete advertisers
- **Search**: Search by name or TIN
- **Block Management**: Block/unblock advertisers
- **Validation**: Form validation with Zod schemas

### 2. Campaign Management
- **Complex Targeting**: Location, restaurant type, menu type targeting
- **Scheduling**: Time-based ad scheduling
- **Budget Management**: Total and daily budget tracking
- **Pricing Models**: CPM, CPC, CPA support
- **Priority & Weight**: Campaign prioritization
- **Restaurant Targeting**: Specific restaurant assignments

### 3. Creative Management
- **HTML/CSS Editor**: Monaco editor for creative content
- **Dimension Control**: Min/max width/height constraints
- **Preview**: Real-time creative preview
- **Base64 Encoding**: Secure content storage

### 4. Restaurant Management
- **Location Tracking**: Geographic coordinates
- **Map Integration**: Leaflet map display
- **Multi-classification**: Types, price segments, menu types
- **Campaign Assignment**: Manage restaurant-specific campaigns

### 5. Schedule Management
- **Weekly Schedules**: Day-by-day time configuration
- **Visual Representation**: Color-coded schedules
- **Flexible Timing**: Start/end times per day
- **Reusability**: Schedules shared across campaigns

### 6. Slot Management
- **Slot Types**: MainLarge, MainSmall, Selection, Group
- **Rotation Settings**: Configure ad rotation
- **Refresh Control**: TTL-based refresh
- **Placement Management**: Associated placements

### 7. Dictionary Management
- **Multilingual**: Armenian, Russian, English support
- **Reference Data**: System-wide reference entities
- **CRUD Operations**: Manage dictionary items
- **Hierarchical**: Countries → Cities → Districts

### 8. Audit Logging
- **Change Tracking**: Track all entity modifications
- **User Attribution**: Who made what change
- **Filtering**: Filter by entity type and ID
- **Historical Data**: View entity change history

### 9. Authentication & Authorization
- **Cookie-based Auth**: Secure HttpOnly cookies
- **Protected Routes**: Route-level access control
- **Session Management**: Auto-refresh, timeout handling
- **User Context**: Current user information

### 10. Internationalization
- **Multi-language**: Armenian (default), Russian, English
- **Language Switcher**: Easy language selection
- **Persistent Preference**: Language saved to localStorage
- **Multilingual Data**: Support for multilingual entity names

### 11. Error Handling
- **Error Boundaries**: Catch React errors gracefully
- **API Error Handling**: Structured error responses
- **User Feedback**: Toast notifications
- **Recovery**: Retry mechanisms, fallback UI

### 12. Performance Optimization
- **Code Splitting**: Lazy-loaded routes
- **Memoization**: React.memo, useMemo, useCallback
- **Debouncing**: Input debouncing
- **Virtual Scrolling**: Large list optimization

### 13. Developer Experience
- **TypeScript**: Full type safety
- **Hot Reload**: Fast refresh in development
- **ESLint**: Code quality enforcement
- **Path Aliases**: Clean imports with @
- **Logging**: Comprehensive logging utility

---

## Component Dependency Graph

```
App
│
├── AuthStore (Global State)
├── DictionariesStore (Global State)
│
├── LoginPage
│   └── LoginForm
│
└── MainLayout
    ├── Navigation
    ├── LanguageSwitcher
    │
    ├── AdvertisersListPage
    │   ├── useEntityList
    │   ├── AdvertisersTable
    │   └── AdvertiserFormDialog
    │
    ├── CampaignsListPage
    │   ├── useCampaignsData
    │   ├── CampaignsTable
    │   ├── CampaignFormDialog
    │   ├── TargetingTab
    │   └── AddRestaurantsModal
    │
    ├── CreativesListPage
    │   ├── useEntityList
    │   ├── CreativesTable
    │   └── CreativeFormDialog (with Monaco Editor)
    │
    ├── SchedulesListPage
    │   ├── useEntityList
    │   ├── SchedulesTable
    │   └── ScheduleFormDialog
    │
    ├── RestaurantsListPage
    │   ├── useEntityList
    │   ├── RestaurantsTable
    │   ├── RestaurantsMap (Leaflet)
    │   └── RestaurantCampaignsModal
    │
    ├── SlotsListPage
    │   ├── useEntityList
    │   ├── SlotsTable
    │   └── SlotFormDialog
    │
    ├── DictionariesPage
    │   ├── useEntityList
    │   ├── DictionaryTable
    │   └── DictionaryFormDialog
    │
    └── StatisticsPage
        └── Statistics Components
```

---

## Data Flow

### Fetch Flow
```
Component
  ↓
Custom Hook (useEntityList)
  ↓
API Module (advertisersApi.list)
  ↓
HTTP Client (realApiFetch)
  ↓
Network Request
  ↓
Response Parser
  ↓
Data Transformer (API → Internal)
  ↓
Component State Update
  ↓
UI Re-render
```

### Update Flow
```
User Action (Button Click)
  ↓
Event Handler
  ↓
Optimistic UI Update (Optional)
  ↓
API Call (advertisersApi.update)
  ↓
Data Transformer (Internal → API)
  ↓
HTTP Request
  ↓
Response
  ↓
Data Transformer (API → Internal)
  ↓
Final State Update
  ↓
Success/Error Notification
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026

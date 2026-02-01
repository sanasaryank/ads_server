# Trio Ad Server - Admin Dashboard

A modern, enterprise-grade administration dashboard for managing advertising campaigns, restaurants, creatives, and schedules for the Trio advertising platform.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Development](#development)
- [Architecture](#architecture)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Build and Deployment](#build-and-deployment)
- [Documentation](#documentation)

## 🎯 Overview

Trio Ad Server Admin Dashboard is a React-based single-page application (SPA) that provides a comprehensive interface for managing:

- **Advertisers**: Companies and organizations running ad campaigns
- **Campaigns**: Advertising campaigns with detailed targeting and scheduling
- **Creatives**: Ad content with various dimensions and formats
- **Restaurants**: Partner restaurants where ads are displayed
- **Schedules**: Time-based scheduling for ad display
- **Slots**: Ad placement locations with rotation settings
- **Dictionaries**: System-wide reference data (locations, types, segments)
- **Statistics**: Performance metrics and analytics

## ✨ Features

### Core Functionality
- **Authentication**: Cookie-based authentication with auto-refresh
- **Multi-language Support**: Armenian, Russian, and English
- **Real-time Data**: Live updates with optimistic UI updates
- **Advanced Filtering**: Client-side filtering with multiple criteria
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Error Handling**: Comprehensive error boundaries and recovery
- **Audit Logging**: Track all system changes and user actions
- **Map Integration**: Leaflet maps for geographic targeting
- **Image Display**: Automatic image cropping and scaling for dish placements

### Technical Features
- **Code Splitting**: Lazy-loaded routes for optimal performance
- **Type Safety**: Full TypeScript coverage
- **API Layer**: Robust HTTP client with retry logic
- **State Management**: Zustand for global state
- **Form Validation**: Zod schemas with React Hook Form
- **Accessibility**: WCAG 2.1 compliant components
- **Performance**: Virtualized lists for large datasets

## 🛠 Technology Stack

### Frontend Framework
- **React 19.2.0**: Latest React with concurrent features
- **TypeScript 5.9.3**: Strong typing and developer experience
- **Vite 7.3.1**: Lightning-fast build tool and dev server

### UI Components
- **Material-UI (MUI) 7.3.7**: Comprehensive component library
- **@emotion**: CSS-in-JS styling
- **React Router DOM 7.12.0**: Client-side routing

### State Management
- **Zustand 5.0.9**: Lightweight state management
- **React Hook Form 7.71.0**: Performant forms with validation
- **Zod 4.3.5**: Schema validation

### Internationalization
- **i18next 25.7.4**: Internationalization framework
- **react-i18next 16.5.2**: React bindings for i18next

### Data Visualization
- **Leaflet 1.9.4**: Interactive maps
- **react-leaflet 5.0.0**: React components for Leaflet

### Development Tools
- **ESLint 9.39.1**: Code quality and consistency
- **Vitest 4.0.16**: Unit testing framework
- **Testing Library**: React component testing

### Additional Libraries
- **date-fns 4.1.0**: Date manipulation and formatting
- **notistack 3.0.2**: Toast notifications
- **DOMPurify 3.3.1**: XSS protection for HTML sanitization
- **Monaco Editor**: Code editor for HTML/CSS editing

## 📁 Project Structure

```
trio_ad_server/
├── docs/                      # Documentation
├── public/                    # Static assets
├── src/
│   ├── api/                   # API integration layer
│   │   ├── client.ts         # Base HTTP client
│   │   ├── errors.ts         # Error handling
│   │   ├── endpoints/        # API endpoint definitions
│   │   └── real/             # Real API implementations
│   ├── components/           # React components
│   │   ├── campaigns/        # Campaign-specific components
│   │   ├── common/           # Shared components
│   │   ├── dictionaries/     # Dictionary management
│   │   ├── restaurants/      # Restaurant components
│   │   ├── slots/            # Slot components
│   │   └── ui/               # UI component library
│   ├── config/               # Application configuration
│   │   ├── api.ts           # API endpoints config
│   │   └── env.ts           # Environment variables
│   ├── hooks/                # Custom React hooks
│   ├── i18n/                 # Internationalization
│   │   ├── config.ts        # i18n configuration
│   │   └── locales/         # Translation files
│   ├── layouts/              # Layout components
│   ├── pages/                # Page components
│   │   ├── advertisement/   # Ad management pages
│   │   ├── auth/            # Authentication pages
│   │   ├── dictionaries/    # Dictionary pages
│   │   ├── restaurants/     # Restaurant pages
│   │   ├── slots/           # Slot pages
│   │   └── statistics/      # Analytics pages
│   ├── store/                # State management
│   ├── theme/                # MUI theme configuration
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── eslint.config.js          # ESLint configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Backend API**: Running Trio Ad Server API

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd trio_ad_server
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment** (see [Configuration](#configuration))

4. **Start development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Build
npm run build        # Build for production

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report

# Quality
npm run lint         # Run ESLint

# Preview
npm run preview      # Preview production build
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Application
VITE_APP_MODE=development
VITE_APP_NAME=Trio Admin
VITE_APP_VERSION=1.0.0

# API
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_USE_MOCK_API=false

# Features
VITE_ENABLE_AUDIT_LOG=true
VITE_ENABLE_QR_GENERATION=true

# Debug
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info

# Map Configuration
VITE_MAP_DEFAULT_CENTER_LAT=40.1792
VITE_MAP_DEFAULT_CENTER_LNG=44.4991
VITE_MAP_DEFAULT_ZOOM=12

# Session
VITE_SESSION_TIMEOUT=3600000
VITE_TOKEN_REFRESH_INTERVAL=300000
```

### Configuration Files

#### `vite.config.ts`
- Path aliases for clean imports
- Code splitting configuration
- Development server settings
- Build optimizations

#### `tsconfig.json`
- TypeScript compiler options
- Path mappings matching Vite aliases
- Strict type checking

#### `eslint.config.js`
- Code quality rules
- React-specific rules
- Import/export conventions

## 💻 Development

### Code Organization

#### API Layer (`src/api/`)

The API layer is organized in three parts:

1. **Client** (`client.ts`): Base HTTP client with:
   - Automatic retry logic with exponential backoff
   - Cookie-based authentication
   - Request/response interceptors
   - Timeout handling
   - Error parsing

2. **Endpoints** (`endpoints/`): API endpoint definitions
   - Type-safe endpoint URLs
   - Request/response types
   - Documentation

3. **Real Implementations** (`real/`): Actual API calls
   - Data transformers (API ↔ Internal format)
   - CRUD operations
   - Error handling

Example API usage:
```typescript
import { advertisersApi } from '@api';

// Fetch all advertisers
const advertisers = await advertisersApi.list();

// Create new advertiser
const newAdvertiser = await advertisersApi.create({
  name: 'Acme Corp',
  tin: '12345678',
  blocked: false,
});

// Update advertiser
const updated = await advertisersApi.update(id, {
  ...data,
  hash: currentHash, // Optimistic locking
});
```

#### Custom Hooks (`src/hooks/`)

Reusable business logic:

- **`useEntityList`**: Generic CRUD list management
- **`useCampaignsData`**: Campaign-specific data logic
- **`useFormDialog`**: Dialog form state management
- **`usePagination`**: Pagination logic
- **`useFilters`**: Filter state management
- **`useDebounce`**: Debounced value updates
- **`useLocalStorage`**: Persistent local state

Example hook usage:
```typescript
const entityList = useEntityList({
  fetchList: advertisersApi.list,
  toggleBlock: advertisersApi.block,
  filterFn: (entities, filters, search) => {
    return entities.filter(e => 
      e.name.toLowerCase().includes(search.toLowerCase())
    );
  },
  entityName: 'advertiser',
});
```

#### Components (`src/components/`)

Components are organized by feature:

- **`common/`**: Shared components (ErrorBoundary, ProtectedRoute)
- **`campaigns/`**: Campaign management components
- **`restaurants/`**: Restaurant components
- **`ui/`**: Reusable UI components (atoms, molecules)

Component best practices:
- Use TypeScript for all components
- Implement error boundaries
- Memoize expensive computations
- Use React.memo for expensive renders

#### State Management (`src/store/`)

Zustand stores for global state:

- **`authStore`**: User authentication state
- **`dictionariesStore`**: Reference dictionary data
- **`advertisersStore`**: Advertiser management
- **`restaurantsStore`**: Restaurant data

Store example:
```typescript
// Using auth store
const { user, isAuthenticated, login, logout } = useAuthStore();

// Login
await login({ username, password });

// Check if authenticated
if (isAuthenticated) {
  logger.info('User:', user);
}
```

### Type System

All types are centralized in `src/types/`:

```typescript
// Base entity interface
interface BaseEntity {
  id: number;
  blocked: boolean;
}

// Domain entities
interface Advertiser extends BaseEntity {
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  tin: string;
  description?: string;
}

// API types (separate from internal types)
interface ApiAdvertiser {
  id: number;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  TIN: string;
  isBlocked: boolean;
  description?: string;
}
```

### Error Handling

Comprehensive error handling strategy:

1. **API Errors**: Custom `ApiError` class with status codes
2. **Error Boundaries**: Catch React component errors
3. **Global Handlers**: Window error and unhandled rejection
4. **User Feedback**: Toast notifications for all errors

Error handling example:
```typescript
try {
  await advertisersApi.create(data);
  enqueueSnackbar('Created successfully', { variant: 'success' });
} catch (error) {
  if (error instanceof ApiError) {
    enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
  } else {
    enqueueSnackbar('Unexpected error', { variant: 'error' });
  }
}
```

### Logging

Centralized logging utility (`src/utils/logger.ts`):

```typescript
import { logger } from '@utils/logger';

// Different log levels
logger.debug('Debug info', data);
logger.info('Info message', data);
logger.warn('Warning', data);
logger.error('Error occurred', error, context);

// Special loggers
logger.api('GET', '/api/advertisers', 200, 150);
logger.perf('Component render', 45.2);
logger.userAction('button_click', { buttonId: 'save' });
```

## 🔌 API Integration

### Authentication

Cookie-based authentication with HttpOnly cookies:

```typescript
// Login
const response = await authApi.login({
  username: 'admin',
  password: 'password',
});
// Cookie is automatically set by server

// Check authentication
const user = await authApi.me();

// Logout
await authApi.logout();
// Cookie is cleared by server
```

### API Endpoints

All endpoints are defined in `src/config/api.ts`:

| Endpoint | Description |
|----------|-------------|
| `/auth` | Authentication (login, logout, me) |
| `/advertisers` | Advertiser management |
| `/campaigns` | Campaign management |
| `/creatives` | Creative management |
| `/restaurants` | Restaurant management |
| `/schedules` | Schedule management |
| `/adslots` | Ad slot management |
| `/dictionaries` | Dictionary data |
| `/locations` | Location data |
| `/audit` | Audit log events |

### Data Transformers

API responses are transformed to internal format:

```typescript
// API format (snake_case, different naming)
interface ApiAdvertiser {
  id: number;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  TIN: string;
  isBlocked: boolean;
}

// Internal format (camelCase, consistent naming)
interface Advertiser {
  id: number;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  tin: string;
  blocked: boolean;
}

// Transformer
const transformer = createApiTransformer<ApiAdvertiser, Advertiser>(
  (api) => ({
    id: api.id,
    name: api.name,
    tin: api.TIN,
    blocked: api.isBlocked,
  }),
  (internal) => ({
    id: internal.id,
    name: internal.name,
    TIN: internal.tin,
    isBlocked: internal.blocked,
  })
);
```

### Optimistic Locking

Prevent concurrent updates with hash-based locking:

```typescript
// Get entity with hash
const advertiser = await advertisersApi.getById(id);
// advertiser.hash = "abc123"

// Update with hash
await advertisersApi.update(id, {
  ...data,
  hash: advertiser.hash, // Include current hash
});

// If hash mismatch (concurrent update), API returns 460 error
```

## 🗄️ State Management

### Global State (Zustand)

#### Auth Store
Manages authentication state:
```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

#### Dictionaries Store
Holds reference data:
```typescript
const { 
  locations, 
  restaurantTypes, 
  menuTypes,
  slots,
  schedules 
} = useDictionariesStore();
```

### Local State

- Component state with `useState`
- Form state with `react-hook-form`
- URL state with `react-router-dom`

### Data Fetching

Use custom hooks for data fetching:

```typescript
const {
  entities,
  loading,
  refetch,
  searchTerm,
  setSearchTerm,
  filters,
  updateFilter,
} = useEntityList({
  fetchList: advertisersApi.list,
  entityName: 'advertiser',
});
```

## 🌍 Internationalization

### Supported Languages

- **Armenian (hy)**: Default language
- **Russian (ru)**: Secondary language
- **English (en)**: Tertiary language

### Translation Files

Located in `src/i18n/locales/`:
- `hy.json`: Armenian translations
- `ru.json`: Russian translations
- `en.json`: English translations

### Usage

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('pages.advertisers.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

### Language Switching

```typescript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };
}
```

### Multilingual Data

Dictionary names and other content support multiple languages:

```typescript
interface DictionaryName {
  ARM: string;
  ENG: string;
  RUS: string;
}

interface DictionaryItem {
  id: string;
  name: DictionaryName;
  isBlocked: boolean;
}
```

## 🧪 Testing

### Unit Tests

Using Vitest and Testing Library:

```bash
# Run tests
npm run test

# Run with UI
npm run test:ui

# Generate coverage
npm run test:coverage
```

### Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Testing Best Practices

1. Test user behavior, not implementation
2. Use semantic queries (getByRole, getByLabelText)
3. Mock API calls
4. Test error states
5. Test loading states

## 🏗️ Build and Deployment

### Production Build

```bash
# Build for production
npm run build

# Output: dist/ directory
```

### Build Configuration

The build process:
1. TypeScript compilation
2. Code minification
3. Code splitting (manual chunks)
4. Asset optimization
5. Source map generation

### Manual Chunks

Optimized code splitting:

```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-mui': ['@mui/material', '@mui/icons-material'],
  'vendor-forms': ['react-hook-form', 'zod'],
  'vendor-i18n': ['i18next', 'react-i18next'],
  'vendor-maps': ['leaflet', 'react-leaflet'],
}
```

### Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Serve static files**:
   - Use any static file server (nginx, Apache)
   - Serve `dist/` directory
   - Configure fallback to `index.html` for client-side routing

3. **Environment variables**:
   - Set production environment variables
   - Update API base URL
   - Disable debug mode

Example nginx configuration:
```nginx
server {
  listen 80;
  server_name your-domain.com;
  
  root /var/www/trio-admin/dist;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  location /api {
    proxy_pass http://backend-server:3000;
  }
}
```

### Production Checklist

- [ ] Set `VITE_APP_MODE=production`
- [ ] Configure production API URL
- [ ] Enable HTTPS
- [ ] Set up error monitoring
- [ ] Configure CORS properly
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Run security audit

## 📊 Performance

### Optimization Techniques

1. **Code Splitting**: Lazy-loaded routes
2. **Memoization**: React.memo, useMemo, useCallback
3. **Virtual Scrolling**: For large lists
4. **Debouncing**: Search and filter inputs
5. **Tree Shaking**: Unused code elimination

### Performance Monitoring

Use React DevTools and Chrome DevTools to monitor:
- Component render times
- Network requests
- Bundle size
- Memory usage

## 🔒 Security

### Implemented Security Measures

1. **XSS Protection**: DOMPurify for HTML sanitization
2. **CSRF Protection**: Cookie-based auth with SameSite
3. **Input Validation**: Zod schemas for all forms
4. **Type Safety**: Full TypeScript coverage
5. **Secure Headers**: Set by backend
6. **Error Handling**: No sensitive data in error messages

### Security Best Practices

- Never store sensitive data in localStorage
- Use HttpOnly cookies for authentication
- Validate all user inputs
- Sanitize HTML content
- Keep dependencies updated
- Use environment variables for secrets

## 🤝 Contributing

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Write meaningful commit messages
- Add JSDoc comments for complex functions

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Run linting and tests
5. Submit PR with description

## 📄 License

[Add your license information here]

## 👥 Team

[Add your team information here]

## 📞 Support

For support, email [support@example.com] or open an issue in the repository.

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[README.md](README.md)** - This file, project overview and quick start
- **[API.md](docs/API.md)** - Complete API reference with all endpoints and data types
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guide and best practices
- **[COMPONENTS.md](docs/COMPONENTS.md)** - Detailed component and feature documentation
- **[QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Quick lookup for common tasks

### Quick Links

- New to the project? Start with [Getting Started](#getting-started)
- Setting up development? See [DEVELOPMENT.md](docs/DEVELOPMENT.md)
- Need API details? Check [API.md](docs/API.md)
- Understanding the codebase? Read [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Looking for a specific component? Browse [COMPONENTS.md](docs/COMPONENTS.md)
- Quick reference needed? Use [QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained by**: [Your Team Name]

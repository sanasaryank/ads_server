# Architecture Documentation

Comprehensive architecture guide for the Trio Ad Server Admin Dashboard.

## Table of Contents

- [System Architecture](#system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Component Architecture](#component-architecture)
- [State Management Architecture](#state-management-architecture)
- [API Layer Architecture](#api-layer-architecture)
- [Routing Architecture](#routing-architecture)
- [Error Handling Architecture](#error-handling-architecture)
- [Performance Architecture](#performance-architecture)
- [Security Architecture](#security-architecture)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Trio Ad Server Admin Dashboard (React)        │ │
│  │                                                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │ │
│  │  │  Pages   │  │Components│  │  State Management  │  │ │
│  │  └────┬─────┘  └────┬─────┘  └─────────┬──────────┘  │ │
│  │       │             │                   │              │ │
│  │       └─────────────┴───────────────────┘              │ │
│  │                     │                                   │ │
│  │              ┌──────┴───────┐                          │ │
│  │              │   API Layer   │                          │ │
│  │              └──────┬───────┘                          │ │
│  └─────────────────────┼────────────────────────────────┘ │
│                        │ HTTP/HTTPS (Cookie Auth)          │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Trio Ad Server API    │
            │  (Backend Service)     │
            └────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │      Database          │
            │   (PostgreSQL/etc.)    │
            └────────────────────────┘
```

### Technology Stack Layers

```
┌─────────────────────────────────────────────────────┐
│                  Application Layer                   │
│  React Components, Pages, Business Logic             │
├─────────────────────────────────────────────────────┤
│                  Presentation Layer                  │
│  Material-UI, Emotion, Theming, i18n               │
├─────────────────────────────────────────────────────┤
│                  State Layer                         │
│  Zustand, React Hook Form, Local State             │
├─────────────────────────────────────────────────────┤
│                  API Layer                           │
│  HTTP Client, Transformers, Error Handling          │
├─────────────────────────────────────────────────────┤
│                  Build Layer                         │
│  Vite, TypeScript, ESLint                          │
├─────────────────────────────────────────────────────┤
│                  Runtime Environment                 │
│  Browser (Chrome, Firefox, Safari, Edge)           │
└─────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Directory Structure Philosophy

The application follows a **feature-based architecture** with **shared components**:

```
src/
├── api/              # API integration (data layer)
├── components/       # UI components (presentation layer)
│   ├── common/      # Shared components
│   └── {feature}/   # Feature-specific components
├── pages/           # Route pages (page layer)
│   └── {feature}/   # Feature pages
├── hooks/           # Custom React hooks (logic layer)
├── store/           # Global state (state layer)
├── utils/           # Utilities (helper layer)
├── types/           # TypeScript types (type layer)
├── config/          # Configuration (config layer)
├── i18n/            # Internationalization
├── theme/           # Styling theme
└── layouts/         # Layout components
```

### Architectural Principles

1. **Separation of Concerns**
   - UI logic separate from business logic
   - API layer decoupled from components
   - State management isolated from components

2. **Single Responsibility**
   - Each module has one clear purpose
   - Components do one thing well
   - Hooks encapsulate specific logic

3. **DRY (Don't Repeat Yourself)**
   - Shared components in `common/`
   - Reusable hooks in `hooks/`
   - Centralized utilities in `utils/`

4. **Type Safety**
   - Full TypeScript coverage
   - Strict type checking enabled
   - API types separate from internal types

5. **Testability**
   - Pure functions where possible
   - Dependency injection
   - Mockable API layer

---

## Component Architecture

### Component Hierarchy

```
App
├── ErrorBoundary
│   └── ThemeProvider
│       └── SnackbarProvider
│           └── BrowserRouter
│               └── AppRouter
│                   ├── LoginPage
│                   └── ProtectedRoute
│                       └── MainLayout
│                           ├── AppBar
│                           ├── Drawer
│                           └── Outlet (Pages)
│                               ├── RestaurantsListPage
│                               ├── AdvertisersListPage
│                               ├── CampaignsListPage
│                               └── ... (other pages)
```

### Component Types

#### 1. Page Components

**Location**: `src/pages/{feature}/`

**Responsibility**:
- Top-level route components
- Data fetching and loading states
- Page-level error boundaries
- Compose feature components

**Example**:
```typescript
export const AdvertisersListPage = () => {
  const entityList = useEntityList({
    fetchList: advertisersApi.list,
    entityName: 'advertiser',
  });

  return (
    <Box>
      <PageHeader title={t('pages.advertisers.title')} />
      <SearchBar value={entityList.searchTerm} onChange={entityList.setSearchTerm} />
      <AdvertisersTable data={entityList.filteredEntities} loading={entityList.loading} />
    </Box>
  );
};
```

#### 2. Feature Components

**Location**: `src/components/{feature}/`

**Responsibility**:
- Feature-specific UI
- Local state management
- User interactions
- Delegate to common components

**Example**:
```typescript
export const AdvertisersTable = ({ data, loading }) => {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  return (
    <Table>
      <TableHead>
        <SortableColumn field="name" onSort={handleSort} />
      </TableHead>
      <TableBody>
        {data.map(advertiser => (
          <AdvertiserRow key={advertiser.id} advertiser={advertiser} />
        ))}
      </TableBody>
    </Table>
  );
};
```

#### 3. Common Components

**Location**: `src/components/common/`

**Responsibility**:
- Shared across features
- No feature-specific logic
- Reusable and configurable
- Well-documented props

**Example**:
```typescript
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} color="primary">{t('common.confirm')}</Button>
      </DialogActions>
    </Dialog>
  );
};
```

#### 4. UI Components

**Location**: `src/components/ui/`

**Responsibility**:
- Atomic design principles
- atoms: buttons, inputs, labels
- molecules: form fields, cards
- styled: styled wrappers

### Component Best Practices

1. **Use Functional Components**
```typescript
// ✅ Good
const MyComponent = () => { ... };

// ❌ Bad
class MyComponent extends React.Component { ... }
```

2. **Destructure Props**
```typescript
// ✅ Good
const MyComponent = ({ title, count }: Props) => { ... };

// ❌ Bad
const MyComponent = (props: Props) => {
  const title = props.title;
  ...
};
```

3. **Use TypeScript Interfaces**
```typescript
interface MyComponentProps {
  title: string;
  count: number;
  onSubmit: (data: FormData) => void;
}
```

4. **Memoize Expensive Computations**
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

5. **Use React.memo for Pure Components**
```typescript
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Only re-renders when data changes
  return <div>{data}</div>;
});
```

---

## State Management Architecture

### State Layers

```
┌────────────────────────────────────────────────┐
│           Server State (API)                   │
│  Advertisers, Campaigns, Restaurants, etc.    │
└───────────────┬────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────┐
│           Global State (Zustand)               │
│  Auth, Dictionaries, User Preferences         │
└───────────────┬────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────┐
│           Local State (useState)               │
│  Component state, UI state                    │
└────────────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────┐
│           Form State (React Hook Form)         │
│  Form inputs, validation                      │
└────────────────────────────────────────────────┘
```

### Zustand Stores

#### Auth Store

**Purpose**: Manage authentication state

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

**When to use**:
- Authentication status
- User information
- Login/logout actions

#### Dictionaries Store

**Purpose**: Hold reference data for current session

```typescript
interface DictionariesState {
  locations: District[];
  restaurantTypes: DictionaryItem[];
  menuTypes: DictionaryItem[];
  slots: Slot[];
  schedules: Schedule[];
  loading: boolean;
  setAllDictionaries: (data: Partial<DictionariesState>) => void;
}
```

**When to use**:
- Reference data needed across features
- Data that changes infrequently
- Avoid repeated API calls

### State Management Patterns

#### 1. Server State Pattern

Use custom hooks for server data:

```typescript
const useAdvertisers = () => {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await advertisersApi.list();
        setAdvertisers(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { advertisers, loading, error };
};
```

#### 2. Optimistic Updates Pattern

Update UI immediately, rollback on error:

```typescript
const handleToggleBlock = async (id: string, currentState: boolean) => {
  const newState = !currentState;
  
  // Optimistic update
  setAdvertisers(prev => 
    prev.map(a => a.id === id ? { ...a, blocked: newState } : a)
  );

  try {
    await advertisersApi.block(id, newState);
  } catch (error) {
    // Rollback on error
    setAdvertisers(prev => 
      prev.map(a => a.id === id ? { ...a, blocked: currentState } : a)
    );
    showError(error);
  }
};
```

#### 3. Form State Pattern

Use React Hook Form with Zod validation:

```typescript
const schema = z.object({
  name: z.object({
    ARM: z.string().min(1),
    ENG: z.string().min(1),
    RUS: z.string().min(1)
  }),
  tin: z.string().length(8),
  blocked: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

---

## API Layer Architecture

### API Layer Structure

```
api/
├── client.ts              # Base HTTP client
├── errors.ts              # Error handling
├── index.ts               # Public API exports
├── endpoints/             # Endpoint definitions
│   ├── index.ts
│   ├── auth.ts
│   ├── advertisers.ts
│   └── ...
└── real/                  # Implementations
    ├── client.ts          # Real HTTP client
    ├── transformer.ts     # Data transformers
    ├── advertisers.ts
    ├── campaigns.ts
    └── ...
```

### Request Flow

```
Component
    │
    ▼
Custom Hook (useEntityList)
    │
    ▼
API Module (advertisersApi.list)
    │
    ▼
API Client (realApiFetch)
    │
    ├─► Request Interceptor
    │   ├─► Add credentials
    │   ├─► Add timeout
    │   └─► Add headers
    │
    ▼
Network Request (fetch)
    │
    ▼
Response Handling
    │
    ├─► Parse JSON
    ├─► Check status
    ├─► Parse errors
    └─► Transform data
    │
    ▼
Return to Component
```

### API Client Features

1. **Automatic Cookie Handling**
   - Credentials included in all requests
   - HttpOnly cookies managed by browser

2. **Retry Logic**
   - Exponential backoff
   - Max 3 retries
   - Only retries safe errors

3. **Timeout Handling**
   - AbortController for timeout
   - Configurable timeout (30s default)

4. **Error Parsing**
   - Structured error responses
   - User-friendly messages
   - Error categorization

5. **Request Logging**
   - API calls logged in dev mode
   - Performance metrics
   - Error tracking

---

## Routing Architecture

### Route Structure

```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  
  <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
    <Route index element={<Navigate to="/restaurants" />} />
    
    <Route path="restaurants" element={
      <ErrorBoundary><RestaurantsListPage /></ErrorBoundary>
    } />
    
    <Route path="advertisers" element={
      <ErrorBoundary><AdvertisersListPage /></ErrorBoundary>
    } />
    
    <Route path="campaigns" element={
      <ErrorBoundary><CampaignsListPage /></ErrorBoundary>
    } />
    
    {/* ... more routes */}
  </Route>
</Routes>
```

### Route Protection

```typescript
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### Code Splitting

Routes are lazy-loaded for performance:

```typescript
const AdvertisersListPage = lazy(() => 
  import('./pages/advertisement/AdvertisersListPage')
);

// Wrapped in Suspense
<Suspense fallback={<LoadingFallback />}>
  <AdvertisersListPage />
</Suspense>
```

---

## Error Handling Architecture

### Error Boundary Hierarchy

```
App ErrorBoundary (Global)
    │
    ├─► Route ErrorBoundaries (Per-section)
    │   ├─► RestaurantsErrorFallback
    │   ├─► AdvertisementErrorFallback
    │   └─► StatisticsErrorFallback
    │
    └─► Component ErrorBoundaries (Specific)
        └─► Local error handling
```

### Error Handling Layers

1. **Global Error Handlers**
   - Window error events
   - Unhandled promise rejections
   - React error boundaries

2. **API Error Handling**
   - ApiError class with structured info
   - Automatic error categorization
   - User-friendly error messages

3. **Component Error Handling**
   - Try-catch blocks
   - Error state management
   - User feedback via toast

4. **Form Validation Errors**
   - Zod schema validation
   - Field-level error messages
   - Submit error handling

### Error Recovery Strategies

1. **Retry**: Automatic retry for transient errors
2. **Rollback**: Optimistic update rollback
3. **Fallback UI**: Error boundary fallback
4. **Reset**: Error boundary reset on navigation
5. **Notification**: Toast messages for user feedback

---

## Performance Architecture

### Performance Optimizations

1. **Code Splitting**
   - Lazy-loaded routes
   - Dynamic imports
   - Manual chunks for vendors

2. **Memoization**
   - React.memo for components
   - useMemo for expensive calculations
   - useCallback for function references

3. **Virtualization**
   - Virtual scrolling for large lists
   - @tanstack/react-virtual

4. **Debouncing**
   - Search input debouncing
   - Filter updates debouncing

5. **Local Storage**
   - User preferences (language, theme)
   - Session persistence

### Bundle Optimization

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-mui': ['@mui/material', '@mui/icons-material'],
        'vendor-forms': ['react-hook-form', 'zod'],
        'vendor-i18n': ['i18next', 'react-i18next'],
        'vendor-maps': ['leaflet', 'react-leaflet'],
      },
    },
  },
}
```

### Performance Monitoring

- React DevTools Profiler
- Chrome DevTools Performance
- Network tab for API calls
- Lighthouse audits

---

## Security Architecture

### Security Measures

1. **Authentication**
   - Cookie-based authentication
   - HttpOnly cookies
   - Secure flag in production
   - SameSite: Strict

2. **Authorization**
   - Protected routes
   - Server-side validation
   - Role-based access (future)

3. **XSS Protection**
   - DOMPurify for HTML sanitization
   - React's built-in XSS protection
   - Content Security Policy headers

4. **Input Validation**
   - Zod schemas on client
   - Server-side validation
   - Type checking with TypeScript

5. **Secure Communication**
   - HTTPS in production
   - CORS configuration
   - Credentials: include

6. **Sensitive Data**
   - No sensitive data in localStorage
   - Passwords never logged
   - Sanitized error messages

### Security Best Practices

```typescript
// ✅ Good: Sanitize HTML
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);

// ✅ Good: Validate input
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ✅ Good: Handle sensitive data
// Never log passwords or tokens
logger.debug('Login attempt', { username }); // OK
logger.debug('Login attempt', { password }); // ❌ NEVER
```

---

## Scalability Considerations

### Current Architecture

- Single-page application
- Client-side rendering
- API-based data fetching
- Suitable for admin dashboards

### Future Enhancements

1. **Server-Side Rendering (SSR)**
   - For public-facing pages
   - Better SEO
   - Faster initial load

2. **Micro-frontends**
   - Split by feature domain
   - Independent deployment
   - Team autonomy

3. **State Management Evolution**
   - Consider React Query for server state
   - Keep Zustand for client state
   - Optimize data fetching patterns

4. **Progressive Web App (PWA)**
   - Offline support
   - Service workers
   - Push notifications

---

## Testing Architecture

### Testing Pyramid

```
       ┌────────────┐
       │    E2E     │  ← Few, slow, expensive
       └────────────┘
      ┌──────────────┐
      │ Integration  │  ← Some, medium speed
      └──────────────┘
    ┌──────────────────┐
    │   Unit Tests     │  ← Many, fast, cheap
    └──────────────────┘
```

### Test Categories

1. **Unit Tests**
   - Utils functions
   - Transformers
   - Custom hooks
   - Pure components

2. **Integration Tests**
   - Component + hooks
   - API layer + transformers
   - Form + validation

3. **E2E Tests** (Future)
   - User workflows
   - Critical paths
   - Cross-browser testing

### Test Tools

- **Vitest**: Test runner
- **Testing Library**: Component testing
- **jsdom**: DOM simulation
- **MSW** (Future): API mocking

---

## Monitoring and Observability

### Current Logging

- Console logging in development
- Structured logger utility
- API request/response logging
- Error tracking

### Future Monitoring

1. **Error Tracking**
   - Sentry integration
   - Error aggregation
   - Stack trace analysis

2. **Performance Monitoring**
   - Real User Monitoring (RUM)
   - Core Web Vitals
   - API latency tracking

3. **Analytics**
   - User behavior tracking
   - Feature usage metrics
   - Conversion funnels

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026

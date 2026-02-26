# Development Guide

A comprehensive guide for developers working on the Trio Ad Server Admin Dashboard.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Component Development](#component-development)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Form Handling](#form-handling)
- [Internationalization](#internationalization)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Tips](#performance-tips)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd trio_ad_server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
# Update VITE_API_BASE_URL to point to your backend

# Start development server
npm run dev
```

### Development Server

The dev server will start at `http://localhost:5173` with:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- TypeScript type checking
- ESLint warnings/errors

---

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Start dev server
npm run dev

# 4. Make changes and test

# 5. Run linting
npm run lint

# 6. Commit changes
git add .
git commit -m "feat: add my feature"

# 7. Push and create PR
git push origin feature/my-feature
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new campaign targeting options
fix: resolve schedule conflict validation
refactor: simplify advertiser form logic
docs: update API documentation
test: add tests for campaign filtering
chore: update dependencies
```

---

## Code Style Guide

### TypeScript

#### Always Use Types

```typescript
// ✅ Good
interface Advertiser {
  id: string;
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  tin: string;
}

const getAdvertiser = (id: string): Promise<Advertiser> => {
  return api.get(`/advertisers/${id}`);
};

// ❌ Bad
const getAdvertiser = (id: any): any => {
  return api.get(`/advertisers/${id}`);
};
```

#### Use Interfaces for Objects

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// ✅ Also good for union types
type Status = 'pending' | 'active' | 'completed';
```

#### Avoid `any`

```typescript
// ❌ Bad
const data: any = fetchData();

// ✅ Good
const data: User[] = fetchData();

// ✅ Good (if truly unknown)
const data: unknown = fetchData();
if (isUser(data)) {
  // Type guard narrows to User
}
```

### React Components

#### Functional Components

```typescript
// ✅ Good
interface MyComponentProps {
  title: string;
  count: number;
}

export const MyComponent = ({ title, count }: MyComponentProps) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>{count}</p>
    </div>
  );
};

// ❌ Bad
export const MyComponent = (props: any) => {
  return <div>{props.title}</div>;
};
```

#### Destructure Props

```typescript
// ✅ Good
const UserCard = ({ name, email, avatar }: UserCardProps) => {
  return (
    <Card>
      <Avatar src={avatar} />
      <h3>{name}</h3>
      <p>{email}</p>
    </Card>
  );
};

// ❌ Bad
const UserCard = (props: UserCardProps) => {
  return (
    <Card>
      <Avatar src={props.avatar} />
      <h3>{props.name}</h3>
      <p>{props.email}</p>
    </Card>
  );
};
```

#### Use Meaningful Names

```typescript
// ✅ Good
const isUserAuthenticated = user !== null;
const handleSubmitForm = () => { ... };
const advertisersWithCampaigns = advertisers.filter(a => a.campaigns.length > 0);

// ❌ Bad
const flag = user !== null;
const submit = () => { ... };
const list2 = advertisers.filter(a => a.campaigns.length > 0);
```

### File Organization

```typescript
// Component file structure
import { useState, useEffect } from 'react';  // React imports
import { useTranslation } from 'react-i18next';  // Third-party imports
import { Box, Button } from '@mui/material';  // UI library imports

import { useEntityList } from '@hooks';  // Local hooks
import { advertisersApi } from '@api';  // API imports
import type { Advertiser } from '@types';  // Type imports

// Component implementation
export const MyComponent = () => {
  // State declarations
  const [loading, setLoading] = useState(false);
  
  // Hooks
  const { t } = useTranslation();
  const entityList = useEntityList(...);
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleClick = () => { ... };
  
  // Render
  return (
    <Box>
      {/* Component JSX */}
    </Box>
  );
};
```

---

## Component Development

### Creating a New Component

1. **Determine component type**:
   - Page component → `src/pages/{feature}/`
   - Feature component → `src/components/{feature}/`
   - Common component → `src/components/common/`
   - UI component → `src/components/ui/`

2. **Create component file**:

```typescript
// src/components/campaigns/CampaignCard.tsx
import { Card, CardContent, Typography } from '@mui/material';
import type { Campaign } from '@types';

interface CampaignCardProps {
  campaign: Campaign;
  onClick?: (campaign: Campaign) => void;
}

export const CampaignCard = ({ campaign, onClick }: CampaignCardProps) => {
  return (
    <Card onClick={() => onClick?.(campaign)}>
      <CardContent>
        <Typography variant="h6">{campaign.name}</Typography>
        <Typography variant="body2">{campaign.description}</Typography>
      </CardContent>
    </Card>
  );
};
```

3. **Export from index** (if creating a module):

```typescript
// src/components/campaigns/index.ts
export { CampaignCard } from './CampaignCard';
export { CampaignForm } from './CampaignForm';
export { CampaignTable } from './CampaignTable';
```

### Component Patterns

#### Loading State

```typescript
export const MyComponent = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Data[]>([]);

  if (loading) {
    return <CircularProgress />;
  }

  return <DataTable data={data} />;
};
```

#### Error State

```typescript
export const MyComponent = () => {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <Alert severity="error">
        {error.message}
      </Alert>
    );
  }

  return <Content />;
};
```

#### Empty State

```typescript
export const MyComponent = ({ data }: Props) => {
  if (data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6">No data available</Typography>
        <Button onClick={handleCreate}>Create New</Button>
      </Box>
    );
  }

  return <DataList data={data} />;
};
```

---

## API Integration

### Creating a New API Module

1. **Define types** in `src/types/`:

```typescript
// src/types/index.ts
export interface MyEntity {
  id: string;
  description: string;
  blocked: boolean;
}

export interface ApiMyEntity {
  id: string;
  description: string;
  isBlocked: boolean;
}
```

2. **Create API implementation** in `src/api/real/`:

```typescript
// src/api/real/myEntities.ts
import { realApiFetch, parseJsonResponse } from './client';
import { createApiTransformer } from './transformer';
import { env } from '@config/env';
import type { MyEntity, ApiMyEntity } from '@types';

const BASE_URL = `${env.apiBaseUrl}/my-entities`;

const transformer = createApiTransformer<ApiMyEntity, MyEntity>(
  (api) => ({
    id: api.id,
    name: api.name,
    blocked: api.isBlocked,
  }),
  (internal) => ({
    id: internal.id,
    name: internal.name,
    isBlocked: internal.blocked,
  })
);

export const realMyEntitiesApi = {
  list: async (): Promise<MyEntity[]> => {
    const response = await realApiFetch(BASE_URL, { method: 'GET' });
    const data = await parseJsonResponse<ApiMyEntity[]>(response);
    return transformer.fromApiList(data || []);
  },

  getById: async (id: string): Promise<MyEntity> => {
    const response = await realApiFetch(`${BASE_URL}/${id}`, { method: 'GET' });
    const data = await parseJsonResponse<ApiMyEntity>(response);
    if (!data) throw new Error('Empty response');
    return transformer.fromApi(data);
  },

  create: async (formData: MyEntityFormData): Promise<MyEntity> => {
    const response = await realApiFetch(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(transformer.toApi(formData)),
    });
    const data = await parseJsonResponse<ApiMyEntity>(response);
    if (!data) throw new Error('Empty response');
    return transformer.fromApi(data);
  },
};
```

3. **Export from endpoints**:

```typescript
// src/api/endpoints/myEntities.ts
export { realMyEntitiesApi as myEntitiesApi } from '../real/myEntities';
```

4. **Export from API index**:

```typescript
// src/api/index.ts
export { myEntitiesApi } from './endpoints/myEntities';
```

### Using API in Components

```typescript
import { myEntitiesApi } from '@api';

const MyComponent = () => {
  const [entities, setEntities] = useState<MyEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await myEntitiesApi.list();
        setEntities(data);
      } catch (error) {
        logger.error('Failed to fetch:', error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return <DataTable data={entities} loading={loading} />;
};
```

---

## State Management

### When to Use Each State Type

#### Local State (useState)

**Use for**:
- Component-specific UI state
- Form input values (not using React Hook Form)
- Modal open/close state
- Temporary data

```typescript
const [open, setOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);
```

#### Global State (Zustand)

**Use for**:
- Authentication state
- User preferences
- Reference data for current session
- Shared across many components

```typescript
// Create store
export const useMyStore = create<MyState>((set) => ({
  data: [],
  loading: false,
  setData: (data) => set({ data }),
  setLoading: (loading) => set({ loading }),
}));

// Use in component
const { data, loading, setData } = useMyStore();
```

#### Form State (React Hook Form)

**Use for**:
- All forms
- Complex validation
- Multi-step forms

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

#### Custom Hooks

**Use for**:
- Reusable business logic
- Data fetching with state
- Complex state management

```typescript
const useAdvertisers = () => {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch logic
  }, []);

  return { advertisers, loading };
};
```

---

## Form Handling

### Creating a Form

1. **Define Zod schema**:

```typescript
const schema = z.object({
  name: z.object({
    ARM: z.string().min(1, 'Armenian name is required'),
    ENG: z.string().min(1, 'English name is required'),
    RUS: z.string().min(1, 'Russian name is required')
  }),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older'),
});

type FormData = z.infer<typeof schema>;
```

2. **Create form component**:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const MyForm = ({ onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <TextField
        {...register('name')}
        label="Name"
        error={!!errors.name}
        helperText={errors.name?.message}
      />
      
      <TextField
        {...register('email')}
        label="Email"
        type="email"
        error={!!errors.email}
        helperText={errors.email?.message}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
};
```

### Form Validation

```typescript
// Custom validation
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Conditional validation
const schema = z.object({
  type: z.enum(['individual', 'company']),
  companyName: z.string().optional(),
}).refine((data) => {
  if (data.type === 'company') {
    return data.companyName && data.companyName.length > 0;
  }
  return true;
}, {
  message: 'Company name is required for company type',
  path: ['companyName'],
});
```

---

## Internationalization

### Adding Translations

1. **Add keys to translation files**:

```json
// src/i18n/locales/en.json
{
  "pages": {
    "myFeature": {
      "title": "My Feature",
      "description": "Feature description",
      "buttons": {
        "create": "Create New",
        "edit": "Edit"
      }
    }
  }
}
```

2. **Use in components**:

```typescript
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('pages.myFeature.title')}</h1>
      <p>{t('pages.myFeature.description')}</p>
      <Button>{t('pages.myFeature.buttons.create')}</Button>
    </div>
  );
};
```

### Translation Best Practices

```typescript
// ✅ Good: Use descriptive keys
t('pages.campaigns.form.fields.name.label')

// ❌ Bad: Generic keys
t('label1')

// ✅ Good: Organize by feature
{
  "pages": {
    "campaigns": {
      "form": { ... }
    }
  }
}

// ❌ Bad: Flat structure
{
  "campaign_form_name": "Name",
  "campaign_form_email": "Email"
}
```

### Multilingual Data

```typescript
interface DictionaryName {
  ARM: string;
  ENG: string;
  RUS: string;
}

// Display multilingual content
const DisplayName = ({ name }: { name: DictionaryName }) => {
  const { i18n } = useTranslation();
  
  const getLocalizedName = () => {
    switch (i18n.language) {
      case 'hy': return name.ARM;
      case 'ru': return name.RUS;
      case 'en': return name.ENG;
      default: return name.ENG;
    }
  };

  return <span>{getLocalizedName()}</span>;
};
```

---

## Testing

### Writing Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  test('renders title', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('calls onClick when button clicked', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAdvertisers } from './useAdvertisers';

test('fetches advertisers', async () => {
  const { result } = renderHook(() => useAdvertisers());

  expect(result.current.loading).toBe(true);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.advertisers.length).toBeGreaterThan(0);
});
```

---

## Debugging

### Development Tools

1. **React DevTools**
   - Inspect component tree
   - View props and state
   - Profile performance

2. **Chrome DevTools**
   - Network tab for API calls
   - Console for logs
   - Sources for breakpoints

3. **Vite DevTools**
   - HMR status
   - Build errors
   - TypeScript errors

### Logging

```typescript
import { logger } from '@utils/logger';

// Different log levels
logger.debug('Debug info', { data });
logger.info('Info message');
logger.warn('Warning');
logger.error('Error occurred', error);

// API logging
logger.api('GET', '/api/advertisers', 200, 150);

// Performance logging
logger.perf('Component render', 45.2);
```

### Common Debugging Scenarios

#### API Call Not Working

```typescript
// Add logging
logger.debug('Calling API', { endpoint, method });

try {
  const response = await api.call();
  logger.debug('API response', response);
} catch (error) {
  logger.error('API error', error);
}
```

#### Component Not Re-rendering

```typescript
// Check dependencies
useEffect(() => {
  fetchData();
}, [dependency1, dependency2]);  // Add all dependencies

// Use React DevTools to inspect state changes
```

#### State Not Updating

```typescript
// ❌ Bad: Direct mutation
state.items.push(newItem);

// ✅ Good: Immutable update
setState(prev => [...prev, newItem]);
```

---

## Performance Tips

### Optimize Re-renders

```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <ComplexVisualization data={data} />;
});

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveOperation(data);
}, [data]);
```

### Debounce User Input

```typescript
import { useDebounce } from '@hooks';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  // Only search after user stops typing
  search(debouncedSearch);
}, [debouncedSearch]);
```

### Virtual Scrolling

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const MyList = ({ items }: Props) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Common Patterns

### List with CRUD Operations

```typescript
export const MyListPage = () => {
  const entityList = useEntityList({
    fetchList: myEntitiesApi.list,
    toggleBlock: myEntitiesApi.block,
    deleteEntity: myEntitiesApi.delete,
    entityName: 'entity',
  });

  return (
    <Box>
      <SearchBar
        value={entityList.searchTerm}
        onChange={entityList.setSearchTerm}
      />
      <DataTable
        data={entityList.filteredEntities}
        loading={entityList.loading}
        onToggleBlock={entityList.handleToggleBlock}
        onDelete={entityList.handleDelete}
      />
    </Box>
  );
};
```

### Modal Dialog Pattern

```typescript
export const MyPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSave = async (data: FormData) => {
    await myEntitiesApi.update(selectedItem!.id, data);
    handleClose();
    refetch();
  };

  return (
    <>
      <ItemsList onEdit={handleEdit} />
      <EditDialog
        open={dialogOpen}
        item={selectedItem}
        onClose={handleClose}
        onSave={handleSave}
      />
    </>
  );
};
```

---

## Troubleshooting

### Build Errors

#### TypeScript Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

#### Vite Build Errors

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Runtime Errors

#### "Cannot read property of undefined"

```typescript
// ✅ Use optional chaining
const name = user?.profile?.name;

// ✅ Provide defaults
const name = user?.profile?.name ?? 'Unknown';
```

#### "setState called on unmounted component"

```typescript
useEffect(() => {
  let mounted = true;

  const fetchData = async () => {
    const data = await api.fetch();
    if (mounted) {
      setData(data);
    }
  };

  fetchData();

  return () => {
    mounted = false;
  };
}, []);
```

### API Errors

#### CORS Errors

```typescript
// Ensure API allows origin
// Check VITE_API_BASE_URL in .env
// Verify credentials: 'include' is set
```

#### Authentication Errors

```typescript
// Check if cookie is set
// Verify cookie domain and path
// Check SameSite setting
// Ensure HTTPS in production
```

---

## Helpful Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI Docs](https://mui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) (if using Redux)
- [Vite Documentation](https://vitejs.dev/)

### Community
- Stack Overflow
- React Discord
- GitHub Issues

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026

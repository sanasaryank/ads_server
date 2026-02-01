# Quick Reference Guide

Fast lookup for common tasks and patterns in the Trio Ad Server Admin Dashboard.

## Quick Links

- [Main Documentation](../README.md)
- [API Reference](./API.md)
- [Architecture](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Components](./COMPONENTS.md)

## Quick Commands

```bash
# Development
npm run dev                  # Start dev server
npm run build               # Build for production
npm run preview             # Preview production build

# Code Quality
npm run lint                # Run ESLint
npm run test                # Run tests
npm run test:ui             # Run tests with UI
npm run test:coverage       # Generate coverage

# Utilities
npm install <package>       # Add dependency
npm update                  # Update dependencies
```

## Environment Variables

```bash
# Copy and configure
cp .env.example .env

# Key variables
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_API=false
VITE_LOG_LEVEL=info
```

## Common Imports

```typescript
// React
import { useState, useEffect, useMemo, useCallback } from 'react';

// Routing
import { useNavigate, useParams, useLocation } from 'react-router-dom';

// Translation
import { useTranslation } from 'react-i18next';

// UI Components
import { Box, Button, TextField, Typography } from '@mui/material';

// API
import { advertisersApi, campaignsApi } from '@api';

// Types
import type { Advertiser, Campaign } from '@types';

// Hooks
import { useEntityList, useFormDialog } from '@hooks';

// Utils
import { logger } from '@utils/logger';
```

## Quick Patterns

### Create a New Page

```typescript
// src/pages/myFeature/MyPage.tsx
import { Box } from '@mui/material';
import { useEntityList } from '@hooks';
import { myEntitiesApi } from '@api';

export const MyPage = () => {
  const entityList = useEntityList({
    fetchList: myEntitiesApi.list,
    entityName: 'myEntity',
  });

  return (
    <Box>
      {/* Page content */}
    </Box>
  );
};
```

### Create a Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.object({
    ARM: z.string().min(1),
    ENG: z.string().min(1),
    RUS: z.string().min(1)
  }),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.create(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField {...register('name')} error={!!errors.name} />
      <TextField {...register('email')} error={!!errors.email} />
      <Button type="submit">Submit</Button>
    </form>
  );
};
```

### Add Translation

```json
// src/i18n/locales/en.json
{
  "pages": {
    "myPage": {
      "title": "My Page",
      "button": "Click Me"
    }
  }
}
```

```typescript
// Use in component
const { t } = useTranslation();
<h1>{t('pages.myPage.title')}</h1>
```

### API Call with Error Handling

```typescript
import { logger } from '@utils/logger';
import { useSnackbar } from 'notistack';

const MyComponent = () => {
  const { enqueueSnackbar } = useSnackbar();

  const handleSave = async () => {
    try {
      await api.save(data);
      enqueueSnackbar('Saved successfully', { variant: 'success' });
    } catch (error) {
      logger.error('Save failed', error);
      enqueueSnackbar('Save failed', { variant: 'error' });
    }
  };
};
```

### Use Global State

```typescript
// Auth state
import { useAuthStore } from '@store/authStore';

const { user, isAuthenticated, login, logout } = useAuthStore();

// Dictionaries state
import { useDictionariesStore } from '@store/dictionariesStore';

const { slots, schedules, restaurantTypes } = useDictionariesStore();
```

## API Quick Reference

### Advertisers
```typescript
import { advertisersApi } from '@api';

// List
const advertisers = await advertisersApi.list();

// Get by ID
const advertiser = await advertisersApi.getById('123');

// Create
const newAdvertiser = await advertisersApi.create(data);

// Update
const updated = await advertisersApi.update('123', { ...data, hash });

// Block/Unblock
await advertisersApi.block('123', true);
```

### Campaigns
```typescript
import { campaignsApi } from '@api';

// List
const campaigns = await campaignsApi.list();

// Get by ID
const campaign = await campaignsApi.getById('456');

// Create
const newCampaign = await campaignsApi.create(data);

// Update
const updated = await campaignsApi.update('456', { ...data, hash });

// Block/Unblock
await campaignsApi.block('456', true);
```

### Auth
```typescript
import { authApi } from '@api';

// Login
await authApi.login({ username, password });

// Get current user
const user = await authApi.me();

// Logout
await authApi.logout();
```

## Type Definitions

### Base Types
```typescript
interface BaseEntity {
  id: number;
  blocked: boolean;
}

interface DictionaryName {
  ARM: string;
  ENG: string;
  RUS: string;
}
```

### Advertiser
```typescript
interface Advertiser extends BaseEntity {
  name: DictionaryName;  // Multilingual: { ARM: string; ENG: string; RUS: string }
  tin: string;
  description?: string;
}
```

### Campaign
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
  // ... more fields
}
```

## Component Snippets

### Loading State
```typescript
if (loading) {
  return <CircularProgress />;
}
```

### Error State
```typescript
if (error) {
  return <Alert severity="error">{error.message}</Alert>;
}
```

### Empty State
```typescript
if (data.length === 0) {
  return (
    <Box textAlign="center" py={4}>
      <Typography>No data available</Typography>
      <Button onClick={handleCreate}>Create New</Button>
    </Box>
  );
}
```

### Modal Dialog
```typescript
const [open, setOpen] = useState(false);

return (
  <>
    <Button onClick={() => setOpen(true)}>Open</Button>
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Title</DialogTitle>
      <DialogContent>{/* Content */}</DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={handleConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  </>
);
```

## Debugging Tricks

### Log Everything
```typescript
import { logger } from '@utils/logger';

logger.debug('Component mounted', { props });
logger.info('User action', { action: 'click', target: 'button' });
logger.warn('Deprecated feature used');
logger.error('Operation failed', error, { context });
```

### React DevTools
```bash
# Install React DevTools browser extension
# Use Components tab to inspect props/state
# Use Profiler tab for performance analysis
```

### Network Inspector
```bash
# Chrome DevTools → Network tab
# Filter by XHR/Fetch
# Check request/response headers
# Verify cookies are sent
```

## Performance Tips

### Memoization
```typescript
// Expensive computation
const processed = useMemo(() => {
  return expensiveOperation(data);
}, [data]);

// Stable function reference
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Component memoization
export const MyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

### Debouncing
```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

## Common Errors & Fixes

### "Cannot read property of undefined"
```typescript
// ❌ Problem
user.profile.name

// ✅ Solution
user?.profile?.name ?? 'Unknown'
```

### "setState on unmounted component"
```typescript
useEffect(() => {
  let mounted = true;

  fetchData().then(data => {
    if (mounted) setData(data);
  });

  return () => { mounted = false; };
}, []);
```

### "CORS Error"
```typescript
// Check .env file
VITE_API_BASE_URL=http://localhost:3000/api

// Verify credentials in API client
credentials: 'include'
```

### "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or clear Vite cache
rm -rf node_modules/.vite
```

## Useful VS Code Snippets

Add to `.vscode/react.code-snippets`:

```json
{
  "React Functional Component": {
    "prefix": "rfc",
    "body": [
      "interface ${1:Component}Props {",
      "  $2",
      "}",
      "",
      "export const ${1:Component} = ({ $3 }: ${1:Component}Props) => {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "};"
    ]
  },
  "useState Hook": {
    "prefix": "ust",
    "body": "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState$2($3);"
  },
  "useEffect Hook": {
    "prefix": "uef",
    "body": [
      "useEffect(() => {",
      "  $1",
      "}, [$2]);"
    ]
  }
}
```

## Git Workflow

```bash
# Start feature
git checkout -b feature/my-feature

# Regular commits
git add .
git commit -m "feat: add feature"

# Update from main
git fetch origin
git rebase origin/main

# Push
git push origin feature/my-feature

# Create PR via GitHub/GitLab UI
```

## Checklists

### Before Committing
- [ ] Code compiles without errors
- [ ] ESLint passes
- [ ] All tests pass
- [ ] No console.log statements (use logger)
- [ ] Types are properly defined
- [ ] Code is formatted

### Before PR
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Meaningful commit messages
- [ ] PR description filled out

### Before Deployment
- [ ] Production build succeeds
- [ ] Environment variables configured
- [ ] API endpoints correct
- [ ] Error tracking configured
- [ ] Performance tested
- [ ] Security review complete

## Keyboard Shortcuts

### VS Code
- `Ctrl + P`: Quick open file
- `Ctrl + Shift + P`: Command palette
- `Ctrl + /`: Toggle comment
- `Alt + Up/Down`: Move line
- `Ctrl + D`: Select next occurrence
- `F12`: Go to definition
- `Ctrl + Space`: Trigger suggestions

### Browser DevTools
- `F12`: Open DevTools
- `Ctrl + Shift + C`: Inspect element
- `Ctrl + R`: Reload page
- `Ctrl + Shift + R`: Hard reload
- `Ctrl + Shift + I`: Toggle DevTools

## Additional Resources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI](https://mui.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

### Community
- [Stack Overflow](https://stackoverflow.com)
- [React Discord](https://discord.gg/react)
- GitHub Issues

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026

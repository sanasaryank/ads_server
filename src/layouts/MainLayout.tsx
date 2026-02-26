import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Restaurant as RestaurantIcon,
  Book as BookIcon,
  BarChart as BarChartIcon,
  Campaign as CampaignIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';

const DRAWER_WIDTH = 280;

// Extracted menu item styles for consistency and reusability
const menuItemStyles = {
  base: {
    '&:hover': {
      bgcolor: 'action.hover',
    },
  },
  active: {
    bgcolor: 'action.selected',
    '&:hover': {
      bgcolor: 'action.selected',
    },
  },
};

const menuItemIconStyles = {
  active: {
    color: 'primary.main',
  },
  inactive: {
    color: 'inherit',
  },
};

const menuItemTextStyles = {
  active: {
    '& .MuiListItemText-primary': {
      color: 'primary.main',
      fontWeight: 600,
    },
  },
  inactive: {
    '& .MuiListItemText-primary': {
      color: 'inherit',
      fontWeight: 400,
    },
  },
};

interface MenuItem {
  id: string;
  labelKey: string;
  icon: ReactNode;
  path?: string;
  children?: MenuItem[];
}

export const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Memoize menu items to prevent recreation on every render
  const menuItems = useMemo<MenuItem[]>(() => [
    {
      id: 'restaurants',
      labelKey: 'menu.restaurants',
      icon: <RestaurantIcon />,
      path: '/restaurants',
    },
    {
      id: 'dictionaries',
      labelKey: 'menu.dictionaries',
      icon: <BookIcon />,
      children: [
        { id: 'slots', labelKey: 'menu.slots', icon: null, path: '/slots' },
        { id: 'schedules', labelKey: 'menu.schedules', icon: null, path: '/schedules' },
      ],
    },
    {
      id: 'advertisement',
      labelKey: 'menu.advertisement',
      icon: <CampaignIcon />,
      children: [
        { id: 'advertisers', labelKey: 'menu.advertisers', icon: null, path: '/advertisers' },
        { id: 'campaigns', labelKey: 'menu.campaigns', icon: null, path: '/campaigns' },
        { id: 'creatives', labelKey: 'menu.creatives', icon: null, path: '/creatives' },
      ],
    },
    {
      id: 'statistics',
      labelKey: 'menu.statistics',
      icon: <BarChartIcon />,
      children: [
        { id: 'staff-actions', labelKey: 'menu.staffActions', icon: null, path: '/statistics/staff-actions' },
        { id: 'usage', labelKey: 'menu.usage', icon: null, path: '/statistics/usage' },
        { id: 'error-log', labelKey: 'menu.errorLog', icon: null, path: '/statistics/error-log' },
      ],
    },
  ], []);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.children) {
      setExpandedItems((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
    } else if (item.path) {
      navigate(item.path);
      setMobileOpen(false);
    }
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      logger.error('Logout failed', error as Error);
    }
  }, [logout, navigate]);

  const renderMenuItem = useCallback((item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.id];
    const isActive = item.path && location.pathname.startsWith(item.path);

    return (
      <Box key={item.id}>
        <ListItem disablePadding sx={{ pl: depth * 2 }}>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              ...menuItemStyles.base,
              ...(isActive && menuItemStyles.active),
            }}
          >
            {item.icon && (
              <ListItemIcon
                sx={isActive ? menuItemIconStyles.active : menuItemIconStyles.inactive}
              >
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText
              primary={t(item.labelKey)}
              sx={{
                pl: !item.icon && depth > 0 ? 2 : 0,
                ...(isActive ? menuItemTextStyles.active : menuItemTextStyles.inactive),
              }}
            />
            {hasChildren && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  }, [expandedItems, location.pathname, t, handleItemClick]);

  const drawer = (
    <Box>
      <Toolbar sx={{ justifyContent: 'left', gap: 1 }}>
        <Box component="img" src="/logo.svg" alt="Logo" sx={{ width: 128, height: 128 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Ads Server
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => renderMenuItem(item))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <LanguageSwitcher />
          <Typography variant="body1" sx={{ mx: 2 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            {t('common.logout')}
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

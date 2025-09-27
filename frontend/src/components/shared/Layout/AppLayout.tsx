import React from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings,
  ExitToApp,
  Brightness4,
  Brightness7,
  Dashboard,
  Security,
  LocalHospital,
  Science,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { toggleSidebar, toggleThemeMode, setNotificationsPanelOpen } from '@/store/slices/uiSlice';
import { ROUTES } from '@/utils/constants';
import { WalletConnection } from '../WalletConnection/WalletConnection';
import { NotificationsPanel } from '../NotificationsPanel/NotificationsPanel';

interface AppLayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 280;

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen, theme: appTheme, notificationsPanelOpen } = useAppSelector((state) => state.ui);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const { connection } = useAppSelector((state) => state.wallet);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleUserMenuClose();
    navigate(ROUTES.LOGIN);
  };

  const handleToggleTheme = () => {
    dispatch(toggleThemeMode());
  };

  const handleNotificationsClick = () => {
    dispatch(setNotificationsPanelOpen(!notificationsPanelOpen));
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const commonItems = [
      {
        label: 'Dashboard',
        icon: <Dashboard />,
        path: user.userType === 'patient' ? ROUTES.PATIENT_DASHBOARD : ROUTES.RESEARCHER_DASHBOARD,
      },
    ];

    if (user.userType === 'patient') {
      return [
        ...commonItems,
        {
          label: 'Health Records',
          icon: <LocalHospital />,
          path: ROUTES.PATIENT_RECORDS,
        },
        {
          label: 'Upload Data',
          icon: <Security />,
          path: ROUTES.PATIENT_UPLOAD,
        },
        {
          label: 'Data Consents',
          icon: <Security />,
          path: ROUTES.PATIENT_CONSENTS,
        },
        {
          label: 'Earnings',
          icon: <Security />,
          path: ROUTES.PATIENT_EARNINGS,
        },
        {
          label: 'Privacy Settings',
          icon: <Security />,
          path: ROUTES.PATIENT_PRIVACY,
        },
      ];
    } else {
      return [
        ...commonItems,
        {
          label: 'Research Proposals',
          icon: <Science />,
          path: ROUTES.RESEARCHER_PROPOSALS,
        },
        {
          label: 'Data Requests',
          icon: <Security />,
          path: ROUTES.RESEARCHER_REQUESTS,
        },
        {
          label: 'Available Datasets',
          icon: <LocalHospital />,
          path: ROUTES.RESEARCHER_DATASETS,
        },
        {
          label: 'Research Results',
          icon: <Science />,
          path: ROUTES.RESEARCHER_RESULTS,
        },
        {
          label: 'Budget Management',
          icon: <Security />,
          path: ROUTES.RESEARCHER_BUDGET,
        },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: alpha(theme.palette.primary.main, 0.95),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={() => dispatch(toggleSidebar())}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            PrivateHealth
          </Typography>

          {/* Wallet Connection */}
          <Box sx={{ mr: 2 }}>
            <WalletConnection />
          </Box>

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationsClick}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Theme Toggle */}
          <IconButton color="inherit" onClick={handleToggleTheme} sx={{ mr: 1 }}>
            {appTheme.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {/* User Menu */}
          <IconButton
            color="inherit"
            onClick={handleUserMenuOpen}
            sx={{ p: 0 }}
          >
            <Avatar
              alt={user?.profile.name}
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.profile.name || 'User')}&background=random`}
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            onClick={handleUserMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => navigate(ROUTES.PROFILE)}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        open={sidebarOpen}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', py: 1 }}>
          <List>
            {navigationItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.16),
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Notifications Panel */}
      <NotificationsPanel
        open={notificationsPanelOpen}
        onClose={() => dispatch(setNotificationsPanelOpen(false))}
      />
    </Box>
  );
};
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeConfig, LoadingState, ErrorState } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

interface UIState {
  theme: ThemeConfig;
  sidebarOpen: boolean;
  notificationsPanelOpen: boolean;
  loading: LoadingState;
  errors: ErrorState;
  modals: {
    [key: string]: boolean;
  };
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
    autoHideDuration: number;
  };
  breadcrumbs: Array<{
    label: string;
    href?: string;
  }>;
  pageTitle: string;
}

const getInitialTheme = (): ThemeConfig => {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
  if (savedTheme) {
    try {
      return JSON.parse(savedTheme);
    } catch {
      // Fallback to default if parsing fails
    }
  }

  return {
    mode: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    fontFamily: 'Roboto, sans-serif',
  };
};

const initialState: UIState = {
  theme: getInitialTheme(),
  sidebarOpen: true,
  notificationsPanelOpen: false,
  loading: {},
  errors: {},
  modals: {},
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 5000,
  },
  breadcrumbs: [],
  pageTitle: 'PrivateHealth',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action: PayloadAction<Partial<ThemeConfig>>) => {
      state.theme = { ...state.theme, ...action.payload };
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, JSON.stringify(state.theme));
    },
    toggleThemeMode: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, JSON.stringify(state.theme));
    },

    // Sidebar management
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // Notifications panel
    toggleNotificationsPanel: (state) => {
      state.notificationsPanelOpen = !state.notificationsPanelOpen;
    },
    setNotificationsPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.notificationsPanelOpen = action.payload;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      if (action.payload.loading) {
        state.loading[action.payload.key] = true;
      } else {
        delete state.loading[action.payload.key];
      }
    },
    clearAllLoading: (state) => {
      state.loading = {};
    },

    // Error states
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      if (action.payload.error) {
        state.errors[action.payload.key] = action.payload.error;
      } else {
        delete state.errors[action.payload.key];
      }
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },

    // Modal management
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      state.modals = {};
    },

    // Snackbar management
    showSnackbar: (state, action: PayloadAction<{
      message: string;
      severity?: 'success' | 'error' | 'warning' | 'info';
      autoHideDuration?: number;
    }>) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info',
        autoHideDuration: action.payload.autoHideDuration || 5000,
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },

    // Navigation
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; href?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
      document.title = `${action.payload} - PrivateHealth`;
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; href?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    removeBreadcrumb: (state, action: PayloadAction<number>) => {
      state.breadcrumbs.splice(action.payload, 1);
    },

    // Bulk UI updates
    resetUI: (state) => {
      state.loading = {};
      state.errors = {};
      state.modals = {};
      state.snackbar.open = false;
      state.notificationsPanelOpen = false;
    },

    // Application state
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      if (action.payload) {
        state.loading.global = true;
      } else {
        delete state.loading.global;
      }
    },
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        state.errors.global = action.payload;
      } else {
        delete state.errors.global;
      }
    },
  },
});

export const {
  setTheme,
  toggleThemeMode,
  toggleSidebar,
  setSidebarOpen,
  toggleNotificationsPanel,
  setNotificationsPanelOpen,
  setLoading,
  clearAllLoading,
  setError,
  clearError,
  clearAllErrors,
  openModal,
  closeModal,
  closeAllModals,
  showSnackbar,
  hideSnackbar,
  setBreadcrumbs,
  setPageTitle,
  addBreadcrumb,
  removeBreadcrumb,
  resetUI,
  setGlobalLoading,
  setGlobalError,
} = uiSlice.actions;

export default uiSlice.reducer;
// API Endpoints
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',

  // Health Records
  RECORDS: '/api/records',
  UPLOAD_RECORD: '/api/records/upload',
  RECORD_DETAIL: (id: string) => `/api/records/${id}`,

  // Consent Management
  CONSENTS: '/api/consents',
  CREATE_CONSENT: '/api/consents/create',
  APPROVE_CONSENT: (id: string) => `/api/consents/${id}/approve`,
  REJECT_CONSENT: (id: string) => `/api/consents/${id}/reject`,

  // Research
  PROPOSALS: '/api/research/proposals',
  CREATE_PROPOSAL: '/api/research/proposals/create',
  PROPOSAL_DETAIL: (id: string) => `/api/research/proposals/${id}`,
  DATA_REQUESTS: '/api/research/requests',

  // Blockchain
  TRANSACTIONS: '/api/blockchain/transactions',
  WALLET_CONNECT: '/api/blockchain/wallet/connect',
  ZK_PROOFS: '/api/blockchain/zk-proofs',

  // Dashboard
  PATIENT_STATS: '/api/dashboard/patient',
  RESEARCHER_STATS: '/api/dashboard/researcher',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_READ: (id: string) => `/api/notifications/${id}/read`,
} as const;

// Application Constants
export const APP_CONFIG = {
  NAME: 'PrivateHealth',
  VERSION: '1.0.0',
  DESCRIPTION: 'Privacy-First Healthcare Data Platform',
  GITHUB_URL: 'https://github.com/privatehealth/dapp',
  DOCUMENTATION_URL: 'https://docs.privatehealth.io',
  SUPPORT_EMAIL: 'support@privatehealth.io',
} as const;

// Data Types
export const DATA_TYPES = [
  { value: 'medical', label: 'Medical Records', icon: 'local_hospital' },
  { value: 'genomic', label: 'Genomic Data', icon: 'biotech' },
  { value: 'lifestyle', label: 'Lifestyle Data', icon: 'fitness_center' },
  { value: 'diagnostic', label: 'Diagnostic Results', icon: 'science' },
] as const;

// Privacy Levels
export const PRIVACY_LEVELS = [
  {
    value: 'public',
    label: 'Public',
    description: 'Data can be accessed by approved researchers',
    icon: 'public',
    color: 'success',
  },
  {
    value: 'restricted',
    label: 'Restricted',
    description: 'Data requires explicit consent for each use',
    icon: 'lock_open',
    color: 'warning',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Data is encrypted and requires special permissions',
    icon: 'lock',
    color: 'error',
  },
] as const;

// User Types
export const USER_TYPES = [
  { value: 'patient', label: 'Patient', icon: 'person' },
  { value: 'researcher', label: 'Researcher', icon: 'science' },
] as const;

// Status Colors
export const STATUS_COLORS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  active: 'info',
  completed: 'success',
  expired: 'default',
  verified: 'success',
  draft: 'default',
  submitted: 'info',
} as const;

// Blockchain Networks
export const NETWORKS = {
  MIDNIGHT_TESTNET: {
    chainId: '0x1',
    name: 'Midnight Testnet',
    rpcUrl: 'https://testnet.midnight.network',
    blockExplorer: 'https://explorer.testnet.midnight.network',
    nativeCurrency: {
      name: 'DUST',
      symbol: 'DUST',
      decimals: 18,
    },
  },
  MIDNIGHT_MAINNET: {
    chainId: '0x2',
    name: 'Midnight Mainnet',
    rpcUrl: 'https://mainnet.midnight.network',
    blockExplorer: 'https://explorer.midnight.network',
    nativeCurrency: {
      name: 'DUST',
      symbol: 'DUST',
      decimals: 18,
    },
  },
} as const;

// File Upload Constants
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/csv',
    'application/json',
    'application/xml',
    'text/plain',
  ],
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large file uploads
} as const;

// Pagination
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// Timeouts and Intervals
export const TIMING_CONFIG = {
  API_TIMEOUT: 30000, // 30 seconds
  WALLET_CONNECTION_TIMEOUT: 10000, // 10 seconds
  NOTIFICATION_AUTO_HIDE: 5000, // 5 seconds
  POLLING_INTERVAL: 30000, // 30 seconds for real-time updates
  ZK_PROOF_GENERATION_TIMEOUT: 300000, // 5 minutes
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  TAG_MAX_LENGTH: 50,
  MAX_TAGS: 10,
  ETHEREUM_ADDRESS_PATTERN: /^0x[a-fA-F0-9]{40}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  INVALID_ADDRESS: 'Invalid wallet address format',
  FILE_TOO_LARGE: `File size exceeds ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
  INVALID_FILE_TYPE: 'File type not supported',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  SESSION_EXPIRED: 'Your session has expired. Please log in again',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  FILE_UPLOADED: 'File uploaded and encrypted successfully',
  CONSENT_GRANTED: 'Consent granted successfully',
  PROPOSAL_SUBMITTED: 'Research proposal submitted for review',
  TRANSACTION_CONFIRMED: 'Transaction confirmed on blockchain',
  PROFILE_UPDATED: 'Profile updated successfully',
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Patient Routes
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_RECORDS: '/patient/records',
  PATIENT_UPLOAD: '/patient/upload',
  PATIENT_CONSENTS: '/patient/consents',
  PATIENT_EARNINGS: '/patient/earnings',
  PATIENT_PRIVACY: '/patient/privacy',

  // Researcher Routes
  RESEARCHER_DASHBOARD: '/researcher/dashboard',
  RESEARCHER_PROPOSALS: '/researcher/proposals',
  RESEARCHER_REQUESTS: '/researcher/requests',
  RESEARCHER_DATASETS: '/researcher/datasets',
  RESEARCHER_RESULTS: '/researcher/results',
  RESEARCHER_BUDGET: '/researcher/budget',

  // Shared Routes
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  HELP: '/help',
  ABOUT: '/about',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'privatehealth_auth_token',
  USER_PROFILE: 'privatehealth_user_profile',
  WALLET_ADDRESS: 'privatehealth_wallet_address',
  THEME_PREFERENCE: 'privatehealth_theme',
  LANGUAGE_PREFERENCE: 'privatehealth_language',
  NOTIFICATIONS_ENABLED: 'privatehealth_notifications_enabled',
} as const;

// ZK Proof Types
export const ZK_PROOF_TYPES = {
  DATA_INTEGRITY: 'data_integrity',
  CONSENT_VERIFICATION: 'consent_verification',
  ANONYMIZATION: 'anonymization',
  AGE_VERIFICATION: 'age_verification',
  LOCATION_VERIFICATION: 'location_verification',
} as const;

// Dashboard Refresh Intervals
export const DASHBOARD_CONFIG = {
  STATS_REFRESH_INTERVAL: 60000, // 1 minute
  NOTIFICATIONS_REFRESH_INTERVAL: 30000, // 30 seconds
  TRANSACTIONS_REFRESH_INTERVAL: 15000, // 15 seconds
} as const;
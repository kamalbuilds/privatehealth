// Core Types
export interface User {
  id: string;
  address: string;
  userType: 'patient' | 'researcher';
  profile: UserProfile;
  createdAt: string;
  lastLogin: string;
}

export interface UserProfile {
  name: string;
  email: string;
  organization?: string;
  specialization?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

// Health Data Types
export interface HealthRecord {
  id: string;
  patientId: string;
  dataType: 'medical' | 'genomic' | 'lifestyle' | 'diagnostic';
  title: string;
  description: string;
  encryptedData: string;
  zkProof: string;
  privacyLevel: 'public' | 'restricted' | 'private';
  tags: string[];
  uploadedAt: string;
  lastModified: string;
  fileSize: number;
  fileHash: string;
}

export interface DataConsent {
  id: string;
  patientId: string;
  researcherId: string;
  recordIds: string[];
  purpose: string;
  duration: number; // in days
  compensationAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
  zkProofHash: string;
}

// Research Types
export interface ResearchProposal {
  id: string;
  researcherId: string;
  title: string;
  description: string;
  purpose: string;
  dataRequirements: DataRequirement[];
  duration: number;
  budget: number;
  ethicsApproval: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'active' | 'completed';
  createdAt: string;
  approvedAt?: string;
  zkProofRequirements: string[];
}

export interface DataRequirement {
  dataType: string;
  minSamples: number;
  maxSamples: number;
  ageRange?: [number, number];
  genderFilter?: 'male' | 'female' | 'any';
  geographicFilter?: string[];
  additionalCriteria: Record<string, any>;
}

export interface DataRequest {
  id: string;
  proposalId: string;
  researcherId: string;
  patientId: string;
  recordIds: string[];
  requestedAt: string;
  respondedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  compensation: number;
  message: string;
}

// Blockchain Types
export interface Transaction {
  id: string;
  hash: string;
  type: 'upload' | 'consent' | 'payment' | 'verification';
  from: string;
  to?: string;
  amount?: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface WalletConnection {
  isConnected: boolean;
  address?: string;
  balance?: number;
  network?: string;
  provider?: any;
}

// UI State Types
export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface UploadFormData {
  title: string;
  description: string;
  dataType: string;
  privacyLevel: string;
  tags: string[];
  file: File;
}

export interface ConsentFormData {
  recordIds: string[];
  researcherId: string;
  purpose: string;
  duration: number;
  compensationAmount: number;
}

export interface ProposalFormData {
  title: string;
  description: string;
  purpose: string;
  dataRequirements: DataRequirement[];
  duration: number;
  budget: number;
  ethicsApproval: string;
}

// Dashboard Types
export interface DashboardStats {
  totalRecords: number;
  activeConsents: number;
  totalEarnings: number;
  dataShared: number;
  privacyScore: number;
}

export interface ResearcherStats {
  activeProposals: number;
  approvedRequests: number;
  totalBudget: number;
  datasetsAccessed: number;
  publicationsCount: number;
}

// ZK Proof Types
export interface ZKProofStatus {
  id: string;
  type: 'data_integrity' | 'consent_verification' | 'anonymization';
  status: 'generating' | 'generated' | 'verified' | 'failed';
  proofHash: string;
  verificationKey: string;
  createdAt: string;
  verifiedAt?: string;
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

// Filter and Sort Types
export interface FilterOptions {
  dataType?: string[];
  privacyLevel?: string[];
  dateRange?: [string, string];
  tags?: string[];
  status?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface RouteParams {
  id?: string;
  type?: string;
  action?: string;
}
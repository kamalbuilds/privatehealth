import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DataConsent, ConsentFormData, FilterOptions, PaginatedResponse } from '@/types';
import { consentService } from '@/services/consentService';

interface ConsentState {
  consents: DataConsent[];
  selectedConsent: DataConsent | null;
  pendingConsents: DataConsent[];
  activeConsents: DataConsent[];
  isLoading: boolean;
  error: string | null;
  filters: FilterOptions;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ConsentState = {
  consents: [],
  selectedConsent: null,
  pendingConsents: [],
  activeConsents: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchConsents = createAsyncThunk(
  'consent/fetchConsents',
  async (params: {
    page?: number;
    limit?: number;
    filters?: FilterOptions;
    userType?: 'patient' | 'researcher';
  } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const currentFilters = state.consent.filters;

      const requestParams = {
        page: params.page || state.consent.pagination.page,
        limit: params.limit || state.consent.pagination.limit,
        filters: { ...currentFilters, ...params.filters },
        userType: params.userType,
      };

      const response = await consentService.getConsents(requestParams);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch consents');
    }
  }
);

export const fetchConsentById = createAsyncThunk(
  'consent/fetchConsentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const consent = await consentService.getConsentById(id);
      return consent;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch consent');
    }
  }
);

export const createConsent = createAsyncThunk(
  'consent/createConsent',
  async (consentData: ConsentFormData, { rejectWithValue }) => {
    try {
      const consent = await consentService.createConsent(consentData);
      return consent;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create consent');
    }
  }
);

export const approveConsent = createAsyncThunk(
  'consent/approveConsent',
  async (params: {
    id: string;
    signature: string;
    zkProof: string;
  }, { rejectWithValue }) => {
    try {
      const consent = await consentService.approveConsent(params.id, params.signature, params.zkProof);
      return consent;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to approve consent');
    }
  }
);

export const rejectConsent = createAsyncThunk(
  'consent/rejectConsent',
  async (params: {
    id: string;
    reason: string;
  }, { rejectWithValue }) => {
    try {
      const consent = await consentService.rejectConsent(params.id, params.reason);
      return consent;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reject consent');
    }
  }
);

export const revokeConsent = createAsyncThunk(
  'consent/revokeConsent',
  async (id: string, { rejectWithValue }) => {
    try {
      const consent = await consentService.revokeConsent(id);
      return consent;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to revoke consent');
    }
  }
);

export const fetchPendingConsents = createAsyncThunk(
  'consent/fetchPendingConsents',
  async (_, { rejectWithValue }) => {
    try {
      const consents = await consentService.getPendingConsents();
      return consents;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch pending consents');
    }
  }
);

export const fetchActiveConsents = createAsyncThunk(
  'consent/fetchActiveConsents',
  async (_, { rejectWithValue }) => {
    try {
      const consents = await consentService.getActiveConsents();
      return consents;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active consents');
    }
  }
);

const consentSlice = createSlice({
  name: 'consent',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<FilterOptions>) => {
      state.filters = action.payload;
      state.pagination.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    clearSelectedConsent: (state) => {
      state.selectedConsent = null;
    },
    setSelectedConsent: (state, action: PayloadAction<DataConsent>) => {
      state.selectedConsent = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    updateConsentStatus: (state, action: PayloadAction<{ id: string; status: DataConsent['status'] }>) => {
      const index = state.consents.findIndex(consent => consent.id === action.payload.id);
      if (index !== -1) {
        state.consents[index].status = action.payload.status;
      }

      // Update specific arrays
      state.pendingConsents = state.pendingConsents.filter(consent => consent.id !== action.payload.id);
      if (action.payload.status === 'approved') {
        const consent = state.consents.find(c => c.id === action.payload.id);
        if (consent) {
          state.activeConsents.push(consent);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Consents
      .addCase(fetchConsents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConsents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.consents = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchConsents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Consent by ID
      .addCase(fetchConsentById.fulfilled, (state, action) => {
        state.selectedConsent = action.payload;
      })
      .addCase(fetchConsentById.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Create Consent
      .addCase(createConsent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createConsent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.consents.unshift(action.payload);
        state.pendingConsents.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(createConsent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Approve Consent
      .addCase(approveConsent.fulfilled, (state, action) => {
        const index = state.consents.findIndex(consent => consent.id === action.payload.id);
        if (index !== -1) {
          state.consents[index] = action.payload;
        }
        state.pendingConsents = state.pendingConsents.filter(consent => consent.id !== action.payload.id);
        state.activeConsents.push(action.payload);
        if (state.selectedConsent?.id === action.payload.id) {
          state.selectedConsent = action.payload;
        }
      })
      .addCase(approveConsent.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Reject Consent
      .addCase(rejectConsent.fulfilled, (state, action) => {
        const index = state.consents.findIndex(consent => consent.id === action.payload.id);
        if (index !== -1) {
          state.consents[index] = action.payload;
        }
        state.pendingConsents = state.pendingConsents.filter(consent => consent.id !== action.payload.id);
        if (state.selectedConsent?.id === action.payload.id) {
          state.selectedConsent = action.payload;
        }
      })
      .addCase(rejectConsent.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Revoke Consent
      .addCase(revokeConsent.fulfilled, (state, action) => {
        const index = state.consents.findIndex(consent => consent.id === action.payload.id);
        if (index !== -1) {
          state.consents[index] = action.payload;
        }
        state.activeConsents = state.activeConsents.filter(consent => consent.id !== action.payload.id);
        if (state.selectedConsent?.id === action.payload.id) {
          state.selectedConsent = action.payload;
        }
      })
      .addCase(revokeConsent.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Fetch Pending Consents
      .addCase(fetchPendingConsents.fulfilled, (state, action) => {
        state.pendingConsents = action.payload;
      })

      // Fetch Active Consents
      .addCase(fetchActiveConsents.fulfilled, (state, action) => {
        state.activeConsents = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  setPage,
  setPageSize,
  clearSelectedConsent,
  setSelectedConsent,
  clearFilters,
  updateConsentStatus,
} = consentSlice.actions;

export default consentSlice.reducer;
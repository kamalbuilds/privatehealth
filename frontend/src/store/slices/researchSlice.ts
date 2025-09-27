import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ResearchProposal, DataRequest, ProposalFormData, FilterOptions, PaginatedResponse } from '@/types';
import { researchService } from '@/services/researchService';

interface ResearchState {
  proposals: ResearchProposal[];
  selectedProposal: ResearchProposal | null;
  dataRequests: DataRequest[];
  availableDatasets: any[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  filters: FilterOptions;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ResearchState = {
  proposals: [],
  selectedProposal: null,
  dataRequests: [],
  availableDatasets: [],
  isLoading: false,
  isSubmitting: false,
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
export const fetchProposals = createAsyncThunk(
  'research/fetchProposals',
  async (params: {
    page?: number;
    limit?: number;
    filters?: FilterOptions;
  } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const currentFilters = state.research.filters;

      const requestParams = {
        page: params.page || state.research.pagination.page,
        limit: params.limit || state.research.pagination.limit,
        filters: { ...currentFilters, ...params.filters },
      };

      const response = await researchService.getProposals(requestParams);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch proposals');
    }
  }
);

export const fetchProposalById = createAsyncThunk(
  'research/fetchProposalById',
  async (id: string, { rejectWithValue }) => {
    try {
      const proposal = await researchService.getProposalById(id);
      return proposal;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch proposal');
    }
  }
);

export const createProposal = createAsyncThunk(
  'research/createProposal',
  async (proposalData: ProposalFormData, { rejectWithValue }) => {
    try {
      const proposal = await researchService.createProposal(proposalData);
      return proposal;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create proposal');
    }
  }
);

export const updateProposal = createAsyncThunk(
  'research/updateProposal',
  async (params: {
    id: string;
    updates: Partial<ResearchProposal>;
  }, { rejectWithValue }) => {
    try {
      const proposal = await researchService.updateProposal(params.id, params.updates);
      return proposal;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update proposal');
    }
  }
);

export const submitProposal = createAsyncThunk(
  'research/submitProposal',
  async (id: string, { rejectWithValue }) => {
    try {
      const proposal = await researchService.submitProposal(id);
      return proposal;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit proposal');
    }
  }
);

export const fetchDataRequests = createAsyncThunk(
  'research/fetchDataRequests',
  async (params: {
    proposalId?: string;
    status?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const requests = await researchService.getDataRequests(params);
      return requests;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch data requests');
    }
  }
);

export const createDataRequest = createAsyncThunk(
  'research/createDataRequest',
  async (requestData: {
    proposalId: string;
    patientId: string;
    recordIds: string[];
    message: string;
    compensation: number;
  }, { rejectWithValue }) => {
    try {
      const request = await researchService.createDataRequest(requestData);
      return request;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create data request');
    }
  }
);

export const fetchAvailableDatasets = createAsyncThunk(
  'research/fetchAvailableDatasets',
  async (filters: {
    dataType?: string[];
    ageRange?: [number, number];
    genderFilter?: string;
    minSamples?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const datasets = await researchService.getAvailableDatasets(filters);
      return datasets;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch available datasets');
    }
  }
);

export const downloadDataset = createAsyncThunk(
  'research/downloadDataset',
  async (params: {
    proposalId: string;
    consentIds: string[];
    format: 'csv' | 'json' | 'xml';
  }, { rejectWithValue }) => {
    try {
      const downloadUrl = await researchService.downloadDataset(params);
      return downloadUrl;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to download dataset');
    }
  }
);

export const generateResearchReport = createAsyncThunk(
  'research/generateReport',
  async (proposalId: string, { rejectWithValue }) => {
    try {
      const report = await researchService.generateReport(proposalId);
      return report;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate report');
    }
  }
);

const researchSlice = createSlice({
  name: 'research',
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
    clearSelectedProposal: (state) => {
      state.selectedProposal = null;
    },
    setSelectedProposal: (state, action: PayloadAction<ResearchProposal>) => {
      state.selectedProposal = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
    updateProposalStatus: (state, action: PayloadAction<{ id: string; status: ResearchProposal['status'] }>) => {
      const index = state.proposals.findIndex(proposal => proposal.id === action.payload.id);
      if (index !== -1) {
        state.proposals[index].status = action.payload.status;
      }
      if (state.selectedProposal?.id === action.payload.id) {
        state.selectedProposal.status = action.payload.status;
      }
    },
    addDataRequest: (state, action: PayloadAction<DataRequest>) => {
      state.dataRequests.unshift(action.payload);
    },
    updateDataRequest: (state, action: PayloadAction<{ id: string; updates: Partial<DataRequest> }>) => {
      const index = state.dataRequests.findIndex(request => request.id === action.payload.id);
      if (index !== -1) {
        state.dataRequests[index] = { ...state.dataRequests[index], ...action.payload.updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Proposals
      .addCase(fetchProposals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.proposals = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchProposals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Proposal by ID
      .addCase(fetchProposalById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProposalById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedProposal = action.payload;
        state.error = null;
      })
      .addCase(fetchProposalById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create Proposal
      .addCase(createProposal.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createProposal.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.proposals.unshift(action.payload);
        state.pagination.total += 1;
        state.selectedProposal = action.payload;
        state.error = null;
      })
      .addCase(createProposal.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })

      // Update Proposal
      .addCase(updateProposal.fulfilled, (state, action) => {
        const index = state.proposals.findIndex(proposal => proposal.id === action.payload.id);
        if (index !== -1) {
          state.proposals[index] = action.payload;
        }
        if (state.selectedProposal?.id === action.payload.id) {
          state.selectedProposal = action.payload;
        }
      })
      .addCase(updateProposal.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Submit Proposal
      .addCase(submitProposal.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitProposal.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const index = state.proposals.findIndex(proposal => proposal.id === action.payload.id);
        if (index !== -1) {
          state.proposals[index] = action.payload;
        }
        if (state.selectedProposal?.id === action.payload.id) {
          state.selectedProposal = action.payload;
        }
        state.error = null;
      })
      .addCase(submitProposal.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      })

      // Fetch Data Requests
      .addCase(fetchDataRequests.fulfilled, (state, action) => {
        state.dataRequests = action.payload;
      })
      .addCase(fetchDataRequests.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Create Data Request
      .addCase(createDataRequest.fulfilled, (state, action) => {
        state.dataRequests.unshift(action.payload);
      })
      .addCase(createDataRequest.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Fetch Available Datasets
      .addCase(fetchAvailableDatasets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableDatasets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableDatasets = action.payload;
        state.error = null;
      })
      .addCase(fetchAvailableDatasets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Download Dataset
      .addCase(downloadDataset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(downloadDataset.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // Note: Actual download will be handled by the browser
      })
      .addCase(downloadDataset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Generate Report
      .addCase(generateResearchReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateResearchReport.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(generateResearchReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  setPage,
  setPageSize,
  clearSelectedProposal,
  setSelectedProposal,
  clearFilters,
  updateProposalStatus,
  addDataRequest,
  updateDataRequest,
} = researchSlice.actions;

export default researchSlice.reducer;
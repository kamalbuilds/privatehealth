import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HealthRecord, UploadFormData, FilterOptions, SortOptions, PaginatedResponse } from '@/types';
import { recordsService } from '@/services/recordsService';

interface RecordsState {
  records: HealthRecord[];
  selectedRecord: HealthRecord | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  filters: FilterOptions;
  sort: SortOptions;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: RecordsState = {
  records: [],
  selectedRecord: null,
  isLoading: false,
  isUploading: false,
  error: null,
  filters: {},
  sort: { field: 'uploadedAt', direction: 'desc' },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchRecords = createAsyncThunk(
  'records/fetchRecords',
  async (params: {
    page?: number;
    limit?: number;
    filters?: FilterOptions;
    sort?: SortOptions;
  } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const currentFilters = state.records.filters;
      const currentSort = state.records.sort;

      const requestParams = {
        page: params.page || state.records.pagination.page,
        limit: params.limit || state.records.pagination.limit,
        filters: { ...currentFilters, ...params.filters },
        sort: { ...currentSort, ...params.sort },
      };

      const response = await recordsService.getRecords(requestParams);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch records');
    }
  }
);

export const fetchRecordById = createAsyncThunk(
  'records/fetchRecordById',
  async (id: string, { rejectWithValue }) => {
    try {
      const record = await recordsService.getRecordById(id);
      return record;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch record');
    }
  }
);

export const uploadRecord = createAsyncThunk(
  'records/uploadRecord',
  async (uploadData: UploadFormData, { rejectWithValue }) => {
    try {
      const record = await recordsService.uploadRecord(uploadData);
      return record;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload record');
    }
  }
);

export const deleteRecord = createAsyncThunk(
  'records/deleteRecord',
  async (id: string, { rejectWithValue }) => {
    try {
      await recordsService.deleteRecord(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete record');
    }
  }
);

export const updateRecord = createAsyncThunk(
  'records/updateRecord',
  async (params: {
    id: string;
    updates: Partial<HealthRecord>;
  }, { rejectWithValue }) => {
    try {
      const record = await recordsService.updateRecord(params.id, params.updates);
      return record;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update record');
    }
  }
);

export const generateZKProof = createAsyncThunk(
  'records/generateZKProof',
  async (recordId: string, { rejectWithValue }) => {
    try {
      const proof = await recordsService.generateZKProof(recordId);
      return { recordId, proof };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate ZK proof');
    }
  }
);

const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<FilterOptions>) => {
      state.filters = action.payload;
      state.pagination.page = 1; // Reset to first page when filters change
    },
    setSort: (state, action: PayloadAction<SortOptions>) => {
      state.sort = action.payload;
      state.pagination.page = 1; // Reset to first page when sort changes
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when page size changes
    },
    clearSelectedRecord: (state) => {
      state.selectedRecord = null;
    },
    setSelectedRecord: (state, action: PayloadAction<HealthRecord>) => {
      state.selectedRecord = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Records
      .addCase(fetchRecords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch Record by ID
      .addCase(fetchRecordById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecordById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedRecord = action.payload;
        state.error = null;
      })
      .addCase(fetchRecordById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Upload Record
      .addCase(uploadRecord.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadRecord.fulfilled, (state, action) => {
        state.isUploading = false;
        state.records.unshift(action.payload);
        state.pagination.total += 1;
        state.error = null;
      })
      .addCase(uploadRecord.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      })

      // Delete Record
      .addCase(deleteRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        state.records = state.records.filter(record => record.id !== action.payload);
        state.pagination.total -= 1;
        if (state.selectedRecord?.id === action.payload) {
          state.selectedRecord = null;
        }
        state.error = null;
      })
      .addCase(deleteRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update Record
      .addCase(updateRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.records.findIndex(record => record.id === action.payload.id);
        if (index !== -1) {
          state.records[index] = action.payload;
        }
        if (state.selectedRecord?.id === action.payload.id) {
          state.selectedRecord = action.payload;
        }
        state.error = null;
      })
      .addCase(updateRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Generate ZK Proof
      .addCase(generateZKProof.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateZKProof.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.records.findIndex(record => record.id === action.payload.recordId);
        if (index !== -1) {
          state.records[index].zkProof = action.payload.proof;
        }
        if (state.selectedRecord?.id === action.payload.recordId) {
          state.selectedRecord.zkProof = action.payload.proof;
        }
        state.error = null;
      })
      .addCase(generateZKProof.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  setSort,
  setPage,
  setPageSize,
  clearSelectedRecord,
  setSelectedRecord,
  clearFilters,
} = recordsSlice.actions;

export default recordsSlice.reducer;
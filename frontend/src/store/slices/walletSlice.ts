import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WalletConnection, Transaction } from '@/types';
import { walletService } from '@/services/walletService';
import { STORAGE_KEYS } from '@/utils/constants';

interface WalletState {
  connection: WalletConnection;
  transactions: Transaction[];
  isConnecting: boolean;
  error: string | null;
  lastUpdate: string | null;
}

const initialState: WalletState = {
  connection: {
    isConnected: false,
    address: localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS) || undefined,
  },
  transactions: [],
  isConnecting: false,
  error: null,
  lastUpdate: null,
};

// Async thunks
export const connectWallet = createAsyncThunk(
  'wallet/connect',
  async (_, { rejectWithValue }) => {
    try {
      const connection = await walletService.connect();
      if (connection.address) {
        localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, connection.address);
      }
      return connection;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to connect wallet');
    }
  }
);

export const disconnectWallet = createAsyncThunk(
  'wallet/disconnect',
  async () => {
    await walletService.disconnect();
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
  }
);

export const getBalance = createAsyncThunk(
  'wallet/getBalance',
  async (address: string, { rejectWithValue }) => {
    try {
      const balance = await walletService.getBalance(address);
      return balance;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get balance');
    }
  }
);

export const sendTransaction = createAsyncThunk(
  'wallet/sendTransaction',
  async (transactionData: {
    to: string;
    amount: number;
    data?: string;
  }, { rejectWithValue }) => {
    try {
      const transaction = await walletService.sendTransaction(transactionData);
      return transaction;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Transaction failed');
    }
  }
);

export const getTransactions = createAsyncThunk(
  'wallet/getTransactions',
  async (address: string, { rejectWithValue }) => {
    try {
      const transactions = await walletService.getTransactions(address);
      return transactions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch transactions');
    }
  }
);

export const switchNetwork = createAsyncThunk(
  'wallet/switchNetwork',
  async (networkId: string, { rejectWithValue }) => {
    try {
      await walletService.switchNetwork(networkId);
      return networkId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to switch network');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setProvider: (state, action: PayloadAction<any>) => {
      state.connection.provider = action.payload;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      state.connection.balance = action.payload;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
    },
    updateTransaction: (state, action: PayloadAction<{ id: string; updates: Partial<Transaction> }>) => {
      const index = state.transactions.findIndex(tx => tx.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = { ...state.transactions[index], ...action.payload.updates };
      }
    },
    setLastUpdate: (state) => {
      state.lastUpdate = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect Wallet
      .addCase(connectWallet.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(connectWallet.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.connection = action.payload;
        state.error = null;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(connectWallet.rejected, (state, action) => {
        state.isConnecting = false;
        state.connection.isConnected = false;
        state.error = action.payload as string;
      })

      // Disconnect Wallet
      .addCase(disconnectWallet.fulfilled, (state) => {
        state.connection = { isConnected: false };
        state.transactions = [];
        state.error = null;
        state.lastUpdate = new Date().toISOString();
      })

      // Get Balance
      .addCase(getBalance.fulfilled, (state, action) => {
        state.connection.balance = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(getBalance.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Send Transaction
      .addCase(sendTransaction.pending, (state) => {
        state.error = null;
      })
      .addCase(sendTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
        state.error = null;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(sendTransaction.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Get Transactions
      .addCase(getTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(getTransactions.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Switch Network
      .addCase(switchNetwork.fulfilled, (state, action) => {
        state.connection.network = action.payload;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(switchNetwork.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setProvider,
  updateBalance,
  addTransaction,
  updateTransaction,
  setLastUpdate
} = walletSlice.actions;

export default walletSlice.reducer;
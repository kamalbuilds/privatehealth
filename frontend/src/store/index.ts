import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authSlice from './slices/authSlice';
import walletSlice from './slices/walletSlice';
import recordsSlice from './slices/recordsSlice';
import consentSlice from './slices/consentSlice';
import researchSlice from './slices/researchSlice';
import notificationSlice from './slices/notificationSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    wallet: walletSlice,
    records: recordsSlice,
    consent: consentSlice,
    research: researchSlice,
    notifications: notificationSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['wallet/setProvider'],
        ignoredPaths: ['wallet.provider'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
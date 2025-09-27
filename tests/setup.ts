import { beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Clear local storage and session storage
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }

  // Reset console methods
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  // Cleanup React Testing Library
  cleanup();

  // Restore all mocks
  vi.restoreAllMocks();
});

// Mock window.crypto for cryptographic operations
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    subtle: {
      generateKey: vi.fn(),
      exportKey: vi.fn(),
      importKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
      digest: vi.fn()
    }
  }
});

// Mock Web3 provider
global.ethereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
  selectedAddress: '0x742d35Cc6631C0532925a3b8D2a0644C30f7B5C9'
};
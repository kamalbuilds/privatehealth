import { CoinPublicKey } from '@midnight-ntwrk/compact-runtime';

// Test constants
export const TEST_CONSTANTS = {
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  ZERO_KEY: new Uint8Array(32).fill(0),
  MAX_GAS_LIMIT: 10000000,
  DEFAULT_TIMEOUT: 30000
};

// Generate test user addresses
export function createTestUser(name: string): CoinPublicKey {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < name.length && i < 32; i++) {
    bytes[i] = name.charCodeAt(i);
  }
  return bytes as CoinPublicKey;
}

// Generate test contract addresses
export function createTestContractAddress(name: string): CoinPublicKey {
  const bytes = new Uint8Array(32);
  bytes[0] = 0xFF; // Mark as contract
  for (let i = 0; i < name.length && i < 31; i++) {
    bytes[i + 1] = name.charCodeAt(i);
  }
  return bytes as CoinPublicKey;
}

// Convert string to hex with padding
export function toHexPadded(str: string): string {
  return '0x' + str.padEnd(64, '0');
}

// Generate random BigInt for token IDs
export function randomBigInt(max = BigInt(2 ** 53 - 1)): bigint {
  return BigInt(Math.floor(Math.random() * Number(max)));
}

// Time utilities
export function getCurrentTimestamp(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

export function addDays(timestamp: bigint, days: number): bigint {
  return timestamp + BigInt(days * 24 * 60 * 60);
}

// Privacy utilities
export function generateRandomHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateZKProofMock() {
  return {
    proof: generateRandomHash(),
    publicSignals: [generateRandomHash(), generateRandomHash()],
    verificationKey: generateRandomHash()
  };
}

// Medical data generators
export function generateMedicalDataHash(): string {
  return generateRandomHash();
}

export function generatePatientId(): string {
  return 'patient_' + Math.random().toString(36).substr(2, 9);
}

export function generateResearchId(): string {
  return 'research_' + Math.random().toString(36).substr(2, 9);
}

// Mock data structures
export interface MockPatient {
  id: string;
  address: CoinPublicKey;
  dataHash: string;
  consentTimestamp: bigint;
  isActive: boolean;
}

export interface MockResearchProposal {
  id: string;
  researcher: CoinPublicKey;
  title: string;
  description: string;
  dataRequirements: string[];
  reward: bigint;
  deadline: bigint;
  isApproved: boolean;
}

export interface MockConsent {
  patientId: string;
  researchId: string;
  dataFields: string[];
  consentHash: string;
  timestamp: bigint;
  isActive: boolean;
}

// Wait for async operations
export async function waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Assertion helpers
export function expectZKProofValid(proof: any): void {
  expect(proof).toBeDefined();
  expect(proof.proof).toMatch(/^0x[a-fA-F0-9]{64}$/);
  expect(proof.publicSignals).toBeInstanceOf(Array);
  expect(proof.verificationKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
}

export function expectAddressValid(address: CoinPublicKey): void {
  expect(address).toBeInstanceOf(Uint8Array);
  expect(address.length).toBe(32);
}

export function expectHashValid(hash: string): void {
  expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
}
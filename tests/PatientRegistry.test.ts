import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { CoinPublicKey } from '@midnight-ntwrk/compact-runtime';

// Mock simulator class for PatientRegistry
class PatientRegistrySimulator {
  private patients = new Map();
  private addressToPatientId = new Map();
  private nextPatientId = 1;
  private admin: string;
  private initialized = false;

  constructor(admin: string) {
    this.admin = admin;
    this.initialized = true;
  }

  initialize(admin: string): void {
    this.admin = admin;
    this.initialized = true;
  }

  registerPatient(
    encryptedProfile: string,
    dataCategories: any[],
    initialConsent: any[],
    zkCommitment: bigint,
    caller?: string
  ): bigint {
    if (!this.initialized) {
      throw new Error('PatientRegistry: contract not initialized');
    }

    if (!encryptedProfile) {
      throw new Error('PatientRegistry: empty profile');
    }

    if (zkCommitment <= 0n) {
      throw new Error('PatientRegistry: invalid commitment');
    }

    const callerAddress = caller || 'default_caller';

    if (this.addressToPatientId.has(callerAddress)) {
      throw new Error('PatientRegistry: already registered');
    }

    const patientId = BigInt(this.nextPatientId);
    const currentTime = 1000000n;

    const profile = {
      patientId,
      encryptedProfile,
      dataCategories,
      consentLevels: initialConsent,
      zkCommitment,
      lastUpdated: currentTime,
      isActive: true
    };

    this.patients.set(patientId, profile);
    this.addressToPatientId.set(callerAddress, patientId);
    this.nextPatientId++;

    return patientId;
  }

  updateConsent(
    newConsentLevels: any[],
    newZkCommitment: bigint,
    caller?: string
  ): void {
    if (!this.initialized) {
      throw new Error('PatientRegistry: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';

    if (!this.addressToPatientId.has(callerAddress)) {
      throw new Error('PatientRegistry: not registered');
    }

    if (newZkCommitment <= 0n) {
      throw new Error('PatientRegistry: invalid commitment');
    }

    const patientId = this.addressToPatientId.get(callerAddress);
    const existingProfile = this.patients.get(patientId);

    if (!existingProfile) {
      throw new Error('PatientRegistry: patient not found');
    }

    const updatedProfile = {
      ...existingProfile,
      consentLevels: newConsentLevels,
      zkCommitment: newZkCommitment,
      lastUpdated: 1000000n
    };

    this.patients.set(patientId, updatedProfile);
  }

  getPatientProfile(patientId: bigint): any {
    if (!this.initialized) {
      throw new Error('PatientRegistry: contract not initialized');
    }

    if (!this.patients.has(patientId)) {
      throw new Error('PatientRegistry: patient not found');
    }

    return this.patients.get(patientId);
  }

  getPatientId(patientAddress: string): bigint {
    if (!this.initialized) {
      throw new Error('PatientRegistry: contract not initialized');
    }

    return this.addressToPatientId.get(patientAddress) || 0n;
  }

  deactivatePatient(patientId: bigint, caller?: string): void {
    if (!this.initialized) {
      throw new Error('PatientRegistry: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';
    if (callerAddress !== this.admin) {
      throw new Error('PatientRegistry: admin only');
    }

    if (!this.patients.has(patientId)) {
      throw new Error('PatientRegistry: patient not found');
    }

    const existingProfile = this.patients.get(patientId);
    const updatedProfile = {
      ...existingProfile,
      isActive: false
    };

    this.patients.set(patientId, updatedProfile);
  }
}

// Test constants
const ADMIN_ADDRESS = 'admin_key';
const PATIENT_ADDRESS = 'patient_key';
const RESEARCHER_ADDRESS = 'researcher_key';

const SAMPLE_ENCRYPTED_PROFILE = 'encrypted_health_data_12345';
const SAMPLE_ZK_COMMITMENT = 98765432109876543210n;

// Health data categories enum mock
enum HealthDataCategory {
  Medical_Records = 0,
  Lab_Results = 1,
  Genomic_Data = 2,
  Lifestyle_Data = 3,
  Mental_Health = 4,
  Medication_History = 5,
  Imaging_Data = 6,
  Vital_Signs = 7
}

// Consent level enum mock
enum ConsentLevel {
  None = 0,
  Restricted = 1,
  Research_Only = 2,
  Commercial_Use = 3,
  Full_Access = 4
}

describe('PatientRegistry', () => {
  let registry: PatientRegistrySimulator;

  beforeEach(() => {
    registry = new PatientRegistrySimulator(ADMIN_ADDRESS);
  });

  describe('Initialization', () => {
    it('should initialize with admin address', () => {
      const newRegistry = new PatientRegistrySimulator(ADMIN_ADDRESS);
      expect(newRegistry).toBeDefined();
    });

    it('should fail operations before initialization', () => {
      const uninitializedRegistry = new PatientRegistrySimulator('');
      uninitializedRegistry['initialized'] = false;

      expect(() => {
        uninitializedRegistry.registerPatient(
          SAMPLE_ENCRYPTED_PROFILE,
          [HealthDataCategory.Medical_Records],
          [ConsentLevel.Research_Only],
          SAMPLE_ZK_COMMITMENT
        );
      }).toThrow('PatientRegistry: contract not initialized');
    });
  });

  describe('Patient Registration', () => {
    it('should register a new patient successfully', () => {
      const dataCategories = [HealthDataCategory.Medical_Records, HealthDataCategory.Lab_Results];
      const consentLevels = [ConsentLevel.Research_Only, ConsentLevel.Research_Only];

      const patientId = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        dataCategories,
        consentLevels,
        SAMPLE_ZK_COMMITMENT,
        PATIENT_ADDRESS
      );

      expect(patientId).toBe(1n);

      const profile = registry.getPatientProfile(patientId);
      expect(profile.patientId).toBe(patientId);
      expect(profile.encryptedProfile).toBe(SAMPLE_ENCRYPTED_PROFILE);
      expect(profile.zkCommitment).toBe(SAMPLE_ZK_COMMITMENT);
      expect(profile.isActive).toBe(true);
    });

    it('should fail registration with empty profile', () => {
      expect(() => {
        registry.registerPatient(
          '',
          [HealthDataCategory.Medical_Records],
          [ConsentLevel.Research_Only],
          SAMPLE_ZK_COMMITMENT,
          PATIENT_ADDRESS
        );
      }).toThrow('PatientRegistry: empty profile');
    });

    it('should fail registration with invalid commitment', () => {
      expect(() => {
        registry.registerPatient(
          SAMPLE_ENCRYPTED_PROFILE,
          [HealthDataCategory.Medical_Records],
          [ConsentLevel.Research_Only],
          0n,
          PATIENT_ADDRESS
        );
      }).toThrow('PatientRegistry: invalid commitment');
    });

    it('should fail duplicate registration', () => {
      // Register first time
      registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        [HealthDataCategory.Medical_Records],
        [ConsentLevel.Research_Only],
        SAMPLE_ZK_COMMITMENT,
        PATIENT_ADDRESS
      );

      // Try to register again
      expect(() => {
        registry.registerPatient(
          SAMPLE_ENCRYPTED_PROFILE,
          [HealthDataCategory.Medical_Records],
          [ConsentLevel.Research_Only],
          SAMPLE_ZK_COMMITMENT + 1n,
          PATIENT_ADDRESS
        );
      }).toThrow('PatientRegistry: already registered');
    });

    it('should assign sequential patient IDs', () => {
      const patientId1 = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        [HealthDataCategory.Medical_Records],
        [ConsentLevel.Research_Only],
        SAMPLE_ZK_COMMITMENT,
        'patient1'
      );

      const patientId2 = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        [HealthDataCategory.Lab_Results],
        [ConsentLevel.Commercial_Use],
        SAMPLE_ZK_COMMITMENT + 1n,
        'patient2'
      );

      expect(patientId1).toBe(1n);
      expect(patientId2).toBe(2n);
    });
  });

  describe('Consent Management', () => {
    let patientId: bigint;

    beforeEach(() => {
      patientId = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        [HealthDataCategory.Medical_Records, HealthDataCategory.Lab_Results],
        [ConsentLevel.Research_Only, ConsentLevel.None],
        SAMPLE_ZK_COMMITMENT,
        PATIENT_ADDRESS
      );
    });

    it('should update consent levels successfully', () => {
      const newConsentLevels = [ConsentLevel.Commercial_Use, ConsentLevel.Research_Only];
      const newZkCommitment = SAMPLE_ZK_COMMITMENT + 1000n;

      registry.updateConsent(newConsentLevels, newZkCommitment, PATIENT_ADDRESS);

      const profile = registry.getPatientProfile(patientId);
      expect(profile.consentLevels).toEqual(newConsentLevels);
      expect(profile.zkCommitment).toBe(newZkCommitment);
    });

    it('should fail consent update for unregistered patient', () => {
      expect(() => {
        registry.updateConsent(
          [ConsentLevel.Commercial_Use],
          SAMPLE_ZK_COMMITMENT + 1000n,
          'unregistered_patient'
        );
      }).toThrow('PatientRegistry: not registered');
    });

    it('should fail consent update with invalid commitment', () => {
      expect(() => {
        registry.updateConsent(
          [ConsentLevel.Commercial_Use],
          0n,
          PATIENT_ADDRESS
        );
      }).toThrow('PatientRegistry: invalid commitment');
    });
  });

  describe('Patient Lookup', () => {
    let patientId: bigint;

    beforeEach(() => {
      patientId = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        [HealthDataCategory.Medical_Records],
        [ConsentLevel.Research_Only],
        SAMPLE_ZK_COMMITMENT,
        PATIENT_ADDRESS
      );
    });

    it('should retrieve patient profile by ID', () => {
      const profile = registry.getPatientProfile(patientId);

      expect(profile.patientId).toBe(patientId);
      expect(profile.encryptedProfile).toBe(SAMPLE_ENCRYPTED_PROFILE);
      expect(profile.isActive).toBe(true);
    });

    it('should retrieve patient ID by address', () => {
      const retrievedId = registry.getPatientId(PATIENT_ADDRESS);
      expect(retrievedId).toBe(patientId);
    });

    it('should return 0 for non-existent patient address', () => {
      const retrievedId = registry.getPatientId('non_existent_address');
      expect(retrievedId).toBe(0n);
    });

    it('should fail to retrieve non-existent patient profile', () => {
      expect(() => {
        registry.getPatientProfile(999n);
      }).toThrow('PatientRegistry: patient not found');
    });
  });

  describe('Admin Functions', () => {
    let patientId: bigint;

    beforeEach(() => {
      patientId = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        [HealthDataCategory.Medical_Records],
        [ConsentLevel.Research_Only],
        SAMPLE_ZK_COMMITMENT,
        PATIENT_ADDRESS
      );
    });

    it('should allow admin to deactivate patient', () => {
      registry.deactivatePatient(patientId, ADMIN_ADDRESS);

      const profile = registry.getPatientProfile(patientId);
      expect(profile.isActive).toBe(false);
    });

    it('should fail deactivation by non-admin', () => {
      expect(() => {
        registry.deactivatePatient(patientId, PATIENT_ADDRESS);
      }).toThrow('PatientRegistry: admin only');
    });

    it('should fail deactivation of non-existent patient', () => {
      expect(() => {
        registry.deactivatePatient(999n, ADMIN_ADDRESS);
      }).toThrow('PatientRegistry: patient not found');
    });
  });

  describe('Data Categories and Consent', () => {
    it('should handle multiple data categories', () => {
      const dataCategories = [
        HealthDataCategory.Medical_Records,
        HealthDataCategory.Lab_Results,
        HealthDataCategory.Genomic_Data,
        HealthDataCategory.Mental_Health
      ];

      const consentLevels = [
        ConsentLevel.Research_Only,
        ConsentLevel.Commercial_Use,
        ConsentLevel.Restricted,
        ConsentLevel.None
      ];

      const patientId = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        dataCategories,
        consentLevels,
        SAMPLE_ZK_COMMITMENT,
        PATIENT_ADDRESS
      );

      const profile = registry.getPatientProfile(patientId);
      expect(profile.dataCategories).toEqual(dataCategories);
      expect(profile.consentLevels).toEqual(consentLevels);
    });

    it('should handle consent level changes', () => {
      const patientId = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        [HealthDataCategory.Medical_Records],
        [ConsentLevel.None],
        SAMPLE_ZK_COMMITMENT,
        PATIENT_ADDRESS
      );

      // Upgrade consent to research only
      registry.updateConsent(
        [ConsentLevel.Research_Only],
        SAMPLE_ZK_COMMITMENT + 100n,
        PATIENT_ADDRESS
      );

      let profile = registry.getPatientProfile(patientId);
      expect(profile.consentLevels[0]).toBe(ConsentLevel.Research_Only);

      // Upgrade to commercial use
      registry.updateConsent(
        [ConsentLevel.Commercial_Use],
        SAMPLE_ZK_COMMITMENT + 200n,
        PATIENT_ADDRESS
      );

      profile = registry.getPatientProfile(patientId);
      expect(profile.consentLevels[0]).toBe(ConsentLevel.Commercial_Use);

      // Revoke consent
      registry.updateConsent(
        [ConsentLevel.None],
        SAMPLE_ZK_COMMITMENT + 300n,
        PATIENT_ADDRESS
      );

      profile = registry.getPatientProfile(patientId);
      expect(profile.consentLevels[0]).toBe(ConsentLevel.None);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum patient registration load', () => {
      const patientIds: bigint[] = [];

      for (let i = 0; i < 100; i++) {
        const patientId = registry.registerPatient(
          `encrypted_profile_${i}`,
          [HealthDataCategory.Medical_Records],
          [ConsentLevel.Research_Only],
          SAMPLE_ZK_COMMITMENT + BigInt(i),
          `patient_${i}`
        );
        patientIds.push(patientId);
      }

      expect(patientIds).toHaveLength(100);
      expect(patientIds[0]).toBe(1n);
      expect(patientIds[99]).toBe(100n);
    });

    it('should maintain data integrity across operations', () => {
      const patientId = registry.registerPatient(
        SAMPLE_ENCRYPTED_PROFILE,
        [HealthDataCategory.Medical_Records, HealthDataCategory.Lab_Results],
        [ConsentLevel.Research_Only, ConsentLevel.Commercial_Use],
        SAMPLE_ZK_COMMITMENT,
        PATIENT_ADDRESS
      );

      // Verify initial state
      let profile = registry.getPatientProfile(patientId);
      expect(profile.isActive).toBe(true);
      expect(profile.dataCategories).toHaveLength(2);

      // Update consent
      registry.updateConsent(
        [ConsentLevel.Full_Access, ConsentLevel.None],
        SAMPLE_ZK_COMMITMENT + 500n,
        PATIENT_ADDRESS
      );

      // Verify data categories unchanged, consent updated
      profile = registry.getPatientProfile(patientId);
      expect(profile.dataCategories).toHaveLength(2);
      expect(profile.consentLevels[0]).toBe(ConsentLevel.Full_Access);
      expect(profile.consentLevels[1]).toBe(ConsentLevel.None);

      // Deactivate patient
      registry.deactivatePatient(patientId, ADMIN_ADDRESS);

      // Verify profile still accessible but inactive
      profile = registry.getPatientProfile(patientId);
      expect(profile.isActive).toBe(false);
      expect(profile.patientId).toBe(patientId);
    });
  });
});
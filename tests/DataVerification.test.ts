import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock simulator class for DataVerification
class DataVerificationSimulator {
  private credentials = new Map();
  private verifiedProofs = new Map();
  private authorizedIssuers = new Map();
  private dataCommitments = new Map();
  private proofMetadata = new Map();
  private nextCredentialId = 1;
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

  addAuthorizedIssuer(issuerName: string, caller?: string): void {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';
    if (callerAddress !== this.admin) {
      throw new Error('DataVerification: admin only');
    }

    if (!issuerName) {
      throw new Error('DataVerification: empty issuer name');
    }

    this.authorizedIssuers.set(issuerName, true);
  }

  removeAuthorizedIssuer(issuerName: string, caller?: string): void {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';
    if (callerAddress !== this.admin) {
      throw new Error('DataVerification: admin only');
    }

    this.authorizedIssuers.set(issuerName, false);
  }

  submitCredential(
    credentialType: CredentialType,
    issuer: string,
    zkProofHash: bigint,
    issuedAt: bigint,
    expiresAt: bigint,
    proofParams: ZKProofParams,
    caller?: string
  ): bigint {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';

    // Verify issuer is authorized
    if (!this.authorizedIssuers.has(issuer) || !this.authorizedIssuers.get(issuer)) {
      throw new Error('DataVerification: unauthorized issuer');
    }

    const currentTime = 1000000n;

    if (issuedAt > currentTime) {
      throw new Error('DataVerification: invalid issued time');
    }

    if (expiresAt <= currentTime) {
      throw new Error('DataVerification: credential expired');
    }

    if (zkProofHash <= 0n) {
      throw new Error('DataVerification: invalid proof hash');
    }

    // Verify ZK proof (simplified)
    const isProofValid = this.verifyZKProof(proofParams);
    if (!isProofValid) {
      throw new Error('DataVerification: invalid proof');
    }

    const credentialId = BigInt(this.nextCredentialId);

    const credential = {
      credentialId,
      holder: callerAddress,
      credentialType,
      issuer,
      zkProofHash,
      issuedAt,
      expiresAt,
      isValid: true
    };

    this.credentials.set(credentialId, credential);
    this.verifiedProofs.set(zkProofHash, true);

    const proofMetadata = {
      proofHash: zkProofHash,
      verifier: callerAddress,
      verifiedAt: currentTime,
      expiresAt,
      isValid: true
    };
    this.proofMetadata.set(zkProofHash, proofMetadata);

    this.nextCredentialId++;
    return credentialId;
  }

  verifyZKProof(params: ZKProofParams): boolean {
    if (params.commitment <= 0n) {
      throw new Error('DataVerification: invalid commitment');
    }

    if (params.nullifier <= 0n) {
      throw new Error('DataVerification: invalid nullifier');
    }

    const proofSum = params.proof.reduce((sum, element) => sum + element, 0n);

    if (proofSum <= 0n) {
      throw new Error('DataVerification: empty proof');
    }

    return true;
  }

  generateSelectiveDisclosureProof(
    patientId: bigint,
    disclosureParams: SelectiveDisclosureParams,
    caller?: string
  ): bigint {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';

    if (!this.dataCommitments.has(patientId)) {
      throw new Error('DataVerification: no data commitments');
    }

    const patientCommitments = this.dataCommitments.get(patientId);
    if (!patientCommitments.has(disclosureParams.dataCategory)) {
      throw new Error('DataVerification: data category not committed');
    }

    const storedCommitment = patientCommitments.get(disclosureParams.dataCategory);
    if (storedCommitment !== disclosureParams.commitment) {
      throw new Error('DataVerification: commitment mismatch');
    }

    const isValidDisclosure = this.verifySelectiveDisclosureProof(disclosureParams);
    if (!isValidDisclosure) {
      throw new Error('DataVerification: invalid disclosure proof');
    }

    const currentTime = 1000000n;
    const proofHash = disclosureParams.commitment + disclosureParams.nullifierHash + currentTime;

    this.verifiedProofs.set(proofHash, true);

    const proofMetadata = {
      proofHash,
      verifier: callerAddress,
      verifiedAt: currentTime,
      expiresAt: currentTime + 86400n, // 24 hours validity
      isValid: true
    };
    this.proofMetadata.set(proofHash, proofMetadata);

    return proofHash;
  }

  verifySelectiveDisclosureProof(params: SelectiveDisclosureParams): boolean {
    if (params.commitment <= 0n) {
      throw new Error('DataVerification: invalid commitment');
    }

    if (params.nullifierHash <= 0n) {
      throw new Error('DataVerification: invalid nullifier');
    }

    const proofSum = params.proof.reduce((sum, element) => sum + element, 0n);

    if (proofSum <= 0n) {
      throw new Error('DataVerification: empty proof');
    }

    return true;
  }

  storeDataCommitment(
    patientId: bigint,
    dataCategory: HealthDataCategory,
    commitment: bigint
  ): void {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    if (patientId <= 0n) {
      throw new Error('DataVerification: invalid patient ID');
    }

    if (commitment <= 0n) {
      throw new Error('DataVerification: invalid commitment');
    }

    if (!this.dataCommitments.has(patientId)) {
      this.dataCommitments.set(patientId, new Map());
    }

    this.dataCommitments.get(patientId).set(dataCategory, commitment);
  }

  verifyCredential(credentialId: bigint): boolean {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    if (!this.credentials.has(credentialId)) {
      return false;
    }

    const credential = this.credentials.get(credentialId);
    const currentTime = 1000000n;

    return credential.isValid && credential.expiresAt > currentTime;
  }

  verifyProofHash(proofHash: bigint): boolean {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    if (!this.verifiedProofs.has(proofHash)) {
      return false;
    }

    const isVerified = this.verifiedProofs.get(proofHash);

    if (this.proofMetadata.has(proofHash)) {
      const metadata = this.proofMetadata.get(proofHash);
      const currentTime = 1000000n;

      return isVerified && metadata.isValid && metadata.expiresAt > currentTime;
    }

    return isVerified;
  }

  getCredential(credentialId: bigint): any {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    if (!this.credentials.has(credentialId)) {
      throw new Error('DataVerification: credential not found');
    }

    return this.credentials.get(credentialId);
  }

  revokeCredential(credentialId: bigint, caller?: string): void {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';

    if (!this.credentials.has(credentialId)) {
      throw new Error('DataVerification: credential not found');
    }

    const credential = this.credentials.get(credentialId);

    if (callerAddress !== this.admin && callerAddress !== credential.holder) {
      throw new Error('DataVerification: unauthorized');
    }

    credential.isValid = false;
    this.credentials.set(credentialId, credential);

    this.verifiedProofs.set(credential.zkProofHash, false);

    if (this.proofMetadata.has(credential.zkProofHash)) {
      const metadata = this.proofMetadata.get(credential.zkProofHash);
      metadata.isValid = false;
      this.proofMetadata.set(credential.zkProofHash, metadata);
    }
  }

  isAuthorizedIssuer(issuerName: string): boolean {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    return this.authorizedIssuers.has(issuerName) && this.authorizedIssuers.get(issuerName);
  }

  batchVerifyCredentials(credentialIds: bigint[]): boolean[] {
    if (!this.initialized) {
      throw new Error('DataVerification: contract not initialized');
    }

    const currentTime = 1000000n;
    const results: boolean[] = [];

    for (const credentialId of credentialIds) {
      if (credentialId > 0n && this.credentials.has(credentialId)) {
        const credential = this.credentials.get(credentialId);
        results.push(credential.isValid && credential.expiresAt > currentTime);
      } else {
        results.push(false);
      }
    }

    return results;
  }
}

// Types and enums
enum CredentialType {
  Medical_Degree = 0,
  Board_Certification = 1,
  Research_License = 2,
  Institution_Affiliation = 3,
  Ethics_Approval = 4
}

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

interface ZKProofParams {
  commitment: bigint;
  nullifier: bigint;
  publicInputs: bigint[];
  proof: bigint[];
}

interface SelectiveDisclosureParams {
  dataCategory: HealthDataCategory;
  commitment: bigint;
  nullifierHash: bigint;
  disclosedValue: bigint;
  proof: bigint[];
}

// Test constants
const ADMIN_ADDRESS = 'admin_key';
const RESEARCHER_ADDRESS = 'researcher_key';
const DOCTOR_ADDRESS = 'doctor_key';

const SAMPLE_ISSUER = 'Medical Board Authority';
const SAMPLE_ZK_PROOF_HASH = 123456789012345678901234567890n;
const SAMPLE_COMMITMENT = 987654321098765432109876543210n;

const VALID_ZK_PROOF_PARAMS: ZKProofParams = {
  commitment: SAMPLE_COMMITMENT,
  nullifier: 111111111111111111111111111111n,
  publicInputs: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n],
  proof: [100n, 200n, 300n, 400n, 500n, 600n, 700n, 800n]
};

describe('DataVerification', () => {
  let verification: DataVerificationSimulator;

  beforeEach(() => {
    verification = new DataVerificationSimulator(ADMIN_ADDRESS);
    verification.initialize(ADMIN_ADDRESS);
  });

  describe('Initialization', () => {
    it('should initialize with admin address', () => {
      const newVerification = new DataVerificationSimulator(ADMIN_ADDRESS);
      expect(newVerification).toBeDefined();
    });

    it('should fail operations before initialization', () => {
      const uninitializedVerification = new DataVerificationSimulator('');
      uninitializedVerification['initialized'] = false;

      expect(() => {
        uninitializedVerification.addAuthorizedIssuer(SAMPLE_ISSUER);
      }).toThrow('DataVerification: contract not initialized');
    });
  });

  describe('Issuer Management', () => {
    it('should allow admin to add authorized issuer', () => {
      verification.addAuthorizedIssuer(SAMPLE_ISSUER, ADMIN_ADDRESS);

      expect(verification.isAuthorizedIssuer(SAMPLE_ISSUER)).toBe(true);
    });

    it('should allow admin to remove authorized issuer', () => {
      verification.addAuthorizedIssuer(SAMPLE_ISSUER, ADMIN_ADDRESS);
      expect(verification.isAuthorizedIssuer(SAMPLE_ISSUER)).toBe(true);

      verification.removeAuthorizedIssuer(SAMPLE_ISSUER, ADMIN_ADDRESS);
      expect(verification.isAuthorizedIssuer(SAMPLE_ISSUER)).toBe(false);
    });

    it('should fail issuer addition by non-admin', () => {
      expect(() => {
        verification.addAuthorizedIssuer(SAMPLE_ISSUER, RESEARCHER_ADDRESS);
      }).toThrow('DataVerification: admin only');
    });

    it('should fail issuer removal by non-admin', () => {
      verification.addAuthorizedIssuer(SAMPLE_ISSUER, ADMIN_ADDRESS);

      expect(() => {
        verification.removeAuthorizedIssuer(SAMPLE_ISSUER, RESEARCHER_ADDRESS);
      }).toThrow('DataVerification: admin only');
    });

    it('should fail with empty issuer name', () => {
      expect(() => {
        verification.addAuthorizedIssuer('', ADMIN_ADDRESS);
      }).toThrow('DataVerification: empty issuer name');
    });

    it('should return false for non-authorized issuers', () => {
      expect(verification.isAuthorizedIssuer('Unknown Issuer')).toBe(false);
    });
  });

  describe('Credential Submission', () => {
    beforeEach(() => {
      verification.addAuthorizedIssuer(SAMPLE_ISSUER, ADMIN_ADDRESS);
    });

    it('should submit valid medical credential', () => {
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n; // 1 year from now

      const credentialId = verification.submitCredential(
        CredentialType.Medical_Degree,
        SAMPLE_ISSUER,
        SAMPLE_ZK_PROOF_HASH,
        currentTime,
        futureTime,
        VALID_ZK_PROOF_PARAMS,
        DOCTOR_ADDRESS
      );

      expect(credentialId).toBe(1n);

      const credential = verification.getCredential(credentialId);
      expect(credential.credentialType).toBe(CredentialType.Medical_Degree);
      expect(credential.holder).toBe(DOCTOR_ADDRESS);
      expect(credential.issuer).toBe(SAMPLE_ISSUER);
      expect(credential.isValid).toBe(true);
    });

    it('should fail with unauthorized issuer', () => {
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      expect(() => {
        verification.submitCredential(
          CredentialType.Medical_Degree,
          'Unauthorized Issuer',
          SAMPLE_ZK_PROOF_HASH,
          currentTime,
          futureTime,
          VALID_ZK_PROOF_PARAMS,
          DOCTOR_ADDRESS
        );
      }).toThrow('DataVerification: unauthorized issuer');
    });

    it('should fail with invalid issued time', () => {
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;
      const invalidIssuedTime = currentTime + 86400n; // Future time

      expect(() => {
        verification.submitCredential(
          CredentialType.Medical_Degree,
          SAMPLE_ISSUER,
          SAMPLE_ZK_PROOF_HASH,
          invalidIssuedTime,
          futureTime,
          VALID_ZK_PROOF_PARAMS,
          DOCTOR_ADDRESS
        );
      }).toThrow('DataVerification: invalid issued time');
    });

    it('should fail with expired credential', () => {
      const currentTime = 1000000n;
      const pastTime = currentTime - 86400n; // Past time

      expect(() => {
        verification.submitCredential(
          CredentialType.Medical_Degree,
          SAMPLE_ISSUER,
          SAMPLE_ZK_PROOF_HASH,
          pastTime,
          pastTime,
          VALID_ZK_PROOF_PARAMS,
          DOCTOR_ADDRESS
        );
      }).toThrow('DataVerification: credential expired');
    });

    it('should fail with invalid proof hash', () => {
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      expect(() => {
        verification.submitCredential(
          CredentialType.Medical_Degree,
          SAMPLE_ISSUER,
          0n,
          currentTime,
          futureTime,
          VALID_ZK_PROOF_PARAMS,
          DOCTOR_ADDRESS
        );
      }).toThrow('DataVerification: invalid proof hash');
    });

    it('should assign sequential credential IDs', () => {
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      const credentialId1 = verification.submitCredential(
        CredentialType.Medical_Degree,
        SAMPLE_ISSUER,
        SAMPLE_ZK_PROOF_HASH,
        currentTime,
        futureTime,
        VALID_ZK_PROOF_PARAMS,
        'doctor1'
      );

      const credentialId2 = verification.submitCredential(
        CredentialType.Board_Certification,
        SAMPLE_ISSUER,
        SAMPLE_ZK_PROOF_HASH + 1n,
        currentTime,
        futureTime,
        { ...VALID_ZK_PROOF_PARAMS, commitment: VALID_ZK_PROOF_PARAMS.commitment + 1n },
        'doctor2'
      );

      expect(credentialId1).toBe(1n);
      expect(credentialId2).toBe(2n);
    });
  });

  describe('ZK Proof Verification', () => {
    it('should verify valid ZK proof parameters', () => {
      const isValid = verification.verifyZKProof(VALID_ZK_PROOF_PARAMS);
      expect(isValid).toBe(true);
    });

    it('should fail with invalid commitment', () => {
      const invalidParams = { ...VALID_ZK_PROOF_PARAMS, commitment: 0n };

      expect(() => {
        verification.verifyZKProof(invalidParams);
      }).toThrow('DataVerification: invalid commitment');
    });

    it('should fail with invalid nullifier', () => {
      const invalidParams = { ...VALID_ZK_PROOF_PARAMS, nullifier: 0n };

      expect(() => {
        verification.verifyZKProof(invalidParams);
      }).toThrow('DataVerification: invalid nullifier');
    });

    it('should fail with empty proof', () => {
      const invalidParams = {
        ...VALID_ZK_PROOF_PARAMS,
        proof: [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]
      };

      expect(() => {
        verification.verifyZKProof(invalidParams);
      }).toThrow('DataVerification: empty proof');
    });
  });

  describe('Data Commitment Management', () => {
    const patientId = 123n;
    const commitment = SAMPLE_COMMITMENT;

    it('should store data commitment successfully', () => {
      verification.storeDataCommitment(
        patientId,
        HealthDataCategory.Medical_Records,
        commitment
      );

      // Should not throw when trying to use stored commitment
      expect(() => {
        verification.storeDataCommitment(
          patientId,
          HealthDataCategory.Lab_Results,
          commitment + 1n
        );
      }).not.toThrow();
    });

    it('should fail with invalid patient ID', () => {
      expect(() => {
        verification.storeDataCommitment(
          0n,
          HealthDataCategory.Medical_Records,
          commitment
        );
      }).toThrow('DataVerification: invalid patient ID');
    });

    it('should fail with invalid commitment', () => {
      expect(() => {
        verification.storeDataCommitment(
          patientId,
          HealthDataCategory.Medical_Records,
          0n
        );
      }).toThrow('DataVerification: invalid commitment');
    });
  });

  describe('Selective Disclosure', () => {
    const patientId = 123n;
    const commitment = SAMPLE_COMMITMENT;

    beforeEach(() => {
      verification.storeDataCommitment(
        patientId,
        HealthDataCategory.Medical_Records,
        commitment
      );
    });

    it('should generate selective disclosure proof', () => {
      const disclosureParams: SelectiveDisclosureParams = {
        dataCategory: HealthDataCategory.Medical_Records,
        commitment,
        nullifierHash: 555555555555555555555555555555n,
        disclosedValue: 777777777777777777777777777777n,
        proof: [100n, 200n, 300n, 400n, 500n, 600n, 700n, 800n]
      };

      const proofHash = verification.generateSelectiveDisclosureProof(
        patientId,
        disclosureParams,
        RESEARCHER_ADDRESS
      );

      expect(proofHash).toBeGreaterThan(0n);
      expect(verification.verifyProofHash(proofHash)).toBe(true);
    });

    it('should fail without data commitments', () => {
      const disclosureParams: SelectiveDisclosureParams = {
        dataCategory: HealthDataCategory.Medical_Records,
        commitment,
        nullifierHash: 555555555555555555555555555555n,
        disclosedValue: 777777777777777777777777777777n,
        proof: [100n, 200n, 300n, 400n, 500n, 600n, 700n, 800n]
      };

      expect(() => {
        verification.generateSelectiveDisclosureProof(
          999n, // Non-existent patient
          disclosureParams,
          RESEARCHER_ADDRESS
        );
      }).toThrow('DataVerification: no data commitments');
    });

    it('should fail with uncommitted data category', () => {
      const disclosureParams: SelectiveDisclosureParams = {
        dataCategory: HealthDataCategory.Lab_Results, // Not committed
        commitment,
        nullifierHash: 555555555555555555555555555555n,
        disclosedValue: 777777777777777777777777777777n,
        proof: [100n, 200n, 300n, 400n, 500n, 600n, 700n, 800n]
      };

      expect(() => {
        verification.generateSelectiveDisclosureProof(
          patientId,
          disclosureParams,
          RESEARCHER_ADDRESS
        );
      }).toThrow('DataVerification: data category not committed');
    });

    it('should fail with commitment mismatch', () => {
      const disclosureParams: SelectiveDisclosureParams = {
        dataCategory: HealthDataCategory.Medical_Records,
        commitment: commitment + 1n, // Wrong commitment
        nullifierHash: 555555555555555555555555555555n,
        disclosedValue: 777777777777777777777777777777n,
        proof: [100n, 200n, 300n, 400n, 500n, 600n, 700n, 800n]
      };

      expect(() => {
        verification.generateSelectiveDisclosureProof(
          patientId,
          disclosureParams,
          RESEARCHER_ADDRESS
        );
      }).toThrow('DataVerification: commitment mismatch');
    });
  });

  describe('Credential Verification', () => {
    let credentialId: bigint;

    beforeEach(() => {
      verification.addAuthorizedIssuer(SAMPLE_ISSUER, ADMIN_ADDRESS);

      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      credentialId = verification.submitCredential(
        CredentialType.Medical_Degree,
        SAMPLE_ISSUER,
        SAMPLE_ZK_PROOF_HASH,
        currentTime,
        futureTime,
        VALID_ZK_PROOF_PARAMS,
        DOCTOR_ADDRESS
      );
    });

    it('should verify valid credential', () => {
      expect(verification.verifyCredential(credentialId)).toBe(true);
    });

    it('should return false for non-existent credential', () => {
      expect(verification.verifyCredential(999n)).toBe(false);
    });

    it('should verify proof hash', () => {
      expect(verification.verifyProofHash(SAMPLE_ZK_PROOF_HASH)).toBe(true);
    });

    it('should return false for non-existent proof hash', () => {
      expect(verification.verifyProofHash(999999999999999999999999999999n)).toBe(false);
    });

    it('should retrieve credential details', () => {
      const credential = verification.getCredential(credentialId);

      expect(credential.credentialId).toBe(credentialId);
      expect(credential.holder).toBe(DOCTOR_ADDRESS);
      expect(credential.credentialType).toBe(CredentialType.Medical_Degree);
      expect(credential.issuer).toBe(SAMPLE_ISSUER);
      expect(credential.isValid).toBe(true);
    });

    it('should fail to retrieve non-existent credential', () => {
      expect(() => {
        verification.getCredential(999n);
      }).toThrow('DataVerification: credential not found');
    });
  });

  describe('Credential Revocation', () => {
    let credentialId: bigint;

    beforeEach(() => {
      verification.addAuthorizedIssuer(SAMPLE_ISSUER, ADMIN_ADDRESS);

      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      credentialId = verification.submitCredential(
        CredentialType.Medical_Degree,
        SAMPLE_ISSUER,
        SAMPLE_ZK_PROOF_HASH,
        currentTime,
        futureTime,
        VALID_ZK_PROOF_PARAMS,
        DOCTOR_ADDRESS
      );
    });

    it('should allow admin to revoke credential', () => {
      verification.revokeCredential(credentialId, ADMIN_ADDRESS);

      expect(verification.verifyCredential(credentialId)).toBe(false);
      expect(verification.verifyProofHash(SAMPLE_ZK_PROOF_HASH)).toBe(false);
    });

    it('should allow credential holder to revoke their credential', () => {
      verification.revokeCredential(credentialId, DOCTOR_ADDRESS);

      expect(verification.verifyCredential(credentialId)).toBe(false);
    });

    it('should fail revocation by unauthorized user', () => {
      expect(() => {
        verification.revokeCredential(credentialId, RESEARCHER_ADDRESS);
      }).toThrow('DataVerification: unauthorized');
    });

    it('should fail revocation of non-existent credential', () => {
      expect(() => {
        verification.revokeCredential(999n, ADMIN_ADDRESS);
      }).toThrow('DataVerification: credential not found');
    });

    it('should maintain credential data after revocation', () => {
      verification.revokeCredential(credentialId, ADMIN_ADDRESS);

      const credential = verification.getCredential(credentialId);
      expect(credential.credentialId).toBe(credentialId);
      expect(credential.holder).toBe(DOCTOR_ADDRESS);
      expect(credential.isValid).toBe(false); // But marked as invalid
    });
  });

  describe('Batch Operations', () => {
    let credentialIds: bigint[];

    beforeEach(() => {
      verification.addAuthorizedIssuer(SAMPLE_ISSUER, ADMIN_ADDRESS);

      credentialIds = [];
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      // Create multiple credentials
      for (let i = 0; i < 5; i++) {
        const credentialId = verification.submitCredential(
          CredentialType.Medical_Degree,
          SAMPLE_ISSUER,
          SAMPLE_ZK_PROOF_HASH + BigInt(i),
          currentTime,
          futureTime,
          {
            ...VALID_ZK_PROOF_PARAMS,
            commitment: VALID_ZK_PROOF_PARAMS.commitment + BigInt(i)
          },
          `doctor_${i}`
        );
        credentialIds.push(credentialId);
      }
    });

    it('should batch verify multiple credentials', () => {
      const results = verification.batchVerifyCredentials(credentialIds);

      expect(results).toHaveLength(5);
      expect(results.every(result => result === true)).toBe(true);
    });

    it('should handle mix of valid and invalid credentials', () => {
      // Revoke some credentials
      verification.revokeCredential(credentialIds[1], ADMIN_ADDRESS);
      verification.revokeCredential(credentialIds[3], ADMIN_ADDRESS);

      const results = verification.batchVerifyCredentials(credentialIds);

      expect(results).toHaveLength(5);
      expect(results[0]).toBe(true);
      expect(results[1]).toBe(false); // Revoked
      expect(results[2]).toBe(true);
      expect(results[3]).toBe(false); // Revoked
      expect(results[4]).toBe(true);
    });

    it('should handle non-existent credentials in batch', () => {
      const mixedIds = [...credentialIds, 999n, 998n];
      const results = verification.batchVerifyCredentials(mixedIds);

      expect(results).toHaveLength(7);
      expect(results.slice(0, 5).every(result => result === true)).toBe(true);
      expect(results[5]).toBe(false); // Non-existent
      expect(results[6]).toBe(false); // Non-existent
    });
  });

  describe('Complex Scenarios', () => {
    beforeEach(() => {
      verification.addAuthorizedIssuer('Medical University', ADMIN_ADDRESS);
      verification.addAuthorizedIssuer('Board of Medicine', ADMIN_ADDRESS);
      verification.addAuthorizedIssuer('Research Institute', ADMIN_ADDRESS);
    });

    it('should handle complete credential lifecycle', () => {
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      // 1. Submit credential
      const credentialId = verification.submitCredential(
        CredentialType.Medical_Degree,
        'Medical University',
        SAMPLE_ZK_PROOF_HASH,
        currentTime,
        futureTime,
        VALID_ZK_PROOF_PARAMS,
        DOCTOR_ADDRESS
      );

      // 2. Verify credential is valid
      expect(verification.verifyCredential(credentialId)).toBe(true);

      // 3. Store data commitments
      const patientId = 123n;
      verification.storeDataCommitment(
        patientId,
        HealthDataCategory.Medical_Records,
        SAMPLE_COMMITMENT
      );

      // 4. Generate selective disclosure proof
      const disclosureParams: SelectiveDisclosureParams = {
        dataCategory: HealthDataCategory.Medical_Records,
        commitment: SAMPLE_COMMITMENT,
        nullifierHash: 555555555555555555555555555555n,
        disclosedValue: 777777777777777777777777777777n,
        proof: [100n, 200n, 300n, 400n, 500n, 600n, 700n, 800n]
      };

      const proofHash = verification.generateSelectiveDisclosureProof(
        patientId,
        disclosureParams,
        DOCTOR_ADDRESS
      );

      // 5. Verify proof
      expect(verification.verifyProofHash(proofHash)).toBe(true);

      // 6. Revoke credential
      verification.revokeCredential(credentialId, DOCTOR_ADDRESS);

      // 7. Verify credential is now invalid
      expect(verification.verifyCredential(credentialId)).toBe(false);
    });

    it('should handle multiple credential types for same holder', () => {
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      const credentialTypes = [
        CredentialType.Medical_Degree,
        CredentialType.Board_Certification,
        CredentialType.Research_License,
        CredentialType.Institution_Affiliation
      ];

      const issuers = [
        'Medical University',
        'Board of Medicine',
        'Research Institute',
        'Board of Medicine'
      ];

      const credentialIds: bigint[] = [];

      // Submit multiple credentials for same doctor
      credentialTypes.forEach((type, index) => {
        const credentialId = verification.submitCredential(
          type,
          issuers[index],
          SAMPLE_ZK_PROOF_HASH + BigInt(index),
          currentTime,
          futureTime,
          {
            ...VALID_ZK_PROOF_PARAMS,
            commitment: VALID_ZK_PROOF_PARAMS.commitment + BigInt(index)
          },
          DOCTOR_ADDRESS
        );
        credentialIds.push(credentialId);
      });

      // Verify all credentials
      const results = verification.batchVerifyCredentials(credentialIds);
      expect(results.every(result => result === true)).toBe(true);

      // Verify individual credentials
      credentialIds.forEach(credentialId => {
        const credential = verification.getCredential(credentialId);
        expect(credential.holder).toBe(DOCTOR_ADDRESS);
        expect(credential.isValid).toBe(true);
      });
    });

    it('should handle issuer authorization changes', () => {
      const currentTime = 1000000n;
      const futureTime = currentTime + 31536000n;

      // Submit credential with authorized issuer
      const credentialId = verification.submitCredential(
        CredentialType.Medical_Degree,
        'Medical University',
        SAMPLE_ZK_PROOF_HASH,
        currentTime,
        futureTime,
        VALID_ZK_PROOF_PARAMS,
        DOCTOR_ADDRESS
      );

      expect(verification.verifyCredential(credentialId)).toBe(true);

      // Remove issuer authorization
      verification.removeAuthorizedIssuer('Medical University', ADMIN_ADDRESS);

      // Existing credentials should still be valid
      expect(verification.verifyCredential(credentialId)).toBe(true);

      // But new credentials from this issuer should fail
      expect(() => {
        verification.submitCredential(
          CredentialType.Board_Certification,
          'Medical University',
          SAMPLE_ZK_PROOF_HASH + 1n,
          currentTime,
          futureTime,
          { ...VALID_ZK_PROOF_PARAMS, commitment: VALID_ZK_PROOF_PARAMS.commitment + 1n },
          DOCTOR_ADDRESS
        );
      }).toThrow('DataVerification: unauthorized issuer');
    });
  });
});
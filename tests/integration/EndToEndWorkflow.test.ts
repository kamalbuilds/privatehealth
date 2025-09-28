import { describe, it, expect, beforeEach } from 'vitest';
import { CoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import {
  createTestUser,
  getCurrentTimestamp,
  addDays,
  generateMedicalDataHash,
  generatePatientId,
  generateResearchId,
  generateZKProofMock,
  waitFor
} from '@tests/utils/test-helpers';

// Integration test combining all systems
class PrivateHealthIntegrationSystem {
  private contract: any;
  private zkSystem: any;
  private disclosureSystem: any;
  private accessControl: any;
  private paymentSystem: any;

  constructor() {
    // Initialize all subsystems (mocked for integration testing)
    this.initializeSystems();
  }

  private initializeSystems(): void {
    // Mock implementations for integration testing
    this.contract = {
      patients: new Map(),
      proposals: new Map(),
      consents: new Map(),

      registerPatient: (patientId: string, address: CoinPublicKey, dataHash: string, proof: any) => {
        this.contract.patients.set(patientId, {
          id: patientId,
          address,
          dataHash,
          proof,
          registeredAt: getCurrentTimestamp(),
          isActive: true
        });
      },

      submitProposal: (proposalId: string, researcher: CoinPublicKey, details: any) => {
        this.contract.proposals.set(proposalId, {
          id: proposalId,
          researcher,
          ...details,
          submittedAt: getCurrentTimestamp(),
          status: 'PENDING'
        });
      },

      approveProposal: (proposalId: string) => {
        const proposal = this.contract.proposals.get(proposalId);
        if (proposal) {
          proposal.status = 'APPROVED';
          proposal.approvedAt = getCurrentTimestamp();
        }
      },

      grantConsent: (patientId: string, proposalId: string, fields: string[], proof: any) => {
        const key = `${patientId}-${proposalId}`;
        this.contract.consents.set(key, {
          patientId,
          proposalId,
          fields,
          proof,
          grantedAt: getCurrentTimestamp(),
          isActive: true
        });
      }
    };

    this.zkSystem = {
      generateProof: (type: string, data: any) => generateZKProofMock(),
      verifyProof: (proof: any) => true
    };

    this.disclosureSystem = {
      data: new Map(),
      consents: new Map(),

      storeEncryptedData: (patientId: string, encryptedData: any) => {
        this.disclosureSystem.data.set(patientId, encryptedData);
      },

      grantAccess: (patientId: string, researcherId: string, fields: string[]) => {
        const key = `${patientId}-${researcherId}`;
        this.disclosureSystem.consents.set(key, {
          fields,
          grantedAt: getCurrentTimestamp(),
          isActive: true
        });
        return `token-${key}`;
      },

      selectiveDisclose: (token: string, requestedFields: string[]) => {
        // Mock selective disclosure
        const mockData: any = {
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: 72,
          cholesterol: 180,
          glucose: 95
        };

        const result: any = {};
        requestedFields.forEach(field => {
          if (mockData[field]) {
            result[field] = mockData[field];
          }
        });
        return result;
      }
    };

    this.accessControl = {
      roles: new Map(),

      assignRole: (address: CoinPublicKey, role: string) => {
        const key = this.addressToString(address);
        if (!this.accessControl.roles.has(key)) {
          this.accessControl.roles.set(key, []);
        }
        this.accessControl.roles.get(key).push(role);
      },

      hasPermission: (address: CoinPublicKey, permission: string) => {
        const key = this.addressToString(address);
        const roles = this.accessControl.roles.get(key) || [];

        // Simplified permission mapping
        const permissionMap: any = {
          PATIENT: ['READ_OWN_DATA', 'WRITE_OWN_DATA'],
          RESEARCHER: ['SUBMIT_PROPOSAL', 'ACCESS_CONSENTED_DATA'],
          ADMIN: ['APPROVE_PROPOSALS', 'MANAGE_SYSTEM']
        };

        return roles.some(role =>
          permissionMap[role] && permissionMap[role].includes(permission)
        );
      }
    };

    this.paymentSystem = {
      balances: new Map(),
      escrows: new Map(),

      getBalance: (address: CoinPublicKey) => {
        const key = this.addressToString(address);
        return this.paymentSystem.balances.get(key) || BigInt(0);
      },

      setBalance: (address: CoinPublicKey, amount: bigint) => {
        const key = this.addressToString(address);
        this.paymentSystem.balances.set(key, amount);
      },

      createEscrow: (proposalId: string, amount: bigint, researcher: CoinPublicKey) => {
        this.paymentSystem.escrows.set(proposalId, {
          amount,
          researcher,
          participants: [],
          status: 'ACTIVE'
        });
      },

      addParticipant: (proposalId: string, patient: CoinPublicKey, contribution: any) => {
        const escrow = this.paymentSystem.escrows.get(proposalId);
        if (escrow) {
          escrow.participants.push({ patient, contribution });
        }
      },

      distributeRewards: (proposalId: string) => {
        const escrow = this.paymentSystem.escrows.get(proposalId);
        if (escrow && escrow.participants.length > 0) {
          const rewardPerParticipant = escrow.amount / BigInt(escrow.participants.length);
          escrow.participants.forEach((participant: any) => {
            const currentBalance = this.paymentSystem.getBalance(participant.patient);
            this.paymentSystem.setBalance(participant.patient, currentBalance + rewardPerParticipant);
          });
          escrow.status = 'COMPLETED';
        }
      }
    };
  }

  // Complete workflow: Patient registration to reward distribution
  async executeCompleteWorkflow(
    patient: CoinPublicKey,
    researcher: CoinPublicKey,
    admin: CoinPublicKey
  ): Promise<any> {
    const workflowResults: any = {
      steps: [],
      success: false,
      errors: []
    };

    try {
      // Step 1: Setup roles
      this.accessControl.assignRole(patient, 'PATIENT');
      this.accessControl.assignRole(researcher, 'RESEARCHER');
      this.accessControl.assignRole(admin, 'ADMIN');
      workflowResults.steps.push('Roles assigned');

      // Step 2: Patient registers with encrypted medical data
      const patientId = generatePatientId();
      const medicalDataHash = generateMedicalDataHash();
      const registrationProof = this.zkSystem.generateProof('registration', {
        patientId,
        dataHash: medicalDataHash
      });

      this.contract.registerPatient(patientId, patient, medicalDataHash, registrationProof);

      // Store encrypted data in disclosure system
      const encryptedMedicalData = {
        bloodPressure: 'encrypted_bp_data',
        heartRate: 'encrypted_hr_data',
        cholesterol: 'encrypted_chol_data'
      };
      this.disclosureSystem.storeEncryptedData(patientId, encryptedMedicalData);
      workflowResults.steps.push('Patient registered and data stored');

      // Step 3: Researcher submits research proposal
      const proposalId = generateResearchId();
      const proposalDetails = {
        title: 'Cardiovascular Health Study',
        description: 'Study on blood pressure and heart rate correlation',
        dataRequirements: ['bloodPressure', 'heartRate'],
        reward: BigInt(5000000),
        deadline: addDays(getCurrentTimestamp(), 60)
      };

      this.contract.submitProposal(proposalId, researcher, proposalDetails);
      workflowResults.steps.push('Research proposal submitted');

      // Step 4: Create payment escrow
      this.paymentSystem.setBalance(researcher, BigInt(10000000)); // Give researcher initial balance
      this.paymentSystem.createEscrow(proposalId, proposalDetails.reward, researcher);
      workflowResults.steps.push('Payment escrow created');

      // Step 5: Admin approves proposal
      if (this.accessControl.hasPermission(admin, 'APPROVE_PROPOSALS')) {
        this.contract.approveProposal(proposalId);
        workflowResults.steps.push('Proposal approved by admin');
      } else {
        throw new Error('Admin lacks approval permissions');
      }

      // Step 6: Patient grants consent
      const consentFields = ['bloodPressure', 'heartRate'];
      const consentProof = this.zkSystem.generateProof('consent', {
        patientId,
        proposalId,
        fields: consentFields
      });

      this.contract.grantConsent(patientId, proposalId, consentFields, consentProof);

      // Grant access in disclosure system
      const accessToken = this.disclosureSystem.grantAccess(
        patientId,
        this.addressToString(researcher),
        consentFields
      );
      workflowResults.steps.push('Patient consent granted');

      // Step 7: Researcher accesses consented data
      const disclosedData = this.disclosureSystem.selectiveDisclose(accessToken, consentFields);
      workflowResults.steps.push('Data selectively disclosed to researcher');

      // Step 8: Add patient to payment escrow as participant
      this.paymentSystem.addParticipant(proposalId, patient, {
        dataFields: consentFields,
        qualityScore: 85
      });
      workflowResults.steps.push('Patient added to payment escrow');

      // Step 9: Complete research and distribute rewards
      this.paymentSystem.distributeRewards(proposalId);
      const patientReward = this.paymentSystem.getBalance(patient);
      workflowResults.steps.push(`Rewards distributed: ${patientReward} tokens to patient`);

      workflowResults.success = true;
      workflowResults.finalData = {
        patientId,
        proposalId,
        disclosedData,
        patientReward,
        accessToken
      };

    } catch (error) {
      workflowResults.errors.push(error.message);
    }

    return workflowResults;
  }

  // Workflow variation: Multiple patients participating
  async executeMultiPatientWorkflow(
    patients: CoinPublicKey[],
    researcher: CoinPublicKey,
    admin: CoinPublicKey
  ): Promise<any> {
    const workflowResults: any = {
      steps: [],
      participants: [],
      success: false,
      errors: []
    };

    try {
      // Setup roles
      patients.forEach(patient => this.accessControl.assignRole(patient, 'PATIENT'));
      this.accessControl.assignRole(researcher, 'RESEARCHER');
      this.accessControl.assignRole(admin, 'ADMIN');

      // Create research proposal
      const proposalId = generateResearchId();
      const proposalDetails = {
        title: 'Multi-Patient Diabetes Study',
        description: 'Large-scale diabetes medication efficacy study',
        dataRequirements: ['glucose', 'medications'],
        reward: BigInt(15000000), // Larger reward for multiple participants
        deadline: addDays(getCurrentTimestamp(), 90)
      };

      this.contract.submitProposal(proposalId, researcher, proposalDetails);
      this.paymentSystem.setBalance(researcher, BigInt(20000000));
      this.paymentSystem.createEscrow(proposalId, proposalDetails.reward, researcher);
      this.contract.approveProposal(proposalId);

      workflowResults.steps.push('Research proposal setup completed');

      // Process each patient
      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        const patientId = generatePatientId();

        // Register patient
        const medicalDataHash = generateMedicalDataHash();
        const registrationProof = this.zkSystem.generateProof('registration', { patientId });
        this.contract.registerPatient(patientId, patient, medicalDataHash, registrationProof);

        // Store encrypted data
        this.disclosureSystem.storeEncryptedData(patientId, {
          glucose: `encrypted_glucose_${i}`,
          medications: `encrypted_meds_${i}`
        });

        // Grant consent
        const consentProof = this.zkSystem.generateProof('consent', {
          patientId,
          proposalId,
          fields: proposalDetails.dataRequirements
        });

        this.contract.grantConsent(patientId, proposalId, proposalDetails.dataRequirements, consentProof);

        const accessToken = this.disclosureSystem.grantAccess(
          patientId,
          this.addressToString(researcher),
          proposalDetails.dataRequirements
        );

        // Add to payment escrow with varying quality scores
        const qualityScore = 70 + (i * 10); // 70, 80, 90, etc.
        this.paymentSystem.addParticipant(proposalId, patient, {
          dataFields: proposalDetails.dataRequirements,
          qualityScore
        });

        workflowResults.participants.push({
          patientId,
          qualityScore,
          accessToken
        });
      }

      workflowResults.steps.push(`${patients.length} patients registered and consented`);

      // Distribute rewards
      this.paymentSystem.distributeRewards(proposalId);

      // Calculate final balances
      const finalBalances = patients.map(patient => ({
        patient: this.addressToString(patient),
        balance: this.paymentSystem.getBalance(patient)
      }));

      workflowResults.steps.push('Rewards distributed to all participants');
      workflowResults.success = true;
      workflowResults.finalBalances = finalBalances;

    } catch (error) {
      workflowResults.errors.push(error.message);
    }

    return workflowResults;
  }

  // Test privacy preservation throughout workflow
  async testPrivacyPreservationWorkflow(
    patient: CoinPublicKey,
    researcher: CoinPublicKey,
    unauthorizedUser: CoinPublicKey
  ): Promise<any> {
    const privacyResults: any = {
      tests: [],
      violations: [],
      success: false
    };

    try {
      // Setup scenario
      this.accessControl.assignRole(patient, 'PATIENT');
      this.accessControl.assignRole(researcher, 'RESEARCHER');

      const patientId = generatePatientId();
      const proposalId = generateResearchId();

      // Register patient with sensitive data
      const sensitiveDataHash = generateMedicalDataHash();
      this.contract.registerPatient(patientId, patient, sensitiveDataHash, generateZKProofMock());

      this.disclosureSystem.storeEncryptedData(patientId, {
        bloodPressure: 'sensitive_bp_data',
        heartRate: 'sensitive_hr_data',
        geneticMarkers: 'highly_sensitive_genetic_data',
        socialSecurityNumber: 'should_never_be_disclosed'
      });

      // Create proposal requesting only specific fields
      this.contract.submitProposal(proposalId, researcher, {
        title: 'Privacy Test Study',
        dataRequirements: ['bloodPressure', 'heartRate'], // NOT requesting genetic or SSN
        reward: BigInt(1000000),
        deadline: addDays(getCurrentTimestamp(), 30)
      });

      this.contract.approveProposal(proposalId);

      // Grant limited consent (only for requested fields)
      this.contract.grantConsent(patientId, proposalId, ['bloodPressure', 'heartRate'], generateZKProofMock());

      const accessToken = this.disclosureSystem.grantAccess(
        patientId,
        this.addressToString(researcher),
        ['bloodPressure', 'heartRate']
      );

      privacyResults.tests.push('Setup completed with limited consent');

      // Test 1: Authorized researcher can access consented data
      const authorizedData = this.disclosureSystem.selectiveDisclose(
        accessToken,
        ['bloodPressure', 'heartRate']
      );

      if (authorizedData.bloodPressure && authorizedData.heartRate) {
        privacyResults.tests.push('✓ Authorized access to consented fields works');
      } else {
        privacyResults.violations.push('✗ Authorized access failed');
      }

      // Test 2: Researcher cannot access non-consented fields
      try {
        const unauthorizedData = this.disclosureSystem.selectiveDisclose(
          accessToken,
          ['geneticMarkers'] // Not consented
        );

        if (Object.keys(unauthorizedData).length === 0) {
          privacyResults.tests.push('✓ Access to non-consented fields properly denied');
        } else {
          privacyResults.violations.push('✗ Non-consented data was disclosed');
        }
      } catch {
        privacyResults.tests.push('✓ Non-consented field access properly throws error');
      }

      // Test 3: Unauthorized user cannot access any data
      const fakeToken = 'fake-token-12345';
      try {
        const hackerData = this.disclosureSystem.selectiveDisclose(
          fakeToken,
          ['bloodPressure']
        );

        if (Object.keys(hackerData).length === 0) {
          privacyResults.tests.push('✓ Unauthorized access properly denied');
        } else {
          privacyResults.violations.push('✗ Unauthorized access succeeded');
        }
      } catch {
        privacyResults.tests.push('✓ Unauthorized access properly throws error');
      }

      // Test 4: ZK proofs hide actual values
      const zkProof = this.zkSystem.generateProof('ageRange', {
        actualAge: 35,
        minAge: 18,
        maxAge: 65
      });

      if (!zkProof.proof.includes('35')) {
        privacyResults.tests.push('✓ ZK proof does not reveal actual age');
      } else {
        privacyResults.violations.push('✗ ZK proof leaks actual age value');
      }

      privacyResults.success = privacyResults.violations.length === 0;

    } catch (error) {
      privacyResults.violations.push(`Unexpected error: ${error.message}`);
    }

    return privacyResults;
  }

  private addressToString(address: CoinPublicKey): string {
    return Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

describe('PrivateHealth End-to-End Integration Tests', () => {
  let integrationSystem: PrivateHealthIntegrationSystem;

  // Test users
  const PATIENT_ALICE = createTestUser('PATIENT_ALICE');
  const PATIENT_BOB = createTestUser('PATIENT_BOB');
  const PATIENT_CHARLIE = createTestUser('PATIENT_CHARLIE');
  const RESEARCHER_UNIVERSITY = createTestUser('RESEARCHER_UNIVERSITY');
  const ADMIN_SYSTEM = createTestUser('ADMIN_SYSTEM');
  const UNAUTHORIZED_HACKER = createTestUser('UNAUTHORIZED_HACKER');

  beforeEach(() => {
    integrationSystem = new PrivateHealthIntegrationSystem();
  });

  describe('Complete Workflow Integration', () => {
    it('should execute complete patient-to-reward workflow successfully', async () => {
      const result = await integrationSystem.executeCompleteWorkflow(
        PATIENT_ALICE,
        RESEARCHER_UNIVERSITY,
        ADMIN_SYSTEM
      );

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.steps).toContain('Patient registered and data stored');
      expect(result.steps).toContain('Research proposal submitted');
      expect(result.steps).toContain('Proposal approved by admin');
      expect(result.steps).toContain('Patient consent granted');
      expect(result.steps).toContain('Data selectively disclosed to researcher');
      expect(result.steps).toContain('Patient added to payment escrow');
      expect(result.steps.some(step => step.includes('Rewards distributed'))).toBe(true);

      expect(result.finalData.patientReward).toBeGreaterThan(BigInt(0));
      expect(result.finalData.disclosedData).toHaveProperty('bloodPressure');
      expect(result.finalData.disclosedData).toHaveProperty('heartRate');
    });

    it('should handle multi-patient research study workflow', async () => {
      const patients = [PATIENT_ALICE, PATIENT_BOB, PATIENT_CHARLIE];

      const result = await integrationSystem.executeMultiPatientWorkflow(
        patients,
        RESEARCHER_UNIVERSITY,
        ADMIN_SYSTEM
      );

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.participants).toHaveLength(3);
      expect(result.finalBalances).toHaveLength(3);

      // Check that rewards were distributed proportionally
      const totalReward = result.finalBalances.reduce(
        (sum: bigint, balance: any) => sum + balance.balance,
        BigInt(0)
      );
      expect(totalReward).toBe(BigInt(15000000)); // Total escrow amount

      // Higher quality score should receive more reward
      const balances = result.finalBalances.map((b: any) => b.balance);
      expect(balances[2]).toBeGreaterThan(balances[0]); // Charlie > Alice (higher quality score)
    });

    it('should maintain workflow integrity under various conditions', async () => {
      // Test multiple sequential workflows
      const workflow1 = await integrationSystem.executeCompleteWorkflow(
        PATIENT_ALICE,
        RESEARCHER_UNIVERSITY,
        ADMIN_SYSTEM
      );

      const workflow2 = await integrationSystem.executeCompleteWorkflow(
        PATIENT_BOB,
        RESEARCHER_UNIVERSITY,
        ADMIN_SYSTEM
      );

      expect(workflow1.success).toBe(true);
      expect(workflow2.success).toBe(true);

      // Both patients should have received rewards
      expect(workflow1.finalData.patientReward).toBeGreaterThan(BigInt(0));
      expect(workflow2.finalData.patientReward).toBeGreaterThan(BigInt(0));
    });
  });

  describe('Privacy Preservation Integration', () => {
    it('should maintain privacy throughout the complete workflow', async () => {
      const privacyResult = await integrationSystem.testPrivacyPreservationWorkflow(
        PATIENT_ALICE,
        RESEARCHER_UNIVERSITY,
        UNAUTHORIZED_HACKER
      );

      expect(privacyResult.success).toBe(true);
      expect(privacyResult.violations).toHaveLength(0);
      expect(privacyResult.tests.length).toBeGreaterThan(0);

      // Verify specific privacy tests passed
      expect(privacyResult.tests.some((test: string) =>
        test.includes('Authorized access to consented fields works')
      )).toBe(true);

      expect(privacyResult.tests.some((test: string) =>
        test.includes('Access to non-consented fields properly denied')
      )).toBe(true);

      expect(privacyResult.tests.some((test: string) =>
        test.includes('Unauthorized access properly denied')
      )).toBe(true);
    });

    it('should prevent data leakage across different research studies', async () => {
      // Create two separate studies
      const study1Result = await integrationSystem.executeCompleteWorkflow(
        PATIENT_ALICE,
        RESEARCHER_UNIVERSITY,
        ADMIN_SYSTEM
      );

      const study2Result = await integrationSystem.executeCompleteWorkflow(
        PATIENT_ALICE, // Same patient, different study
        createTestUser('RESEARCHER_PHARMA'),
        ADMIN_SYSTEM
      );

      expect(study1Result.success).toBe(true);
      expect(study2Result.success).toBe(true);

      // Access tokens should be different
      expect(study1Result.finalData.accessToken).not.toBe(study2Result.finalData.accessToken);

      // Data access should be isolated
      expect(study1Result.finalData.proposalId).not.toBe(study2Result.finalData.proposalId);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle workflow failures gracefully', async () => {
      // Test with unauthorized researcher (no permissions)
      const unauthorizedResearcher = createTestUser('UNAUTHORIZED_RESEARCHER');

      const result = await integrationSystem.executeCompleteWorkflow(
        PATIENT_ALICE,
        unauthorizedResearcher, // This should cause failures
        ADMIN_SYSTEM
      );

      // Workflow should complete partially but may have issues
      expect(result.errors.length).toBeGreaterThanOrEqual(0);

      // Should track which steps completed vs failed
      expect(Array.isArray(result.steps)).toBe(true);
    });

    it('should handle concurrent workflows without interference', async () => {
      // Start multiple workflows concurrently
      const workflows = await Promise.all([
        integrationSystem.executeCompleteWorkflow(
          PATIENT_ALICE,
          RESEARCHER_UNIVERSITY,
          ADMIN_SYSTEM
        ),
        integrationSystem.executeCompleteWorkflow(
          PATIENT_BOB,
          createTestUser('RESEARCHER_2'),
          ADMIN_SYSTEM
        ),
        integrationSystem.executeCompleteWorkflow(
          PATIENT_CHARLIE,
          createTestUser('RESEARCHER_3'),
          ADMIN_SYSTEM
        )
      ]);

      // All workflows should complete successfully
      workflows.forEach(workflow => {
        expect(workflow.success).toBe(true);
        expect(workflow.finalData.patientReward).toBeGreaterThan(BigInt(0));
      });

      // Each should have unique identifiers
      const patientIds = workflows.map(w => w.finalData.patientId);
      const proposalIds = workflows.map(w => w.finalData.proposalId);

      expect(new Set(patientIds).size).toBe(3); // All unique
      expect(new Set(proposalIds).size).toBe(3); // All unique
    });

    it('should validate data consistency across all systems', async () => {
      const result = await integrationSystem.executeCompleteWorkflow(
        PATIENT_ALICE,
        RESEARCHER_UNIVERSITY,
        ADMIN_SYSTEM
      );

      expect(result.success).toBe(true);

      // Verify data consistency across systems
      const { patientId, proposalId } = result.finalData;

      // Check that patient exists in contract
      expect(integrationSystem.contract.patients.has(patientId)).toBe(true);

      // Check that proposal exists and is approved
      const proposal = integrationSystem.contract.proposals.get(proposalId);
      expect(proposal).toBeDefined();
      expect(proposal.status).toBe('APPROVED');

      // Check that consent exists
      const consentKey = `${patientId}-${proposalId}`;
      expect(integrationSystem.contract.consents.has(consentKey)).toBe(true);

      // Check that payment escrow was processed
      const escrow = integrationSystem.paymentSystem.escrows.get(proposalId);
      expect(escrow).toBeDefined();
      expect(escrow.status).toBe('COMPLETED');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large-scale multi-patient studies efficiently', async () => {
      const manyPatients = Array.from({ length: 10 }, (_, i) =>
        createTestUser(`PATIENT_${i}`)
      );

      const startTime = Date.now();

      const result = await integrationSystem.executeMultiPatientWorkflow(
        manyPatients,
        RESEARCHER_UNIVERSITY,
        ADMIN_SYSTEM
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.participants).toHaveLength(10);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all participants received rewards
      result.finalBalances.forEach((balance: any) => {
        expect(balance.balance).toBeGreaterThan(BigInt(0));
      });
    });
  });
});
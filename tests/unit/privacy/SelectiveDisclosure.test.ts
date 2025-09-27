import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateMedicalDataHash,
  generatePatientId,
  generateResearchId,
  createTestUser,
  getCurrentTimestamp
} from '@tests/utils/test-helpers';
import { PRIVACY_TEST_SCENARIOS } from '@tests/fixtures/medical-data';

// Mock Selective Disclosure System
class SelectiveDisclosureSystem {
  private patientData: Map<string, any> = new Map();
  private consentRecords: Map<string, any> = new Map();

  // Register patient data with field-level encryption
  registerPatientData(patientId: string, encryptedData: any, fieldMap: string[]): void {
    if (!patientId || !encryptedData || !fieldMap) {
      throw new Error('SelectiveDisclosure: Invalid registration data');
    }

    this.patientData.set(patientId, {
      encryptedData,
      fieldMap,
      registeredAt: getCurrentTimestamp()
    });
  }

  // Grant selective access to specific fields
  grantSelectiveAccess(
    patientId: string,
    researcherId: string,
    authorizedFields: string[],
    consentProof: any
  ): string {
    if (!this.patientData.has(patientId)) {
      throw new Error('SelectiveDisclosure: Patient data not found');
    }

    const accessToken = this.generateAccessToken(patientId, researcherId, authorizedFields);
    const consentKey = `${patientId}-${researcherId}`;

    this.consentRecords.set(consentKey, {
      patientId,
      researcherId,
      authorizedFields,
      consentProof,
      accessToken,
      grantedAt: getCurrentTimestamp(),
      isActive: true
    });

    return accessToken;
  }

  // Perform selective disclosure based on consent
  performSelectiveDisclosure(
    accessToken: string,
    requestedFields: string[]
  ): any {
    const consent = this.findConsentByToken(accessToken);
    if (!consent) {
      throw new Error('SelectiveDisclosure: Invalid access token');
    }

    if (!consent.isActive) {
      throw new Error('SelectiveDisclosure: Consent revoked');
    }

    const patientData = this.patientData.get(consent.patientId);
    if (!patientData) {
      throw new Error('SelectiveDisclosure: Patient data not found');
    }

    // Check if requested fields are authorized
    const unauthorizedFields = requestedFields.filter(
      field => !consent.authorizedFields.includes(field)
    );

    if (unauthorizedFields.length > 0) {
      throw new Error(`SelectiveDisclosure: Unauthorized fields: ${unauthorizedFields.join(', ')}`);
    }

    // Decrypt and return only authorized fields
    return this.decryptAuthorizedFields(patientData, requestedFields);
  }

  // Revoke selective access
  revokeAccess(patientId: string, researcherId: string): void {
    const consentKey = `${patientId}-${researcherId}`;
    const consent = this.consentRecords.get(consentKey);

    if (!consent) {
      throw new Error('SelectiveDisclosure: Consent record not found');
    }

    consent.isActive = false;
    consent.revokedAt = getCurrentTimestamp();
  }

  // Create anonymized subset for research
  createAnonymizedSubset(
    accessToken: string,
    aggregationLevel: 'individual' | 'grouped' | 'statistical'
  ): any {
    const consent = this.findConsentByToken(accessToken);
    if (!consent) {
      throw new Error('SelectiveDisclosure: Invalid access token');
    }

    const disclosedData = this.performSelectiveDisclosure(
      accessToken,
      consent.authorizedFields
    );

    switch (aggregationLevel) {
      case 'individual':
        return this.anonymizeIndividualData(disclosedData);
      case 'grouped':
        return this.createGroupedData([disclosedData]);
      case 'statistical':
        return this.createStatisticalSummary([disclosedData]);
      default:
        throw new Error('SelectiveDisclosure: Invalid aggregation level');
    }
  }

  // Verify data integrity and consent compliance
  verifyDataIntegrity(accessToken: string, dataHash: string): boolean {
    const consent = this.findConsentByToken(accessToken);
    if (!consent) return false;

    const patientData = this.patientData.get(consent.patientId);
    if (!patientData) return false;

    // Verify the data hash matches the original encrypted data
    const computedHash = this.computeDataHash(patientData.encryptedData);
    return computedHash === dataHash;
  }

  // Private helper methods
  private generateAccessToken(patientId: string, researcherId: string, fields: string[]): string {
    const tokenData = `${patientId}:${researcherId}:${fields.join(',')}:${getCurrentTimestamp()}`;
    return this.hashString(tokenData);
  }

  private findConsentByToken(accessToken: string): any {
    for (const consent of this.consentRecords.values()) {
      if (consent.accessToken === accessToken) {
        return consent;
      }
    }
    return null;
  }

  private decryptAuthorizedFields(patientData: any, requestedFields: string[]): any {
    // Mock decryption - return only requested fields from mock encrypted data
    const mockDecryptedData = {
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 72,
      cholesterolLevel: 180,
      bloodGlucose: 95,
      bodyMassIndex: 23.5,
      medications: ['Lisinopril'],
      allergies: ['Penicillin'],
      privateField: 'should not be accessible'
    };

    const result: any = {};
    for (const field of requestedFields) {
      if (mockDecryptedData.hasOwnProperty(field)) {
        result[field] = mockDecryptedData[field];
      }
    }

    return result;
  }

  private anonymizeIndividualData(data: any): any {
    // Remove or hash identifying information
    const anonymized = { ...data };

    // Add noise to numerical values for privacy
    Object.keys(anonymized).forEach(key => {
      if (typeof anonymized[key] === 'number') {
        const noise = (Math.random() - 0.5) * 0.1; // ±5% noise
        anonymized[key] = Math.round(anonymized[key] * (1 + noise));
      }
    });

    return {
      ...anonymized,
      anonymizedAt: getCurrentTimestamp(),
      privacyLevel: 'individual'
    };
  }

  private createGroupedData(dataArray: any[]): any {
    return {
      groupSize: dataArray.length,
      aggregatedFields: this.aggregateFields(dataArray),
      privacyLevel: 'grouped',
      createdAt: getCurrentTimestamp()
    };
  }

  private createStatisticalSummary(dataArray: any[]): any {
    const summary: any = {
      sampleSize: dataArray.length,
      privacyLevel: 'statistical',
      createdAt: getCurrentTimestamp()
    };

    // Compute statistics for numerical fields
    const numericalFields = ['heartRate', 'cholesterolLevel', 'bloodGlucose', 'bodyMassIndex'];

    numericalFields.forEach(field => {
      const values = dataArray
        .map(data => data[field])
        .filter(val => typeof val === 'number');

      if (values.length > 0) {
        summary[field] = {
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    });

    return summary;
  }

  private aggregateFields(dataArray: any[]): any {
    const aggregated: any = {};

    dataArray.forEach(data => {
      Object.keys(data).forEach(key => {
        if (!aggregated[key]) {
          aggregated[key] = [];
        }
        aggregated[key].push(data[key]);
      });
    });

    return aggregated;
  }

  private computeDataHash(data: any): string {
    return this.hashString(JSON.stringify(data));
  }

  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}

describe('SelectiveDisclosureSystem', () => {
  let disclosureSystem: SelectiveDisclosureSystem;
  const patientId = generatePatientId();
  const researcherId = generateResearchId();

  beforeEach(() => {
    disclosureSystem = new SelectiveDisclosureSystem();
  });

  describe('Patient Data Registration', () => {
    it('should register patient data successfully', () => {
      const encryptedData = { encrypted: 'medical-data' };
      const fieldMap = ['bloodPressure', 'heartRate', 'cholesterolLevel'];

      expect(() => {
        disclosureSystem.registerPatientData(patientId, encryptedData, fieldMap);
      }).not.toThrow();
    });

    it('should reject registration with invalid data', () => {
      expect(() => {
        disclosureSystem.registerPatientData('', null, []);
      }).toThrow('SelectiveDisclosure: Invalid registration data');
    });
  });

  describe('Selective Access Management', () => {
    beforeEach(() => {
      const encryptedData = { encrypted: 'medical-data' };
      const fieldMap = ['bloodPressure', 'heartRate', 'cholesterolLevel', 'medications'];
      disclosureSystem.registerPatientData(patientId, encryptedData, fieldMap);
    });

    it('should grant selective access successfully', () => {
      const authorizedFields = ['bloodPressure', 'heartRate'];
      const consentProof = { valid: true };

      const accessToken = disclosureSystem.grantSelectiveAccess(
        patientId,
        researcherId,
        authorizedFields,
        consentProof
      );

      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(accessToken).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should reject access grant for non-existent patient', () => {
      const nonExistentPatient = 'non-existent-patient';
      const authorizedFields = ['bloodPressure'];
      const consentProof = { valid: true };

      expect(() => {
        disclosureSystem.grantSelectiveAccess(
          nonExistentPatient,
          researcherId,
          authorizedFields,
          consentProof
        );
      }).toThrow('SelectiveDisclosure: Patient data not found');
    });
  });

  describe('Selective Data Disclosure', () => {
    let accessToken: string;

    beforeEach(() => {
      const encryptedData = { encrypted: 'medical-data' };
      const fieldMap = ['bloodPressure', 'heartRate', 'cholesterolLevel', 'medications'];
      disclosureSystem.registerPatientData(patientId, encryptedData, fieldMap);

      const authorizedFields = ['bloodPressure', 'heartRate', 'cholesterolLevel'];
      const consentProof = { valid: true };
      accessToken = disclosureSystem.grantSelectiveAccess(
        patientId,
        researcherId,
        authorizedFields,
        consentProof
      );
    });

    it('should disclose only authorized fields', () => {
      const requestedFields = ['bloodPressure', 'heartRate'];

      const disclosedData = disclosureSystem.performSelectiveDisclosure(
        accessToken,
        requestedFields
      );

      expect(disclosedData).toHaveProperty('bloodPressure');
      expect(disclosedData).toHaveProperty('heartRate');
      expect(disclosedData).not.toHaveProperty('medications'); // Not requested
      expect(disclosedData).not.toHaveProperty('privateField'); // Never authorized
    });

    it('should reject disclosure of unauthorized fields', () => {
      const unauthorizedFields = ['medications']; // Not in authorized list

      expect(() => {
        disclosureSystem.performSelectiveDisclosure(accessToken, unauthorizedFields);
      }).toThrow('SelectiveDisclosure: Unauthorized fields: medications');
    });

    it('should reject disclosure with invalid access token', () => {
      const invalidToken = 'invalid-token';
      const requestedFields = ['bloodPressure'];

      expect(() => {
        disclosureSystem.performSelectiveDisclosure(invalidToken, requestedFields);
      }).toThrow('SelectiveDisclosure: Invalid access token');
    });

    it('should reject disclosure after consent revocation', () => {
      disclosureSystem.revokeAccess(patientId, researcherId);

      expect(() => {
        disclosureSystem.performSelectiveDisclosure(accessToken, ['bloodPressure']);
      }).toThrow('SelectiveDisclosure: Consent revoked');
    });
  });

  describe('Privacy Test Scenarios', () => {
    let accessToken: string;

    beforeEach(() => {
      const encryptedData = { encrypted: 'scenario-data' };
      const fieldMap = Object.keys(PRIVACY_TEST_SCENARIOS[0].patientData);
      disclosureSystem.registerPatientData(patientId, encryptedData, fieldMap);
    });

    it('should handle all privacy test scenarios correctly', () => {
      for (const scenario of PRIVACY_TEST_SCENARIOS) {
        const { name, requestedFields, expectedDisclosure } = scenario;

        // Grant access for all possible fields in the scenario
        const allFields = Object.keys(scenario.patientData);
        const consentProof = { valid: true };

        const token = disclosureSystem.grantSelectiveAccess(
          patientId + name, // Unique patient for each scenario
          researcherId + name,
          requestedFields,
          consentProof
        );

        // Register data for this scenario
        disclosureSystem.registerPatientData(
          patientId + name,
          { encrypted: scenario.patientData },
          allFields
        );

        // Test selective disclosure
        if (Object.keys(expectedDisclosure).length === 0) {
          // Expect no disclosure
          expect(() => {
            disclosureSystem.performSelectiveDisclosure(token, requestedFields);
          }).toThrow();
        } else {
          // Should disclose expected fields
          const disclosed = disclosureSystem.performSelectiveDisclosure(token, requestedFields);

          Object.keys(expectedDisclosure).forEach(field => {
            expect(disclosed).toHaveProperty(field);
          });

          // Should not disclose unauthorized fields
          const unauthorizedFields = allFields.filter(field => !requestedFields.includes(field));
          unauthorizedFields.forEach(field => {
            expect(disclosed).not.toHaveProperty(field);
          });
        }
      }
    });
  });

  describe('Anonymization and Aggregation', () => {
    let accessToken: string;

    beforeEach(() => {
      const encryptedData = { encrypted: 'aggregation-data' };
      const fieldMap = ['heartRate', 'cholesterolLevel', 'bloodGlucose'];
      disclosureSystem.registerPatientData(patientId, encryptedData, fieldMap);

      accessToken = disclosureSystem.grantSelectiveAccess(
        patientId,
        researcherId,
        fieldMap,
        { valid: true }
      );
    });

    it('should create anonymized individual data', () => {
      const anonymized = disclosureSystem.createAnonymizedSubset(
        accessToken,
        'individual'
      );

      expect(anonymized).toHaveProperty('privacyLevel', 'individual');
      expect(anonymized).toHaveProperty('anonymizedAt');
      expect(anonymized).toHaveProperty('heartRate');
      expect(anonymized).toHaveProperty('cholesterolLevel');
    });

    it('should create grouped data', () => {
      const grouped = disclosureSystem.createAnonymizedSubset(
        accessToken,
        'grouped'
      );

      expect(grouped).toHaveProperty('privacyLevel', 'grouped');
      expect(grouped).toHaveProperty('groupSize');
      expect(grouped).toHaveProperty('aggregatedFields');
    });

    it('should create statistical summary', () => {
      const statistical = disclosureSystem.createAnonymizedSubset(
        accessToken,
        'statistical'
      );

      expect(statistical).toHaveProperty('privacyLevel', 'statistical');
      expect(statistical).toHaveProperty('sampleSize');
      expect(statistical).toHaveProperty('heartRate');
      expect(statistical.heartRate).toHaveProperty('mean');
      expect(statistical.heartRate).toHaveProperty('min');
      expect(statistical.heartRate).toHaveProperty('max');
    });

    it('should reject invalid aggregation level', () => {
      expect(() => {
        disclosureSystem.createAnonymizedSubset(accessToken, 'invalid' as any);
      }).toThrow('SelectiveDisclosure: Invalid aggregation level');
    });
  });

  describe('Data Integrity Verification', () => {
    let accessToken: string;
    let dataHash: string;

    beforeEach(() => {
      const encryptedData = { encrypted: 'integrity-test-data' };
      const fieldMap = ['bloodPressure'];
      disclosureSystem.registerPatientData(patientId, encryptedData, fieldMap);

      accessToken = disclosureSystem.grantSelectiveAccess(
        patientId,
        researcherId,
        fieldMap,
        { valid: true }
      );

      // Compute expected data hash
      dataHash = disclosureSystem['computeDataHash'](encryptedData);
    });

    it('should verify data integrity successfully', () => {
      const isValid = disclosureSystem.verifyDataIntegrity(accessToken, dataHash);
      expect(isValid).toBe(true);
    });

    it('should reject verification with wrong data hash', () => {
      const wrongHash = generateMedicalDataHash();
      const isValid = disclosureSystem.verifyDataIntegrity(accessToken, wrongHash);
      expect(isValid).toBe(false);
    });

    it('should reject verification with invalid access token', () => {
      const invalidToken = 'invalid-token';
      const isValid = disclosureSystem.verifyDataIntegrity(invalidToken, dataHash);
      expect(isValid).toBe(false);
    });
  });

  describe('Access Revocation', () => {
    let accessToken: string;

    beforeEach(() => {
      const encryptedData = { encrypted: 'revocation-test' };
      const fieldMap = ['bloodPressure', 'heartRate'];
      disclosureSystem.registerPatientData(patientId, encryptedData, fieldMap);

      accessToken = disclosureSystem.grantSelectiveAccess(
        patientId,
        researcherId,
        fieldMap,
        { valid: true }
      );
    });

    it('should revoke access successfully', () => {
      expect(() => {
        disclosureSystem.revokeAccess(patientId, researcherId);
      }).not.toThrow();

      // Subsequent disclosure should fail
      expect(() => {
        disclosureSystem.performSelectiveDisclosure(accessToken, ['bloodPressure']);
      }).toThrow('SelectiveDisclosure: Consent revoked');
    });

    it('should reject revocation for non-existent consent', () => {
      expect(() => {
        disclosureSystem.revokeAccess('non-existent', 'non-existent');
      }).toThrow('SelectiveDisclosure: Consent record not found');
    });
  });
});
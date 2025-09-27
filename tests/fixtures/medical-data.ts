import { MockPatient, MockResearchProposal, MockConsent, createTestUser, generateMedicalDataHash, generatePatientId, generateResearchId, getCurrentTimestamp, addDays } from '../utils/test-helpers';

// Sample medical data types
export const MEDICAL_DATA_TYPES = [
  'bloodPressure',
  'heartRate',
  'cholesterolLevel',
  'bloodGlucose',
  'bodyMassIndex',
  'allergies',
  'medications',
  'surgicalHistory',
  'familyHistory',
  'geneticMarkers'
];

// Generate test patients
export function createTestPatients(): MockPatient[] {
  return [
    {
      id: generatePatientId(),
      address: createTestUser('PATIENT_ALICE'),
      dataHash: generateMedicalDataHash(),
      consentTimestamp: getCurrentTimestamp(),
      isActive: true
    },
    {
      id: generatePatientId(),
      address: createTestUser('PATIENT_BOB'),
      dataHash: generateMedicalDataHash(),
      consentTimestamp: getCurrentTimestamp(),
      isActive: true
    },
    {
      id: generatePatientId(),
      address: createTestUser('PATIENT_CHARLIE'),
      dataHash: generateMedicalDataHash(),
      consentTimestamp: getCurrentTimestamp(),
      isActive: false
    }
  ];
}

// Generate test research proposals
export function createTestResearchProposals(): MockResearchProposal[] {
  const currentTime = getCurrentTimestamp();

  return [
    {
      id: generateResearchId(),
      researcher: createTestUser('RESEARCHER_UNIVERSITY_A'),
      title: 'Cardiovascular Risk Factors Study',
      description: 'Analysis of blood pressure and cholesterol correlation',
      dataRequirements: ['bloodPressure', 'cholesterolLevel', 'bodyMassIndex'],
      reward: BigInt(1000000), // 1M units
      deadline: addDays(currentTime, 30),
      isApproved: true
    },
    {
      id: generateResearchId(),
      researcher: createTestUser('RESEARCHER_PHARMA_B'),
      title: 'Diabetes Medication Efficacy',
      description: 'Long-term effects of diabetes medications',
      dataRequirements: ['bloodGlucose', 'medications', 'familyHistory'],
      reward: BigInt(2000000), // 2M units
      deadline: addDays(currentTime, 60),
      isApproved: true
    },
    {
      id: generateResearchId(),
      researcher: createTestUser('RESEARCHER_HOSPITAL_C'),
      title: 'Genetic Predisposition Analysis',
      description: 'Study of genetic markers in disease susceptibility',
      dataRequirements: ['geneticMarkers', 'familyHistory', 'surgicalHistory'],
      reward: BigInt(5000000), // 5M units
      deadline: addDays(currentTime, 90),
      isApproved: false // Pending approval
    }
  ];
}

// Generate test consent records
export function createTestConsents(): MockConsent[] {
  const patients = createTestPatients();
  const proposals = createTestResearchProposals();
  const currentTime = getCurrentTimestamp();

  return [
    {
      patientId: patients[0].id,
      researchId: proposals[0].id,
      dataFields: ['bloodPressure', 'cholesterolLevel'],
      consentHash: generateMedicalDataHash(),
      timestamp: currentTime,
      isActive: true
    },
    {
      patientId: patients[1].id,
      researchId: proposals[0].id,
      dataFields: ['bloodPressure', 'bodyMassIndex'],
      consentHash: generateMedicalDataHash(),
      timestamp: currentTime,
      isActive: true
    },
    {
      patientId: patients[0].id,
      researchId: proposals[1].id,
      dataFields: ['bloodGlucose', 'medications'],
      consentHash: generateMedicalDataHash(),
      timestamp: currentTime,
      isActive: false // Consent withdrawn
    }
  ];
}

// Privacy-focused test data
export const PRIVACY_TEST_SCENARIOS = [
  {
    name: 'Selective Blood Pressure Disclosure',
    patientData: {
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 72,
      cholesterolLevel: 180,
      privateField: 'shouldNotBeShared'
    },
    requestedFields: ['bloodPressure'],
    expectedDisclosure: {
      bloodPressure: { systolic: 120, diastolic: 80 }
    }
  },
  {
    name: 'Multiple Field Disclosure',
    patientData: {
      bloodPressure: { systolic: 140, diastolic: 90 },
      heartRate: 85,
      cholesterolLevel: 220,
      medications: ['Lisinopril', 'Atorvastatin'],
      privateNotes: 'confidential'
    },
    requestedFields: ['bloodPressure', 'medications'],
    expectedDisclosure: {
      bloodPressure: { systolic: 140, diastolic: 90 },
      medications: ['Lisinopril', 'Atorvastatin']
    }
  },
  {
    name: 'No Data Disclosure for Unauthorized Fields',
    patientData: {
      geneticMarkers: ['BRCA1', 'APOE4'],
      familyHistory: 'diabetes, heart disease',
      sensitiveDiagnosis: 'highly confidential'
    },
    requestedFields: ['bloodPressure'], // Not consented
    expectedDisclosure: {} // Empty result
  }
];

// ZK Proof test vectors
export const ZK_PROOF_TEST_VECTORS = [
  {
    description: 'Valid age range proof (18-65)',
    publicInputs: {
      ageCommitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      minAge: 18,
      maxAge: 65
    },
    privateInputs: {
      actualAge: 35,
      randomness: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef'
    },
    expectedValid: true
  },
  {
    description: 'Invalid age range proof (under 18)',
    publicInputs: {
      ageCommitment: '0x2345678901bcdef02345678901bcdef02345678901bcdef02345678901bcdef0',
      minAge: 18,
      maxAge: 65
    },
    privateInputs: {
      actualAge: 16,
      randomness: '0xbcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef0'
    },
    expectedValid: false
  },
  {
    description: 'Valid cholesterol range proof',
    publicInputs: {
      cholesterolCommitment: '0x3456789012cdef013456789012cdef013456789012cdef013456789012cdef01',
      minLevel: 100,
      maxLevel: 300
    },
    privateInputs: {
      actualLevel: 200,
      randomness: '0xcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef01'
    },
    expectedValid: true
  }
];
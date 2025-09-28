# PrivateHealth DApp Test Suite

This comprehensive test suite ensures the security, privacy, and functionality of the PrivateHealth decentralized application built on the Midnight protocol.

## 📋 Test Overview

### Test Categories

#### 🔒 **Unit Tests** (`/tests/unit/`)
- **Smart Contracts** - Core contract functionality
- **Privacy Systems** - ZK proofs and selective disclosure
- **Access Control** - Role-based permissions and authorization
- **Payment System** - Rewards and escrow management
- **Frontend Components** - React components and user interfaces

#### 🔗 **Integration Tests** (`/tests/integration/`)
- **End-to-End Workflows** - Complete user journeys
- **Multi-System Integration** - Contract-privacy-payment coordination
- **Cross-Component Communication** - Data flow validation

#### 🛡️ **Security Tests** (`/tests/unit/security/`)
- **Vulnerability Assessment** - SQL injection, XSS, access control bypass
- **Privacy Validation** - Data leakage prevention
- **Cryptographic Security** - ZK proof validation
- **Input Validation** - Malicious input handling

### Test Statistics

- **Total Test Files**: 12
- **Test Categories**: 5
- **Security Tests**: 50+
- **Privacy Tests**: 30+
- **Integration Scenarios**: 15+
- **Frontend Component Tests**: 25+

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure you have the following installed:
# - Node.js 18+
# - pnpm or npm
# - Vitest testing framework
```

### Installation
```bash
cd /privatehealth-dapp/tests
npm install
```

### Running Tests

#### Run All Tests
```bash
npm test
```

#### Run Specific Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Security tests only
npm run test:security

# Frontend tests only
npm run test:frontend

# Privacy tests only
npm run test:privacy
```

#### Watch Mode
```bash
npm run test:watch
```

#### Coverage Report
```bash
npm run test:coverage
```

#### UI Test Runner
```bash
npm run test:ui
```

## 📁 Test Structure

```
tests/
├── unit/
│   ├── contracts/
│   │   ├── PrivateHealthContract.test.ts
│   │   ├── AccessControl.test.ts
│   │   └── PaymentRewards.test.ts
│   ├── privacy/
│   │   ├── ZKProofSystem.test.ts
│   │   └── SelectiveDisclosure.test.ts
│   ├── frontend/
│   │   └── PatientDashboard.test.tsx
│   └── security/
│       └── SecurityAudit.test.ts
├── integration/
│   └── EndToEndWorkflow.test.ts
├── fixtures/
│   └── medical-data.ts
├── utils/
│   └── test-helpers.ts
├── __mocks__/
├── coverage/
├── vitest.config.ts
├── setup.ts
└── package.json
```

## 🧪 Test Details

### Smart Contract Tests

#### PrivateHealthContract.test.ts
```typescript
// Tests core contract functionality
- Patient registration and data management
- Research proposal submission and approval
- Consent management and revocation
- Error handling and edge cases
- Uninitialized contract protection
```

#### AccessControl.test.ts
```typescript
// Tests role-based access control
- Role assignment and revocation
- Permission validation
- Temporary permissions
- Patient data access authorization
- Research proposal authorization
- Access logging and auditing
```

#### PaymentRewards.test.ts
```typescript
// Tests payment and reward system
- Balance management and transfers
- Research escrow creation and management
- Participant addition and reward calculation
- Escrow refunds and edge cases
- Bonus reward pools
- Payment history tracking
```

### Privacy Tests

#### ZKProofSystem.test.ts
```typescript
// Tests zero-knowledge proof system
- Age range proofs without revealing actual age
- Medical value range proofs
- Consent proofs
- Data integrity proofs
- Batch verification
- Proof validation edge cases
- Test vector validation
```

#### SelectiveDisclosure.test.ts
```typescript
// Tests selective data disclosure
- Patient data registration and encryption
- Selective access management
- Field-level data disclosure
- Access revocation
- Anonymization and aggregation
- Data integrity verification
- Privacy test scenarios
```

### Security Tests

#### SecurityAudit.test.ts
```typescript
// Comprehensive security testing
- SQL injection vulnerability testing
- Cross-site scripting (XSS) protection
- Access control bypass attempts
- Data exposure in errors and logs
- Cryptographic security validation
- Input validation testing
- Rate limiting and DoS protection
- Privacy preservation validation
```

### Integration Tests

#### EndToEndWorkflow.test.ts
```typescript
// Complete workflow testing
- Patient registration to reward distribution
- Multi-patient research studies
- Privacy preservation throughout workflow
- Error handling and edge cases
- Concurrent workflow handling
- Data consistency validation
- Performance and scalability testing
```

### Frontend Tests

#### PatientDashboard.test.tsx
```typescript
// React component testing
- Patient information display
- Medical data management
- Research proposal interaction
- Consent granting and revocation
- Wallet connection flow
- Reward display
- Error state handling
```

## 🔧 Test Configuration

### Vitest Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### Test Setup
- **Global Mocks**: Web3 provider, crypto API
- **Test Utilities**: Address generators, hash generators, ZK proof mocks
- **Fixtures**: Medical data samples, privacy test scenarios
- **Cleanup**: Automatic test cleanup between runs

## 📊 Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Critical Path Coverage
- All smart contract functions: 100%
- Privacy mechanisms: 95%
- Access control logic: 95%
- Payment calculations: 90%

## 🛡️ Security Test Categories

### 1. Input Validation
- SQL injection attempts
- XSS payload testing
- Buffer overflow attempts
- Type confusion attacks
- Malformed data handling

### 2. Access Control
- Unauthorized access attempts
- Privilege escalation testing
- Role bypass attempts
- Token manipulation
- Session hijacking simulation

### 3. Privacy Protection
- Data leakage detection
- ZK proof validation
- Anonymization verification
- Consent enforcement
- Selective disclosure accuracy

### 4. Cryptographic Security
- Weak proof rejection
- Hash collision resistance
- Key management validation
- Random number generation
- Encryption strength verification

## 🎯 Privacy Test Scenarios

### Test Scenarios Included
1. **Selective Blood Pressure Disclosure**
   - Request specific medical fields
   - Verify only authorized data disclosed
   - Confirm unauthorized fields hidden

2. **Multiple Field Disclosure**
   - Complex consent scenarios
   - Partial data sharing
   - Field-level permissions

3. **Unauthorized Access Prevention**
   - No consent scenarios
   - Expired consent handling
   - Revoked access validation

4. **ZK Proof Privacy**
   - Age range proofs without revealing age
   - Medical threshold proofs
   - Statistical validation without raw data

## 📈 Performance Testing

### Benchmarks
- **Single Patient Workflow**: < 100ms
- **Multi-Patient Study (10 patients)**: < 5 seconds
- **ZK Proof Generation**: < 200ms
- **Selective Disclosure**: < 50ms
- **Access Control Check**: < 10ms

### Scalability Tests
- 100+ concurrent patient registrations
- Large-scale research studies
- High-frequency data access requests
- Bulk reward distributions

## 🔍 Debugging Tests

### Test Debugging
```bash
# Run specific test file
npx vitest run tests/unit/contracts/PrivateHealthContract.test.ts

# Run with debugging
npx vitest run --reporter=verbose

# Run single test
npx vitest run -t "should register patient successfully"
```

### Common Issues
1. **Mock Setup**: Ensure all required mocks are properly configured
2. **Async Handling**: Use proper await/async patterns
3. **State Cleanup**: Tests should be isolated and not affect each other
4. **Type Issues**: Ensure TypeScript types are correctly defined

## 📝 Adding New Tests

### Test File Template
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { testHelpers } from '@tests/utils/test-helpers';

describe('YourComponent', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Feature Category', () => {
    it('should behave correctly under normal conditions', () => {
      // Test implementation
      expect(result).toBe(expected);
    });

    it('should handle edge cases properly', () => {
      // Edge case testing
    });

    it('should validate security constraints', () => {
      // Security testing
    });
  });
});
```

### Best Practices
1. **Descriptive Names**: Test names should clearly describe what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and validation
3. **Edge Cases**: Always test boundary conditions and error scenarios
4. **Security Focus**: Include security and privacy validation in all tests
5. **Isolation**: Each test should be independent and not rely on other tests

## 🚨 Security Validation

### Critical Security Checks
- ✅ SQL injection protection
- ✅ XSS prevention
- ✅ Access control enforcement
- ✅ Data encryption validation
- ✅ ZK proof verification
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ Privacy preservation
- ✅ Audit trail integrity
- ✅ Error message security

### Privacy Guarantees Tested
- ✅ No raw medical data exposure
- ✅ Selective field disclosure only
- ✅ ZK proofs hide private values
- ✅ Consent enforcement
- ✅ Access revocation effectiveness
- ✅ Anonymization accuracy
- ✅ Statistical aggregation privacy

## 📞 Support

### Getting Help
- **Documentation**: See inline code comments and test descriptions
- **Issues**: Check common debugging section above
- **Contributing**: Follow the test file template for new tests

### Test Data
- All test data is synthetic and safe for testing
- No real medical information is used
- Privacy-preserving test scenarios included
- Comprehensive edge case coverage

---

**Note**: This test suite is designed specifically for the PrivateHealth DApp on Midnight protocol. All tests validate both functionality and privacy preservation according to healthcare data protection requirements.
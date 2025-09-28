import { describe, it, expect, beforeEach } from 'vitest';
import { CoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import {
  createTestUser,
  getCurrentTimestamp,
  addDays,
  generateMedicalDataHash,
  generatePatientId,
  generateResearchId
} from '@tests/utils/test-helpers';

// Access Control Roles
enum Role {
  PATIENT = 'PATIENT',
  RESEARCHER = 'RESEARCHER',
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

// Permission Types
enum Permission {
  READ_PATIENT_DATA = 'READ_PATIENT_DATA',
  WRITE_PATIENT_DATA = 'WRITE_PATIENT_DATA',
  SUBMIT_RESEARCH_PROPOSAL = 'SUBMIT_RESEARCH_PROPOSAL',
  APPROVE_RESEARCH_PROPOSAL = 'APPROVE_RESEARCH_PROPOSAL',
  ACCESS_AGGREGATED_DATA = 'ACCESS_AGGREGATED_DATA',
  AUDIT_SYSTEM = 'AUDIT_SYSTEM',
  MANAGE_USERS = 'MANAGE_USERS',
  DISTRIBUTE_REWARDS = 'DISTRIBUTE_REWARDS'
}

// Mock Access Control System
class AccessControlSystem {
  private userRoles: Map<string, Role[]> = new Map();
  private rolePermissions: Map<Role, Permission[]> = new Map();
  private temporaryPermissions: Map<string, any> = new Map();
  private accessLog: any[] = [];

  constructor() {
    this.initializeRolePermissions();
  }

  // Initialize default role-permission mappings
  private initializeRolePermissions(): void {
    this.rolePermissions.set(Role.PATIENT, [
      Permission.READ_PATIENT_DATA,
      Permission.WRITE_PATIENT_DATA
    ]);

    this.rolePermissions.set(Role.RESEARCHER, [
      Permission.SUBMIT_RESEARCH_PROPOSAL,
      Permission.ACCESS_AGGREGATED_DATA
    ]);

    this.rolePermissions.set(Role.ADMIN, [
      Permission.APPROVE_RESEARCH_PROPOSAL,
      Permission.MANAGE_USERS,
      Permission.DISTRIBUTE_REWARDS,
      Permission.AUDIT_SYSTEM
    ]);

    this.rolePermissions.set(Role.AUDITOR, [
      Permission.AUDIT_SYSTEM,
      Permission.ACCESS_AGGREGATED_DATA
    ]);
  }

  // Assign role to user
  assignRole(userAddress: CoinPublicKey, role: Role, assignedBy: CoinPublicKey): void {
    const userKey = this.addressToString(userAddress);
    const assignerKey = this.addressToString(assignedBy);

    // Check if assigner has permission to manage users
    if (!this.hasPermission(assignedBy, Permission.MANAGE_USERS)) {
      throw new Error('AccessControl: Unauthorized role assignment');
    }

    if (!this.userRoles.has(userKey)) {
      this.userRoles.set(userKey, []);
    }

    const userRoles = this.userRoles.get(userKey)!;
    if (!userRoles.includes(role)) {
      userRoles.push(role);
    }

    this.logAccess(assignerKey, `ASSIGN_ROLE:${role}`, userKey, true);
  }

  // Remove role from user
  revokeRole(userAddress: CoinPublicKey, role: Role, revokedBy: CoinPublicKey): void {
    const userKey = this.addressToString(userAddress);
    const revokerKey = this.addressToString(revokedBy);

    if (!this.hasPermission(revokedBy, Permission.MANAGE_USERS)) {
      throw new Error('AccessControl: Unauthorized role revocation');
    }

    const userRoles = this.userRoles.get(userKey);
    if (userRoles) {
      const roleIndex = userRoles.indexOf(role);
      if (roleIndex > -1) {
        userRoles.splice(roleIndex, 1);
      }
    }

    this.logAccess(revokerKey, `REVOKE_ROLE:${role}`, userKey, true);
  }

  // Check if user has specific permission
  hasPermission(userAddress: CoinPublicKey, permission: Permission): boolean {
    const userKey = this.addressToString(userAddress);
    const userRoles = this.userRoles.get(userKey) || [];

    // Check role-based permissions
    for (const role of userRoles) {
      const rolePermissions = this.rolePermissions.get(role) || [];
      if (rolePermissions.includes(permission)) {
        return true;
      }
    }

    // Check temporary permissions
    const tempPermKey = `${userKey}:${permission}`;
    const tempPerm = this.temporaryPermissions.get(tempPermKey);
    if (tempPerm && tempPerm.expiresAt > getCurrentTimestamp()) {
      return true;
    }

    return false;
  }

  // Grant temporary permission
  grantTemporaryPermission(
    userAddress: CoinPublicKey,
    permission: Permission,
    expiresAt: bigint,
    grantedBy: CoinPublicKey
  ): void {
    const userKey = this.addressToString(userAddress);
    const granterKey = this.addressToString(grantedBy);

    if (!this.hasPermission(grantedBy, Permission.MANAGE_USERS)) {
      throw new Error('AccessControl: Unauthorized temporary permission grant');
    }

    const tempPermKey = `${userKey}:${permission}`;
    this.temporaryPermissions.set(tempPermKey, {
      userAddress,
      permission,
      expiresAt,
      grantedBy: granterKey,
      grantedAt: getCurrentTimestamp()
    });

    this.logAccess(granterKey, `GRANT_TEMP_PERM:${permission}`, userKey, true);
  }

  // Revoke temporary permission
  revokeTemporaryPermission(
    userAddress: CoinPublicKey,
    permission: Permission,
    revokedBy: CoinPublicKey
  ): void {
    const userKey = this.addressToString(userAddress);
    const revokerKey = this.addressToString(revokedBy);

    if (!this.hasPermission(revokedBy, Permission.MANAGE_USERS)) {
      throw new Error('AccessControl: Unauthorized temporary permission revocation');
    }

    const tempPermKey = `${userKey}:${permission}`;
    this.temporaryPermissions.delete(tempPermKey);

    this.logAccess(revokerKey, `REVOKE_TEMP_PERM:${permission}`, userKey, true);
  }

  // Check patient data access authorization
  authorizePatientDataAccess(
    patientAddress: CoinPublicKey,
    requesterAddress: CoinPublicKey,
    dataFields: string[],
    consentHash: string
  ): boolean {
    const patientKey = this.addressToString(patientAddress);
    const requesterKey = this.addressToString(requesterAddress);

    // Patient can always access their own data
    if (this.addressEquals(patientAddress, requesterAddress)) {
      this.logAccess(requesterKey, 'ACCESS_OWN_DATA', patientKey, true);
      return true;
    }

    // Researcher needs specific consent for patient data
    if (this.hasPermission(requesterAddress, Permission.ACCESS_AGGREGATED_DATA)) {
      // Verify consent hash (mock implementation)
      const isConsentValid = this.verifyConsent(patientKey, requesterKey, dataFields, consentHash);
      this.logAccess(requesterKey, `ACCESS_PATIENT_DATA:${dataFields.join(',')}`, patientKey, isConsentValid);
      return isConsentValid;
    }

    // Admin and auditors can access anonymized data only
    if (this.hasPermission(requesterAddress, Permission.AUDIT_SYSTEM)) {
      this.logAccess(requesterKey, 'ACCESS_ANONYMIZED_DATA', patientKey, true);
      return true;
    }

    this.logAccess(requesterKey, 'ACCESS_PATIENT_DATA', patientKey, false);
    return false;
  }

  // Authorize research proposal operations
  authorizeResearchProposal(
    requesterAddress: CoinPublicKey,
    operation: 'SUBMIT' | 'APPROVE' | 'REJECT',
    proposalId: string
  ): boolean {
    const requesterKey = this.addressToString(requesterAddress);

    switch (operation) {
      case 'SUBMIT':
        const canSubmit = this.hasPermission(requesterAddress, Permission.SUBMIT_RESEARCH_PROPOSAL);
        this.logAccess(requesterKey, `SUBMIT_PROPOSAL:${proposalId}`, '', canSubmit);
        return canSubmit;

      case 'APPROVE':
      case 'REJECT':
        const canApprove = this.hasPermission(requesterAddress, Permission.APPROVE_RESEARCH_PROPOSAL);
        this.logAccess(requesterKey, `${operation}_PROPOSAL:${proposalId}`, '', canApprove);
        return canApprove;

      default:
        return false;
    }
  }

  // Get user roles
  getUserRoles(userAddress: CoinPublicKey): Role[] {
    const userKey = this.addressToString(userAddress);
    return this.userRoles.get(userKey) || [];
  }

  // Get access log for auditing
  getAccessLog(fromTimestamp?: bigint, toTimestamp?: bigint): any[] {
    let filteredLog = this.accessLog;

    if (fromTimestamp) {
      filteredLog = filteredLog.filter(entry => entry.timestamp >= fromTimestamp);
    }

    if (toTimestamp) {
      filteredLog = filteredLog.filter(entry => entry.timestamp <= toTimestamp);
    }

    return filteredLog;
  }

  // Clear expired temporary permissions
  cleanupExpiredPermissions(): number {
    const currentTime = getCurrentTimestamp();
    let removedCount = 0;

    for (const [key, permission] of this.temporaryPermissions.entries()) {
      if (permission.expiresAt <= currentTime) {
        this.temporaryPermissions.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  // Private helper methods
  private addressToString(address: CoinPublicKey): string {
    return Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private addressEquals(addr1: CoinPublicKey, addr2: CoinPublicKey): boolean {
    return addr1.length === addr2.length &&
           addr1.every((byte, index) => byte === addr2[index]);
  }

  private verifyConsent(
    patientKey: string,
    requesterKey: string,
    dataFields: string[],
    consentHash: string
  ): boolean {
    // Mock consent verification
    return consentHash.length > 0 && dataFields.length > 0;
  }

  private logAccess(
    requester: string,
    action: string,
    target: string,
    success: boolean
  ): void {
    this.accessLog.push({
      timestamp: getCurrentTimestamp(),
      requester,
      action,
      target,
      success
    });
  }
}

describe('AccessControlSystem', () => {
  let accessControl: AccessControlSystem;

  // Test users
  const ADMIN_USER = createTestUser('ADMIN');
  const PATIENT_USER = createTestUser('PATIENT');
  const RESEARCHER_USER = createTestUser('RESEARCHER');
  const AUDITOR_USER = createTestUser('AUDITOR');
  const UNAUTHORIZED_USER = createTestUser('UNAUTHORIZED');

  beforeEach(() => {
    accessControl = new AccessControlSystem();

    // Assign initial roles
    accessControl.assignRole(ADMIN_USER, Role.ADMIN, ADMIN_USER);
    accessControl.assignRole(PATIENT_USER, Role.PATIENT, ADMIN_USER);
    accessControl.assignRole(RESEARCHER_USER, Role.RESEARCHER, ADMIN_USER);
    accessControl.assignRole(AUDITOR_USER, Role.AUDITOR, ADMIN_USER);
  });

  describe('Role Management', () => {
    it('should assign roles successfully', () => {
      const newUser = createTestUser('NEW_USER');

      accessControl.assignRole(newUser, Role.RESEARCHER, ADMIN_USER);

      const roles = accessControl.getUserRoles(newUser);
      expect(roles).toContain(Role.RESEARCHER);
    });

    it('should reject role assignment by unauthorized user', () => {
      const newUser = createTestUser('NEW_USER');

      expect(() => {
        accessControl.assignRole(newUser, Role.ADMIN, UNAUTHORIZED_USER);
      }).toThrow('AccessControl: Unauthorized role assignment');
    });

    it('should revoke roles successfully', () => {
      accessControl.revokeRole(RESEARCHER_USER, Role.RESEARCHER, ADMIN_USER);

      const roles = accessControl.getUserRoles(RESEARCHER_USER);
      expect(roles).not.toContain(Role.RESEARCHER);
    });

    it('should reject role revocation by unauthorized user', () => {
      expect(() => {
        accessControl.revokeRole(RESEARCHER_USER, Role.RESEARCHER, UNAUTHORIZED_USER);
      }).toThrow('AccessControl: Unauthorized role revocation');
    });

    it('should allow multiple roles per user', () => {
      accessControl.assignRole(RESEARCHER_USER, Role.AUDITOR, ADMIN_USER);

      const roles = accessControl.getUserRoles(RESEARCHER_USER);
      expect(roles).toContain(Role.RESEARCHER);
      expect(roles).toContain(Role.AUDITOR);
    });
  });

  describe('Permission Checking', () => {
    it('should grant permissions based on roles', () => {
      expect(accessControl.hasPermission(PATIENT_USER, Permission.READ_PATIENT_DATA)).toBe(true);
      expect(accessControl.hasPermission(PATIENT_USER, Permission.WRITE_PATIENT_DATA)).toBe(true);
      expect(accessControl.hasPermission(PATIENT_USER, Permission.SUBMIT_RESEARCH_PROPOSAL)).toBe(false);

      expect(accessControl.hasPermission(RESEARCHER_USER, Permission.SUBMIT_RESEARCH_PROPOSAL)).toBe(true);
      expect(accessControl.hasPermission(RESEARCHER_USER, Permission.ACCESS_AGGREGATED_DATA)).toBe(true);
      expect(accessControl.hasPermission(RESEARCHER_USER, Permission.APPROVE_RESEARCH_PROPOSAL)).toBe(false);

      expect(accessControl.hasPermission(ADMIN_USER, Permission.MANAGE_USERS)).toBe(true);
      expect(accessControl.hasPermission(ADMIN_USER, Permission.APPROVE_RESEARCH_PROPOSAL)).toBe(true);
      expect(accessControl.hasPermission(ADMIN_USER, Permission.DISTRIBUTE_REWARDS)).toBe(true);
    });

    it('should deny permissions for unauthorized users', () => {
      expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.READ_PATIENT_DATA)).toBe(false);
      expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.SUBMIT_RESEARCH_PROPOSAL)).toBe(false);
      expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.MANAGE_USERS)).toBe(false);
    });
  });

  describe('Temporary Permissions', () => {
    it('should grant temporary permissions', () => {
      const expiresAt = addDays(getCurrentTimestamp(), 1); // 1 day from now

      accessControl.grantTemporaryPermission(
        UNAUTHORIZED_USER,
        Permission.ACCESS_AGGREGATED_DATA,
        expiresAt,
        ADMIN_USER
      );

      expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.ACCESS_AGGREGATED_DATA)).toBe(true);
    });

    it('should reject temporary permission grant by unauthorized user', () => {
      const expiresAt = addDays(getCurrentTimestamp(), 1);

      expect(() => {
        accessControl.grantTemporaryPermission(
          UNAUTHORIZED_USER,
          Permission.ACCESS_AGGREGATED_DATA,
          expiresAt,
          RESEARCHER_USER // Researcher cannot manage users
        );
      }).toThrow('AccessControl: Unauthorized temporary permission grant');
    });

    it('should revoke temporary permissions', () => {
      const expiresAt = addDays(getCurrentTimestamp(), 1);

      accessControl.grantTemporaryPermission(
        UNAUTHORIZED_USER,
        Permission.ACCESS_AGGREGATED_DATA,
        expiresAt,
        ADMIN_USER
      );

      expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.ACCESS_AGGREGATED_DATA)).toBe(true);

      accessControl.revokeTemporaryPermission(
        UNAUTHORIZED_USER,
        Permission.ACCESS_AGGREGATED_DATA,
        ADMIN_USER
      );

      expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.ACCESS_AGGREGATED_DATA)).toBe(false);
    });

    it('should cleanup expired temporary permissions', () => {
      const pastTime = getCurrentTimestamp() - BigInt(86400); // Yesterday

      accessControl.grantTemporaryPermission(
        UNAUTHORIZED_USER,
        Permission.ACCESS_AGGREGATED_DATA,
        pastTime,
        ADMIN_USER
      );

      const removedCount = accessControl.cleanupExpiredPermissions();

      expect(removedCount).toBe(1);
      expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.ACCESS_AGGREGATED_DATA)).toBe(false);
    });
  });

  describe('Patient Data Access Authorization', () => {
    it('should allow patients to access their own data', () => {
      const authorized = accessControl.authorizePatientDataAccess(
        PATIENT_USER,
        PATIENT_USER,
        ['bloodPressure', 'heartRate'],
        ''
      );

      expect(authorized).toBe(true);
    });

    it('should allow researchers to access data with valid consent', () => {
      const consentHash = generateMedicalDataHash();

      const authorized = accessControl.authorizePatientDataAccess(
        PATIENT_USER,
        RESEARCHER_USER,
        ['bloodPressure'],
        consentHash
      );

      expect(authorized).toBe(true);
    });

    it('should deny researchers access without consent', () => {
      const authorized = accessControl.authorizePatientDataAccess(
        PATIENT_USER,
        RESEARCHER_USER,
        ['bloodPressure'],
        '' // No consent hash
      );

      expect(authorized).toBe(false);
    });

    it('should allow auditors to access anonymized data', () => {
      const authorized = accessControl.authorizePatientDataAccess(
        PATIENT_USER,
        AUDITOR_USER,
        ['bloodPressure'],
        ''
      );

      expect(authorized).toBe(true);
    });

    it('should deny unauthorized users access to patient data', () => {
      const authorized = accessControl.authorizePatientDataAccess(
        PATIENT_USER,
        UNAUTHORIZED_USER,
        ['bloodPressure'],
        generateMedicalDataHash()
      );

      expect(authorized).toBe(false);
    });
  });

  describe('Research Proposal Authorization', () => {
    const proposalId = generateResearchId();

    it('should allow researchers to submit proposals', () => {
      const authorized = accessControl.authorizeResearchProposal(
        RESEARCHER_USER,
        'SUBMIT',
        proposalId
      );

      expect(authorized).toBe(true);
    });

    it('should allow admins to approve/reject proposals', () => {
      const authorizedApprove = accessControl.authorizeResearchProposal(
        ADMIN_USER,
        'APPROVE',
        proposalId
      );

      const authorizedReject = accessControl.authorizeResearchProposal(
        ADMIN_USER,
        'REJECT',
        proposalId
      );

      expect(authorizedApprove).toBe(true);
      expect(authorizedReject).toBe(true);
    });

    it('should deny researchers from approving proposals', () => {
      const authorized = accessControl.authorizeResearchProposal(
        RESEARCHER_USER,
        'APPROVE',
        proposalId
      );

      expect(authorized).toBe(false);
    });

    it('should deny unauthorized users from all proposal operations', () => {
      const submitAuth = accessControl.authorizeResearchProposal(
        UNAUTHORIZED_USER,
        'SUBMIT',
        proposalId
      );

      const approveAuth = accessControl.authorizeResearchProposal(
        UNAUTHORIZED_USER,
        'APPROVE',
        proposalId
      );

      expect(submitAuth).toBe(false);
      expect(approveAuth).toBe(false);
    });
  });

  describe('Access Logging and Auditing', () => {
    it('should log all access attempts', () => {
      const proposalId = generateResearchId();

      // Perform various operations
      accessControl.authorizeResearchProposal(RESEARCHER_USER, 'SUBMIT', proposalId);
      accessControl.authorizePatientDataAccess(PATIENT_USER, PATIENT_USER, ['bloodPressure'], '');
      accessControl.authorizePatientDataAccess(PATIENT_USER, UNAUTHORIZED_USER, ['heartRate'], '');

      const accessLog = accessControl.getAccessLog();

      expect(accessLog.length).toBeGreaterThan(0);
      expect(accessLog.some(entry => entry.action.includes('SUBMIT_PROPOSAL'))).toBe(true);
      expect(accessLog.some(entry => entry.action === 'ACCESS_OWN_DATA')).toBe(true);
      expect(accessLog.some(entry => entry.success === false)).toBe(true);
    });

    it('should filter access log by timestamp', () => {
      const startTime = getCurrentTimestamp();

      // Perform operation
      accessControl.authorizeResearchProposal(RESEARCHER_USER, 'SUBMIT', generateResearchId());

      const endTime = getCurrentTimestamp();

      const filteredLog = accessControl.getAccessLog(startTime, endTime);

      expect(filteredLog.length).toBeGreaterThan(0);
      expect(filteredLog.every(entry => entry.timestamp >= startTime && entry.timestamp <= endTime)).toBe(true);
    });

    it('should provide detailed audit trail', () => {
      const proposalId = generateResearchId();

      accessControl.authorizeResearchProposal(RESEARCHER_USER, 'SUBMIT', proposalId);
      accessControl.authorizeResearchProposal(ADMIN_USER, 'APPROVE', proposalId);

      const accessLog = accessControl.getAccessLog();
      const proposalLogs = accessLog.filter(entry => entry.action.includes(proposalId));

      expect(proposalLogs).toHaveLength(2);
      expect(proposalLogs[0].action).toContain('SUBMIT');
      expect(proposalLogs[1].action).toContain('APPROVE');
      expect(proposalLogs.every(entry => entry.success)).toBe(true);
    });
  });

  describe('Complex Authorization Scenarios', () => {
    it('should handle multi-role user permissions correctly', () => {
      // Give researcher additional auditor role
      accessControl.assignRole(RESEARCHER_USER, Role.AUDITOR, ADMIN_USER);

      // Should have both researcher and auditor permissions
      expect(accessControl.hasPermission(RESEARCHER_USER, Permission.SUBMIT_RESEARCH_PROPOSAL)).toBe(true);
      expect(accessControl.hasPermission(RESEARCHER_USER, Permission.AUDIT_SYSTEM)).toBe(true);
      expect(accessControl.hasPermission(RESEARCHER_USER, Permission.APPROVE_RESEARCH_PROPOSAL)).toBe(false);
    });

    it('should handle temporary permission expiration correctly', () => {
      const shortExpiry = getCurrentTimestamp() + BigInt(1); // Expires in 1 second

      accessControl.grantTemporaryPermission(
        UNAUTHORIZED_USER,
        Permission.ACCESS_AGGREGATED_DATA,
        shortExpiry,
        ADMIN_USER
      );

      expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.ACCESS_AGGREGATED_DATA)).toBe(true);

      // Simulate time passing
      setTimeout(() => {
        expect(accessControl.hasPermission(UNAUTHORIZED_USER, Permission.ACCESS_AGGREGATED_DATA)).toBe(false);
      }, 2000);
    });

    it('should maintain access control integrity under concurrent operations', () => {
      const newUser = createTestUser('CONCURRENT_USER');

      // Simulate concurrent role assignments and revocations
      accessControl.assignRole(newUser, Role.RESEARCHER, ADMIN_USER);
      expect(accessControl.getUserRoles(newUser)).toContain(Role.RESEARCHER);

      accessControl.assignRole(newUser, Role.AUDITOR, ADMIN_USER);
      expect(accessControl.getUserRoles(newUser)).toContain(Role.AUDITOR);

      accessControl.revokeRole(newUser, Role.RESEARCHER, ADMIN_USER);
      const finalRoles = accessControl.getUserRoles(newUser);
      expect(finalRoles).not.toContain(Role.RESEARCHER);
      expect(finalRoles).toContain(Role.AUDITOR);
    });
  });
});
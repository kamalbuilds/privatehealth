import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock simulator class for ResearchMarketplace
class ResearchMarketplaceSimulator {
  private proposals = new Map();
  private proposalParticipants = new Map();
  private proposalFunding = new Map();
  private nextProposalId = 1;
  private admin: string;
  private initialized = false;

  constructor(admin: string) {
    this.admin = admin;
    this.initialized = true;
  }

  initialize(admin: string, patientRegistry: string, dataVerification: string): void {
    this.admin = admin;
    this.initialized = true;
  }

  submitProposal(
    title: string,
    description: string,
    requiredDataTypes: any[],
    minParticipants: number,
    maxParticipants: number,
    rewardPerParticipant: bigint,
    duration: bigint,
    ethicsApprovalHash: bigint,
    caller?: string
  ): bigint {
    if (!this.initialized) {
      throw new Error('ResearchMarketplace: contract not initialized');
    }

    if (!title) {
      throw new Error('ResearchMarketplace: empty title');
    }

    if (!description) {
      throw new Error('ResearchMarketplace: empty description');
    }

    if (minParticipants <= 0) {
      throw new Error('ResearchMarketplace: invalid min participants');
    }

    if (maxParticipants < minParticipants) {
      throw new Error('ResearchMarketplace: invalid max participants');
    }

    if (rewardPerParticipant <= 0n) {
      throw new Error('ResearchMarketplace: invalid reward');
    }

    if (duration < 2592000n || duration > 31536000n) {
      throw new Error('ResearchMarketplace: invalid duration');
    }

    if (ethicsApprovalHash <= 0n) {
      throw new Error('ResearchMarketplace: invalid ethics approval');
    }

    const proposalId = BigInt(this.nextProposalId);
    const currentTime = 1000000n;
    const callerAddress = caller || 'default_researcher';

    const proposal = {
      proposalId,
      researcher: callerAddress,
      title,
      description,
      requiredDataTypes,
      minParticipants,
      maxParticipants,
      rewardPerParticipant,
      duration,
      status: ProposalStatus.Submitted,
      ethicsApprovalHash,
      createdAt: currentTime
    };

    this.proposals.set(proposalId, proposal);

    const totalFunding = rewardPerParticipant * BigInt(maxParticipants);
    this.proposalFunding.set(proposalId, totalFunding);
    this.proposalParticipants.set(proposalId, []);

    this.nextProposalId++;
    return proposalId;
  }

  updateProposalStatus(proposalId: bigint, newStatus: ProposalStatus, caller?: string): void {
    if (!this.initialized) {
      throw new Error('ResearchMarketplace: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';
    if (callerAddress !== this.admin) {
      throw new Error('ResearchMarketplace: admin only');
    }

    if (!this.proposals.has(proposalId)) {
      throw new Error('ResearchMarketplace: proposal not found');
    }

    const proposal = this.proposals.get(proposalId);
    proposal.status = newStatus;
    this.proposals.set(proposalId, proposal);
  }

  joinStudy(
    proposalId: bigint,
    patientId: bigint,
    sharedDataTypes: any[],
    zkProofHash: bigint,
    caller?: string
  ): bigint {
    if (!this.initialized) {
      throw new Error('ResearchMarketplace: contract not initialized');
    }

    if (!this.proposals.has(proposalId)) {
      throw new Error('ResearchMarketplace: proposal not found');
    }

    const proposal = this.proposals.get(proposalId);
    if (proposal.status !== ProposalStatus.Approved) {
      throw new Error('ResearchMarketplace: proposal not approved');
    }

    if (zkProofHash <= 0n) {
      throw new Error('ResearchMarketplace: invalid proof');
    }

    const participants = this.proposalParticipants.get(proposalId) || [];
    if (participants.includes(patientId)) {
      throw new Error('ResearchMarketplace: already participating');
    }

    if (participants.length >= proposal.maxParticipants) {
      throw new Error('ResearchMarketplace: study full');
    }

    const currentTime = 1000000n;
    const agreementId = proposalId * 1000000n + currentTime;

    const agreement = {
      agreementId,
      patientId,
      proposalId,
      researcher: proposal.researcher,
      dataTypes: sharedDataTypes,
      compensationAmount: proposal.rewardPerParticipant,
      accessDuration: proposal.duration,
      zkProofHash,
      isActive: true,
      createdAt: currentTime,
      expiresAt: currentTime + proposal.duration
    };

    participants.push(patientId);
    this.proposalParticipants.set(proposalId, participants);

    return agreementId;
  }

  getProposal(proposalId: bigint): any {
    if (!this.initialized) {
      throw new Error('ResearchMarketplace: contract not initialized');
    }

    if (!this.proposals.has(proposalId)) {
      throw new Error('ResearchMarketplace: proposal not found');
    }

    return this.proposals.get(proposalId);
  }

  getParticipantCount(proposalId: bigint): number {
    if (!this.initialized) {
      throw new Error('ResearchMarketplace: contract not initialized');
    }

    if (!this.proposals.has(proposalId)) {
      throw new Error('ResearchMarketplace: proposal not found');
    }

    const participants = this.proposalParticipants.get(proposalId) || [];
    return participants.length;
  }

  cancelProposal(proposalId: bigint, caller?: string): void {
    if (!this.initialized) {
      throw new Error('ResearchMarketplace: contract not initialized');
    }

    if (!this.proposals.has(proposalId)) {
      throw new Error('ResearchMarketplace: proposal not found');
    }

    const proposal = this.proposals.get(proposalId);
    const callerAddress = caller || 'default_caller';

    if (callerAddress !== proposal.researcher) {
      throw new Error('ResearchMarketplace: not researcher');
    }

    if (proposal.status !== ProposalStatus.Submitted && proposal.status !== ProposalStatus.Under_Review) {
      throw new Error('ResearchMarketplace: cannot cancel');
    }

    proposal.status = ProposalStatus.Cancelled;
    this.proposals.set(proposalId, proposal);
    this.proposalFunding.set(proposalId, 0n);
  }

  distributeRewards(proposalId: bigint, caller?: string): void {
    if (!this.initialized) {
      throw new Error('ResearchMarketplace: contract not initialized');
    }

    const callerAddress = caller || 'default_caller';

    if (!this.proposals.has(proposalId)) {
      throw new Error('ResearchMarketplace: proposal not found');
    }

    const proposal = this.proposals.get(proposalId);

    if (callerAddress !== this.admin && callerAddress !== proposal.researcher) {
      throw new Error('ResearchMarketplace: unauthorized');
    }

    if (proposal.status !== ProposalStatus.Completed) {
      throw new Error('ResearchMarketplace: proposal not completed');
    }

    if (!this.proposalFunding.has(proposalId) || this.proposalFunding.get(proposalId) === 0n) {
      throw new Error('ResearchMarketplace: no funding');
    }

    this.proposalFunding.set(proposalId, 0n);
  }
}

// Enums
enum ProposalStatus {
  Submitted = 0,
  Under_Review = 1,
  Approved = 2,
  Rejected = 3,
  Active = 4,
  Completed = 5,
  Cancelled = 6
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

// Test constants
const ADMIN_ADDRESS = 'admin_key';
const RESEARCHER_ADDRESS = 'researcher_key';
const PATIENT_REGISTRY_ADDRESS = 'patient_registry_contract';
const DATA_VERIFICATION_ADDRESS = 'data_verification_contract';

const SAMPLE_TITLE = 'COVID-19 Long-term Effects Study';
const SAMPLE_DESCRIPTION = 'Investigating long-term effects of COVID-19 on cardiovascular health';
const SAMPLE_REWARD_PER_PARTICIPANT = 1000000000000000000n; // 1 DUST token
const SAMPLE_DURATION = 7776000n; // 90 days in seconds
const SAMPLE_ETHICS_HASH = 123456789012345678901234567890n;

describe('ResearchMarketplace', () => {
  let marketplace: ResearchMarketplaceSimulator;

  beforeEach(() => {
    marketplace = new ResearchMarketplaceSimulator(ADMIN_ADDRESS);
    marketplace.initialize(ADMIN_ADDRESS, PATIENT_REGISTRY_ADDRESS, DATA_VERIFICATION_ADDRESS);
  });

  describe('Initialization', () => {
    it('should initialize with proper configuration', () => {
      const newMarketplace = new ResearchMarketplaceSimulator(ADMIN_ADDRESS);
      expect(newMarketplace).toBeDefined();
    });

    it('should fail operations before initialization', () => {
      const uninitializedMarketplace = new ResearchMarketplaceSimulator('');
      uninitializedMarketplace['initialized'] = false;

      expect(() => {
        uninitializedMarketplace.submitProposal(
          SAMPLE_TITLE,
          SAMPLE_DESCRIPTION,
          [HealthDataCategory.Medical_Records],
          10,
          100,
          SAMPLE_REWARD_PER_PARTICIPANT,
          SAMPLE_DURATION,
          SAMPLE_ETHICS_HASH
        );
      }).toThrow('ResearchMarketplace: contract not initialized');
    });
  });

  describe('Proposal Submission', () => {
    it('should submit a valid research proposal', () => {
      const requiredDataTypes = [HealthDataCategory.Medical_Records, HealthDataCategory.Lab_Results];

      const proposalId = marketplace.submitProposal(
        SAMPLE_TITLE,
        SAMPLE_DESCRIPTION,
        requiredDataTypes,
        10,
        100,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );

      expect(proposalId).toBe(1n);

      const proposal = marketplace.getProposal(proposalId);
      expect(proposal.title).toBe(SAMPLE_TITLE);
      expect(proposal.description).toBe(SAMPLE_DESCRIPTION);
      expect(proposal.researcher).toBe(RESEARCHER_ADDRESS);
      expect(proposal.minParticipants).toBe(10);
      expect(proposal.maxParticipants).toBe(100);
      expect(proposal.rewardPerParticipant).toBe(SAMPLE_REWARD_PER_PARTICIPANT);
      expect(proposal.status).toBe(ProposalStatus.Submitted);
    });

    it('should fail with empty title', () => {
      expect(() => {
        marketplace.submitProposal(
          '',
          SAMPLE_DESCRIPTION,
          [HealthDataCategory.Medical_Records],
          10,
          100,
          SAMPLE_REWARD_PER_PARTICIPANT,
          SAMPLE_DURATION,
          SAMPLE_ETHICS_HASH
        );
      }).toThrow('ResearchMarketplace: empty title');
    });

    it('should fail with empty description', () => {
      expect(() => {
        marketplace.submitProposal(
          SAMPLE_TITLE,
          '',
          [HealthDataCategory.Medical_Records],
          10,
          100,
          SAMPLE_REWARD_PER_PARTICIPANT,
          SAMPLE_DURATION,
          SAMPLE_ETHICS_HASH
        );
      }).toThrow('ResearchMarketplace: empty description');
    });

    it('should fail with invalid participant counts', () => {
      expect(() => {
        marketplace.submitProposal(
          SAMPLE_TITLE,
          SAMPLE_DESCRIPTION,
          [HealthDataCategory.Medical_Records],
          0,
          100,
          SAMPLE_REWARD_PER_PARTICIPANT,
          SAMPLE_DURATION,
          SAMPLE_ETHICS_HASH
        );
      }).toThrow('ResearchMarketplace: invalid min participants');

      expect(() => {
        marketplace.submitProposal(
          SAMPLE_TITLE,
          SAMPLE_DESCRIPTION,
          [HealthDataCategory.Medical_Records],
          100,
          50,
          SAMPLE_REWARD_PER_PARTICIPANT,
          SAMPLE_DURATION,
          SAMPLE_ETHICS_HASH
        );
      }).toThrow('ResearchMarketplace: invalid max participants');
    });

    it('should fail with invalid reward amount', () => {
      expect(() => {
        marketplace.submitProposal(
          SAMPLE_TITLE,
          SAMPLE_DESCRIPTION,
          [HealthDataCategory.Medical_Records],
          10,
          100,
          0n,
          SAMPLE_DURATION,
          SAMPLE_ETHICS_HASH
        );
      }).toThrow('ResearchMarketplace: invalid reward');
    });

    it('should fail with invalid duration', () => {
      expect(() => {
        marketplace.submitProposal(
          SAMPLE_TITLE,
          SAMPLE_DESCRIPTION,
          [HealthDataCategory.Medical_Records],
          10,
          100,
          SAMPLE_REWARD_PER_PARTICIPANT,
          86400n, // 1 day (too short)
          SAMPLE_ETHICS_HASH
        );
      }).toThrow('ResearchMarketplace: invalid duration');

      expect(() => {
        marketplace.submitProposal(
          SAMPLE_TITLE,
          SAMPLE_DESCRIPTION,
          [HealthDataCategory.Medical_Records],
          10,
          100,
          SAMPLE_REWARD_PER_PARTICIPANT,
          63072000n, // 2 years (too long)
          SAMPLE_ETHICS_HASH
        );
      }).toThrow('ResearchMarketplace: invalid duration');
    });

    it('should fail with invalid ethics approval', () => {
      expect(() => {
        marketplace.submitProposal(
          SAMPLE_TITLE,
          SAMPLE_DESCRIPTION,
          [HealthDataCategory.Medical_Records],
          10,
          100,
          SAMPLE_REWARD_PER_PARTICIPANT,
          SAMPLE_DURATION,
          0n
        );
      }).toThrow('ResearchMarketplace: invalid ethics approval');
    });

    it('should assign sequential proposal IDs', () => {
      const proposalId1 = marketplace.submitProposal(
        'Study 1',
        'Description 1',
        [HealthDataCategory.Medical_Records],
        10,
        100,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        'researcher1'
      );

      const proposalId2 = marketplace.submitProposal(
        'Study 2',
        'Description 2',
        [HealthDataCategory.Lab_Results],
        5,
        50,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        'researcher2'
      );

      expect(proposalId1).toBe(1n);
      expect(proposalId2).toBe(2n);
    });
  });

  describe('Proposal Status Management', () => {
    let proposalId: bigint;

    beforeEach(() => {
      proposalId = marketplace.submitProposal(
        SAMPLE_TITLE,
        SAMPLE_DESCRIPTION,
        [HealthDataCategory.Medical_Records],
        10,
        100,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );
    });

    it('should allow admin to update proposal status', () => {
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Under_Review, ADMIN_ADDRESS);

      const proposal = marketplace.getProposal(proposalId);
      expect(proposal.status).toBe(ProposalStatus.Under_Review);
    });

    it('should allow status progression through review process', () => {
      // Submit -> Under Review
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Under_Review, ADMIN_ADDRESS);
      let proposal = marketplace.getProposal(proposalId);
      expect(proposal.status).toBe(ProposalStatus.Under_Review);

      // Under Review -> Approved
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Approved, ADMIN_ADDRESS);
      proposal = marketplace.getProposal(proposalId);
      expect(proposal.status).toBe(ProposalStatus.Approved);

      // Approved -> Active
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Active, ADMIN_ADDRESS);
      proposal = marketplace.getProposal(proposalId);
      expect(proposal.status).toBe(ProposalStatus.Active);

      // Active -> Completed
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Completed, ADMIN_ADDRESS);
      proposal = marketplace.getProposal(proposalId);
      expect(proposal.status).toBe(ProposalStatus.Completed);
    });

    it('should allow rejection of proposals', () => {
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Rejected, ADMIN_ADDRESS);

      const proposal = marketplace.getProposal(proposalId);
      expect(proposal.status).toBe(ProposalStatus.Rejected);
    });

    it('should fail status update by non-admin', () => {
      expect(() => {
        marketplace.updateProposalStatus(proposalId, ProposalStatus.Approved, RESEARCHER_ADDRESS);
      }).toThrow('ResearchMarketplace: admin only');
    });

    it('should fail status update for non-existent proposal', () => {
      expect(() => {
        marketplace.updateProposalStatus(999n, ProposalStatus.Approved, ADMIN_ADDRESS);
      }).toThrow('ResearchMarketplace: proposal not found');
    });
  });

  describe('Study Participation', () => {
    let proposalId: bigint;

    beforeEach(() => {
      proposalId = marketplace.submitProposal(
        SAMPLE_TITLE,
        SAMPLE_DESCRIPTION,
        [HealthDataCategory.Medical_Records, HealthDataCategory.Lab_Results],
        2,
        5,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );

      // Approve the proposal
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Approved, ADMIN_ADDRESS);
    });

    it('should allow patient to join approved study', () => {
      const patientId = 123n;
      const sharedDataTypes = [HealthDataCategory.Medical_Records];
      const zkProofHash = 987654321n;

      const agreementId = marketplace.joinStudy(
        proposalId,
        patientId,
        sharedDataTypes,
        zkProofHash
      );

      expect(agreementId).toBeGreaterThan(0n);

      const participantCount = marketplace.getParticipantCount(proposalId);
      expect(participantCount).toBe(1);
    });

    it('should fail to join non-approved study', () => {
      // Create a new proposal that's not approved
      const newProposalId = marketplace.submitProposal(
        'Unapproved Study',
        'Not yet approved',
        [HealthDataCategory.Medical_Records],
        2,
        5,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );

      expect(() => {
        marketplace.joinStudy(
          newProposalId,
          123n,
          [HealthDataCategory.Medical_Records],
          987654321n
        );
      }).toThrow('ResearchMarketplace: proposal not approved');
    });

    it('should fail to join non-existent study', () => {
      expect(() => {
        marketplace.joinStudy(
          999n,
          123n,
          [HealthDataCategory.Medical_Records],
          987654321n
        );
      }).toThrow('ResearchMarketplace: proposal not found');
    });

    it('should fail with invalid proof hash', () => {
      expect(() => {
        marketplace.joinStudy(
          proposalId,
          123n,
          [HealthDataCategory.Medical_Records],
          0n
        );
      }).toThrow('ResearchMarketplace: invalid proof');
    });

    it('should track multiple participants', () => {
      const patients = [123n, 456n, 789n];
      const zkProofHash = 987654321n;

      patients.forEach((patientId, index) => {
        marketplace.joinStudy(
          proposalId,
          patientId,
          [HealthDataCategory.Medical_Records],
          zkProofHash + BigInt(index)
        );
      });

      const participantCount = marketplace.getParticipantCount(proposalId);
      expect(participantCount).toBe(3);
    });

    it('should prevent study overflow', () => {
      const zkProofHash = 987654321n;

      // Fill the study to capacity (maxParticipants = 5)
      for (let i = 1; i <= 5; i++) {
        marketplace.joinStudy(
          proposalId,
          BigInt(i),
          [HealthDataCategory.Medical_Records],
          zkProofHash + BigInt(i)
        );
      }

      // Try to add one more participant
      expect(() => {
        marketplace.joinStudy(
          proposalId,
          6n,
          [HealthDataCategory.Medical_Records],
          zkProofHash + 6n
        );
      }).toThrow('ResearchMarketplace: study full');
    });
  });

  describe('Proposal Cancellation', () => {
    let proposalId: bigint;

    beforeEach(() => {
      proposalId = marketplace.submitProposal(
        SAMPLE_TITLE,
        SAMPLE_DESCRIPTION,
        [HealthDataCategory.Medical_Records],
        10,
        100,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );
    });

    it('should allow researcher to cancel submitted proposal', () => {
      marketplace.cancelProposal(proposalId, RESEARCHER_ADDRESS);

      const proposal = marketplace.getProposal(proposalId);
      expect(proposal.status).toBe(ProposalStatus.Cancelled);
    });

    it('should allow researcher to cancel proposal under review', () => {
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Under_Review, ADMIN_ADDRESS);
      marketplace.cancelProposal(proposalId, RESEARCHER_ADDRESS);

      const proposal = marketplace.getProposal(proposalId);
      expect(proposal.status).toBe(ProposalStatus.Cancelled);
    });

    it('should fail cancellation by non-researcher', () => {
      expect(() => {
        marketplace.cancelProposal(proposalId, 'other_user');
      }).toThrow('ResearchMarketplace: not researcher');
    });

    it('should fail cancellation of non-existent proposal', () => {
      expect(() => {
        marketplace.cancelProposal(999n, RESEARCHER_ADDRESS);
      }).toThrow('ResearchMarketplace: proposal not found');
    });

    it('should fail cancellation of approved proposal', () => {
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Approved, ADMIN_ADDRESS);

      expect(() => {
        marketplace.cancelProposal(proposalId, RESEARCHER_ADDRESS);
      }).toThrow('ResearchMarketplace: cannot cancel');
    });

    it('should fail cancellation of active proposal', () => {
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Active, ADMIN_ADDRESS);

      expect(() => {
        marketplace.cancelProposal(proposalId, RESEARCHER_ADDRESS);
      }).toThrow('ResearchMarketplace: cannot cancel');
    });
  });

  describe('Reward Distribution', () => {
    let proposalId: bigint;

    beforeEach(() => {
      proposalId = marketplace.submitProposal(
        SAMPLE_TITLE,
        SAMPLE_DESCRIPTION,
        [HealthDataCategory.Medical_Records],
        2,
        5,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );

      // Set proposal as completed
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Completed, ADMIN_ADDRESS);
    });

    it('should allow admin to distribute rewards', () => {
      expect(() => {
        marketplace.distributeRewards(proposalId, ADMIN_ADDRESS);
      }).not.toThrow();
    });

    it('should allow researcher to distribute rewards', () => {
      expect(() => {
        marketplace.distributeRewards(proposalId, RESEARCHER_ADDRESS);
      }).not.toThrow();
    });

    it('should fail distribution by unauthorized user', () => {
      expect(() => {
        marketplace.distributeRewards(proposalId, 'unauthorized_user');
      }).toThrow('ResearchMarketplace: unauthorized');
    });

    it('should fail distribution for non-completed proposal', () => {
      const newProposalId = marketplace.submitProposal(
        'Active Study',
        'Still running',
        [HealthDataCategory.Medical_Records],
        2,
        5,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );

      marketplace.updateProposalStatus(newProposalId, ProposalStatus.Active, ADMIN_ADDRESS);

      expect(() => {
        marketplace.distributeRewards(newProposalId, ADMIN_ADDRESS);
      }).toThrow('ResearchMarketplace: proposal not completed');
    });

    it('should fail distribution for non-existent proposal', () => {
      expect(() => {
        marketplace.distributeRewards(999n, ADMIN_ADDRESS);
      }).toThrow('ResearchMarketplace: proposal not found');
    });

    it('should fail double distribution', () => {
      // First distribution should succeed
      marketplace.distributeRewards(proposalId, ADMIN_ADDRESS);

      // Second distribution should fail
      expect(() => {
        marketplace.distributeRewards(proposalId, ADMIN_ADDRESS);
      }).toThrow('ResearchMarketplace: no funding');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle full research lifecycle', () => {
      // 1. Submit proposal
      const proposalId = marketplace.submitProposal(
        'Comprehensive Health Study',
        'Multi-faceted health research',
        [HealthDataCategory.Medical_Records, HealthDataCategory.Lab_Results, HealthDataCategory.Genomic_Data],
        5,
        20,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );

      // 2. Admin reviews and approves
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Under_Review, ADMIN_ADDRESS);
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Approved, ADMIN_ADDRESS);

      // 3. Patients join study
      const patients = [101n, 102n, 103n, 104n, 105n, 106n];
      patients.forEach((patientId, index) => {
        marketplace.joinStudy(
          proposalId,
          patientId,
          [HealthDataCategory.Medical_Records, HealthDataCategory.Lab_Results],
          987654321n + BigInt(index)
        );
      });

      expect(marketplace.getParticipantCount(proposalId)).toBe(6);

      // 4. Study becomes active
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Active, ADMIN_ADDRESS);

      // 5. Study completes
      marketplace.updateProposalStatus(proposalId, ProposalStatus.Completed, ADMIN_ADDRESS);

      // 6. Rewards distributed
      expect(() => {
        marketplace.distributeRewards(proposalId, RESEARCHER_ADDRESS);
      }).not.toThrow();

      // Verify final state
      const finalProposal = marketplace.getProposal(proposalId);
      expect(finalProposal.status).toBe(ProposalStatus.Completed);
    });

    it('should handle multiple concurrent studies', () => {
      const proposals = [];

      // Create multiple proposals
      for (let i = 0; i < 5; i++) {
        const proposalId = marketplace.submitProposal(
          `Study ${i + 1}`,
          `Description for study ${i + 1}`,
          [HealthDataCategory.Medical_Records],
          1,
          10,
          SAMPLE_REWARD_PER_PARTICIPANT,
          SAMPLE_DURATION,
          SAMPLE_ETHICS_HASH + BigInt(i),
          `researcher_${i}`
        );
        proposals.push(proposalId);
      }

      // Approve all proposals
      proposals.forEach(proposalId => {
        marketplace.updateProposalStatus(proposalId, ProposalStatus.Approved, ADMIN_ADDRESS);
      });

      // Different patients join different studies
      proposals.forEach((proposalId, index) => {
        const patientId = BigInt(100 + index);
        marketplace.joinStudy(
          proposalId,
          patientId,
          [HealthDataCategory.Medical_Records],
          987654321n + BigInt(index)
        );
      });

      // Verify all studies have participants
      proposals.forEach(proposalId => {
        expect(marketplace.getParticipantCount(proposalId)).toBe(1);
      });
    });

    it('should handle proposal rejection and resubmission', () => {
      // Submit initial proposal
      const proposalId1 = marketplace.submitProposal(
        'Initial Study',
        'First attempt',
        [HealthDataCategory.Medical_Records],
        10,
        100,
        SAMPLE_REWARD_PER_PARTICIPANT,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH,
        RESEARCHER_ADDRESS
      );

      // Reject proposal
      marketplace.updateProposalStatus(proposalId1, ProposalStatus.Rejected, ADMIN_ADDRESS);

      // Submit revised proposal
      const proposalId2 = marketplace.submitProposal(
        'Revised Study',
        'Updated approach based on feedback',
        [HealthDataCategory.Medical_Records, HealthDataCategory.Lab_Results],
        5,
        50,
        SAMPLE_REWARD_PER_PARTICIPANT * 2n,
        SAMPLE_DURATION,
        SAMPLE_ETHICS_HASH + 1n,
        RESEARCHER_ADDRESS
      );

      // Approve revised proposal
      marketplace.updateProposalStatus(proposalId2, ProposalStatus.Approved, ADMIN_ADDRESS);

      // Verify both proposals exist with correct status
      const rejectedProposal = marketplace.getProposal(proposalId1);
      const approvedProposal = marketplace.getProposal(proposalId2);

      expect(rejectedProposal.status).toBe(ProposalStatus.Rejected);
      expect(approvedProposal.status).toBe(ProposalStatus.Approved);
      expect(proposalId1).not.toBe(proposalId2);
    });
  });
});
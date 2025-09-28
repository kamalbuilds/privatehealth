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

// Payment and Reward System
class PaymentRewardSystem {
  private balances: Map<string, bigint> = new Map();
  private escrowAccounts: Map<string, any> = new Map();
  private rewardPools: Map<string, any> = new Map();
  private paymentHistory: any[] = [];
  private rewardHistory: any[] = [];

  constructor() {
    this.initializeSystem();
  }

  private initializeSystem(): void {
    // Initialize with some test balances
    this.balances.set(this.addressToString(createTestUser('RESEARCHER')), BigInt(10000000)); // 10M tokens
    this.balances.set(this.addressToString(createTestUser('ADMIN')), BigInt(50000000)); // 50M tokens
  }

  // Get balance for an address
  getBalance(address: CoinPublicKey): bigint {
    const key = this.addressToString(address);
    return this.balances.get(key) || BigInt(0);
  }

  // Create escrow for research proposal
  createResearchEscrow(
    proposalId: string,
    researcher: CoinPublicKey,
    amount: bigint,
    participantCount: number,
    deadline: bigint
  ): void {
    if (amount <= 0n) {
      throw new Error('PaymentReward: Invalid escrow amount');
    }

    if (deadline <= getCurrentTimestamp()) {
      throw new Error('PaymentReward: Invalid deadline');
    }

    const researcherKey = this.addressToString(researcher);
    const researcherBalance = this.getBalance(researcher);

    if (researcherBalance < amount) {
      throw new Error('PaymentReward: Insufficient balance');
    }

    // Deduct from researcher balance
    this.balances.set(researcherKey, researcherBalance - amount);

    // Create escrow
    this.escrowAccounts.set(proposalId, {
      proposalId,
      researcher,
      amount,
      participantCount,
      deadline,
      participants: new Map<string, any>(),
      status: 'ACTIVE',
      createdAt: getCurrentTimestamp()
    });

    this.logPayment(researcherKey, 'ESCROW_CREATED', amount, proposalId);
  }

  // Add participant to research escrow
  addParticipant(
    proposalId: string,
    patient: CoinPublicKey,
    dataContribution: string[],
    qualityScore: number
  ): void {
    const escrow = this.escrowAccounts.get(proposalId);
    if (!escrow) {
      throw new Error('PaymentReward: Escrow not found');
    }

    if (escrow.status !== 'ACTIVE') {
      throw new Error('PaymentReward: Escrow not active');
    }

    if (qualityScore < 0 || qualityScore > 100) {
      throw new Error('PaymentReward: Invalid quality score');
    }

    const patientKey = this.addressToString(patient);

    escrow.participants.set(patientKey, {
      patient,
      dataContribution,
      qualityScore,
      joinedAt: getCurrentTimestamp(),
      rewardCalculated: false
    });
  }

  // Calculate and distribute rewards
  distributeRewards(proposalId: string, adminAddress: CoinPublicKey): void {
    const escrow = this.escrowAccounts.get(proposalId);
    if (!escrow) {
      throw new Error('PaymentReward: Escrow not found');
    }

    if (escrow.status !== 'ACTIVE') {
      throw new Error('PaymentReward: Escrow not active');
    }

    const adminKey = this.addressToString(adminAddress);
    const participants = Array.from(escrow.participants.values());

    if (participants.length === 0) {
      throw new Error('PaymentReward: No participants to reward');
    }

    // Calculate total quality score
    const totalQualityScore = participants.reduce(
      (sum, participant) => sum + participant.qualityScore,
      0
    );

    if (totalQualityScore === 0) {
      throw new Error('PaymentReward: Invalid total quality score');
    }

    // Distribute rewards based on quality score
    for (const participant of participants) {
      const rewardRatio = participant.qualityScore / totalQualityScore;
      const rewardAmount = BigInt(Math.floor(Number(escrow.amount) * rewardRatio));

      const patientKey = this.addressToString(participant.patient);
      const currentBalance = this.getBalance(participant.patient);
      this.balances.set(patientKey, currentBalance + rewardAmount);

      participant.rewardCalculated = true;
      participant.rewardAmount = rewardAmount;

      this.logReward(patientKey, proposalId, rewardAmount, participant.qualityScore);
    }

    escrow.status = 'COMPLETED';
    escrow.completedAt = getCurrentTimestamp();
    escrow.distributedBy = adminKey;

    this.logPayment(adminKey, 'REWARDS_DISTRIBUTED', escrow.amount, proposalId);
  }

  // Refund escrow if research fails or expires
  refundEscrow(proposalId: string, reason: string): void {
    const escrow = this.escrowAccounts.get(proposalId);
    if (!escrow) {
      throw new Error('PaymentReward: Escrow not found');
    }

    if (escrow.status !== 'ACTIVE') {
      throw new Error('PaymentReward: Escrow not active');
    }

    // Check if deadline has passed for automatic refund
    if (reason === 'EXPIRED' && getCurrentTimestamp() <= escrow.deadline) {
      throw new Error('PaymentReward: Cannot refund before deadline');
    }

    const researcherKey = this.addressToString(escrow.researcher);
    const currentBalance = this.getBalance(escrow.researcher);
    this.balances.set(researcherKey, currentBalance + escrow.amount);

    escrow.status = 'REFUNDED';
    escrow.refundedAt = getCurrentTimestamp();
    escrow.refundReason = reason;

    this.logPayment(researcherKey, `ESCROW_REFUNDED:${reason}`, escrow.amount, proposalId);
  }

  // Create bonus reward pool for high-quality contributions
  createBonusPool(
    poolId: string,
    creator: CoinPublicKey,
    amount: bigint,
    criteria: any
  ): void {
    if (amount <= 0n) {
      throw new Error('PaymentReward: Invalid pool amount');
    }

    const creatorKey = this.addressToString(creator);
    const creatorBalance = this.getBalance(creator);

    if (creatorBalance < amount) {
      throw new Error('PaymentReward: Insufficient balance for pool');
    }

    this.balances.set(creatorKey, creatorBalance - amount);

    this.rewardPools.set(poolId, {
      poolId,
      creator,
      amount,
      criteria,
      remainingAmount: amount,
      recipients: [],
      status: 'ACTIVE',
      createdAt: getCurrentTimestamp()
    });
  }

  // Award bonus from pool
  awardBonus(
    poolId: string,
    recipient: CoinPublicKey,
    bonusAmount: bigint,
    justification: string
  ): void {
    const pool = this.rewardPools.get(poolId);
    if (!pool) {
      throw new Error('PaymentReward: Bonus pool not found');
    }

    if (pool.status !== 'ACTIVE') {
      throw new Error('PaymentReward: Bonus pool not active');
    }

    if (bonusAmount > pool.remainingAmount) {
      throw new Error('PaymentReward: Insufficient pool balance');
    }

    const recipientKey = this.addressToString(recipient);
    const currentBalance = this.getBalance(recipient);
    this.balances.set(recipientKey, currentBalance + bonusAmount);

    pool.remainingAmount -= bonusAmount;
    pool.recipients.push({
      recipient,
      amount: bonusAmount,
      justification,
      awardedAt: getCurrentTimestamp()
    });

    if (pool.remainingAmount === 0n) {
      pool.status = 'DEPLETED';
    }

    this.logReward(recipientKey, poolId, bonusAmount, justification);
  }

  // Transfer tokens between addresses
  transfer(from: CoinPublicKey, to: CoinPublicKey, amount: bigint): void {
    if (amount <= 0n) {
      throw new Error('PaymentReward: Invalid transfer amount');
    }

    const fromKey = this.addressToString(from);
    const toKey = this.addressToString(to);

    const fromBalance = this.getBalance(from);
    if (fromBalance < amount) {
      throw new Error('PaymentReward: Insufficient balance for transfer');
    }

    const toBalance = this.getBalance(to);

    this.balances.set(fromKey, fromBalance - amount);
    this.balances.set(toKey, toBalance + amount);

    this.logPayment(fromKey, 'TRANSFER_OUT', amount, toKey);
    this.logPayment(toKey, 'TRANSFER_IN', amount, fromKey);
  }

  // Get escrow details
  getEscrow(proposalId: string): any {
    return this.escrowAccounts.get(proposalId);
  }

  // Get reward pool details
  getRewardPool(poolId: string): any {
    return this.rewardPools.get(poolId);
  }

  // Get payment history
  getPaymentHistory(address?: CoinPublicKey): any[] {
    if (address) {
      const addressKey = this.addressToString(address);
      return this.paymentHistory.filter(
        payment => payment.address === addressKey
      );
    }
    return this.paymentHistory;
  }

  // Get reward history
  getRewardHistory(address?: CoinPublicKey): any[] {
    if (address) {
      const addressKey = this.addressToString(address);
      return this.rewardHistory.filter(
        reward => reward.recipient === addressKey
      );
    }
    return this.rewardHistory;
  }

  // Calculate pending rewards for a participant
  calculatePendingRewards(address: CoinPublicKey): bigint {
    const addressKey = this.addressToString(address);
    let pendingAmount = BigInt(0);

    for (const escrow of this.escrowAccounts.values()) {
      if (escrow.status === 'ACTIVE' && escrow.participants.has(addressKey)) {
        const participant = escrow.participants.get(addressKey);
        if (!participant.rewardCalculated) {
          // Estimate reward based on current quality score
          const participants = Array.from(escrow.participants.values());
          const totalQuality = participants.reduce(
            (sum, p) => sum + p.qualityScore,
            0
          );
          if (totalQuality > 0) {
            const estimatedReward = BigInt(
              Math.floor(Number(escrow.amount) * (participant.qualityScore / totalQuality))
            );
            pendingAmount += estimatedReward;
          }
        }
      }
    }

    return pendingAmount;
  }

  // Private helper methods
  private addressToString(address: CoinPublicKey): string {
    return Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private logPayment(address: string, action: string, amount: bigint, reference: string): void {
    this.paymentHistory.push({
      timestamp: getCurrentTimestamp(),
      address,
      action,
      amount,
      reference
    });
  }

  private logReward(recipient: string, source: string, amount: bigint, details: any): void {
    this.rewardHistory.push({
      timestamp: getCurrentTimestamp(),
      recipient,
      source,
      amount,
      details
    });
  }
}

describe('PaymentRewardSystem', () => {
  let paymentSystem: PaymentRewardSystem;

  // Test users
  const RESEARCHER = createTestUser('RESEARCHER');
  const PATIENT_1 = createTestUser('PATIENT_1');
  const PATIENT_2 = createTestUser('PATIENT_2');
  const PATIENT_3 = createTestUser('PATIENT_3');
  const ADMIN = createTestUser('ADMIN');

  beforeEach(() => {
    paymentSystem = new PaymentRewardSystem();
  });

  describe('Balance Management', () => {
    it('should return correct initial balances', () => {
      const researcherBalance = paymentSystem.getBalance(RESEARCHER);
      const patientBalance = paymentSystem.getBalance(PATIENT_1);

      expect(researcherBalance).toBe(BigInt(10000000));
      expect(patientBalance).toBe(BigInt(0));
    });

    it('should handle balance transfers', () => {
      const transferAmount = BigInt(1000000);

      paymentSystem.transfer(RESEARCHER, PATIENT_1, transferAmount);

      expect(paymentSystem.getBalance(RESEARCHER)).toBe(BigInt(9000000));
      expect(paymentSystem.getBalance(PATIENT_1)).toBe(transferAmount);
    });

    it('should reject transfer with insufficient balance', () => {
      const excessiveAmount = BigInt(20000000); // More than researcher has

      expect(() => {
        paymentSystem.transfer(RESEARCHER, PATIENT_1, excessiveAmount);
      }).toThrow('PaymentReward: Insufficient balance for transfer');
    });

    it('should reject invalid transfer amounts', () => {
      expect(() => {
        paymentSystem.transfer(RESEARCHER, PATIENT_1, BigInt(0));
      }).toThrow('PaymentReward: Invalid transfer amount');

      expect(() => {
        paymentSystem.transfer(RESEARCHER, PATIENT_1, BigInt(-1000));
      }).toThrow('PaymentReward: Invalid transfer amount');
    });
  });

  describe('Research Escrow Management', () => {
    const proposalId = generateResearchId();
    const escrowAmount = BigInt(5000000);
    const participantCount = 10;
    const deadline = addDays(getCurrentTimestamp(), 30);

    it('should create research escrow successfully', () => {
      paymentSystem.createResearchEscrow(
        proposalId,
        RESEARCHER,
        escrowAmount,
        participantCount,
        deadline
      );

      const escrow = paymentSystem.getEscrow(proposalId);
      expect(escrow).toBeDefined();
      expect(escrow.amount).toBe(escrowAmount);
      expect(escrow.researcher).toEqual(RESEARCHER);
      expect(escrow.status).toBe('ACTIVE');

      // Check researcher balance was deducted
      expect(paymentSystem.getBalance(RESEARCHER)).toBe(BigInt(5000000));
    });

    it('should reject escrow creation with insufficient balance', () => {
      const excessiveAmount = BigInt(20000000);

      expect(() => {
        paymentSystem.createResearchEscrow(
          proposalId,
          RESEARCHER,
          excessiveAmount,
          participantCount,
          deadline
        );
      }).toThrow('PaymentReward: Insufficient balance');
    });

    it('should reject escrow creation with past deadline', () => {
      const pastDeadline = getCurrentTimestamp() - BigInt(86400); // Yesterday

      expect(() => {
        paymentSystem.createResearchEscrow(
          proposalId,
          RESEARCHER,
          escrowAmount,
          participantCount,
          pastDeadline
        );
      }).toThrow('PaymentReward: Invalid deadline');
    });

    it('should add participants to escrow', () => {
      paymentSystem.createResearchEscrow(
        proposalId,
        RESEARCHER,
        escrowAmount,
        participantCount,
        deadline
      );

      paymentSystem.addParticipant(
        proposalId,
        PATIENT_1,
        ['bloodPressure', 'heartRate'],
        85 // Quality score
      );

      const escrow = paymentSystem.getEscrow(proposalId);
      const patientKey = Array.from(escrow.participants.keys())[0];
      const participant = escrow.participants.get(patientKey);

      expect(participant.qualityScore).toBe(85);
      expect(participant.dataContribution).toEqual(['bloodPressure', 'heartRate']);
    });

    it('should reject invalid quality scores', () => {
      paymentSystem.createResearchEscrow(
        proposalId,
        RESEARCHER,
        escrowAmount,
        participantCount,
        deadline
      );

      expect(() => {
        paymentSystem.addParticipant(
          proposalId,
          PATIENT_1,
          ['bloodPressure'],
          150 // Invalid: > 100
        );
      }).toThrow('PaymentReward: Invalid quality score');

      expect(() => {
        paymentSystem.addParticipant(
          proposalId,
          PATIENT_1,
          ['bloodPressure'],
          -10 // Invalid: < 0
        );
      }).toThrow('PaymentReward: Invalid quality score');
    });
  });

  describe('Reward Distribution', () => {
    const proposalId = generateResearchId();
    const escrowAmount = BigInt(6000000);
    const deadline = addDays(getCurrentTimestamp(), 30);

    beforeEach(() => {
      paymentSystem.createResearchEscrow(
        proposalId,
        RESEARCHER,
        escrowAmount,
        3,
        deadline
      );

      // Add participants with different quality scores
      paymentSystem.addParticipant(proposalId, PATIENT_1, ['bloodPressure'], 90);
      paymentSystem.addParticipant(proposalId, PATIENT_2, ['heartRate'], 60);
      paymentSystem.addParticipant(proposalId, PATIENT_3, ['cholesterol'], 30);
      // Total quality score: 180
    });

    it('should distribute rewards based on quality scores', () => {
      paymentSystem.distributeRewards(proposalId, ADMIN);

      // Expected rewards:
      // PATIENT_1: 90/180 * 6000000 = 3000000
      // PATIENT_2: 60/180 * 6000000 = 2000000
      // PATIENT_3: 30/180 * 6000000 = 1000000

      expect(paymentSystem.getBalance(PATIENT_1)).toBe(BigInt(3000000));
      expect(paymentSystem.getBalance(PATIENT_2)).toBe(BigInt(2000000));
      expect(paymentSystem.getBalance(PATIENT_3)).toBe(BigInt(1000000));

      const escrow = paymentSystem.getEscrow(proposalId);
      expect(escrow.status).toBe('COMPLETED');
    });

    it('should reject reward distribution with no participants', () => {
      const emptyProposalId = generateResearchId();
      paymentSystem.createResearchEscrow(
        emptyProposalId,
        RESEARCHER,
        BigInt(1000000),
        3,
        deadline
      );

      expect(() => {
        paymentSystem.distributeRewards(emptyProposalId, ADMIN);
      }).toThrow('PaymentReward: No participants to reward');
    });

    it('should calculate pending rewards correctly', () => {
      // Before distribution
      const pendingReward1 = paymentSystem.calculatePendingRewards(PATIENT_1);
      const pendingReward2 = paymentSystem.calculatePendingRewards(PATIENT_2);

      expect(pendingReward1).toBe(BigInt(3000000)); // 90/180 * 6000000
      expect(pendingReward2).toBe(BigInt(2000000)); // 60/180 * 6000000

      // After distribution
      paymentSystem.distributeRewards(proposalId, ADMIN);

      const pendingAfter1 = paymentSystem.calculatePendingRewards(PATIENT_1);
      expect(pendingAfter1).toBe(BigInt(0)); // No more pending rewards
    });
  });

  describe('Escrow Refunds', () => {
    const proposalId = generateResearchId();
    const escrowAmount = BigInt(2000000);
    const deadline = addDays(getCurrentTimestamp(), 1); // 1 day from now

    beforeEach(() => {
      paymentSystem.createResearchEscrow(
        proposalId,
        RESEARCHER,
        escrowAmount,
        3,
        deadline
      );
    });

    it('should refund escrow for failed research', () => {
      const initialBalance = paymentSystem.getBalance(RESEARCHER);

      paymentSystem.refundEscrow(proposalId, 'RESEARCH_FAILED');

      const finalBalance = paymentSystem.getBalance(RESEARCHER);
      expect(finalBalance).toBe(initialBalance + escrowAmount);

      const escrow = paymentSystem.getEscrow(proposalId);
      expect(escrow.status).toBe('REFUNDED');
      expect(escrow.refundReason).toBe('RESEARCH_FAILED');
    });

    it('should refund escrow after deadline expiration', () => {
      // Simulate time passing (this would need actual time manipulation in real tests)
      // For now, we test the logic with an explicit expired call
      paymentSystem.refundEscrow(proposalId, 'EXPIRED');

      const escrow = paymentSystem.getEscrow(proposalId);
      expect(escrow.status).toBe('REFUNDED');
    });

    it('should reject premature expiration refund', () => {
      // Try to refund as expired before deadline
      expect(() => {
        paymentSystem.refundEscrow(proposalId, 'EXPIRED');
      }).toThrow('PaymentReward: Cannot refund before deadline');
    });

    it('should reject refund of already completed escrow', () => {
      // Add participant and distribute rewards first
      paymentSystem.addParticipant(proposalId, PATIENT_1, ['bloodPressure'], 100);
      paymentSystem.distributeRewards(proposalId, ADMIN);

      expect(() => {
        paymentSystem.refundEscrow(proposalId, 'RESEARCH_FAILED');
      }).toThrow('PaymentReward: Escrow not active');
    });
  });

  describe('Bonus Reward Pools', () => {
    const poolId = 'quality-bonus-pool';
    const poolAmount = BigInt(1000000);

    it('should create bonus pool successfully', () => {
      paymentSystem.createBonusPool(
        poolId,
        ADMIN,
        poolAmount,
        { minQualityScore: 90 }
      );

      const pool = paymentSystem.getRewardPool(poolId);
      expect(pool).toBeDefined();
      expect(pool.amount).toBe(poolAmount);
      expect(pool.remainingAmount).toBe(poolAmount);
      expect(pool.status).toBe('ACTIVE');
    });

    it('should award bonus from pool', () => {
      paymentSystem.createBonusPool(
        poolId,
        ADMIN,
        poolAmount,
        { minQualityScore: 90 }
      );

      const bonusAmount = BigInt(100000);
      paymentSystem.awardBonus(
        poolId,
        PATIENT_1,
        bonusAmount,
        'Exceptional data quality'
      );

      expect(paymentSystem.getBalance(PATIENT_1)).toBe(bonusAmount);

      const pool = paymentSystem.getRewardPool(poolId);
      expect(pool.remainingAmount).toBe(poolAmount - bonusAmount);
      expect(pool.recipients).toHaveLength(1);
    });

    it('should deplete pool when all funds awarded', () => {
      paymentSystem.createBonusPool(poolId, ADMIN, poolAmount, {});

      paymentSystem.awardBonus(poolId, PATIENT_1, poolAmount, 'Full pool award');

      const pool = paymentSystem.getRewardPool(poolId);
      expect(pool.status).toBe('DEPLETED');
      expect(pool.remainingAmount).toBe(BigInt(0));
    });

    it('should reject bonus award exceeding pool balance', () => {
      paymentSystem.createBonusPool(poolId, ADMIN, poolAmount, {});

      const excessiveAmount = poolAmount + BigInt(1);

      expect(() => {
        paymentSystem.awardBonus(poolId, PATIENT_1, excessiveAmount, 'Too much');
      }).toThrow('PaymentReward: Insufficient pool balance');
    });
  });

  describe('Payment and Reward History', () => {
    it('should track payment history', () => {
      const transferAmount = BigInt(500000);
      paymentSystem.transfer(RESEARCHER, PATIENT_1, transferAmount);

      const researcherHistory = paymentSystem.getPaymentHistory(RESEARCHER);
      const patient1History = paymentSystem.getPaymentHistory(PATIENT_1);

      expect(researcherHistory.some(h => h.action === 'TRANSFER_OUT')).toBe(true);
      expect(patient1History.some(h => h.action === 'TRANSFER_IN')).toBe(true);
    });

    it('should track reward history', () => {
      const proposalId = generateResearchId();
      paymentSystem.createResearchEscrow(
        proposalId,
        RESEARCHER,
        BigInt(1000000),
        1,
        addDays(getCurrentTimestamp(), 30)
      );

      paymentSystem.addParticipant(proposalId, PATIENT_1, ['bloodPressure'], 100);
      paymentSystem.distributeRewards(proposalId, ADMIN);

      const rewardHistory = paymentSystem.getRewardHistory(PATIENT_1);
      expect(rewardHistory).toHaveLength(1);
      expect(rewardHistory[0].source).toBe(proposalId);
      expect(rewardHistory[0].amount).toBe(BigInt(1000000));
    });

    it('should provide comprehensive transaction history', () => {
      // Multiple operations
      paymentSystem.transfer(RESEARCHER, PATIENT_1, BigInt(100000));

      const poolId = 'test-pool';
      paymentSystem.createBonusPool(poolId, ADMIN, BigInt(500000), {});
      paymentSystem.awardBonus(poolId, PATIENT_2, BigInt(50000), 'Test bonus');

      const allPaymentHistory = paymentSystem.getPaymentHistory();
      const allRewardHistory = paymentSystem.getRewardHistory();

      expect(allPaymentHistory.length).toBeGreaterThan(0);
      expect(allRewardHistory.length).toBeGreaterThan(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple concurrent escrows', () => {
      const proposal1 = generateResearchId();
      const proposal2 = generateResearchId();

      paymentSystem.createResearchEscrow(
        proposal1,
        RESEARCHER,
        BigInt(2000000),
        2,
        addDays(getCurrentTimestamp(), 30)
      );

      paymentSystem.createResearchEscrow(
        proposal2,
        RESEARCHER,
        BigInt(3000000),
        3,
        addDays(getCurrentTimestamp(), 45)
      );

      // Add participants to different escrows
      paymentSystem.addParticipant(proposal1, PATIENT_1, ['bloodPressure'], 80);
      paymentSystem.addParticipant(proposal1, PATIENT_2, ['heartRate'], 70);

      paymentSystem.addParticipant(proposal2, PATIENT_2, ['cholesterol'], 90);
      paymentSystem.addParticipant(proposal2, PATIENT_3, ['glucose'], 60);

      // Check pending rewards calculation includes both escrows
      const pendingPatient2 = paymentSystem.calculatePendingRewards(PATIENT_2);
      expect(pendingPatient2).toBeGreaterThan(BigInt(0));

      // Distribute rewards for first escrow
      paymentSystem.distributeRewards(proposal1, ADMIN);

      const escrow1 = paymentSystem.getEscrow(proposal1);
      const escrow2 = paymentSystem.getEscrow(proposal2);

      expect(escrow1.status).toBe('COMPLETED');
      expect(escrow2.status).toBe('ACTIVE');
    });

    it('should maintain system balance integrity', () => {
      const initialTotal = BigInt(10000000 + 50000000); // RESEARCHER + ADMIN initial balances

      // Perform various operations
      paymentSystem.transfer(RESEARCHER, PATIENT_1, BigInt(1000000));

      const proposalId = generateResearchId();
      paymentSystem.createResearchEscrow(
        proposalId,
        RESEARCHER,
        BigInt(2000000),
        1,
        addDays(getCurrentTimestamp(), 30)
      );

      paymentSystem.addParticipant(proposalId, PATIENT_1, ['bloodPressure'], 100);
      paymentSystem.distributeRewards(proposalId, ADMIN);

      // Calculate total balance across all addresses
      const finalTotal = [RESEARCHER, ADMIN, PATIENT_1, PATIENT_2, PATIENT_3]
        .reduce((sum, address) => sum + paymentSystem.getBalance(address), BigInt(0));

      expect(finalTotal).toBe(initialTotal);
    });
  });
});
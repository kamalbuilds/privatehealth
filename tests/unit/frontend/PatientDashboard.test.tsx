import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock components for testing
const PatientDashboard = ({
  patient,
  onDataUpdate,
  onConsentGrant,
  onConsentRevoke,
  researchProposals = [],
  medicalData = {}
}: any) => {
  const handleDataUpdate = (newData: any) => {
    onDataUpdate && onDataUpdate(newData);
  };

  const handleConsentGrant = (proposalId: string, fields: string[]) => {
    onConsentGrant && onConsentGrant(proposalId, fields);
  };

  const handleConsentRevoke = (proposalId: string) => {
    onConsentRevoke && onConsentRevoke(proposalId);
  };

  return (
    <div data-testid="patient-dashboard">
      <h1>Patient Dashboard</h1>

      {/* Patient Info Section */}
      <section data-testid="patient-info">
        <h2>Patient Information</h2>
        <div data-testid="patient-id">{patient?.id || 'Not set'}</div>
        <div data-testid="patient-address">{patient?.address || 'Not connected'}</div>
        <div data-testid="registration-status">
          {patient?.registered ? 'Registered' : 'Not registered'}
        </div>
      </section>

      {/* Medical Data Section */}
      <section data-testid="medical-data">
        <h2>Medical Data</h2>
        <div data-testid="data-summary">
          {Object.keys(medicalData).length > 0 ?
            `${Object.keys(medicalData).length} data fields` :
            'No data available'
          }
        </div>
        <button
          data-testid="update-data-btn"
          onClick={() => handleDataUpdate({ bloodPressure: '120/80' })}
        >
          Update Medical Data
        </button>
      </section>

      {/* Research Proposals Section */}
      <section data-testid="research-proposals">
        <h2>Available Research Studies</h2>
        {researchProposals.length === 0 ? (
          <div data-testid="no-proposals">No research proposals available</div>
        ) : (
          researchProposals.map((proposal: any) => (
            <div key={proposal.id} data-testid={`proposal-${proposal.id}`} className="proposal-card">
              <h3>{proposal.title}</h3>
              <p>{proposal.description}</p>
              <div data-testid={`proposal-reward-${proposal.id}`}>
                Reward: {proposal.reward} tokens
              </div>
              <div data-testid={`proposal-fields-${proposal.id}`}>
                Data required: {proposal.dataRequirements.join(', ')}
              </div>
              <div className="consent-actions">
                <button
                  data-testid={`grant-consent-${proposal.id}`}
                  onClick={() => handleConsentGrant(proposal.id, proposal.dataRequirements)}
                  disabled={proposal.consentGranted}
                >
                  {proposal.consentGranted ? 'Consent Granted' : 'Grant Consent'}
                </button>
                {proposal.consentGranted && (
                  <button
                    data-testid={`revoke-consent-${proposal.id}`}
                    onClick={() => handleConsentRevoke(proposal.id)}
                  >
                    Revoke Consent
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Privacy Settings Section */}
      <section data-testid="privacy-settings">
        <h2>Privacy Settings</h2>
        <div data-testid="privacy-level">
          Privacy Level: High
        </div>
        <button data-testid="privacy-settings-btn">
          Manage Privacy Settings
        </button>
      </section>

      {/* Rewards Section */}
      <section data-testid="rewards">
        <h2>Earned Rewards</h2>
        <div data-testid="token-balance">
          Balance: {patient?.tokenBalance || 0} tokens
        </div>
        <div data-testid="pending-rewards">
          Pending: {patient?.pendingRewards || 0} tokens
        </div>
      </section>
    </div>
  );
};

const ResearcherDashboard = ({
  researcher,
  onProposalSubmit,
  onDataAccess,
  proposals = [],
  accessibleData = []
}: any) => {
  const handleProposalSubmit = (proposalData: any) => {
    onProposalSubmit && onProposalSubmit(proposalData);
  };

  const handleDataAccess = (patientId: string, fields: string[]) => {
    onDataAccess && onDataAccess(patientId, fields);
  };

  return (
    <div data-testid="researcher-dashboard">
      <h1>Researcher Dashboard</h1>

      {/* Researcher Info */}
      <section data-testid="researcher-info">
        <h2>Researcher Information</h2>
        <div data-testid="researcher-id">{researcher?.id || 'Not set'}</div>
        <div data-testid="institution">{researcher?.institution || 'Not set'}</div>
      </section>

      {/* Submit Proposal Section */}
      <section data-testid="submit-proposal">
        <h2>Submit Research Proposal</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleProposalSubmit({
              title: formData.get('title'),
              description: formData.get('description'),
              dataRequirements: (formData.get('dataRequirements') as string)?.split(','),
              reward: parseInt(formData.get('reward') as string)
            });
          }}
        >
          <input
            name="title"
            placeholder="Study Title"
            data-testid="proposal-title-input"
            required
          />
          <textarea
            name="description"
            placeholder="Study Description"
            data-testid="proposal-description-input"
            required
          />
          <input
            name="dataRequirements"
            placeholder="Required data fields (comma-separated)"
            data-testid="proposal-data-requirements-input"
            required
          />
          <input
            name="reward"
            type="number"
            placeholder="Reward amount"
            data-testid="proposal-reward-input"
            required
          />
          <button type="submit" data-testid="submit-proposal-btn">
            Submit Proposal
          </button>
        </form>
      </section>

      {/* My Proposals Section */}
      <section data-testid="my-proposals">
        <h2>My Research Proposals</h2>
        {proposals.length === 0 ? (
          <div data-testid="no-my-proposals">No proposals submitted yet</div>
        ) : (
          proposals.map((proposal: any) => (
            <div key={proposal.id} data-testid={`my-proposal-${proposal.id}`} className="proposal-card">
              <h3>{proposal.title}</h3>
              <div data-testid={`proposal-status-${proposal.id}`}>
                Status: {proposal.status}
              </div>
              <div data-testid={`proposal-participants-${proposal.id}`}>
                Participants: {proposal.participantCount || 0}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Accessible Data Section */}
      <section data-testid="accessible-data">
        <h2>Accessible Patient Data</h2>
        {accessibleData.length === 0 ? (
          <div data-testid="no-accessible-data">No data access granted yet</div>
        ) : (
          accessibleData.map((data: any) => (
            <div key={data.patientId} data-testid={`accessible-${data.patientId}`} className="data-card">
              <div>Patient: {data.patientId}</div>
              <div>Fields: {data.fields.join(', ')}</div>
              <button
                data-testid={`access-data-${data.patientId}`}
                onClick={() => handleDataAccess(data.patientId, data.fields)}
              >
                Access Data
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

const WalletConnection = ({
  isConnected,
  onConnect,
  onDisconnect,
  address
}: any) => {
  return (
    <div data-testid="wallet-connection">
      {!isConnected ? (
        <button
          data-testid="connect-wallet-btn"
          onClick={onConnect}
        >
          Connect Wallet
        </button>
      ) : (
        <div data-testid="wallet-connected">
          <div data-testid="wallet-address">{address}</div>
          <button
            data-testid="disconnect-wallet-btn"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

describe('PatientDashboard Component', () => {
  const mockPatient = {
    id: 'patient_12345',
    address: '0x742d35Cc6631C0532925a3b8D2a0644C30f7B5C9',
    registered: true,
    tokenBalance: 1500000,
    pendingRewards: 250000
  };

  const mockResearchProposals = [
    {
      id: 'proposal_1',
      title: 'Cardiovascular Health Study',
      description: 'Study on blood pressure patterns',
      dataRequirements: ['bloodPressure', 'heartRate'],
      reward: 500000,
      consentGranted: false
    },
    {
      id: 'proposal_2',
      title: 'Diabetes Research',
      description: 'Long-term diabetes medication effects',
      dataRequirements: ['bloodGlucose', 'medications'],
      reward: 750000,
      consentGranted: true
    }
  ];

  const mockMedicalData = {
    bloodPressure: '120/80',
    heartRate: 72,
    bloodGlucose: 95
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('Patient Information Display', () => {
    it('should display patient information correctly', () => {
      render(
        <PatientDashboard
          patient={mockPatient}
          researchProposals={[]}
          medicalData={{}}
        />
      );

      expect(screen.getByTestId('patient-id')).toHaveTextContent(mockPatient.id);
      expect(screen.getByTestId('patient-address')).toHaveTextContent(mockPatient.address);
      expect(screen.getByTestId('registration-status')).toHaveTextContent('Registered');
    });

    it('should display unregistered state correctly', () => {
      const unregisteredPatient = { ...mockPatient, registered: false };

      render(
        <PatientDashboard
          patient={unregisteredPatient}
          researchProposals={[]}
          medicalData={{}}
        />
      );

      expect(screen.getByTestId('registration-status')).toHaveTextContent('Not registered');
    });

    it('should handle missing patient data gracefully', () => {
      render(
        <PatientDashboard
          patient={null}
          researchProposals={[]}
          medicalData={{}}
        />
      );

      expect(screen.getByTestId('patient-id')).toHaveTextContent('Not set');
      expect(screen.getByTestId('patient-address')).toHaveTextContent('Not connected');
    });
  });

  describe('Medical Data Management', () => {
    it('should display medical data summary', () => {
      render(
        <PatientDashboard
          patient={mockPatient}
          researchProposals={[]}
          medicalData={mockMedicalData}
        />
      );

      expect(screen.getByTestId('data-summary')).toHaveTextContent('3 data fields');
    });

    it('should handle empty medical data', () => {
      render(
        <PatientDashboard
          patient={mockPatient}
          researchProposals={[]}
          medicalData={{}}
        />
      );

      expect(screen.getByTestId('data-summary')).toHaveTextContent('No data available');
    });

    it('should trigger data update callback', async () => {
      const mockOnDataUpdate = vi.fn();

      render(
        <PatientDashboard
          patient={mockPatient}
          onDataUpdate={mockOnDataUpdate}
          researchProposals={[]}
          medicalData={mockMedicalData}
        />
      );

      fireEvent.click(screen.getByTestId('update-data-btn'));

      expect(mockOnDataUpdate).toHaveBeenCalledWith({ bloodPressure: '120/80' });
    });
  });

  describe('Research Proposals', () => {
    it('should display research proposals correctly', () => {
      render(
        <PatientDashboard
          patient={mockPatient}
          researchProposals={mockResearchProposals}
          medicalData={mockMedicalData}
        />
      );

      expect(screen.getByTestId('proposal-proposal_1')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-proposal_2')).toBeInTheDocument();

      expect(screen.getByTestId('proposal-reward-proposal_1')).toHaveTextContent('500000 tokens');
      expect(screen.getByTestId('proposal-fields-proposal_1')).toHaveTextContent('bloodPressure, heartRate');
    });

    it('should handle no research proposals', () => {
      render(
        <PatientDashboard
          patient={mockPatient}
          researchProposals={[]}
          medicalData={mockMedicalData}
        />
      );

      expect(screen.getByTestId('no-proposals')).toHaveTextContent('No research proposals available');
    });

    it('should handle consent granting', async () => {
      const mockOnConsentGrant = vi.fn();

      render(
        <PatientDashboard
          patient={mockPatient}
          onConsentGrant={mockOnConsentGrant}
          researchProposals={mockResearchProposals}
          medicalData={mockMedicalData}
        />
      );

      fireEvent.click(screen.getByTestId('grant-consent-proposal_1'));

      expect(mockOnConsentGrant).toHaveBeenCalledWith('proposal_1', ['bloodPressure', 'heartRate']);
    });

    it('should handle consent revocation', async () => {
      const mockOnConsentRevoke = vi.fn();

      render(
        <PatientDashboard
          patient={mockPatient}
          onConsentRevoke={mockOnConsentRevoke}
          researchProposals={mockResearchProposals}
          medicalData={mockMedicalData}
        />
      );

      fireEvent.click(screen.getByTestId('revoke-consent-proposal_2'));

      expect(mockOnConsentRevoke).toHaveBeenCalledWith('proposal_2');
    });

    it('should show different button states based on consent status', () => {
      render(
        <PatientDashboard
          patient={mockPatient}
          researchProposals={mockResearchProposals}
          medicalData={mockMedicalData}
        />
      );

      const grantBtn1 = screen.getByTestId('grant-consent-proposal_1');
      const grantBtn2 = screen.getByTestId('grant-consent-proposal_2');
      const revokeBtn = screen.getByTestId('revoke-consent-proposal_2');

      expect(grantBtn1).not.toBeDisabled();
      expect(grantBtn1).toHaveTextContent('Grant Consent');

      expect(grantBtn2).toBeDisabled();
      expect(grantBtn2).toHaveTextContent('Consent Granted');

      expect(revokeBtn).toBeInTheDocument();
    });
  });

  describe('Rewards Display', () => {
    it('should display token balance and pending rewards', () => {
      render(
        <PatientDashboard
          patient={mockPatient}
          researchProposals={[]}
          medicalData={{}}
        />
      );

      expect(screen.getByTestId('token-balance')).toHaveTextContent('1500000 tokens');
      expect(screen.getByTestId('pending-rewards')).toHaveTextContent('250000 tokens');
    });

    it('should handle zero balances', () => {
      const patientWithZeroBalance = { ...mockPatient, tokenBalance: 0, pendingRewards: 0 };

      render(
        <PatientDashboard
          patient={patientWithZeroBalance}
          researchProposals={[]}
          medicalData={{}}
        />
      );

      expect(screen.getByTestId('token-balance')).toHaveTextContent('0 tokens');
      expect(screen.getByTestId('pending-rewards')).toHaveTextContent('0 tokens');
    });
  });
});

describe('ResearcherDashboard Component', () => {
  const mockResearcher = {
    id: 'researcher_123',
    institution: 'University Hospital'
  };

  const mockProposals = [
    {
      id: 'proposal_1',
      title: 'Heart Study',
      status: 'APPROVED',
      participantCount: 5
    },
    {
      id: 'proposal_2',
      title: 'Diabetes Study',
      status: 'PENDING',
      participantCount: 0
    }
  ];

  const mockAccessibleData = [
    {
      patientId: 'patient_1',
      fields: ['bloodPressure', 'heartRate']
    },
    {
      patientId: 'patient_2',
      fields: ['bloodGlucose']
    }
  ];

  describe('Researcher Information', () => {
    it('should display researcher information', () => {
      render(
        <ResearcherDashboard
          researcher={mockResearcher}
          proposals={[]}
          accessibleData={[]}
        />
      );

      expect(screen.getByTestId('researcher-id')).toHaveTextContent(mockResearcher.id);
      expect(screen.getByTestId('institution')).toHaveTextContent(mockResearcher.institution);
    });
  });

  describe('Proposal Submission', () => {
    it('should handle proposal submission', async () => {
      const mockOnProposalSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <ResearcherDashboard
          researcher={mockResearcher}
          onProposalSubmit={mockOnProposalSubmit}
          proposals={[]}
          accessibleData={[]}
        />
      );

      await user.type(screen.getByTestId('proposal-title-input'), 'Test Study');
      await user.type(screen.getByTestId('proposal-description-input'), 'Test Description');
      await user.type(screen.getByTestId('proposal-data-requirements-input'), 'bloodPressure,heartRate');
      await user.type(screen.getByTestId('proposal-reward-input'), '1000000');

      fireEvent.click(screen.getByTestId('submit-proposal-btn'));

      expect(mockOnProposalSubmit).toHaveBeenCalledWith({
        title: 'Test Study',
        description: 'Test Description',
        dataRequirements: ['bloodPressure', 'heartRate'],
        reward: 1000000
      });
    });

    it('should require all form fields', () => {
      render(
        <ResearcherDashboard
          researcher={mockResearcher}
          proposals={[]}
          accessibleData={[]}
        />
      );

      const titleInput = screen.getByTestId('proposal-title-input');
      const descInput = screen.getByTestId('proposal-description-input');
      const dataInput = screen.getByTestId('proposal-data-requirements-input');
      const rewardInput = screen.getByTestId('proposal-reward-input');

      expect(titleInput).toBeRequired();
      expect(descInput).toBeRequired();
      expect(dataInput).toBeRequired();
      expect(rewardInput).toBeRequired();
    });
  });

  describe('Proposal Management', () => {
    it('should display researcher proposals', () => {
      render(
        <ResearcherDashboard
          researcher={mockResearcher}
          proposals={mockProposals}
          accessibleData={[]}
        />
      );

      expect(screen.getByTestId('my-proposal-proposal_1')).toBeInTheDocument();
      expect(screen.getByTestId('proposal-status-proposal_1')).toHaveTextContent('APPROVED');
      expect(screen.getByTestId('proposal-participants-proposal_1')).toHaveTextContent('5');
    });

    it('should handle no proposals', () => {
      render(
        <ResearcherDashboard
          researcher={mockResearcher}
          proposals={[]}
          accessibleData={[]}
        />
      );

      expect(screen.getByTestId('no-my-proposals')).toHaveTextContent('No proposals submitted yet');
    });
  });

  describe('Data Access', () => {
    it('should display accessible patient data', () => {
      render(
        <ResearcherDashboard
          researcher={mockResearcher}
          proposals={[]}
          accessibleData={mockAccessibleData}
        />
      );

      expect(screen.getByTestId('accessible-patient_1')).toBeInTheDocument();
      expect(screen.getByText('Fields: bloodPressure, heartRate')).toBeInTheDocument();
    });

    it('should handle data access requests', () => {
      const mockOnDataAccess = vi.fn();

      render(
        <ResearcherDashboard
          researcher={mockResearcher}
          onDataAccess={mockOnDataAccess}
          proposals={[]}
          accessibleData={mockAccessibleData}
        />
      );

      fireEvent.click(screen.getByTestId('access-data-patient_1'));

      expect(mockOnDataAccess).toHaveBeenCalledWith('patient_1', ['bloodPressure', 'heartRate']);
    });

    it('should handle no accessible data', () => {
      render(
        <ResearcherDashboard
          researcher={mockResearcher}
          proposals={[]}
          accessibleData={[]}
        />
      );

      expect(screen.getByTestId('no-accessible-data')).toHaveTextContent('No data access granted yet');
    });
  });
});

describe('WalletConnection Component', () => {
  describe('Connection States', () => {
    it('should show connect button when not connected', () => {
      const mockOnConnect = vi.fn();

      render(
        <WalletConnection
          isConnected={false}
          onConnect={mockOnConnect}
          onDisconnect={vi.fn()}
          address=""
        />
      );

      const connectBtn = screen.getByTestId('connect-wallet-btn');
      expect(connectBtn).toBeInTheDocument();
      expect(connectBtn).toHaveTextContent('Connect Wallet');

      fireEvent.click(connectBtn);
      expect(mockOnConnect).toHaveBeenCalled();
    });

    it('should show connected state when wallet is connected', () => {
      const mockOnDisconnect = vi.fn();
      const testAddress = '0x742d35Cc6631C0532925a3b8D2a0644C30f7B5C9';

      render(
        <WalletConnection
          isConnected={true}
          onConnect={vi.fn()}
          onDisconnect={mockOnDisconnect}
          address={testAddress}
        />
      );

      expect(screen.getByTestId('wallet-connected')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-address')).toHaveTextContent(testAddress);

      const disconnectBtn = screen.getByTestId('disconnect-wallet-btn');
      expect(disconnectBtn).toBeInTheDocument();

      fireEvent.click(disconnectBtn);
      expect(mockOnDisconnect).toHaveBeenCalled();
    });
  });

  describe('Wallet Integration', () => {
    it('should handle wallet connection flow', async () => {
      let isConnected = false;
      let address = '';

      const mockConnect = vi.fn(() => {
        isConnected = true;
        address = '0x742d35Cc6631C0532925a3b8D2a0644C30f7B5C9';
      });

      const mockDisconnect = vi.fn(() => {
        isConnected = false;
        address = '';
      });

      const { rerender } = render(
        <WalletConnection
          isConnected={isConnected}
          onConnect={mockConnect}
          onDisconnect={mockDisconnect}
          address={address}
        />
      );

      // Initially not connected
      expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument();

      // Click connect
      fireEvent.click(screen.getByTestId('connect-wallet-btn'));
      expect(mockConnect).toHaveBeenCalled();

      // Update state and rerender
      mockConnect(); // Simulate connection
      rerender(
        <WalletConnection
          isConnected={true}
          onConnect={mockConnect}
          onDisconnect={mockDisconnect}
          address="0x742d35Cc6631C0532925a3b8D2a0644C30f7B5C9"
        />
      );

      // Should now show connected state
      expect(screen.getByTestId('wallet-connected')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-address')).toHaveTextContent('0x742d35Cc6631C0532925a3b8D2a0644C30f7B5C9');
    });
  });
});
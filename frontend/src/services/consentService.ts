import { apiClient } from './api';
import { DataConsent, ConsentFormData, FilterOptions, PaginatedResponse, ApiResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

class ConsentService {
  async getConsents(params: {
    page?: number;
    limit?: number;
    filters?: FilterOptions;
    userType?: 'patient' | 'researcher';
  }): Promise<PaginatedResponse<DataConsent>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.userType) queryParams.append('userType', params.userType);

    // Add filter parameters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (value) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get<ApiResponse<PaginatedResponse<DataConsent>>>(
      `${API_ENDPOINTS.CONSENTS}?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch consents');
    }

    return response.data;
  }

  async getConsentById(id: string): Promise<DataConsent> {
    const response = await apiClient.get<ApiResponse<DataConsent>>(
      `${API_ENDPOINTS.CONSENTS}/${id}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch consent');
    }

    return response.data;
  }

  async createConsent(consentData: ConsentFormData): Promise<DataConsent> {
    const response = await apiClient.post<ApiResponse<DataConsent>>(
      API_ENDPOINTS.CREATE_CONSENT,
      consentData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create consent');
    }

    return response.data;
  }

  async approveConsent(id: string, signature: string, zkProof: string): Promise<DataConsent> {
    const response = await apiClient.post<ApiResponse<DataConsent>>(
      API_ENDPOINTS.APPROVE_CONSENT(id),
      { signature, zkProof }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to approve consent');
    }

    return response.data;
  }

  async rejectConsent(id: string, reason: string): Promise<DataConsent> {
    const response = await apiClient.post<ApiResponse<DataConsent>>(
      API_ENDPOINTS.REJECT_CONSENT(id),
      { reason }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to reject consent');
    }

    return response.data;
  }

  async revokeConsent(id: string): Promise<DataConsent> {
    const response = await apiClient.post<ApiResponse<DataConsent>>(
      `/api/consents/${id}/revoke`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to revoke consent');
    }

    return response.data;
  }

  async getPendingConsents(): Promise<DataConsent[]> {
    const response = await apiClient.get<ApiResponse<DataConsent[]>>(
      '/api/consents/pending'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch pending consents');
    }

    return response.data;
  }

  async getActiveConsents(): Promise<DataConsent[]> {
    const response = await apiClient.get<ApiResponse<DataConsent[]>>(
      '/api/consents/active'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch active consents');
    }

    return response.data;
  }

  async getConsentStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    totalEarnings: number;
    averageCompensation: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/api/consents/stats'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch consent stats');
    }

    return response.data;
  }

  async getConsentHistory(id: string): Promise<Array<{
    action: string;
    timestamp: string;
    user: string;
    details: string;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/consents/${id}/history`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch consent history');
    }

    return response.data;
  }

  async generateConsentZKProof(consentData: {
    patientId: string;
    researcherId: string;
    recordIds: string[];
    purpose: string;
    duration: number;
  }): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ proof: string }>>(
      '/api/consents/generate-proof',
      consentData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate ZK proof');
    }

    return response.data.proof;
  }

  async verifyConsentZKProof(consentId: string, proof: string): Promise<{ valid: boolean; details?: any }> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/api/consents/${consentId}/verify-proof`,
      { proof }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to verify ZK proof');
    }

    return response.data;
  }

  async renewConsent(id: string, duration: number): Promise<DataConsent> {
    const response = await apiClient.post<ApiResponse<DataConsent>>(
      `/api/consents/${id}/renew`,
      { duration }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to renew consent');
    }

    return response.data;
  }

  async updateCompensation(id: string, amount: number): Promise<DataConsent> {
    const response = await apiClient.patch<ApiResponse<DataConsent>>(
      `/api/consents/${id}/compensation`,
      { amount }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update compensation');
    }

    return response.data;
  }

  async getConsentTemplate(purpose: string): Promise<{
    template: string;
    requiredFields: string[];
    suggestedDuration: number;
    estimatedCompensation: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/consents/template?purpose=${encodeURIComponent(purpose)}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch consent template');
    }

    return response.data;
  }

  async validateConsentRequirements(consentData: ConsentFormData): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    suggestions?: string[];
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/api/consents/validate',
      consentData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to validate consent requirements');
    }

    return response.data;
  }

  async bulkApproveConsents(consentIds: string[], signature: string): Promise<{
    approved: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/api/consents/bulk-approve',
      { consentIds, signature }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to bulk approve consents');
    }

    return response.data;
  }

  async bulkRejectConsents(consentIds: string[], reason: string): Promise<{
    rejected: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/api/consents/bulk-reject',
      { consentIds, reason }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to bulk reject consents');
    }

    return response.data;
  }

  async getEarningsBreakdown(timeframe: 'week' | 'month' | 'year'): Promise<{
    total: number;
    byResearch: Array<{
      researchId: string;
      researchTitle: string;
      amount: number;
      timestamp: string;
    }>;
    byPeriod: Array<{
      period: string;
      amount: number;
      consentCount: number;
    }>;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/consents/earnings?timeframe=${timeframe}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch earnings breakdown');
    }

    return response.data;
  }

  async exportConsentData(format: 'csv' | 'json' | 'pdf', filters?: FilterOptions): Promise<void> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (value) {
          queryParams.append(key, value.toString());
        }
      });
    }

    await apiClient.download(`/api/consents/export?${queryParams.toString()}`);
  }

  async checkConsentExpiry(): Promise<Array<{
    consentId: string;
    expiresAt: string;
    daysRemaining: number;
    autoRenew: boolean;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/api/consents/expiry-check'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to check consent expiry');
    }

    return response.data;
  }
}

export const consentService = new ConsentService();
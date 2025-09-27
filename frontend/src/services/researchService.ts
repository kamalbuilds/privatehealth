import { apiClient } from './api';
import { ResearchProposal, DataRequest, ProposalFormData, FilterOptions, PaginatedResponse, ApiResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

class ResearchService {
  async getProposals(params: {
    page?: number;
    limit?: number;
    filters?: FilterOptions;
  }): Promise<PaginatedResponse<ResearchProposal>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

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

    const response = await apiClient.get<ApiResponse<PaginatedResponse<ResearchProposal>>>(
      `${API_ENDPOINTS.PROPOSALS}?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch proposals');
    }

    return response.data;
  }

  async getProposalById(id: string): Promise<ResearchProposal> {
    const response = await apiClient.get<ApiResponse<ResearchProposal>>(
      API_ENDPOINTS.PROPOSAL_DETAIL(id)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch proposal');
    }

    return response.data;
  }

  async createProposal(proposalData: ProposalFormData): Promise<ResearchProposal> {
    const response = await apiClient.post<ApiResponse<ResearchProposal>>(
      API_ENDPOINTS.CREATE_PROPOSAL,
      proposalData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create proposal');
    }

    return response.data;
  }

  async updateProposal(id: string, updates: Partial<ResearchProposal>): Promise<ResearchProposal> {
    const response = await apiClient.patch<ApiResponse<ResearchProposal>>(
      API_ENDPOINTS.PROPOSAL_DETAIL(id),
      updates
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update proposal');
    }

    return response.data;
  }

  async submitProposal(id: string): Promise<ResearchProposal> {
    const response = await apiClient.post<ApiResponse<ResearchProposal>>(
      `/api/research/proposals/${id}/submit`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to submit proposal');
    }

    return response.data;
  }

  async deleteProposal(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.PROPOSAL_DETAIL(id)
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete proposal');
    }
  }

  async getDataRequests(params: {
    proposalId?: string;
    status?: string;
  }): Promise<DataRequest[]> {
    const queryParams = new URLSearchParams();

    if (params.proposalId) queryParams.append('proposalId', params.proposalId);
    if (params.status) queryParams.append('status', params.status);

    const response = await apiClient.get<ApiResponse<DataRequest[]>>(
      `${API_ENDPOINTS.DATA_REQUESTS}?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch data requests');
    }

    return response.data;
  }

  async createDataRequest(requestData: {
    proposalId: string;
    patientId: string;
    recordIds: string[];
    message: string;
    compensation: number;
  }): Promise<DataRequest> {
    const response = await apiClient.post<ApiResponse<DataRequest>>(
      API_ENDPOINTS.DATA_REQUESTS,
      requestData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create data request');
    }

    return response.data;
  }

  async getAvailableDatasets(filters: {
    dataType?: string[];
    ageRange?: [number, number];
    genderFilter?: string;
    minSamples?: number;
  }): Promise<Array<{
    id: string;
    dataType: string;
    sampleCount: number;
    avgAge: number;
    genderDistribution: { male: number; female: number; other: number };
    tags: string[];
    privacyLevel: string;
    avgCompensation: number;
  }>> {
    const queryParams = new URLSearchParams();

    if (filters.dataType) {
      filters.dataType.forEach(type => queryParams.append('dataType', type));
    }
    if (filters.ageRange) {
      queryParams.append('minAge', filters.ageRange[0].toString());
      queryParams.append('maxAge', filters.ageRange[1].toString());
    }
    if (filters.genderFilter) {
      queryParams.append('gender', filters.genderFilter);
    }
    if (filters.minSamples) {
      queryParams.append('minSamples', filters.minSamples.toString());
    }

    const response = await apiClient.get<ApiResponse<any>>(
      `/api/research/datasets?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch available datasets');
    }

    return response.data;
  }

  async downloadDataset(params: {
    proposalId: string;
    consentIds: string[];
    format: 'csv' | 'json' | 'xml';
  }): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ downloadUrl: string }>>(
      '/api/research/download',
      params
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to prepare dataset download');
    }

    // Trigger download
    window.open(response.data.downloadUrl, '_blank');

    return response.data.downloadUrl;
  }

  async generateReport(proposalId: string): Promise<{
    reportId: string;
    downloadUrl: string;
    generatedAt: string;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/api/research/proposals/${proposalId}/report`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate report');
    }

    return response.data;
  }

  async getResearchStats(): Promise<{
    totalProposals: number;
    activeProposals: number;
    approvedRequests: number;
    totalBudgetSpent: number;
    datasetsAccessed: number;
    publicationsCount: number;
    collaborators: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/api/research/stats'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch research stats');
    }

    return response.data;
  }

  async validateProposal(proposalData: ProposalFormData): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    suggestions?: string[];
    estimatedCost?: number;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/api/research/validate-proposal',
      proposalData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to validate proposal');
    }

    return response.data;
  }

  async searchDatasets(query: string, filters?: {
    dataType?: string[];
    privacyLevel?: string[];
    minSamples?: number;
    maxCompensation?: number;
  }): Promise<Array<{
    id: string;
    title: string;
    description: string;
    dataType: string;
    sampleCount: number;
    tags: string[];
    privacyLevel: string;
    avgCompensation: number;
    relevanceScore: number;
  }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else if (value) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get<ApiResponse<any>>(
      `/api/research/search?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to search datasets');
    }

    return response.data;
  }

  async getBudgetBreakdown(proposalId: string): Promise<{
    totalBudget: number;
    allocated: number;
    spent: number;
    remaining: number;
    breakdown: Array<{
      category: string;
      budgeted: number;
      spent: number;
      remaining: number;
    }>;
    transactions: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      category: string;
    }>;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/research/proposals/${proposalId}/budget`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch budget breakdown');
    }

    return response.data;
  }

  async addCollaborator(proposalId: string, collaboratorData: {
    email: string;
    role: 'researcher' | 'analyst' | 'reviewer';
    permissions: string[];
  }): Promise<{
    collaboratorId: string;
    invitationSent: boolean;
  }> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/api/research/proposals/${proposalId}/collaborators`,
      collaboratorData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to add collaborator');
    }

    return response.data;
  }

  async removeCollaborator(proposalId: string, collaboratorId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/research/proposals/${proposalId}/collaborators/${collaboratorId}`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to remove collaborator');
    }
  }

  async getCollaborators(proposalId: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    joinedAt: string;
    lastActive: string;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/research/proposals/${proposalId}/collaborators`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch collaborators');
    }

    return response.data;
  }

  async exportProposalData(proposalId: string, format: 'pdf' | 'docx' | 'json'): Promise<void> {
    await apiClient.download(`/api/research/proposals/${proposalId}/export?format=${format}`);
  }

  async cloneProposal(proposalId: string, updates?: Partial<ProposalFormData>): Promise<ResearchProposal> {
    const response = await apiClient.post<ApiResponse<ResearchProposal>>(
      `/api/research/proposals/${proposalId}/clone`,
      updates
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to clone proposal');
    }

    return response.data;
  }

  async getProposalTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      defaultValue?: any;
    }>;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/api/research/templates'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch proposal templates');
    }

    return response.data;
  }
}

export const researchService = new ResearchService();
import { apiClient } from './api';
import { HealthRecord, UploadFormData, FilterOptions, SortOptions, PaginatedResponse, ApiResponse } from '@/types';
import { API_ENDPOINTS, UPLOAD_CONFIG } from '@/utils/constants';

class RecordsService {
  async getRecords(params: {
    page?: number;
    limit?: number;
    filters?: FilterOptions;
    sort?: SortOptions;
  }): Promise<PaginatedResponse<HealthRecord>> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) {
      queryParams.append('sortField', params.sort.field);
      queryParams.append('sortDirection', params.sort.direction);
    }

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

    const response = await apiClient.get<ApiResponse<PaginatedResponse<HealthRecord>>>(
      `${API_ENDPOINTS.RECORDS}?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch records');
    }

    return response.data;
  }

  async getRecordById(id: string): Promise<HealthRecord> {
    const response = await apiClient.get<ApiResponse<HealthRecord>>(
      API_ENDPOINTS.RECORD_DETAIL(id)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch record');
    }

    return response.data;
  }

  async uploadRecord(uploadData: UploadFormData): Promise<HealthRecord> {
    // Validate file
    this.validateFile(uploadData.file);

    // Create form data
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('dataType', uploadData.dataType);
    formData.append('privacyLevel', uploadData.privacyLevel);
    formData.append('tags', JSON.stringify(uploadData.tags));

    const response = await apiClient.upload<ApiResponse<HealthRecord>>(
      API_ENDPOINTS.UPLOAD_RECORD,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to upload record');
    }

    return response.data;
  }

  async updateRecord(id: string, updates: Partial<HealthRecord>): Promise<HealthRecord> {
    const response = await apiClient.patch<ApiResponse<HealthRecord>>(
      API_ENDPOINTS.RECORD_DETAIL(id),
      updates
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update record');
    }

    return response.data;
  }

  async deleteRecord(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.RECORD_DETAIL(id)
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete record');
    }
  }

  async generateZKProof(recordId: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ proof: string }>>(
      `/api/records/${recordId}/generate-proof`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate ZK proof');
    }

    return response.data.proof;
  }

  async verifyZKProof(recordId: string, proof: string): Promise<{ valid: boolean }> {
    const response = await apiClient.post<ApiResponse<{ valid: boolean }>>(
      `/api/records/${recordId}/verify-proof`,
      { proof }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to verify ZK proof');
    }

    return response.data;
  }

  async getRecordStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byPrivacyLevel: Record<string, number>;
    recentUploads: number;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/api/records/stats'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch record stats');
    }

    return response.data;
  }

  async searchRecords(query: string, filters?: FilterOptions): Promise<HealthRecord[]> {
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

    const response = await apiClient.get<ApiResponse<HealthRecord[]>>(
      `/api/records/search?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to search records');
    }

    return response.data;
  }

  async downloadRecord(id: string): Promise<void> {
    await apiClient.download(`/api/records/${id}/download`);
  }

  async getRecordHistory(id: string): Promise<Array<{
    action: string;
    timestamp: string;
    details: string;
    user: string;
  }>> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/records/${id}/history`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch record history');
    }

    return response.data;
  }

  async bulkDelete(recordIds: string[]): Promise<{ deleted: number; failed: number }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/api/records/bulk-delete',
      { recordIds }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to delete records');
    }

    return response.data;
  }

  async bulkUpdateTags(recordIds: string[], tags: string[]): Promise<{ updated: number; failed: number }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/api/records/bulk-update-tags',
      { recordIds, tags }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update tags');
    }

    return response.data;
  }

  async bulkUpdatePrivacyLevel(recordIds: string[], privacyLevel: string): Promise<{ updated: number; failed: number }> {
    const response = await apiClient.post<ApiResponse<any>>(
      '/api/records/bulk-update-privacy',
      { recordIds, privacyLevel }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update privacy level');
    }

    return response.data;
  }

  async getRecordAnalytics(recordId: string): Promise<{
    accessCount: number;
    lastAccessed: string;
    consentCount: number;
    earnings: number;
    researchUsage: Array<{
      researchId: string;
      researchTitle: string;
      accessDate: string;
      compensation: number;
    }>;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/api/records/${recordId}/analytics`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch record analytics');
    }

    return response.data;
  }

  private validateFile(file: File): void {
    // Check file size
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Check file type
    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File type not supported');
    }
  }

  // Utility methods for client-side encryption (placeholder)
  async encryptFile(file: File, publicKey: string): Promise<Blob> {
    // This would implement client-side encryption using the public key
    // For now, return the original file
    console.log('Encrypting file with public key:', publicKey);
    return file;
  }

  async decryptFile(encryptedData: Blob, privateKey: string): Promise<Blob> {
    // This would implement client-side decryption using the private key
    // For now, return the original data
    console.log('Decrypting file with private key:', privateKey);
    return encryptedData;
  }

  async generateFileHash(file: File): Promise<string> {
    // Generate SHA-256 hash of file contents
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}

export const recordsService = new RecordsService();
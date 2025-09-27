import { apiClient } from './api';
import { User, UserProfile, ApiResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

export interface LoginCredentials {
  address: string;
  signature: string;
}

export interface RegisterData {
  address: string;
  signature: string;
  userType: 'patient' | 'researcher';
  profile: Partial<UserProfile>;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.LOGIN,
      credentials
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }

    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.REGISTER,
      userData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Registration failed');
    }

    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      API_ENDPOINTS.PROFILE
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch profile');
    }

    return response.data;
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<{ user: User }> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>(
      API_ENDPOINTS.PROFILE,
      { profile: profileData }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update profile');
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we still clear local data
      console.warn('Logout request failed:', error);
    }

    // Always clear local authentication data
    apiClient.clearAuthToken();
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/refresh',
      { refreshToken }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Token refresh failed');
    }

    return response.data;
  }

  async verifyEmail(token: string): Promise<{ user: User }> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>(
      '/auth/verify-email',
      { token }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Email verification failed');
    }

    return response.data;
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      { email }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Password reset request failed');
    }

    return response.data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      { token, password: newPassword }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Password reset failed');
    }

    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/change-password',
      { currentPassword, newPassword }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Password change failed');
    }

    return response.data;
  }

  async validateSession(): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await apiClient.get<ApiResponse<{ valid: boolean; user?: User }>>(
        '/auth/validate'
      );

      if (!response.success) {
        return { valid: false };
      }

      return response.data || { valid: false };
    } catch (error) {
      return { valid: false };
    }
  }

  async updateNotificationSettings(settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    consentUpdates: boolean;
    dataRequests: boolean;
    researchUpdates: boolean;
  }): Promise<{ user: User }> {
    const response = await apiClient.patch<ApiResponse<{ user: User }>>(
      '/auth/notification-settings',
      settings
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update notification settings');
    }

    return response.data;
  }

  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      '/auth/account?password=' + encodeURIComponent(password)
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Account deletion failed');
    }

    return response.data;
  }

  async getTwoFactorSecret(): Promise<{ secret: string; qrCode: string }> {
    const response = await apiClient.get<ApiResponse<{ secret: string; qrCode: string }>>(
      '/auth/2fa/setup'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to generate 2FA secret');
    }

    return response.data;
  }

  async enableTwoFactor(token: string): Promise<{ backupCodes: string[] }> {
    const response = await apiClient.post<ApiResponse<{ backupCodes: string[] }>>(
      '/auth/2fa/enable',
      { token }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to enable 2FA');
    }

    return response.data;
  }

  async disableTwoFactor(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/2fa/disable',
      { token }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to disable 2FA');
    }

    return response.data;
  }
}

export const authService = new AuthService();
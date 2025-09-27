import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, STORAGE_KEYS, TIMING_CONFIG } from '@/utils/constants';
import { store } from '@/store';
import { setGlobalLoading, setGlobalError } from '@/store/slices/uiSlice';
import { clearAuth } from '@/store/slices/authSlice';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMING_CONFIG.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token to requests
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Set global loading state
        store.dispatch(setGlobalLoading(true));

        return config;
      },
      (error) => {
        store.dispatch(setGlobalLoading(false));
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        store.dispatch(setGlobalLoading(false));
        store.dispatch(setGlobalError(null));
        return response;
      },
      (error: AxiosError) => {
        store.dispatch(setGlobalLoading(false));

        // Handle common error scenarios
        if (error.response?.status === 401) {
          // Unauthorized - clear auth and redirect to login
          store.dispatch(clearAuth());
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
          window.location.href = '/login';
        } else if (error.response?.status === 403) {
          // Forbidden
          store.dispatch(setGlobalError('You do not have permission to perform this action'));
        } else if (error.response?.status >= 500) {
          // Server errors
          store.dispatch(setGlobalError('Server error. Please try again later.'));
        } else if (!error.response) {
          // Network errors
          store.dispatch(setGlobalError('Network error. Please check your connection.'));
        }

        return Promise.reject(error);
      }
    );
  }

  // GET request
  async get<T = any>(url: string, params?: object): Promise<T> {
    try {
      const response = await this.client.get<T>(url, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST request
  async post<T = any>(url: string, data?: object, config?: object): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT request
  async put<T = any>(url: string, data?: object): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH request
  async patch<T = any>(url: string, data?: object): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE request
  async delete<T = any>(url: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File upload
  async upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    try {
      const response = await this.client.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Download file
  async download(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename || 'download';

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL
      URL.revokeObjectURL(link.href);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Stream data (for real-time updates)
  async stream(url: string, onData: (data: any) => void, onError?: (error: any) => void): Promise<() => void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'stream',
      });

      const reader = response.data.getReader();
      let cancelled = false;

      const processStream = async () => {
        try {
          while (!cancelled) {
            const { done, value } = await reader.read();

            if (done) break;

            // Parse the data (assuming JSON)
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                onData(data);
              } catch (parseError) {
                console.warn('Failed to parse stream data:', parseError);
              }
            }
          }
        } catch (error) {
          if (onError) {
            onError(error);
          } else {
            console.error('Stream error:', error);
          }
        }
      };

      processStream();

      // Return cancel function
      return () => {
        cancelled = true;
        reader.cancel();
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      return await this.get('/health');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Set auth token
  setAuthToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  // Clear auth token
  clearAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // Error handling
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response received
      return new Error('Network error - no response from server');
    } else {
      // Something else happened
      return new Error(error.message || 'Unknown error occurred');
    }
  }

  // Get raw axios instance for advanced usage
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export types for use in services
export type { AxiosResponse, AxiosError };
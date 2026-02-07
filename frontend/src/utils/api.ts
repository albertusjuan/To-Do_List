import { supabase } from '../config/supabase';

/**
 * Get the current user's JWT token
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Enhanced fetch with automatic auth token injection
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * API helper with automatic JSON parsing and error handling
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await apiFetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return result;
  } catch (error: any) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T = any>(url: string) => 
    apiRequest<T>(url, { method: 'GET' }),
  
  post: <T = any>(url: string, data: any) => 
    apiRequest<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: <T = any>(url: string, data: any) => 
    apiRequest<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: <T = any>(url: string) => 
    apiRequest<T>(url, { method: 'DELETE' }),
};


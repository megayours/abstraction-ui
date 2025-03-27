import { toast } from 'sonner';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.text();
    toast.error(error || 'An error occurred');
    return { success: false, error };
  }

  const data = await response.json();
  return { success: true, data };
}

export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return handleApiResponse<T>(response);
  } catch (error) {
    console.error('API request failed:', error);
    toast.error('Failed to make API request');
    return { success: false, error: 'Failed to make API request' };
  }
} 
import { config } from '../config';

export interface Collection {
  id: number;
  name: string;
  account_id: string;
  is_published: boolean;
  created_at: string | Date | number;
  updated_at: string | Date | number;
  modules: string[];
}

export interface Token {
  id: string;
  collection_id: number;
  data: Record<string, any>;
  is_published: boolean;
  created_at: string | Date | number;
  updated_at: string | Date | number;
}

export interface Account {
  id: string;
  type: string;
  created_at: string | Date | number;
  updated_at: string | Date | number;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  schema: Record<string, any>;
  created_at: number;
  updated_at: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type BulkTokenCreatePayload = {
  id: string; // Token ID
  data: Record<string, any>; // Metadata
};

// Interface for the paginated response structure
export interface PaginatedTokensResponse {
  data: Token[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

const API_URL = config.megadataApiUri;

const addAuthHeaders = (headers: HeadersInit) => {
  return {
    ...headers,
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'X-App-Pub-Key': `${localStorage.getItem('app_pub_key')}`
  }
}

export async function getCollections(): Promise<Collection[]> {
  const response = await fetch(`${API_URL}/megadata/collections`, {
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to fetch collections');
  }
  return response.json();
}

export async function createCollection(name: string, modules: string[]): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections`, {
    method: 'POST',
    headers: addAuthHeaders({}),
    body: JSON.stringify({ name, modules }),
  });
  if (!response.ok) {
    throw new Error('Failed to create collection');
  }
  return response.json();
}

export async function getCollection(collection_id: number): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}`, {
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to fetch collection');
  }
  return response.json();
}

export async function updateCollection(collection_id: number, name: string): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}`, {
    method: 'PUT',
    headers: addAuthHeaders({}),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to update collection');
  }
  return response.json();
}

export async function deleteCollection(collection_id: number): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}`, {
    method: 'DELETE',
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to delete collection');
  }
  return response.json();
}

export async function publishCollection(collection_id: number, token_ids: string[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/publish`, {
    method: 'PUT',
    headers: addAuthHeaders({}),
    body: JSON.stringify(token_ids),
  });
  if (!response.ok) {
    throw new Error('Failed to publish collection');
  }
  return response.json();
}

export async function getTokens(collection_id: number, page: number = 1, limit: number = 50): Promise<PaginatedTokensResponse> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens?page=${page}&limit=${limit}`, {
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch tokens' }));
    throw new Error(errorData.error || 'Failed to fetch tokens');
  }
  return response.json();
}

export async function getToken(collection_id: number, token_id: string): Promise<Token> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens/${token_id}`, {
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to fetch token');
  }
  return response.json();
}

export async function updateToken(collection_id: number, token_id: string, data: Record<string, any>): Promise<Token> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens/${token_id}`, {
    method: 'PUT',
    headers: addAuthHeaders({}),
    body: JSON.stringify({ data }),
  });
  if (!response.ok) {
    throw new Error('Failed to update token');
  }
  return response.json();
}

export async function deleteToken(collection_id: number, token_id: string): Promise<Token> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens/${token_id}`, {
    method: 'DELETE',
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to delete token');
  }
  return response.json();
}

export async function getAccounts(): Promise<Account[]> {
  const response = await fetch(`${API_URL}/accounts`, {
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }
  return response.json();
}

export async function createAccount(id: string, type: string): Promise<Account> {
  const response = await fetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: addAuthHeaders({}),
    body: JSON.stringify({ id, type }),
  });
  if (!response.ok) {
    throw new Error('Failed to create account');
  }
  return response.json();
}

export async function getAccount(id: string): Promise<Account> {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to fetch account');
  }
  return response.json();
}

export async function deleteAccount(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to delete account');
  }
  return response.json();
}

export async function getModules(): Promise<Module[]> {
  const response = await fetch(`${API_URL}/modules`, {
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to fetch modules');
  }
  return response.json();
}

export async function getModule(id: string): Promise<Module> {
  const response = await fetch(`${API_URL}/modules/${id}`, {
    headers: addAuthHeaders({})
  });
  if (!response.ok) {
    throw new Error('Failed to fetch module');
  }
  return response.json();
}

export async function validateModuleData(moduleId: string, data: Record<string, any>): Promise<ValidationResult> {
  const response = await fetch(`${API_URL}/modules/${moduleId}/validate`, {
    method: 'POST',
    headers: addAuthHeaders({}),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to validate data');
  }
  return response.json();
}

// Publish specific tokens within a collection
export const publishTokens = async (collectionId: number, tokenIds: string[], publishAll: boolean = false): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}/megadata/collections/${collectionId}/publish`, {
    method: 'PUT',
    headers: addAuthHeaders({}),
    body: JSON.stringify({
      token_ids: tokenIds,
      all: publishAll
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to publish tokens');
  }
  return response.json();
};

export const createTokensBulk = async (
  collectionId: number,
  tokens: BulkTokenCreatePayload[]
): Promise<Token[]> => {
  const response = await fetch(`${API_URL}/megadata/collections/${collectionId}/tokens`, {
    method: 'POST',
    headers: addAuthHeaders({}),
    body: JSON.stringify(tokens),
  });
  if (!response.ok) {
    throw new Error('Failed to create tokens');
  }
  return response.json();
};
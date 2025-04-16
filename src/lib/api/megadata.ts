import { config } from '../config';

export interface Collection {
  id: number;
  name: string;
  account_id: string;
  is_published: boolean;
  created_at: string | Date | number;
  updated_at: string | Date | number;
  modules: string[];
  type: string;
}

export interface Token {
  id: string;
  collection_id: number;
  data: Record<string, any>;
  modules: string[];
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

export type ExternalCollectionCreatePayload = {
  source: string;
  id: string;
  type: string;
};

export type ExternalCollectionDetails = {
  collection_id: number;
  source: string;
  id: string;
  type: string;
  last_checked: number | null;
  created_at: number;
  updated_at: number;
};

export interface ExternalCollection extends Collection {
  type: 'external';
  external_details: ExternalCollectionDetails;
}

export type BulkTokenCreatePayload = {
  id: string; // Token ID
  data: Record<string, any>; // Metadata
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
};

// Interface for the paginated response structure
export interface PaginatedTokensResponse extends Pagination {
  tokens: Token[];
}

// Types for token config endpoint
export type TokenTypeConfig = {
  name: string;
  type: string;
};

export type TokenConfig = {
  name: string;
  token_types: TokenTypeConfig[];
};

const API_URL = config.megadataApiUri;

// Add the local addAuthHeaders function back
const addAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  // Check if running in a browser environment before accessing localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const appPubKey = localStorage.getItem('app_pub_key');
    const authHeaders: Record<string, string> = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
    if (appPubKey) {
      authHeaders['X-App-Pub-Key'] = appPubKey;
    }
    return {
      ...headers,
      ...authHeaders,
    };
  }
  return headers; // Return original headers if not in browser
}

export type GetCollectionsParams = {
  type?: 'internal' | 'external';
  accountId?: string; // User's wallet address for filtering their collections
};

export async function getCollections(params?: GetCollectionsParams): Promise<Collection[]> {
  const queryParams = new URLSearchParams();
  if (params?.type) {
    queryParams.append('type', params.type);
  }
  if (params?.accountId) {
    queryParams.append('account_id', params.accountId);
  }
  const queryString = queryParams.toString();
  const url = `${API_URL}/megadata/collections${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    throw new Error('Failed to fetch collections');
  }
  return response.json();
}

export async function createCollection(name: string): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections`, {
    method: 'POST',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to create collection');
  }
  return response.json();
}

export async function getCollection(collection_id: number): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }) // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to fetch collection');
  }
  return response.json();
}

export async function updateCollection(collection_id: number, name: string): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}`, {
    method: 'PUT',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
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
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }) // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to delete collection');
  }
  return response.json();
}

export async function publishCollection(collection_id: number, token_ids: string[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/publish`, {
    method: 'PUT',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
    body: JSON.stringify(token_ids),
  });
  if (!response.ok) {
    throw new Error('Failed to publish collection');
  }
  return response.json();
}

export async function getTokens(collection_id: number, page: number = 1, limit: number = 50): Promise<PaginatedTokensResponse> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens?page=${page}&limit=${limit}`, {
    headers: addAuthHeaders() // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch tokens' }));
    throw new Error(errorData.error || 'Failed to fetch tokens');
  }
  return response.json();
}

export async function getToken(collection_id: number, token_id: string): Promise<Token> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens/${token_id}`, {
    headers: addAuthHeaders() // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to fetch token');
  }
  return response.json();
}

export async function updateToken(collection_id: number, token_id: string, data: Record<string, any>, modules: string[]): Promise<Token> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens/${token_id}`, {
    method: 'PUT',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
    body: JSON.stringify({ data, modules }),
  });
  if (!response.ok) {
    throw new Error('Failed to update token');
  }
  return response.json();
}

export async function deleteToken(collection_id: number, token_id: string): Promise<Token> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens/${token_id}`, {
    method: 'DELETE',
    headers: addAuthHeaders() // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to delete token');
  }
  return response.json();
}

export async function getAccounts(): Promise<Account[]> {
  const response = await fetch(`${API_URL}/accounts`, {
    headers: addAuthHeaders() // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }
  return response.json();
}

export async function createAccount(id: string, type: string): Promise<Account> {
  const response = await fetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
    body: JSON.stringify({ id, type }),
  });
  if (!response.ok) {
    throw new Error('Failed to create account');
  }
  return response.json();
}

export async function getAccount(id: string): Promise<Account> {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }) // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to fetch account');
  }
  return response.json();
}

export async function deleteAccount(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }) // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to delete account');
  }
  return response.json();
}

export async function getModules(): Promise<Module[]> {
  const response = await fetch(`${API_URL}/modules`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }) // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to fetch modules');
  }
  return response.json();
}

export async function getModule(id: string): Promise<Module> {
  const response = await fetch(`${API_URL}/modules/${id}`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }) // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    throw new Error('Failed to fetch module');
  }
  return response.json();
}

// Publish specific tokens within a collection
export const publishTokens = async (collectionId: number, tokenIds: string[], publishAll: boolean = false): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}/megadata/collections/${collectionId}/publish`, {
    method: 'PUT',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
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
  tokens: Array<{
    id: string;
    data: Record<string, any>;
    modules: string[];
  }>
): Promise<Token[]> => {
  const response = await fetch(`${API_URL}/megadata/collections/${collectionId}/tokens`, {
    method: 'POST',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
    body: JSON.stringify(tokens),
  });
  if (!response.ok) {
    throw new Error('Failed to create tokens');
  }
  return response.json();
};

export const uploadFile = async (file: File): Promise<{ hash: string }> => {
  // Convert File to Base64
  const arrayBuffer = await file.arrayBuffer();
  const base64File = bufferToBase64(arrayBuffer);
  const response = await fetch(`${API_URL}/megahub/upload-file`, {
    method: 'POST',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      file: base64File,
      contentType: file.type || 'application/octet-stream',
      name: file.name,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  return response.json();
};

// Function to convert ArrayBuffer to Base64
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export async function validateToken(collectionId: number, tokenId: string): Promise<{ isValid: boolean; error?: string }> {
  const response = await fetch(`${API_URL}/megadata/collections/${collectionId}/tokens/${tokenId}/validate`, {
    method: 'GET',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
  });

  if (!response.ok) {
    throw new Error(`Failed to validate token: ${response.statusText}`);
  }

  return response.json();
}

export async function createExternalCollection(payload: ExternalCollectionCreatePayload): Promise<ExternalCollection> {
  const response = await fetch(`${API_URL}/megadata/external-collections`, {
    method: 'POST',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }), // Re-apply addAuthHeaders
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create external collection' }));
    throw new Error(errorData.error || 'Failed to create external collection');
  }
  return response.json();
}

export async function getExternalCollection(collectionId: number): Promise<ExternalCollectionDetails> {
  const url = `${API_URL}/megadata/external-collections/${collectionId}`;
  const response = await fetch(url, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }) // Re-apply addAuthHeaders
  });
  if (!response.ok) {
    // Consider more specific error handling based on status code (401, 404)
    throw new Error(`Failed to fetch external collection details for ID ${collectionId}`);
  }
  return response.json();
}

/**
 * Fetches available token sources and types from the /config/tokens endpoint.
 * Returns an array of token configs, each with a name and token_types.
 */
export async function getTokenConfigs(): Promise<TokenConfig[]> {
  const response = await fetch(`${API_URL}/config/tokens`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    throw new Error('Failed to fetch token configs');
  }
  return response.json();
}

/**
 * Fetches random tokens that have a specific attribute using the /megadata/tokens/random endpoint.
 * @param attribute The attribute to filter tokens by (e.g., 'image')
 * @param count The number of random tokens to fetch
 * @returns Promise<Token[]>
 */
export async function getRandomTokensByAttribute(attribute: string, count: number): Promise<Token[]> {
  const API_URL = config.megadataApiUri;
  const url = `${API_URL}/megadata/tokens/random?attribute=${encodeURIComponent(attribute)}&count=${count}`;
  const response = await fetch(url, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch random tokens' }));
    throw new Error(errorData.error || 'Failed to fetch random tokens');
  }
  return response.json();
}

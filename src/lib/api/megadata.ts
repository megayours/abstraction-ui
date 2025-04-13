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

export interface ExternalCollectionDetails {
  source: string;
  id: string;
  type: string;
  last_checked: number | null;
}

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

const API_URL = config.megadataApiUri;

const addAuthHeaders = (headers: HeadersInit) => {
  return {
    ...headers,
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'X-App-Pub-Key': `${localStorage.getItem('app_pub_key')}`
  }
}

// Define the type for the optional parameters for getCollections
type GetCollectionsParams = {
  type?: 'external'; // Or potentially other types in the future
};

export async function getCollections(params?: GetCollectionsParams): Promise<Collection[]> {
  let url = `${API_URL}/megadata/collections`; // Use let for mutable URL
  if (params?.type) {
    url += `?type=${params.type}`; // Append type query parameter if present
  }
  const response = await fetch(url, { // Use the potentially modified URL
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
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to create collection');
  }
  return response.json();
}

export async function getCollection(collection_id: number): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    throw new Error('Failed to fetch collection');
  }
  return response.json();
}

export async function updateCollection(collection_id: number, name: string): Promise<Collection> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}`, {
    method: 'PUT',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
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
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    throw new Error('Failed to delete collection');
  }
  return response.json();
}

export async function publishCollection(collection_id: number, token_ids: string[]): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/publish`, {
    method: 'PUT',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
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

export async function updateToken(collection_id: number, token_id: string, data: Record<string, any>, modules: string[]): Promise<Token> {
  const response = await fetch(`${API_URL}/megadata/collections/${collection_id}/tokens/${token_id}`, {
    method: 'PUT',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
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
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id, type }),
  });
  if (!response.ok) {
    throw new Error('Failed to create account');
  }
  return response.json();
}

export async function getAccount(id: string): Promise<Account> {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    throw new Error('Failed to fetch account');
  }
  return response.json();
}

export async function deleteAccount(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    throw new Error('Failed to delete account');
  }
  return response.json();
}

export async function getModules(): Promise<Module[]> {
  const response = await fetch(`${API_URL}/modules`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    throw new Error('Failed to fetch modules');
  }
  return response.json();
}

export async function getModule(id: string): Promise<Module> {
  const response = await fetch(`${API_URL}/modules/${id}`, {
    headers: addAuthHeaders({ 'Content-Type': 'application/json' })
  });
  if (!response.ok) {
    throw new Error('Failed to fetch module');
  }
  return response.json();
}

export async function validateModuleData(moduleId: string, data: Record<string, any>): Promise<ValidationResult> {
  const response = await fetch(`${API_URL}/modules/${moduleId}/validate`, {
    method: 'POST',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
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
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
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
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(tokens),
  });
  if (!response.ok) {
    throw new Error('Failed to create tokens');
  }
  return response.json();
};

export const uploadImage = async (image: File): Promise<{ hash: string }> => {
  // Convert File to Base64
  const arrayBuffer = await image.arrayBuffer();
  const base64File = bufferToBase64(arrayBuffer);
  const response = await fetch(`${API_URL}/megahub/upload-file`, {
    method: 'POST',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      file: base64File,
      contentType: image.type,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to upload image');
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
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to validate token: ${response.statusText}`);
  }

  return response.json();
}

export async function createExternalCollection(payload: ExternalCollectionCreatePayload): Promise<ExternalCollection> {
  const response = await fetch(`${API_URL}/megadata/external-collections`, {
    method: 'POST',
    headers: addAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create external collection' }));
    throw new Error(errorData.error || 'Failed to create external collection');
  }
  return response.json();
}

import { ApiResponse, SignatureData, AssetFilter } from "../types";
import { config } from "../config";

const url = config.megaForwarderUri;

export const registerContract = async (chain: string, contract: string, blockNumber: number, collection: string, type: string, signature: SignatureData) => {
  const response = await fetch(`${url}/task`, {
    method: 'POST',
    body: JSON.stringify({
      pluginId: 'evm-contract-registration',
      input: {
        chain,
        contract,
        blockNumber,
        collection,
        type,
        auth: signature
      }
    }),
  });
  return response.json();
}

export const fetchBlockNumber = async (chain: string) => {
  const response = await fetch(`${url}/task`, {
    method: 'POST',
    body: JSON.stringify({
      pluginId: 'evm-block-number',
      input: { chain }
    })
  });
  return response.json();
}

export async function submitAccountLinkingRequest(signatures: SignatureData[]): Promise<ApiResponse> {
  try {
    const response = await fetch(`${url}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pluginId: "account-linker",
        input: { signatures }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.error || 'Failed to submit account linking request',
        context: 'submit_account_linking_request'
      }
    }
    
    return data;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'submit_account_linking_request'
    }
  }
}

export async function createMegaDataCollection(signature: SignatureData): Promise<ApiResponse> {
  const response = await fetch(`${url}/task`, {
    method: 'POST',
    body: JSON.stringify({
      pluginId: 'manage-megadata',
      input: { 
        auth:signature,
        operation: 'create_collection'
      }
    })
  });

  const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.error || 'Failed to create mega data collection',
        context: 'create_megadata_collection'
      }
    }
    
    return { result: true };
}

export async function upsertMegaDataItem(signature: SignatureData, collection: string, tokenId: string, properties: Record<string, any>): Promise<ApiResponse> {
  const response = await fetch(`${url}/task`, {
    method: 'POST',
    body: JSON.stringify({
      pluginId: 'manage-megadata',
      input: { 
        auth:signature,
        operation: 'upsert_item',
        collection,
        tokenId,
        properties
      }
    })
  });

  const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.error || 'Failed to submit account linking request',
        context: 'upsert_megadata_item'
      }
    }
    
    return { result: true };
}

export async function deleteMegaDataItem(signature: SignatureData, collection: string, tokenId: string): Promise<ApiResponse> {
  const response = await fetch(`${url}/task`, {
    method: 'POST',
    body: JSON.stringify({
      pluginId: 'manage-megadata',
      input: { 
        auth:signature,
        operation: 'delete_item',
        collection,
        tokenId
      }
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    return {
      error: data.error || 'Failed to submit account linking request',
      context: 'delete_megadata_item'
    }
  }
  
  return { result: true };
}

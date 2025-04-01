import { ApiResponse, SignatureData } from "../types";
import { config } from "../config";

const url = config.megaForwarderUri;

export const registerAsset = async (source: string, asset: string, unit: number, name: string, type: string, signature: SignatureData) => {
  const response = await fetch(`${url}/task`, {
    method: 'POST',
    body: JSON.stringify({
      pluginId: 'asset-registration',
      input: {
        source,
        asset,
        unit,
        name,
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

type Operation = "create_collection" | "upsert_item" | "delete_item";

type OperationInput = {
  operation: Operation;
  name?: string;
  collection?: string;
  tokenId?: string;
  properties?: Record<string, any>;
};

type ManageMegadataInput = {
  auth: SignatureData;
  operations: OperationInput[];
};

export async function manageMegadata(input: ManageMegadataInput): Promise<ApiResponse> {
  try {
    const response = await fetch(`${url}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pluginId: 'manage-megadata',
        input
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'Failed to manage mega data',
        context: 'manage_megadata'
      }
    }

    return { result: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'manage_megadata'
    }
  }
}

export async function getAvailableSources(): Promise<string[]> {
  const response = await fetch(`${url}/sources`, {
    method: 'GET',
  });

  const data = await response.json();
  return data;
}

export async function upsertMegaDataItem(signature: SignatureData, collection: string, tokenId: string, properties: Record<string, any>): Promise<ApiResponse> {
  const response = await fetch(`${url}/task`, {
    method: 'POST',
    body: JSON.stringify({
      pluginId: 'manage-megadata',
      input: {
        auth: signature,
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
        auth: signature,
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

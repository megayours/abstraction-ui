import { ApiResponse, SignatureData, ManageQueryInput } from "../types";
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

type Item = {
  tokenId: string;
  properties: Record<string, any>;
};

type ManageMegadataInput = {
  auth: SignatureData;
  collection: string;
  items: Item[];
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

    // Transform the nested response format to our ApiSuccessResponse
    // New format example: {"result":{"value":{"id":"0195f565"}}}
    if (data.result?.value?.id) {
      return { 
        result: true,
        collectionId: data.result.value.id
      };
    }

    // Return the raw response if it doesn't match the expected format
    return data;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'manage_megadata'
    }
  }
}

export async function manageQuery(input: ManageQueryInput): Promise<ApiResponse> {
  try {
    const response = await fetch(`${url}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pluginId: 'manage-query',
        input
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'Failed to manage query',
        context: 'manage_query'
      }
    }

    return { result: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'manage_query'
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

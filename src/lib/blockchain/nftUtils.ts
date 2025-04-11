import { ethers } from 'ethers';

// Define the structure for the data we want to return
export interface DetectedTokenData {
  tokenId: string;
}

// Define the progress callback type
export type FetchProgressCallback = (fetched: number, total: number) => void;

// Minimal ABI for ERC721 Enumerable interface
const erc721Abi = [
  // ERC721Enumerable
  "function totalSupply() external view returns (uint256)",
  "function tokenByIndex(uint256 index) external view returns (uint256)"
];

// --- Metadata Fetching Helpers ---
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const ARWEAVE_GATEWAY = 'https://arweave.net/';

/**
 * Resolves IPFS/Arweave URIs to gateway URLs.
 * @param uri The original URI (http, ipfs, or ar).
 * @returns A fetchable URL.
 */
const resolveMetadataUri = (uri: string): string => {
  if (uri.startsWith('ipfs://')) {
    return `${IPFS_GATEWAY}${uri.substring(7)}`;
  }
  if (uri.startsWith('ar://')) {
    return `${ARWEAVE_GATEWAY}${uri.substring(5)}`;
  }
  // Assume http/https URLs are fine
  return uri;
};

/**
 * Fetches and parses JSON metadata from a given URI.
 * Handles URI resolution (IPFS/Arweave) and fetch errors.
 * @param uri The original metadata URI.
 * @returns The parsed JSON object or null if fetching/parsing fails.
 */
const fetchMetadata = async (uri: string): Promise<Record<string, any> | null> => {
  if (!uri) return null;

  const url = resolveMetadataUri(uri);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json' // Prefer JSON response
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch metadata from ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    // Attempt to parse as JSON, return null if not valid JSON
    const data = await response.json().catch(e => {
        console.error(`Failed to parse JSON metadata from ${url}:`, e);
        return null;
    }); 
    return data;
  } catch (error) {
    console.error(`Error fetching metadata from ${url}:`, error);
    return null;
  }
};

/**
 * Fetches token IDs for an ERC721 contract using the Enumerable extension.
 * Assumes the contract implements ERC721Enumerable.
 *
 * @param contractAddress The address of the ERC721 contract.
 * @param provider An ethers.js Provider instance.
 * @param onProgress Optional callback function to report progress.
 * @returns A promise that resolves to an array of token IDs.
 * @throws If the contract doesn't support enumeration or other RPC errors occur.
 */
export async function fetchErc721UrisViaEnumeration(
  contractAddress: string,
  provider: ethers.Provider,
  onProgress?: FetchProgressCallback
): Promise<DetectedTokenData[]> {
  const contract = new ethers.Contract(contractAddress, erc721Abi, provider);
  let networkName = 'unknown';
  let networkChainId = 'unknown';

  try {
    const network = await provider.getNetwork();
    networkName = network.name;
    networkChainId = network.chainId.toString();
    console.log(`Provider connected to network: ${networkName} (Chain ID: ${networkChainId})`);
  } catch (networkError) {
    console.warn("Could not determine provider network:", networkError);
  }

  let totalSupplyBigInt: bigint;

  try {
    totalSupplyBigInt = await contract.totalSupply();
    console.log(`Contract ${contractAddress} total supply: ${totalSupplyBigInt}`);
  } catch (error) {
    console.error(`Failed to get totalSupply for ${contractAddress} on network ${networkName} (Chain ID: ${networkChainId}).`, error);
    throw new Error(
      `Failed to get total supply on network '${networkName}'. ` +
      `Ensure the contract exists on this network and supports ERC721Enumerable.`
    );
  }

  const totalSupply = Number(totalSupplyBigInt); // Convert BigInt to Number
  if (totalSupply === 0) {
    console.log(`Contract ${contractAddress} has zero total supply.`);
    onProgress?.(0, 0);
    return [];
  }

  console.log(`Preparing to fetch data for ${totalSupply} tokens...`);
  onProgress?.(0, totalSupply); // Initial progress

  const allTokens: DetectedTokenData[] = [];
  const batchSize = 50; // How many tokens to process in each batch
  const delayBetweenBatches = 200; // Milliseconds delay
  let fetchedCount = 0;

  for (let i = 0; i < totalSupply; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, totalSupply);
    const batchIndices = Array.from({ length: batchEnd - i }, (_, k) => i + k);
    console.log(`Fetching batch indices ${i} to ${batchEnd - 1}`);

    try {
      // Fetch token IDs for the current batch of indices
      const tokenIdPromises = batchIndices.map(index => contract.tokenByIndex(index));
      const tokenIdsBigInt: bigint[] = await Promise.all(tokenIdPromises);
      const tokenIds = tokenIdsBigInt.map(id => id.toString());

      // Create token data objects
      const batchResults: DetectedTokenData[] = tokenIds.map(tokenId => ({
        tokenId
      }));

      allTokens.push(...batchResults);
      fetchedCount += batchResults.length;

      console.log(`Batch ${i / batchSize + 1} completed. Fetched ${fetchedCount}/${totalSupply} tokens.`);
      onProgress?.(fetchedCount, totalSupply); // Update progress

    } catch (batchError) {
      console.error(`Error fetching batch indices ${i} to ${batchEnd - 1}:`, batchError);
      throw new Error(`Failed to process token batch starting at index ${i}: ${batchError instanceof Error ? batchError.message : String(batchError)}`);
    }

    // Throttle before next batch
    if (batchEnd < totalSupply) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log(`Finished fetching all ${allTokens.length} tokens.`);
  return allTokens;
}

// --- Future Extensibility ---
// export async function fetchErc1155Uris(...) { ... }
// export async function detectAndFetchNftUris(address, provider) { ... detect standard ... call specific fetcher ... }

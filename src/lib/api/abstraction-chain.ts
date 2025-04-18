import { createClient, DictPair, IClient } from "postchain-client"
import { ApiResponse, AssetFilter, AssetInfo, AccountLink, MegaDataItem, MegaDataCollection, AssetGroup } from "../types";
import { fromHexBuffer } from "../util";
import { config } from "../config";

let client: IClient;

const toTimestamp = (date: string | undefined) => date ? new Date(date).getTime() : null;

const ensureClient = async () => {
  if (!client) {
    client = await createClient({
      directoryNodeUrlPool: config.abstractionChain.directoryNodeUrlPool,
      blockchainRid: config.abstractionChain.blockchainRid
    });
  }
  return client;
}

// Fetch available sources
export async function fetchSources(): Promise<string[]> {
  try {
    const client = await ensureClient();
    const sources = await client.query<string[]>('airdrop.get_sources', {});
    console.log('Fetched sources:', sources);
    return sources;
  } catch (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
}

// Fetch available assets for a given source
export async function fetchAssets(source: string): Promise<string[]> {
  if (!source) return [];

  try {
    const client = await ensureClient();
    const assets = await client.query<string[]>('airdrop.get_assets', {
      source
    });

    console.log('Fetched assets for source', source, ':', assets);
    return assets;
  } catch (error) {
    console.error('Error fetching assets for source', source, ':', error);
    return [];
  }
}

export async function fetchEligibleAccounts(filters: AssetFilter[], from?: string, to?: string): Promise<string[][]> {
  const client = await ensureClient();

  console.log('Fetching points data with filters:', filters);

  const results = await client.query<string[][]>('airdrop.get_accounts_filtered_by_assets', {
    filters: filters.map((f) => [
      f.source,
      f.asset,
      0
    ]),
    from: toTimestamp(from),
    to: toTimestamp(to)
  })

  console.log('Fetched accounts:', results);
  return results;
}

export const getSources = async () => {
  const client = await ensureClient();
  return client.query<string[]>('assets.get_sources', {});
}

export const getTypes = async ({ source }: { source?: string }) => {
  const client = await ensureClient();
  return client.query<string[]>('assets.get_types', { source: source || null });
}

export const getContracts = async ({ source, type }: { source?: string, type?: string }) => {
  const client = await ensureClient();
  return client.query<AssetInfo[]>('assets.get_assets_info', { source: source || null, type: type || null })
}

export const fetchAssetGroups = async (owner: string): Promise<AssetGroup[]> => {
  const client = await ensureClient();
  return client.query<{ id: Buffer, name: string, owner: string }[]>('asset_groups.get_asset_groups', { owner })
    .then((groups) => groups.map((group) => ({
      ...group,
      id: fromHexBuffer(group.id)
    })));
}

export const fetchAssetGroupFilters = async (groupId: Buffer) => {
  const client = await ensureClient();
  console.log('Fetching asset group filters for groupId:', groupId);
  return client.query<AssetFilter[]>('asset_groups.get_asset_group_filters', {
    asset_group_id: groupId
  });;
}

export async function createAssetGroup(id: string): Promise<ApiResponse> {
  try {
    const client = await ensureClient();
    await client.sendTransaction({
      name: 'asset_groups.create_asset_group',
      args: [id]
    });
    return { result: true };
  } catch (error) {
    console.error('Error creating asset group:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'create_asset_group'
    };
  }
}

export async function addAssetGroupFilter(
  groupId: string,
  source: string,
  asset: string,
  requires: number
): Promise<ApiResponse> {
  try {
    const client = await ensureClient();
    await client.sendTransaction({
      name: 'asset_groups.add_asset_group_filter',
      args: [groupId, source, asset, requires]
    });
    return { result: true };
  } catch (error) {
    console.error('Error adding asset group filter:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'add_asset_group_filter'
    };
  }
}

export async function removeAssetGroupFilter(
  groupId: string,
  source: string,
  asset: string
): Promise<ApiResponse> {
  try {
    const client = await ensureClient();
    await client.sendTransaction({
      name: 'asset_groups.remove_asset_group_filter',
      args: [groupId, source, asset]
    });
    return { result: true };
  } catch (error) {
    console.error('Error removing asset group filter:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      context: 'remove_asset_group_filter'
    };
  }
}

export async function fetchAccountLinks(search?: string): Promise<AccountLink[]> {
  try {
    const client = await ensureClient();
    const links = await client.query<Array<{ account: string, link: string }>>('account_links.get_account_links', {
      search: search || null
    });

    console.log('Fetched account links:', links);
    return links;
  } catch (error) {
    console.error('Error fetching account links:', error);
    return [];
  }
}

export async function unlinkAccounts(accountA: string, accountB: string) {
  const client = await ensureClient();
  await client.sendTransaction({
    operations: [
      {
        name: 'account_links.unlink_accounts',
        args: [accountA, accountB]
      }
    ],
    signers: []
  });
}

export async function getCollections(owner: string): Promise<MegaDataCollection[]> {
  const client = await ensureClient();
  const collections = await client.query<{ id: string, name: string }[]>('megadata.get_collections', {
    owner
  });
  return collections.map(collection => ({
    id: collection.id,
    name: collection.name
  }));
}

export async function getItems(collection: string): Promise<MegaDataItem[]> {
  const client = await ensureClient();
  const items = await client.query<{ collection: string, token_id: string, properties: DictPair }[]>('megadata.get_items', {
    collection
  });

  return items.map(item => ({
    collection: item.collection,
    tokenId: item.token_id,
    data: item.properties
  }));
}

export async function getItem(collection: string, token_id: string): Promise<MegaDataItem> {
  const client = await ensureClient();
  const item = await client.query<{ collection: Buffer, token_id: string, properties: DictPair }>('megadata.get_items', {
    collection,
    token_id
  });

  return {
    collection: fromHexBuffer(item.collection),
    tokenId: item.token_id,
    data: item.properties
  };
}
export type MegaDataCollection = {
  id: string;
  name: string;
}

export type AssetFilter =  {
  source: string;
  asset: string;
  requires: number; // balance requirement of specified asset
}

export type AssetGroup = {
  id: string;
  filters: AssetFilter[];
  created_at: number;
  updated_at: number;
}

export type AssetInfo = {
  source: string;
  id: string;
  unit: number;
  name: string;
  type: string;
}

export type SignatureData = {
  type: "evm" | "solana";
  timestamp: number;
  account: string;
  signature: string;
}

export interface AccountLink {
  account: string;
  link: string;
}

// API Response Types
export type ApiSuccessResponse = {
  result: true;
}

export type ApiErrorResponse = {
  error: string;
  context?: string;
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

export type MegaDataItem = {
  collection: string;
  tokenId: string;
  properties: Record<string, any>;
}
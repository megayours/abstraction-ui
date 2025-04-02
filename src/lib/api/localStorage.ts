import { MegaDataCollection, MegaDataItem } from "../types";

// Extended MegaDataCollection with publishing status
export interface ExtendedMegaDataCollection extends MegaDataCollection {
  published: boolean;
  numTokens: number;
  startingIndex: number;
  moduleSettings: {
    erc721?: {
      external_url?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

// Extended MegaDataItem to track editing status
export interface ExtendedMegaDataItem extends MegaDataItem {
  lastModified: number;
}

// Storage keys
const COLLECTIONS_KEY = 'megadata_collections';
const ITEMS_PREFIX = 'megadata_items_';

// Helper functions
const getCollectionsFromStorage = (): ExtendedMegaDataCollection[] => {
  const stored = localStorage.getItem(COLLECTIONS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse collections from localStorage', error);
    return [];
  }
};

const saveCollectionsToStorage = (collections: ExtendedMegaDataCollection[]): void => {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
};

const getItemsFromStorage = (collectionId: string): ExtendedMegaDataItem[] => {
  const stored = localStorage.getItem(`${ITEMS_PREFIX}${collectionId}`);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Failed to parse items for collection ${collectionId}`, error);
    return [];
  }
};

const saveItemsToStorage = (collectionId: string, items: ExtendedMegaDataItem[]): void => {
  localStorage.setItem(`${ITEMS_PREFIX}${collectionId}`, JSON.stringify(items));
};

// API functions

// Collection functions
export const getLocalCollections = (owner: string): ExtendedMegaDataCollection[] => {
  return getCollectionsFromStorage();
};

export const createLocalCollection = (
  name: string, 
  numTokens: number, 
  startingIndex: number,
  moduleSettings: ExtendedMegaDataCollection['moduleSettings']
): ExtendedMegaDataCollection => {
  const collections = getCollectionsFromStorage();
  
  // Generate a unique ID for the collection
  const id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const newCollection: ExtendedMegaDataCollection = {
    id,
    name,
    published: false,
    numTokens,
    startingIndex,
    moduleSettings
  };
  
  // Save the new collection
  collections.push(newCollection);
  saveCollectionsToStorage(collections);
  
  // Initialize tokens based on numTokens and starting index
  const items: ExtendedMegaDataItem[] = [];
  
  for (let i = 0; i < numTokens; i++) {
    const tokenId = String(startingIndex + i);
    items.push({
      collection: id,
      tokenId,
      properties: {
        erc721: {
          name: `${name} #${tokenId}`,
          ...(moduleSettings.erc721 || {})
        }
      },
      lastModified: Date.now()
    });
  }
  
  // Save the items
  saveItemsToStorage(id, items);
  
  return newCollection;
};

export const publishLocalCollection = (collectionId: string, blockchainId?: string): boolean => {
  const collections = getCollectionsFromStorage();
  const collectionIndex = collections.findIndex(c => c.id === collectionId);
  
  if (collectionIndex === -1) return false;
  
  // Mark the collection as published
  collections[collectionIndex].published = true;
  
  // If a blockchain ID is provided, update the ID to maintain the link
  if (blockchainId) {
    // Save the items with the new collection ID
    const items = getItemsFromStorage(collectionId);
    const updatedItems = items.map(item => ({
      ...item,
      collection: blockchainId
    }));
    
    // Save the items under the new ID
    saveItemsToStorage(blockchainId, updatedItems);
    
    // Delete the items under the old ID
    localStorage.removeItem(`${ITEMS_PREFIX}${collectionId}`);
    
    // Update the collection ID
    collections[collectionIndex].id = blockchainId;
  }
  
  saveCollectionsToStorage(collections);
  
  return true;
};

export const deleteLocalCollection = (collectionId: string): boolean => {
  const collections = getCollectionsFromStorage();
  const filteredCollections = collections.filter(c => c.id !== collectionId);
  
  if (filteredCollections.length === collections.length) return false;
  
  saveCollectionsToStorage(filteredCollections);
  
  // Also remove the associated items
  localStorage.removeItem(`${ITEMS_PREFIX}${collectionId}`);
  
  return true;
};

// Item functions
export const getLocalItems = (collectionId: string): ExtendedMegaDataItem[] => {
  return getItemsFromStorage(collectionId);
};

export const getLocalItem = (collectionId: string, tokenId: string): ExtendedMegaDataItem | null => {
  const items = getItemsFromStorage(collectionId);
  return items.find(item => item.tokenId === tokenId) || null;
};

export const saveLocalItem = (item: ExtendedMegaDataItem): boolean => {
  const { collection: collectionId } = item;
  
  // Check if the collection exists and is not published
  const collections = getCollectionsFromStorage();
  const collectionData = collections.find(c => c.id === collectionId);
  
  if (!collectionData) return false;
  if (collectionData.published) return false; // Can't modify published collections
  
  const items = getItemsFromStorage(collectionId);
  const itemIndex = items.findIndex(i => i.tokenId === item.tokenId);
  
  // Update lastModified timestamp
  const updatedItem = { 
    ...item, 
    lastModified: Date.now() 
  };
  
  if (itemIndex === -1) {
    // New item
    items.push(updatedItem);
  } else {
    // Update existing item
    items[itemIndex] = updatedItem;
  }
  
  saveItemsToStorage(collectionId, items);
  return true;
};

export const deleteLocalItem = (collectionId: string, tokenId: string): boolean => {
  // Check if the collection exists and is not published
  const collections = getCollectionsFromStorage();
  const collectionData = collections.find(c => c.id === collectionId);
  
  if (!collectionData) return false;
  if (collectionData.published) return false; // Can't modify published collections
  
  const items = getItemsFromStorage(collectionId);
  const filteredItems = items.filter(i => i.tokenId !== tokenId);
  
  if (filteredItems.length === items.length) return false;
  
  saveItemsToStorage(collectionId, filteredItems);
  return true;
};

// Import/Export functions
export const exportLocalData = (): { collections: ExtendedMegaDataCollection[], items: Record<string, ExtendedMegaDataItem[]> } => {
  const collections = getCollectionsFromStorage();
  const items: Record<string, ExtendedMegaDataItem[]> = {};
  
  for (const collection of collections) {
    items[collection.id] = getItemsFromStorage(collection.id);
  }
  
  return { collections, items };
};

export const importLocalData = (data: { collections: ExtendedMegaDataCollection[], items: Record<string, ExtendedMegaDataItem[]> }): boolean => {
  try {
    // Save all collections
    saveCollectionsToStorage(data.collections);
    
    // Save all item groups
    for (const collectionId in data.items) {
      saveItemsToStorage(collectionId, data.items[collectionId]);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import data', error);
    return false;
  }
}; 
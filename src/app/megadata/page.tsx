'use client';

import { useState, useEffect } from 'react';
import { getCollections, getItems } from '@/lib/api/abstraction-chain';
import { upsertMegaDataItem, createMegaDataCollection } from '@/lib/api/megaforwarder';
import { useWallet } from '@/contexts/WalletContext';
import dynamic from 'next/dynamic';
import { SignatureData, MegaDataItem } from '@/lib/types';

const JsonEditor = dynamic(() => import('@/components/JsonEditor'), { ssr: false });

export default function MegaData() {
  const { account, signMessage, accountType } = useWallet();
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [items, setItems] = useState<MegaDataItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MegaDataItem | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (account) {
      loadCollections();
    }
  }, [account]);

  useEffect(() => {
    if (selectedCollection) {
      loadItems();
    }
  }, [selectedCollection]);

  useEffect(() => {
    if (selectedItem) {
      setEditedProperties(selectedItem.properties);
      setHasUnsavedChanges(false);
    }
  }, [selectedItem]);

  const loadCollections = async () => {
    if (!account) return;
    const userCollections = await getCollections(account);
    setCollections(userCollections);
  };

  const loadItems = async () => {
    if (!selectedCollection) return;
    const collectionItems = await getItems(selectedCollection);
    setItems(collectionItems);
  };

  const createMessage = (account: string, timestamp: number) => {
    return `MegaYours MegaData Management: ${account} at ${timestamp}`;
  }

  const handleCreateCollection = async () => {
    if (!account || !signMessage) return;
    setIsCreatingCollection(true);
    try {
      const timestamp = Date.now();
      const message = createMessage(account, timestamp);
      const signature = await signMessage(message);
      const signatureData: SignatureData = {
        type: 'evm',
        timestamp,
        account,
        signature
      };
      await createMegaDataCollection(signatureData);
      await loadCollections();
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleCreateItem = () => {
    setIsCreatingItem(true);
    setNewItemName('');
    setEditedProperties({});
    setSelectedItem(null);
    setHasUnsavedChanges(false);
  };

  const handleSaveItem = async () => {
    if (!selectedCollection || !account || !signMessage || !accountType) return;
    
    const itemToSave = isCreatingItem ? newItemName : selectedItem?.tokenId;
    if (!itemToSave) return;

    console.log('Saving item with properties:', editedProperties);

    setIsSaving(true);
    try {
      const timestamp = Date.now();
      const message = createMessage(account, timestamp);
      const signature = await signMessage(message);
      const signatureData: SignatureData = {
        type: accountType,
        timestamp,
        account,
        signature
      };
      await upsertMegaDataItem(
        signatureData,
        selectedCollection,
        itemToSave,
        editedProperties
      );
      await loadItems();
      setIsCreatingItem(false);
      setNewItemName('');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleJsonChange = (newProperties: Record<string, any>) => {
    console.log('JSON Editor onChange:', newProperties);
    setEditedProperties(newProperties);
    setHasUnsavedChanges(true);
  };

  if (!account) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">MegaData Editor</h1>
        <p>Please connect your wallet to access the MegaData editor.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">MegaData Editor</h1>
        <div className="flex items-center gap-4 mb-4">
          <select
            className="border rounded p-2 flex-grow"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
          >
            <option value="">Select a collection</option>
            {collections.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateCollection}
            disabled={isCreatingCollection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isCreatingCollection ? 'Creating...' : 'New Collection'}
          </button>
        </div>
      </div>

      {selectedCollection && (
        <div className="flex gap-4">
          <div className="w-1/3 border rounded p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tokens</h2>
              <button
                onClick={handleCreateItem}
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                New Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.tokenId}
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
                        setSelectedItem(item);
                      }
                    } else {
                      setSelectedItem(item);
                    }
                  }}
                  className={`p-2 rounded cursor-pointer ${
                    selectedItem?.tokenId === item.tokenId
                      ? 'bg-blue-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {item.tokenId}
                </div>
              ))}
            </div>
          </div>
          <div className="w-2/3 border rounded p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isCreatingItem ? 'New Item' : selectedItem ? `Editing token ${selectedItem.tokenId}` : 'Select an item'}
              </h2>
              {isCreatingItem && (
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter item name"
                  className="border rounded px-2 py-1"
                />
              )}
            </div>
            {selectedItem && !isCreatingItem && (
              <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Preview:</span>
                <code className="text-sm bg-white px-2 py-1 rounded flex-1 overflow-x-auto">
                  {`http://localhost:3000/megadata/${selectedItem.collection.substring(0, 4)}...${selectedItem.collection.substring(selectedItem.collection.length - 4)}/${selectedItem.tokenId}`}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `http://localhost:3000/megadata/${selectedItem.collection}/${selectedItem.tokenId}`
                    );
                  }}
                  className="text-blue-500 hover:text-blue-600 px-2 py-1"
                >
                  Copy
                </button>
              </div>
            )}
            {(selectedItem || isCreatingItem) && (
              <div className="space-y-4">
                <div className="h-[500px] border rounded overflow-hidden">
                  <JsonEditor
                    value={editedProperties}
                    onChange={handleJsonChange}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  {hasUnsavedChanges && (
                    <span className="text-yellow-600 self-center mr-2">
                      You have unsaved changes
                    </span>
                  )}
                  <button
                    onClick={handleSaveItem}
                    disabled={isSaving || (isCreatingItem && !newItemName) || !hasUnsavedChanges}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
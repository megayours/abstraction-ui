'use client';

import { useState, useEffect } from 'react';
import { getCollections, getItems } from '@/lib/api/abstraction-chain';
import { upsertMegaDataItem, createMegaDataCollection } from '@/lib/api/megaforwarder';
import { useWallet } from '@/contexts/WalletContext';
import dynamic from 'next/dynamic';
import { SignatureData, MegaDataItem, MegaDataCollection } from '@/lib/types';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Database, Plus, Code, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateCollectionModal } from './components/CreateCollectionModal';

const JsonEditor = dynamic(() => import('./components/JsonEditor'), { ssr: false });

export default function MegaData() {
  const { account, signMessage, accountType } = useWallet();
  const [collections, setCollections] = useState<MegaDataCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [items, setItems] = useState<MegaDataItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MegaDataItem | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);

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

  const handleCreateCollection = async (name: string) => {
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
      await createMegaDataCollection(signatureData, name);
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
      <section className="py-12 md:py-30">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center space-y-6">
            <h1 className="text-balance text-4xl font-medium lg:text-5xl">MegaData</h1>
            <p className="text-lg text-muted-foreground">Please connect your wallet to access the MegaData editor.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-30">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-balance text-4xl font-medium lg:text-5xl">MegaData</h1>
          <p className="text-lg text-muted-foreground">Create and manage your on-chain token metadata</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="">Select a collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() => setIsCreateCollectionModalOpen(true)}
              className="shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          </div>

          <CreateCollectionModal
            isOpen={isCreateCollectionModalOpen}
            onClose={() => setIsCreateCollectionModalOpen(false)}
            onCreate={handleCreateCollection}
            isCreating={isCreatingCollection}
          />

          {selectedCollection && (
            <>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">

                <div className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your token metadata is accessible through a structured URL. Each part represents a specific component:
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <code className="text-sm font-mono text-muted-foreground">
                          {config.megaRouterUri}
                        </code>
                        <span className="text-xs text-muted-foreground">/</span>
                        <code className="text-sm font-mono text-muted-foreground">
                          megadata
                        </code>
                        <span className="text-xs text-muted-foreground">/</span>
                        <code className="text-sm font-mono">
                          {`${selectedCollection.substring(0, 6)}...${selectedCollection.substring(selectedCollection.length - 4)}`}
                        </code>
                        {selectedItem && !isCreatingItem && (
                          <>
                            <span className="text-xs text-muted-foreground">/</span>
                            <code className="text-sm font-mono text-primary">
                              {selectedItem.tokenId}
                            </code>
                          </>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${config.megaRouterUri}/megadata/${selectedCollection}/`
                              );
                            }}
                          >
                            Copy Collection Base URI
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Use this to get the base URI for the entire collection
                          </span>
                        </div>
                        {selectedItem && !isCreatingItem && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${config.megaRouterUri}/megadata/${selectedCollection}/${selectedItem.tokenId}`
                                );
                              }}
                            >
                              Copy Full URI
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Use this to get the complete URI including the token ID
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center justify-between p-6 border-b">
                      <h2 className="text-lg font-semibold">Tokens</h2>
                      <Button
                        onClick={handleCreateItem}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create
                      </Button>
                    </div>
                    <div className="p-6">
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
                            className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                              selectedItem?.tokenId === item.tokenId
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <Database className="mr-2 h-4 w-4" />
                            {item.tokenId}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center justify-between p-6 border-b">
                      <h2 className="text-lg font-semibold">
                        {isCreatingItem ? 'New Item' : selectedItem ? `MegaData` : 'Select a token'}
                      </h2>
                      {isCreatingItem && (
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="Enter item name"
                          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      )}
                    </div>
                    {(selectedItem || isCreatingItem) && (
                      <div className="p-6 space-y-4">
                        <div className="h-[500px] rounded-md border">
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
                          <Button
                            onClick={handleSaveItem}
                            disabled={isSaving || (!isCreatingItem && !hasUnsavedChanges)}
                          >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
} 
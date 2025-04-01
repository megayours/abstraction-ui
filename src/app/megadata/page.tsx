'use client';

import { useState, useEffect } from 'react';
import { getCollections, getItems } from '@/lib/api/abstraction-chain';
import { manageMegadata } from '@/lib/api/megaforwarder';
import { useWallet } from '@/contexts/WalletContext';
import dynamic from 'next/dynamic';
import { SignatureData, MegaDataItem, MegaDataCollection } from '@/lib/types';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Database, Plus, Code, Globe, Save, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateCollectionModal } from './components/CreateCollectionModal';
import ImportExportTemplate from './components/ImportExportTemplate';
import { validateMegadata } from './utils/validation';

const JsonEditor = dynamic(() => import('./components/JsonEditor'), { ssr: false });

type PendingOperation = {
  operation: "create_collection" | "upsert_item" | "delete_item";
  name?: string;
  collection?: string;
  tokenId?: string;
  properties?: Record<string, any>;
};

export default function MegaData() {
  const { account, signMessage, accountType } = useWallet();
  const [collections, setCollections] = useState<MegaDataCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [items, setItems] = useState<MegaDataItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MegaDataItem | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newTokenId, setNewTokenId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<MegaDataItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

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
      
      // Validate all items when switching
      validateAllItems();
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
    setSavedItems(collectionItems);

    // Validate all items after loading
    const newValidationErrors: Record<string, string[]> = {};
    collectionItems.forEach(item => {
      const { isValid, errors } = validateMegadata(item.properties);
      if (!isValid) {
        newValidationErrors[item.tokenId] = errors;
      }
    });
    setValidationErrors(newValidationErrors);
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
        type: accountType || 'evm',
        timestamp,
        account,
        signature
      };

      // Add create collection operation to pending operations
      setPendingOperations(prev => [...prev, {
        operation: "create_collection",
        name
      }]);

      // Create a temporary collection in memory
      const tempCollection: MegaDataCollection = {
        id: `temp_${Date.now()}`,
        name
      };
      setCollections(prev => [...prev, tempCollection]);
      setSelectedCollection(tempCollection.id);
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleCreateItem = () => {
    // Don't allow creating new item if current item has validation errors
    if (selectedItem && validationErrors[selectedItem.tokenId]?.length > 0) {
      alert('Please fix validation errors before creating a new token');
      return;
    }
    setIsCreatingItem(true);
    setNewTokenId('');
    setEditedProperties({});
    setSelectedItem(null);
  };

  const handleDeleteItem = (tokenId: string) => {
    if (!selectedCollection) return;

    // Don't allow deleting if current item has validation errors
    if (selectedItem?.tokenId === tokenId && validationErrors[tokenId]?.length > 0) {
      alert('Please fix validation errors before deleting the token');
      return;
    }

    // Only add delete operation if the item exists in savedItems
    if (savedItems.some(item => item.tokenId === tokenId)) {
      setPendingOperations(prev => [...prev, {
        operation: "delete_item",
        collection: selectedCollection,
        tokenId
      }]);
    }

    // Update items in memory
    setItems(prev => prev.filter(item => item.tokenId !== tokenId));

    // Clear selection if the deleted item was selected
    if (selectedItem?.tokenId === tokenId) {
      setSelectedItem(null);
      setEditedProperties({});
    }
  };

  const handleTokenIdChange = (oldTokenId: string, newTokenId: string) => {
    if (!selectedCollection) return;

    // Don't allow changing token ID if current item has validation errors
    if (validationErrors[oldTokenId]?.length > 0) {
      alert('Please fix validation errors before changing the token ID');
      return;
    }

    // Update items in memory
    setItems(prev => prev.map(item => 
      item.tokenId === oldTokenId 
        ? { ...item, tokenId: newTokenId }
        : item
    ));

    // Update selected item if it was the one being edited
    if (selectedItem?.tokenId === oldTokenId) {
      setSelectedItem(prev => prev ? { ...prev, tokenId: newTokenId } : null);
    }

    // Update pending operations
    setPendingOperations(prev => {
      // Remove any existing operations for the old tokenId
      const filteredOps = prev.filter(op => 
        !(op.operation === "upsert_item" && op.tokenId === oldTokenId)
      );

      // Only add new operation if the new tokenId doesn't exist in savedItems
      if (!savedItems.some(item => item.tokenId === newTokenId)) {
        return [...filteredOps, {
          operation: "upsert_item",
          collection: selectedCollection,
          tokenId: newTokenId,
          properties: editedProperties
        }];
      }

      return filteredOps;
    });

    setEditingTokenId(null);
  };

  const handleSaveItem = async () => {
    if (!selectedCollection || !account || !signMessage || !accountType) return;

    const itemToSave = isCreatingItem ? newTokenId : selectedItem?.tokenId;
    if (!itemToSave) return;

    // Add upsert operation to pending operations
    setPendingOperations(prev => [...prev, {
      operation: "upsert_item",
      collection: selectedCollection,
      tokenId: itemToSave,
      properties: editedProperties
    }]);

    // Update items in memory
    const newItem: MegaDataItem = {
      tokenId: itemToSave,
      collection: selectedCollection,
      properties: editedProperties
    };

    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.tokenId === itemToSave);
      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex] = newItem;
        return newItems;
      }
      return [...prev, newItem];
    });

    setIsCreatingItem(false);
    setSelectedItem(newItem);
    setHasUnsavedChanges(true);

    // Validate all items after saving
    validateAllItems();
  };

  const handleSaveCollection = async () => {
    if (!selectedCollection || !account || !signMessage || !accountType) return;

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

      const result = await manageMegadata({
        auth: signatureData,
        operations: pendingOperations
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Update saved items and clear pending operations
      setSavedItems(items);
      setPendingOperations([]);
      setHasUnsavedChanges(false);
      alert('Collection saved successfully');
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Error saving collection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (value: Record<string, any>) => {
    setEditedProperties(value);
    setHasUnsavedChanges(true);

    // Validate the current item
    const { isValid, errors } = validateMegadata(value);
    const itemToValidate = isCreatingItem ? newTokenId : selectedItem?.tokenId;
    if (itemToValidate) {
      setValidationErrors(prev => ({
        ...prev,
        [itemToValidate]: isValid ? [] : errors
      }));
    }
  };

  // Add a new function to validate all items
  const validateAllItems = () => {
    const newValidationErrors: Record<string, string[]> = {};
    
    items.forEach(item => {
      const { isValid, errors } = validateMegadata(item.properties);
      if (!isValid) {
        newValidationErrors[item.tokenId] = errors;
      }
    });

    setValidationErrors(newValidationErrors);
  };

  const handleImportData = async (importedData: any[]) => {
    if (!selectedCollection || !account || !signMessage || !accountType) {
      alert('Please select a collection first');
      return;
    }

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

      // Create operations for new/updated items
      const upsertOperations = importedData.map(item => ({
        operation: "upsert_item" as const,
        collection: selectedCollection,
        tokenId: item.tokenId,
        properties: { erc721: item.megadata.erc721 }
      }));

      // Find items that exist in current items but not in imported data
      const deletedTokenIds = items
        .filter(item => !importedData.some(imported => imported.tokenId === item.tokenId))
        .map(item => item.tokenId);

      // Create delete operations for removed items
      const deleteOperations = deletedTokenIds.map(tokenId => ({
        operation: "delete_item" as const,
        collection: selectedCollection,
        tokenId
      }));

      // Combine all operations
      const operations = [...upsertOperations, ...deleteOperations];

      const result = await manageMegadata({
        auth: signatureData,
        operations
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      // Update items in memory
      const newItems = importedData.map(item => ({
        tokenId: item.tokenId,
        collection: selectedCollection,
        properties: { erc721: item.megadata.erc721 }
      }));
      setItems(newItems);
      setSavedItems(newItems);

      // Validate all imported items
      const newValidationErrors: Record<string, string[]> = {};
      newItems.forEach(item => {
        const { isValid, errors } = validateMegadata(item.properties);
        if (!isValid) {
          newValidationErrors[item.tokenId] = errors;
        }
      });
      setValidationErrors(newValidationErrors);

      alert('Successfully imported metadata');
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateToken = (tokenId: string) => {
    if (!tokenId.trim() || !selectedCollection) return;

    // Add new item to memory
    const newItem: MegaDataItem = {
      tokenId: tokenId.trim(),
      collection: selectedCollection,
      properties: {}
    };
    setItems(prev => [...prev, newItem]);
    
    // Add upsert operation to pending operations only if it's a new token
    if (!savedItems.some(item => item.tokenId === tokenId.trim())) {
      setPendingOperations(prev => [...prev, {
        operation: "upsert_item",
        collection: selectedCollection,
        tokenId: tokenId.trim(),
        properties: {}
      }]);
    }

    // Reset creation state
    setIsCreatingItem(false);
    setNewTokenId('');
  };

  const handleTokenClick = (item: MegaDataItem) => {
    setSelectedItem(item);
    setEditedProperties(item.properties);
    validateAllItems();
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
    <section className="py-24 md:py-30">
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
              onChange={(e) => {
                // Don't allow switching collection if current item has validation errors
                if (selectedItem && validationErrors[selectedItem.tokenId]?.length > 0) {
                  alert('Please fix validation errors before switching collections');
                  return;
                }
                setSelectedCollection(e.target.value);
              }}
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
            {selectedCollection && pendingOperations.length > 0 && (
              <Button
                onClick={handleSaveCollection}
                className="shrink-0"
                disabled={isSaving || Object.keys(validationErrors).length > 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : Object.keys(validationErrors).length > 0 ? 'Fix Validation Errors' : 'Save Collection'}
              </Button>
            )}
          </div>

          <CreateCollectionModal
            isOpen={isCreateCollectionModalOpen}
            onClose={() => setIsCreateCollectionModalOpen(false)}
            onCreate={handleCreateCollection}
            isCreating={isCreatingCollection}
          />

          {selectedCollection && (
            <>
              <ImportExportTemplate onImport={handleImportData} items={items} />

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
                            onClick={() => handleTokenClick(item)}
                            className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                              selectedItem?.tokenId === item.tokenId
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-muted'
                            } ${validationErrors[item.tokenId]?.length > 0 ? 'border-red-500 border' : ''}`}
                          >
                            <Database className={`mr-2 h-4 w-4 ${validationErrors[item.tokenId]?.length > 0 ? 'text-red-500' : ''}`} />
                            {editingTokenId === item.tokenId ? (
                              <input
                                type="text"
                                value={newTokenId}
                                onChange={(e) => setNewTokenId(e.target.value)}
                                onBlur={() => handleTokenIdChange(item.tokenId, newTokenId)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleTokenIdChange(item.tokenId, newTokenId);
                                  }
                                }}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                autoFocus
                              />
                            ) : (
                              <span
                                onDoubleClick={() => {
                                  setEditingTokenId(item.tokenId);
                                  setNewTokenId(item.tokenId);
                                }}
                                className="flex-1"
                              >
                                {item.tokenId}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.tokenId);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {isCreatingItem && (
                          <div className="flex items-center p-3 rounded-md bg-muted/50">
                            <Database className="mr-2 h-4 w-4" />
                            <input
                              type="text"
                              value={newTokenId}
                              onChange={(e) => setNewTokenId(e.target.value)}
                              placeholder="Enter Token ID (e.g., 1, 2, 3, or #1, #2, #3)"
                              className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCreateToken(newTokenId);
                                }
                              }}
                              onBlur={() => handleCreateToken(newTokenId)}
                            />
                          </div>
                        )}
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
                    </div>
                    {(selectedItem || isCreatingItem) && (
                      <div className="p-6 space-y-4">
                        <div className="h-[500px] rounded-md border">
                          <JsonEditor
                            value={editedProperties}
                            onChange={handleEditorChange}
                          />
                        </div>
                        {pendingOperations.length > 0 && (
                          <div className="flex justify-end">
                            <span className="text-yellow-600 self-center">
                              Changes will be saved when you click "Save Collection"
                            </span>
                          </div>
                        )}
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
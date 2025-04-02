'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { getCollections, getItems } from '@/lib/api/abstraction-chain';
import { manageMegadata } from '@/lib/api/megaforwarder';
import { useWallet } from '@/contexts/WalletContext';
import dynamic from 'next/dynamic';
import { SignatureData, MegaDataItem, MegaDataCollection } from '@/lib/types';
import { config } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Database, Plus, Code, Globe, Save, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateCollectionWizard } from './components/CreateCollectionWizard';
import ImportExportTemplate from './components/ImportExportTemplate';
import TokenList from './components/TokenList';
import { validateMegadata, ValidationResult } from './utils/validation';
import { 
  getLocalCollections, 
  getLocalItems, 
  createLocalCollection, 
  saveLocalItem,
  deleteLocalItem,
  publishLocalCollection,
  ExtendedMegaDataCollection,
  ExtendedMegaDataItem
} from '@/lib/api/localStorage';

const JsonEditor = dynamic(() => import('./components/JsonEditor'), { 
  ssr: false,
  loading: () => <div className="h-[500px] rounded-md border bg-muted animate-pulse" />
});

export default function MegaData() {
  const { account, signMessage, accountType } = useWallet();
  const [collections, setCollections] = useState<ExtendedMegaDataCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedCollectionData, setSelectedCollectionData] = useState<ExtendedMegaDataCollection | null>(null);
  const [items, setItems] = useState<ExtendedMegaDataItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ExtendedMegaDataItem | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newTokenId, setNewTokenId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isCreateCollectionWizardOpen, setIsCreateCollectionWizardOpen] = useState(false);

  useEffect(() => {
    if (account) {
      loadCollections();
    }
  }, [account]);

  useEffect(() => {
    if (selectedCollection) {
      loadItems();
      // Find the collection data
      const collectionData = collections.find(c => c.id === selectedCollection) || null;
      setSelectedCollectionData(collectionData);
    } else {
      setSelectedCollectionData(null);
    }
  }, [selectedCollection, collections]);

  useEffect(() => {
    if (selectedItem) {
      setEditedProperties(selectedItem.properties);
    }
  }, [selectedItem]);

  // Autosave when properties are edited
  useEffect(() => {
    if (!selectedItem) return;
    
    console.time('autosave-effect');
    // Skip if properties haven't actually changed
    if (JSON.stringify(editedProperties) === JSON.stringify(selectedItem.properties)) {
      console.timeEnd('autosave-effect');
      return;
    }

    const timer = setTimeout(() => {
      autoSaveItem();
    }, 500);
    
    return () => {
      clearTimeout(timer);
      console.timeEnd('autosave-effect');
    };
  }, [editedProperties, selectedItem]);

  const autoSaveItem = () => {
    console.time('autoSaveItem');
    if (!selectedItem || !selectedCollection) return;
    
    if (selectedCollectionData?.published) return;
    
    const updatedItem: ExtendedMegaDataItem = {
      ...selectedItem,
      properties: editedProperties,
      lastModified: Date.now()
    };
    
    const saved = saveLocalItem(updatedItem);
    
    if (saved) {
      setItems(prev => prev.map(item => 
        item.tokenId === updatedItem.tokenId ? updatedItem : item
      ));
      setSelectedItem(updatedItem);
    }
    console.timeEnd('autoSaveItem');
  };

  const loadCollections = async () => {
    if (!account) return;
    
    // Load collections from localStorage
    const localCollections = getLocalCollections(account);
    
    // Also load collections from the blockchain - these are all published collections
    try {
      const remoteCollections = await getCollections(account);
      
      // Merge local and remote collections
      // For each remote collection, add a 'published' flag
      const remoteWithPublishedFlag = remoteCollections.map(remote => ({
        ...remote,
        published: true, // Remote collections are always published
        numTokens: 0,     // We don't know this for remote collections
        startingIndex: 0, // We don't know this for remote collections
        moduleSettings: {}
      }));
      
      // Combine collections, ensuring no duplicates by ID
      const combinedCollections = [...localCollections];
      
      remoteWithPublishedFlag.forEach(remote => {
        // If not already in combinedCollections by ID, add it
        if (!combinedCollections.some(local => local.id === remote.id)) {
          combinedCollections.push(remote as ExtendedMegaDataCollection);
        }
      });
      
      setCollections(combinedCollections);
    } catch (error) {
      console.error("Failed to load collections from blockchain", error);
      // If we can't load from blockchain, just use local collections
      setCollections(localCollections);
    }
  };

  const loadItems = async () => {
    if (!selectedCollection) return;
    
    console.time('loadItems-total');
    console.time('loadItems-localStorage');
    // Load items from localStorage
    const localItems = getLocalItems(selectedCollection);
    console.timeEnd('loadItems-localStorage');
    
    // Batch all state updates together
    const updates = () => {
      console.time('loadItems-setState');
      // Set items first without validation
      setItems(localItems);
      
      // Only validate items that have been modified recently
      const newValidationErrors: Record<string, string[]> = {};
      const now = Date.now();
      const RECENT_THRESHOLD = 5 * 60 * 1000; // 5 minutes
      
      // Validate immediately
      localItems.forEach(item => {
        if (item.lastModified > now - RECENT_THRESHOLD) {
          const { isValid, errors } = validateMegadata(item.properties);
          if (!isValid) {
            newValidationErrors[item.tokenId] = errors;
          }
        }
      });
      
      // Only update validation errors if there are any
      if (Object.keys(newValidationErrors).length > 0) {
        setValidationErrors(newValidationErrors);
      }
      console.timeEnd('loadItems-setState');
    };
    
    // Use requestAnimationFrame to batch updates
    requestAnimationFrame(updates);
    
    // Only load from blockchain if the collection is published
    if (selectedCollectionData?.published) {
      console.time('loadItems-blockchain');
      try {
        const remoteItems = await getItems(selectedCollection);
        // Merge local and remote items in future versions
      } catch (error) {
        console.error("Failed to load items from blockchain", error);
      }
      console.timeEnd('loadItems-blockchain');
    }
    console.timeEnd('loadItems-total');
  };

  const createMessage = (account: string, timestamp: number) => {
    return `MegaYours MegaData Management: ${account} at ${timestamp}`;
  }

  const handleCreateCollection = async (
    name: string, 
    numTokens: number, 
    startingIndex: number, 
    moduleSettings: ExtendedMegaDataCollection['moduleSettings']
  ) => {
    if (!account) return;
    setIsCreatingCollection(true);
    try {
      // Create the collection in localStorage
      const newCollection = createLocalCollection(name, numTokens, startingIndex, moduleSettings);
      
      // Update collections in state
      setCollections(prev => [...prev, newCollection]);
      setSelectedCollection(newCollection.id);
      
      // No need to add pending operations anymore since we're using localStorage
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setIsCreatingCollection(false);
      setIsCreateCollectionWizardOpen(false);
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
    
    // Check if collection is published
    if (selectedCollectionData?.published) {
      alert('Cannot delete items from published collections');
      return;
    }

    // Delete from localStorage
    const deleted = deleteLocalItem(selectedCollection, tokenId);
    
    if (deleted) {
      // Update items in memory
      setItems(prev => prev.filter(item => item.tokenId !== tokenId));

      // Clear selection if the deleted item was selected
      if (selectedItem?.tokenId === tokenId) {
        setSelectedItem(null);
        setEditedProperties({});
      }
    }
  };

  const handleTokenIdChange = (oldTokenId: string, newTokenId: string) => {
    if (!selectedCollection) return;

    // Don't allow changing token ID if current item has validation errors
    if (validationErrors[oldTokenId]?.length > 0) {
      alert('Please fix validation errors before changing the token ID');
      return;
    }
    
    // Check if collection is published
    if (selectedCollectionData?.published) {
      alert('Cannot modify items in published collections');
      return;
    }
    
    // Find the item to update
    const itemToUpdate = items.find(item => item.tokenId === oldTokenId);
    if (!itemToUpdate) return;
    
    // Delete the old item
    deleteLocalItem(selectedCollection, oldTokenId);
    
    // Create a new item with the new tokenId
    const newItem: ExtendedMegaDataItem = {
      ...itemToUpdate,
      tokenId: newTokenId,
      lastModified: Date.now()
    };
    
    // Save the new item
    const saved = saveLocalItem(newItem);
    
    if (saved) {
      // Update items in memory
      setItems(prev => prev.map(item => 
        item.tokenId === oldTokenId ? newItem : item
      ));

      // Update selected item if it was the one being edited
      if (selectedItem?.tokenId === oldTokenId) {
        setSelectedItem(newItem);
      }
    }
    
    setEditingTokenId(null);
  };

  // Remove the validationResults memo and validationErrors effect
  // Instead, compute validation on demand
  const getValidationErrors = useCallback((item: ExtendedMegaDataItem) => {
    const result = validateMegadata(item.properties);
    return result.isValid ? [] : result.errors;
  }, []);

  // Update handleTokenClick to use the new validation function
  const handleTokenClick = (item: ExtendedMegaDataItem) => {
    console.time('handleTokenClick');
    
    // Skip if clicking the same item
    if (selectedItem?.tokenId === item.tokenId) {
      console.timeEnd('handleTokenClick');
      return;
    }

    // Batch state updates
    const updates = () => {
      console.time('handleTokenClick-updates');
      setSelectedItem(item);
      
      // Only update edited properties if they're different
      if (JSON.stringify(item.properties) !== JSON.stringify(editedProperties)) {
        setEditedProperties(item.properties);
      }
      
      // Only validate if there are existing errors
      if (validationErrors[item.tokenId]) {
        const errors = getValidationErrors(item);
        setValidationErrors(prev => ({
          ...prev,
          [item.tokenId]: errors
        }));
      }
      console.timeEnd('handleTokenClick-updates');
    };
    
    requestAnimationFrame(updates);
    console.timeEnd('handleTokenClick');
  };

  const handlePublishCollection = async () => {
    if (!selectedCollection || !account || !signMessage || !accountType) return;
    
    // Check if there are any validation errors
    if (Object.keys(validationErrors).length > 0) {
      alert('Please fix all validation errors before publishing');
      return;
    }

    // Confirm with the user
    if (!confirm('Publishing will make this collection immutable. You will no longer be able to edit or delete items. Are you sure you want to continue?')) {
      return;
    }

    setIsPublishing(true);
    try {
      // Format the items for the new API
      const formattedItems = items.map(item => ({
        tokenId: item.tokenId,
        properties: item.properties
      }));
      
      // Generate signature for blockchain operations
      const timestamp = Date.now();
      const message = createMessage(account, timestamp);
      const signature = await signMessage(message);
      const signatureData: SignatureData = {
        type: accountType,
        timestamp,
        account,
        signature
      };
      
      // Call manageMegadata with the new format to publish to blockchain
      const result = await manageMegadata({
        auth: signatureData,
        collection: selectedCollectionData?.name || 'Unnamed Collection',
        items: formattedItems
      });

      if ('error' in result) {
        throw new Error(result.error);
      }
      
      // Extract the blockchain collection ID from the result
      const blockchainId = result.collectionId;
      
      if (!blockchainId) {
        throw new Error('No collection ID returned from server');
      }

      // If blockchain operation was successful, mark as published in localStorage
      const published = publishLocalCollection(selectedCollection, blockchainId);
      
      if (published) {
        // The collection ID has changed, update selectedCollection
        setSelectedCollection(blockchainId);
        
        // Reload the collections to update the UI
        await loadCollections();
        
        alert('Collection published successfully!');
      } else {
        throw new Error('Failed to publish collection locally');
      }
    } catch (error) {
      console.error('Error publishing collection:', error);
      alert('Error publishing collection. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImportData = async (importedData: any) => {
    if (!selectedCollection) {
      alert('Please select a collection first');
      return;
    }
    
    // Check if collection is published
    if (selectedCollectionData?.published) {
      alert('Cannot import items to published collections');
      return;
    }
    
    // If it's our old format, we've already imported it in the ImportExportTemplate component
    if (importedData.collections && importedData.items) {
      // Reload collections and items
      await loadCollections();
      if (selectedCollection) {
        await loadItems();
      }
      return;
    }
    
    // Handle an array of items (simplified format or older format)
    try {
      const newItems: ExtendedMegaDataItem[] = [];
      
      for (const item of importedData) {
        // Properties may come as either item.properties or item.megadata
        const itemProperties = item.megadata 
          ? { erc721: item.megadata.erc721 || {} } 
          : (item.properties || {});
          
        const newItem: ExtendedMegaDataItem = {
          collection: selectedCollection,
          tokenId: item.tokenId,
          properties: itemProperties,
          lastModified: Date.now()
        };
        
        // Save to localStorage
        saveLocalItem(newItem);
        newItems.push(newItem);
      }
      
      // Update items in memory
      setItems(newItems);
      
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
    }
  };

  const handleCreateToken = (tokenId: string) => {
    if (!tokenId.trim() || !selectedCollection) return;
    
    // Check if collection is published
    if (selectedCollectionData?.published) {
      alert('Cannot add items to published collections');
      return;
    }

    // Create a new item in localStorage
    const newItem: ExtendedMegaDataItem = {
      collection: selectedCollection,
      tokenId: tokenId.trim(),
      properties: {},
      lastModified: Date.now()
    };
    
    const saved = saveLocalItem(newItem);
    
    if (saved) {
      // Add new item to memory
      setItems(prev => [...prev, newItem]);
      
      // Reset creation state
      setIsCreatingItem(false);
      setNewTokenId('');
    }
  };

  if (!account) {
    return (
      <section className="py-12 md:py-30">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center space-y-6">
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
                  {collection.name} {collection.published ? '(Published)' : ''}
                </option>
              ))}
            </select>
            <Button
              onClick={() => setIsCreateCollectionWizardOpen(true)}
              className="shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
            {selectedCollection && !selectedCollectionData?.published && Object.keys(validationErrors).length === 0 && (
              <Button
                onClick={handlePublishCollection}
                className="shrink-0"
                disabled={isPublishing}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isPublishing ? 'Publishing...' : 'Publish Collection'}
              </Button>
            )}
          </div>

          <CreateCollectionWizard
            isOpen={isCreateCollectionWizardOpen}
            onClose={() => setIsCreateCollectionWizardOpen(false)}
            onCreate={handleCreateCollection}
            isCreating={isCreatingCollection}
          />

          {selectedCollection && (
            <>
              <ImportExportTemplate 
                onImport={handleImportData} 
                items={items} 
                collectionId={selectedCollection} 
              />

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

              <div className="grid lg:grid-cols-3 gap-6 min-h-[600px]">
                <div className="lg:col-span-1 h-full">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between p-6 pb-3">
                      <h3 className="text-2xl font-medium tracking-tight">Tokens</h3>
                      {!selectedCollectionData?.published && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCreatingItem(true)}
                          disabled={isCreatingItem}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 min-h-0">
                      <TokenList
                        items={items}
                        selectedItem={selectedItem}
                        validationErrors={validationErrors}
                        isPublished={!!selectedCollectionData?.published}
                        onTokenClick={handleTokenClick}
                        onDeleteToken={handleDeleteItem}
                        editingTokenId={editingTokenId}
                        newTokenId={newTokenId}
                        onTokenIdChange={handleTokenIdChange}
                        onNewTokenIdChange={setNewTokenId}
                        isCreatingItem={isCreatingItem}
                        onNewTokenKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateToken(newTokenId);
                          }
                        }}
                        onNewTokenBlur={() => handleCreateToken(newTokenId)}
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 h-full">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between p-6 pb-3">
                      <h3 className="text-2xl font-medium tracking-tight">MegaData</h3>
                    </div>
                    <div className="flex-1 p-6 pt-0 min-h-0">
                      {selectedItem ? (
                        <JsonEditor
                          value={editedProperties}
                          onChange={(value) => {
                            console.time('handleEditorChange');
                            setEditedProperties(value);

                            // Debounce validation
                            const itemToValidate = isCreatingItem ? newTokenId : selectedItem?.tokenId;
                            if (itemToValidate) {
                              const timer = setTimeout(() => {
                                const result = validateMegadata(value);
                                setValidationErrors(prev => ({
                                  ...prev,
                                  [itemToValidate]: result.isValid ? [] : result.errors
                                }));
                              }, 500);
                              return () => clearTimeout(timer);
                            }
                            console.timeEnd('handleEditorChange');
                          }}
                          readOnly={selectedCollectionData?.published}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Select a token to view and edit its metadata
                        </div>
                      )}
                    </div>
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
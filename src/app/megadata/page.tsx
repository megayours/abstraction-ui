'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Plus, Globe, Save, Upload } from 'lucide-react';
import CreateCollectionWizard from './components/CreateCollectionWizard';
import ImportExportTemplate from './components/ImportExportTemplate';
import TokenList from './components/TokenList';
import MegadataForm from './components/MegadataForm';
import { validateMegadata } from './utils/validation';
import * as megadataApi from '@/lib/api/megadata';
import type { Collection, Token, Module } from '@/lib/api/megadata';
import { config } from '@/lib/config';
import type { MegaDataItem } from '@/lib/types';

// Helper function to generate default values based on schema type
const generateDefaultValue = (propertySchema: any): any => {
  if (propertySchema.default !== undefined) {
    return propertySchema.default;
  }
  switch (propertySchema.type) {
    case 'string': return '';
    case 'number': return 0;
    case 'integer': return 0;
    case 'boolean': return false;
    case 'array': return [];
    case 'object': return {};
    default: return null; // Or handle other types/throw error
  }
};

export default function MegaData() {
  const { account, signMessage, accountType } = useWallet();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [selectedCollectionData, setSelectedCollectionData] = useState<Collection | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newTokenId, setNewTokenId] = useState('');
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isCreateCollectionWizardOpen, setIsCreateCollectionWizardOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [collectionModules, setCollectionModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [tokensToPublish, setTokensToPublish] = useState<Set<string>>(new Set());

  // --- Loading Functions --- 

  // Refactor loadCollectionData to use passed ID primarily
  const loadCollectionData = async (id: number | null = selectedCollection) => {
    if (!id) {
        setSelectedCollectionData(null);
        return;
    }
    try {
      const collection = await megadataApi.getCollection(id);
      // Only set if the loaded data is for the currently selected collection
      if (id === selectedCollection) {
        setSelectedCollectionData(collection);
      }
    } catch (error) {
      console.error(`Failed to load collection data for ${id}`, error);
      if (id === selectedCollection) setSelectedCollectionData(null); // Clear if error for current selection
    }
  };

  // Refactor loadTokens - remove internal check, rely on caller timing
  const loadTokens = async (id: number | null = selectedCollection) => {
    if (!id) {
        setTokens([]);
        return;
    }
    console.log(`loadTokens fetching for collection ID: ${id}`); // Debugging
    try {
      const fetchedTokens = await megadataApi.getTokens(id);
      // Only set if the loaded data is for the currently selected collection
       if (id === selectedCollection) {
            console.log(`Setting tokens for collection: ${id}`); // Debugging
            setTokens(fetchedTokens);
       } else {
            console.log(`Skipping setTokens for ${id} because current selection is ${selectedCollection}`); // Debugging
       }
    } catch (error) {
      console.error(`Failed to load tokens for collection ${id}:`, error);
       if (id === selectedCollection) setTokens([]); // Clear if error for current selection
    }
  };

  // Refactor loadModule to use passed ID primarily
  const loadModule = async (id: number | null = selectedCollection) => {
    if (!id) {
        setCollectionModules([]);
        setSelectedModule(null);
        return;
    }
    // Resetting based on the ID we intend to load for
    setCollectionModules([]);
    setSelectedModule(null);
    
    try {
      const collection = await megadataApi.getCollection(id);
      // Check if the collection we based this on is still the selected one
      if (id === selectedCollection && collection.modules && collection.modules.length > 0) {
          const modules = await Promise.all(
            collection.modules.map(modId => megadataApi.getModule(modId))
          );
          // Final check before setting state
          if (id === selectedCollection) {
                setCollectionModules(modules);
                if (modules.length > 0) {
                    setSelectedModule(modules[0]);
                }
          }
      }
    } catch (error) {
      console.error(`Failed to load module(s) for ${id}:`, error);
      if (id === selectedCollection) { // Clear if error for current selection
          setCollectionModules([]);
          setSelectedModule(null);
      }
    }
  };

  // New central loading function (Moved earlier)
  const selectAndLoadCollection = useCallback(async (id: number | null) => {
    // Set the selected ID first - NO! Set it AFTER clearing/fetching? No, the load functions check it.
    // Let's keep setting it first, but ensure loaders check correctly.
    // setSelectedCollection(id); // Let the caller handle setting the state externally if needed
    
    // If null, clear everything and return
    if (id === null) {
      setSelectedCollectionData(null);
      setTokens([]);
      setSelectedToken(null);
      setCollectionModules([]);
      setSelectedModule(null);
      setEditedProperties({});
      setHasUnsavedChanges(false);
      setTokensToPublish(new Set());
      return;
    }

    // Clear previous data immediately for responsiveness
    console.log(`Clearing state before loading collection ${id}`);
    setTokens([]); 
    setSelectedToken(null);
    setSelectedCollectionData(null); // Indicate loading for collection data too
    setCollectionModules([]);
    setSelectedModule(null);
    setEditedProperties({});
    setHasUnsavedChanges(false);
    setTokensToPublish(new Set());

    // Load data sequentially or in parallel
    try {
        console.log(`Starting parallel load for collection ${id}`);
        await Promise.all([ 
            loadCollectionData(id),
            loadTokens(id),
            loadModule(id)
        ]);
        console.log(`Finished loading all data for collection ${id}`);
    } catch (error) {
        console.error(`Error loading data for collection ${id}:`, error);
        // State clearing on error is handled within individual load functions now
    }
  }, [selectedCollection]); // Dependency: selectedCollection needed for checks inside load functions

  // --- useEffect Hooks --- 

  useEffect(() => {
    if (account) {
      loadCollections();
    }
  }, [account]);

  // useEffect watching selectedCollection: Now just calls the central loader
  useEffect(() => {
    // This effect now triggers the load when selectedCollection changes externally (like dropdown)
    // It ensures that if the ID changes, we load data for the new ID.
    console.log(`useEffect detected selectedCollection change to: ${selectedCollection}`);
    // We don't call setSelectedCollection here, just the loader
    selectAndLoadCollection(selectedCollection); 
  }, [selectedCollection, selectAndLoadCollection]); // Add selectAndLoadCollection dependency

  useEffect(() => {
    if (selectedToken) {
      setEditedProperties(JSON.parse(JSON.stringify(selectedToken.data)));
      setHasUnsavedChanges(false);
    }
  }, [selectedToken]);

  useEffect(() => {
    if (!selectedToken) return;
    
    const currentProps = JSON.stringify(editedProperties);
    const originalProps = JSON.stringify(selectedToken.data);
    
    if (currentProps === originalProps) {
      setHasUnsavedChanges(false);
    } else {
      setHasUnsavedChanges(true);
    }
  }, [editedProperties, selectedToken]);

  const loadCollections = async () => {
    if (!account) return;
    
    try {
      const collections = await megadataApi.getCollections(account);
      setCollections(collections);
    } catch (error) {
      console.error("Failed to load collections", error);
    }
  };

  const handleCreateCollection = async (
    name: string,
    numTokens: number,
    startingIndex: number,
    moduleIds: string[] // Received module IDs
  ) => {
    if (!account) return;
    setIsCreatingCollection(true);
    let newCollection: Collection | null = null; // Keep track of the created collection
    try {
      // 1. Create the collection with selected modules
      newCollection = await megadataApi.createCollection(
        name,
        account,
        moduleIds
      );
      console.log(`Created collection: ${newCollection.id}`);
      setCollections(prev => [...prev, newCollection!]);
      
      // Reset states (redundant with selectAndLoadCollection but safe)
      setTokens([]); 
      setSelectedToken(null); 
      setEditedProperties({}); 
      setHasUnsavedChanges(false);
      setTokensToPublish(new Set());

      // *** Trigger Load AFTER Token Creation ***
      // No need to call setSelectedCollection here, we do it AFTER tokens are done.

      // 2. Fetch module details (needed for default data)
      const moduleDetails = await Promise.all(
        moduleIds.map(id => megadataApi.getModule(id))
      );

      // 3. Determine default data
      const defaultData: Record<string, any> = {};
      moduleDetails.forEach(module => {
        if (module?.schema?.properties) {
          const requiredFields = module.schema.required || [];
          Object.entries(module.schema.properties).forEach(([key, propertySchema]) => {
            if (requiredFields.includes(key) && defaultData[key] === undefined) {
              defaultData[key] = generateDefaultValue(propertySchema);
            }
          });
        }
      });

      // 4. Create the specified number of tokens
      console.log(`Starting token creation loop for collection ${newCollection.id}`);
      for (let i = 0; i < numTokens; i++) {
        const tokenId = (startingIndex + i).toString();
        const initialData = {
          ...defaultData, 
          name: `${name} #${tokenId}`, 
          description: `Token #${tokenId} from ${name} collection`,
        };
        await megadataApi.createToken(newCollection.id, tokenId, initialData);
      }
      console.log(`Finished token creation loop for collection ${newCollection.id}`);

      // 5. NOW set the collection and trigger the load via useEffect
      console.log(`Setting selectedCollection to ${newCollection.id} to trigger load`);
      setSelectedCollection(newCollection.id); 
      // The useEffect watching selectedCollection will now call selectAndLoadCollection

    } catch (error) {
      console.error('Failed to create collection or tokens:', error);
    } finally {
      setIsCreatingCollection(false);
      setIsCreateCollectionWizardOpen(false);
    }
  };

  const handleCreateToken = async () => {
    if (!selectedCollection || !newTokenId) return;
    
    try {
      // 1. Determine default data based on required fields in collection schemas
      const defaultData: Record<string, any> = {};
      collectionModules.forEach(module => {
        if (module?.schema?.properties) {
          const requiredFields = module.schema.required || [];
          Object.entries(module.schema.properties).forEach(([key, propertySchema]) => {
            // Add default if field is required and not already added
            if (requiredFields.includes(key) && defaultData[key] === undefined) {
              defaultData[key] = generateDefaultValue(propertySchema);
            }
          });
        }
      });
      
      // 2. Merge defaults with specific token data
      const initialData = {
        ...defaultData, // Apply defaults first
        name: `Token ${newTokenId}`, // Specific values override defaults
        description: `Token #${newTokenId}`
      };
      
      // 3. Create the token with combined initial data
      const newToken = await megadataApi.createToken(selectedCollection, newTokenId, initialData);

      // 4. Update local state
      setTokens(prev => [...prev, newToken]);
      setSelectedToken(newToken);
      setNewTokenId('');
    } catch (error) {
      console.error('Failed to create token:', error);
      // Add user feedback (e.g., toast notification)
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!selectedCollection) return;

    if (selectedToken?.id === tokenId && validationErrors[tokenId]?.length > 0) {
      alert('Please fix validation errors before deleting the token');
      return;
    }
    
    if (selectedCollectionData?.is_published) {
      alert('Cannot delete tokens from published collections');
      return;
    }

    try {
      await megadataApi.deleteToken(selectedCollection, tokenId);
      setTokens(prev => prev.filter(token => token.id !== tokenId));
      if (selectedToken?.id === tokenId) {
        setSelectedToken(null);
        setEditedProperties({});
      }
    } catch (error) {
      console.error('Failed to delete token:', error);
    }
  };

  const handleTokenIdChange = async (oldTokenId: string, newTokenId: string) => {
    if (!selectedCollection) return;
    
    if (selectedCollectionData?.is_published) {
      alert('Cannot modify token IDs in published collections');
      return;
    }

    try {
      const token = await megadataApi.getToken(selectedCollection, oldTokenId);
      await megadataApi.deleteToken(selectedCollection, oldTokenId);
      const newToken = await megadataApi.createToken(selectedCollection, newTokenId, token.data);
      
      setTokens(prev => prev.map(t => 
        t.id === oldTokenId ? newToken : t
      ));
      
      if (selectedToken?.id === oldTokenId) {
        setSelectedToken(newToken);
      }
    } catch (error) {
      console.error('Failed to update token ID:', error);
    }
  };

  const handleTokenClick = (token: Token) => {
    setSelectedToken(token);
    setEditingTokenId(null);
  };

  const handleTogglePublishSelection = (tokenId: string) => {
    setTokensToPublish(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        // Only allow selecting unpublished tokens
        const token = tokens.find(t => t.id === tokenId);
        if (token && !token.is_published) {
            newSet.add(tokenId);
        }
      }
      return newSet;
    });
  };

  const handlePublishSelectedTokens = async () => {
    if (!selectedCollection || tokensToPublish.size === 0) return;

    setIsPublishing(true);
    try {
      await megadataApi.publishTokens(selectedCollection, Array.from(tokensToPublish));
      
      // Update local state to reflect published status
      setTokens(prevTokens => 
        prevTokens.map(token => 
          tokensToPublish.has(token.id) ? { ...token, is_published: true } : token
        )
      );
      
      // Clear selection and potentially update selected token if it was published
      setTokensToPublish(new Set());
      if (selectedToken && tokensToPublish.has(selectedToken.id)) {
        setSelectedToken(prev => prev ? { ...prev, is_published: true } : null);
        // If published, assume no unsaved changes anymore for that token
        setHasUnsavedChanges(false); 
        setEditedProperties({});
      }
      
      // Refetch collection data to update its published status in the UI
      await loadCollectionData(selectedCollection);
      await loadCollections(); // Also refresh the main list for the dropdown
      
      // Optionally, refresh all tokens from API again
      // await loadTokens(); 
      
      // Add success feedback (e.g., toast)
      console.log('Successfully published selected tokens');

    } catch (error) {
      console.error('Failed to publish tokens:', error);
      // Add error feedback (e.g., toast)
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCollection || !selectedToken || !selectedModule) return;
    
    try {
      // Validate the data against the module schema
      const validationResult = await megadataApi.validateModuleData(
        selectedModule.id,
        editedProperties
      );

      if (!validationResult.valid) {
        setValidationErrors(prev => ({
          ...prev,
          [selectedToken.id]: validationResult.errors
        }));
        return;
      }

      // Update the token
      const updatedToken = await megadataApi.updateToken(
        selectedCollection,
        selectedToken.id,
        editedProperties
      );

      // Update local state
      setTokens(prev => prev.map(t => 
        t.id === selectedToken.id ? updatedToken : t
      ));
      setSelectedToken(updatedToken);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  };

  const handleImportData = async (items: MegaDataItem[]) => {
    if (!selectedCollection) return;
    
    try {
      // Convert MegaDataItem to Token format
      const tokens = items.map(item => ({
        id: item.tokenId,
        collection_id: selectedCollection,
        data: item.properties,
        is_published: false
      }));

      // Create tokens in the API
      for (const token of tokens) {
        await megadataApi.createToken(selectedCollection, token.id, token.data);
      }

      // Refresh tokens
      await loadTokens();
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  };

  const handleImageUpload = async (token: Token, file: File) => {
    if (!selectedCollection) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${config.megadataApiUri}/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const { url } = await response.json();
      
      // Update token with new image URL
      const updatedToken = await megadataApi.updateToken(
        selectedCollection,
        token.id,
        { ...token.data, image: url }
      );
      
      // Update local state
      setTokens(prev => prev.map(t => 
        t.id === token.id ? updatedToken : t
      ));
      
      if (selectedToken?.id === token.id) {
        setSelectedToken(updatedToken);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
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
              value={selectedCollection || ''}
              onChange={(e) => {
                const newId = e.target.value ? Number(e.target.value) : null;
                setSelectedCollection(newId);
              }}
            >
              <option value="">Select a collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name} {collection.is_published ? '(Published)' : ''}
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
            {selectedCollection && (
              <Button
                onClick={handlePublishSelectedTokens}
                className="shrink-0"
                disabled={tokensToPublish.size === 0 || isPublishing}
              >
                {isPublishing ? 'Publishing...' : `Publish Selected (${tokensToPublish.size})`}
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
                items={tokens.map(token => ({
                  collection: selectedCollection.toString(),
                  tokenId: token.id,
                  properties: token.data
                }))} 
                collectionId={selectedCollection.toString()} 
                published={selectedCollectionData?.is_published || false}
              />

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {selectedCollectionData?.is_published 
                        ? "Your token metadata is accessible through this URL:"
                        : "Once published, your token metadata will be accessible through a URL like this:"}
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
                        <code className={`text-sm font-mono ${selectedCollectionData?.is_published ? '' : 'text-muted-foreground'}`}>
                          {selectedCollection}
                        </code>
                        {selectedToken && (
                          <>
                            <span className="text-xs text-muted-foreground">/</span>
                            <code className={`text-sm font-mono ${selectedCollectionData?.is_published ? 'text-primary' : 'text-muted-foreground'}`}>
                              {selectedToken.id}
                            </code>
                          </>
                        )}
                      </div>
                      {selectedCollectionData?.is_published && (
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
                          {selectedToken && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `${config.megaRouterUri}/megadata/${selectedCollection}/${selectedToken.id}`
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
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 min-h-[600px]">
                <div className="lg:col-span-1 h-full">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between p-6 pb-3">
                      <h3 className="text-2xl font-medium tracking-tight">Tokens</h3>
                    </div>
                    <div className="flex-1 min-h-0">
                      <TokenList
                        items={tokens} 
                        selectedItem={selectedToken} 
                        validationErrors={validationErrors}
                        onTokenClick={handleTokenClick}
                        newTokenId={newTokenId}
                        onNewTokenIdChange={setNewTokenId}
                        onNewTokenBlur={handleCreateToken}
                        onImageUpload={handleImageUpload}
                        tokensToPublish={tokensToPublish}
                        onTogglePublishSelection={handleTogglePublishSelection}
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 h-full">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
                    <div className="flex items-center justify-between p-6 pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-medium tracking-tight">MegaData</h3>
                        {hasUnsavedChanges && (
                          <span className="text-sm text-muted-foreground">
                            Unsaved changes
                          </span>
                        )}
                      </div>
                      {hasUnsavedChanges && !selectedToken?.is_published && (
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="shrink-0"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 p-6 pt-0 min-h-0">
                      {selectedToken ? (
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                          <MegadataForm
                            value={editedProperties}
                            onChange={(newProperties) => {
                              setEditedProperties(newProperties);
                            }}
                            readOnly={!!selectedToken?.is_published}
                            schema={selectedModule?.schema}
                          />
                        </div>
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
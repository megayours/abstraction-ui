'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Plus, Globe, Save, Upload, Copy } from 'lucide-react';
import CreateCollectionWizard from './components/CreateCollectionWizard';
import ImportExportTemplate from './components/ImportExportTemplate';
import { TokenPageableList } from '@/components/TokenPageableList';
import MegadataForm from './components/MegadataForm';
import * as megadataApi from '@/lib/api/megadata';
import type { Collection, Token, Module } from '@/lib/api/megadata';
import { config } from '@/lib/config';
import type { MegaDataItem } from '@/lib/types';
import { CreateTokenDialog } from '@/components/CreateTokenDialog';
import { useWeb3Auth } from '@/providers/web3auth-provider';

const EXTENDING_METADATA_MODULE_ID = 'extending_metadata';
const TOKENS_PAGE_SIZE = 11;

const mergeSchemas = (modules: Module[]): Record<string, any> | null => {
  if (!modules || modules.length === 0) {
    return null;
  }

  let combinedProperties: Record<string, any> = {};
  let combinedRequired: Set<string> = new Set();

  modules.forEach(mod => {
    if (mod.schema?.properties) {
      combinedProperties = { ...combinedProperties, ...mod.schema.properties };
    }
    if (mod.schema?.required && Array.isArray(mod.schema.required)) {
      mod.schema.required.forEach(req => combinedRequired.add(req));
    }
  });

  if (Object.keys(combinedProperties).length === 0) {
    return null;
  }

  return {
    type: 'object',
    properties: combinedProperties,
    required: Array.from(combinedRequired),
  };
};

interface DetectedTokenData {
  tokenId: string;
  uri: string;
  metadata: Record<string, any> | null;
}

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
    default: return null;
  }
};

export default function MegaData() {
  const { walletAddress } = useWeb3Auth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [selectedCollectionData, setSelectedCollectionData] = useState<Collection | null>(null);
  const [loadedTokens, setLoadedTokens] = useState<Token[]>([]);
  const [totalTokens, setTotalTokens] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreateCollectionWizardOpen, setIsCreateCollectionWizardOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [collectionModules, setCollectionModules] = useState<Module[]>([]);
  const [mergedSchema, setMergedSchema] = useState<Record<string, any> | null>(null);
  const [tokensToPublish, setTokensToPublish] = useState<Set<string>>(new Set());
  const [pendingCollectionSelection, setPendingCollectionSelection] = useState<number | undefined>(undefined);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [isCreateTokenDialogOpen, setIsCreateTokenDialogOpen] = useState(false);

  const loadCollectionData = useCallback(async (id: number | null) => {
    if (!id) {
      setSelectedCollectionData(null);
      return;
    }
    try {
      const collection = await megadataApi.getCollection(id);
      if (id === selectedCollection) {
        setSelectedCollectionData(collection);
      }
    } catch (error) {
      console.error(`Failed to load collection data for ${id}`, error);
      if (id === selectedCollection) setSelectedCollectionData(null);
    }
  }, [selectedCollection]);

  const loadModule = useCallback(async (id: number | null) => {
    if (!id) {
      setCollectionModules([]);
      setMergedSchema(null);
      return;
    }
    setCollectionModules([]);
    setMergedSchema(null);

    try {
      const collection = await megadataApi.getCollection(id);
      if (id === selectedCollection && collection.modules && collection.modules.length > 0) {
        const modules = await Promise.all(
          collection.modules.map(modId => megadataApi.getModule(modId))
        );
        if (id === selectedCollection) {
          setCollectionModules(modules);
          const combinedSchema = mergeSchemas(modules);
          setMergedSchema(combinedSchema);
        }
      } else if (id === selectedCollection) {
        setCollectionModules([]);
        setMergedSchema(null);
      }
    } catch (error) {
      console.error(`Failed to load module(s) for ${id}:`, error);
      if (id === selectedCollection) {
        setCollectionModules([]);
        setMergedSchema(null);
      }
    }
  }, [selectedCollection]);

  const loadTokens = useCallback(async (id: number, page: number) => {
    if (!id || isLoadingTokens) return;
    console.log(`Loading tokens for collection ID: ${id}, page: ${page}`);
    setIsLoadingTokens(true);
    try {
      const response = await megadataApi.getTokens(id, page, TOKENS_PAGE_SIZE);
      if (id === selectedCollection) {
        console.log(`Setting tokens for collection: ${id}`);
        setLoadedTokens(response.data);
        setTotalTokens(response.pagination.total);
        setCurrentPage(response.pagination.page);
      } else {
        console.log(`Skipping setTokens for ${id} because selection changed to ${selectedCollection}`);
      }
    } catch (error) {
      console.error(`Failed to load tokens for collection ${id}:`, error);
      if (id === selectedCollection) {
        setLoadedTokens([]);
        setTotalTokens(0);
      }
    } finally {
      if (id === selectedCollection) {
        setIsLoadingTokens(false);
      }
    }
  }, [selectedCollection, isLoadingTokens]);

  const handlePageChange = useCallback((page: number) => {
    if (selectedCollection) {
      loadTokens(selectedCollection, page);
    }
  }, [selectedCollection, loadTokens]);

  const loadCollections = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const fetchedCollections = await megadataApi.getCollections();
      setCollections(fetchedCollections);
      if (pendingCollectionSelection !== undefined && fetchedCollections.some(c => c.id === pendingCollectionSelection)) {
        handleCollectionSelect(pendingCollectionSelection);
        setPendingCollectionSelection(undefined);
      }
    } catch (error) {
      console.error("Failed to load collections", error);
    }
  }, [walletAddress, pendingCollectionSelection]);

  useEffect(() => {
    if (selectedCollection === null) {
      setSelectedCollectionData(null);
      setLoadedTokens([]);
      setTotalTokens(null);
      setSelectedToken(null);
      setCollectionModules([]);
      setMergedSchema(null);
      setTokensToPublish(new Set());
      setHasUnsavedChanges(false);
      setCurrentPage(1);
      setIsLoadingTokens(false);
      return;
    }

    const loadCollectionAndTokens = async () => {
      console.log(`Loading data for collection: ${selectedCollection}`);
      
      // Load collection data and modules first
      await Promise.all([
        loadCollectionData(selectedCollection),
        loadModule(selectedCollection)
      ]);

      // Then load tokens
      await loadTokens(selectedCollection, 1);
    };

    loadCollectionAndTokens();
  }, [selectedCollection]);

  useEffect(() => {
    if (walletAddress) {
      loadCollections();
    }
  }, [walletAddress, loadCollections]);

  useEffect(() => {
    if (selectedToken) {
      setEditedProperties(JSON.parse(JSON.stringify(selectedToken.data)));
      setHasUnsavedChanges(false);
    } else {
      setEditedProperties({});
    }
  }, [selectedToken]);

  useEffect(() => {
    if (!selectedToken) return;

    const currentProps = JSON.stringify(editedProperties);
    const originalProps = JSON.stringify(selectedToken.data);

    if (currentProps !== originalProps) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [editedProperties, selectedToken]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleCollectionSelect = (id: number | null) => {
    if (id === selectedCollection) return;

    const switchCollection = () => {
      setSelectedToken(null);
      setEditedProperties({});
      setSelectedCollection(id);
      setPendingCollectionSelection(undefined);
      setHasUnsavedChanges(false);
    };

    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to switch collections? Changes will be lost.')) {
        switchCollection();
      } else {
        // Optional: Reset the dropdown visually if the select component allows it
      }
    } else {
      switchCollection();
    }
  };

  const handleCreateCollection = useCallback(async (
    name: string,
    numTokens: number,
    startingIndex: number,
    moduleIds: string[],
    defaultData: Record<string, string>
  ) => {
    if (!walletAddress) {
      console.error('Account/Signer not available');
      alert('Wallet not connected or account/signer not found.');
      return;
    }
    setIsCreatingCollection(true);
    try {
      const newCollection = await megadataApi.createCollection(name, moduleIds);
      console.log('Created collection:', newCollection);

      if (numTokens > 0 && newCollection.id) {
        const tokensToCreate = [];
        for (let i = 0; i < numTokens; i++) {
          const tokenId = (startingIndex + i).toString();
          tokensToCreate.push({ id: tokenId, data: { ...defaultData } });
        }
        await megadataApi.createTokensBulk(newCollection.id, tokensToCreate);
      }

      await loadCollections();
      setIsCreateCollectionWizardOpen(false);
      setPendingCollectionSelection(newCollection.id);

    } catch (error) {
      console.error('Failed to create collection:', error);
      alert(`Failed to create collection: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCreatingCollection(false);
    }
  }, [walletAddress, loadCollections]);

  const handleAutoDetectCreateCollection = useCallback(async (name: string, moduleIds: string[], detectedData: DetectedTokenData[]) => {
    if (!walletAddress) {
      console.error('handleAutoDetectCreateCollection: Account/Signer not available');
      alert('Wallet not connected or account/signer not found.');
      return;
    }
    if (detectedData.length === 0) {
      alert("Cannot create collection with zero detected tokens.");
      return;
    }
    setIsCreatingCollection(true);
    console.log(`Creating collection '${name}' with modules [${moduleIds.join(', ')}] and ${detectedData.length} detected tokens.`);

    try {
      const newCollection = await megadataApi.createCollection(name, moduleIds);
      console.log('Created collection:', newCollection);

      if (!newCollection || !newCollection.id) {
        throw new Error("Failed to create collection or received invalid collection ID.");
      }

      let requiredFields = new Set<string>();
      try {
        const moduleDetails = await Promise.all(moduleIds.map(id => megadataApi.getModule(id)));
        moduleDetails.forEach(mod => {
          if (mod?.schema?.required && Array.isArray(mod.schema.required)) {
            mod.schema.required.forEach(field => requiredFields.add(field as string));
          }
        });
      } catch (schemaError) {
        console.warn('Failed to fetch module schemas, proceeding without defaults:', schemaError);
      }

      const tokensToCreate: megadataApi.BulkTokenCreatePayload[] = detectedData.map(item => {
        let tokenData: Record<string, any> = {};
        requiredFields.forEach(field => { tokenData[field] = ""; });
        tokenData = { ...tokenData, ...(item.metadata || {}) };
        if (moduleIds.includes(EXTENDING_METADATA_MODULE_ID)) {
          tokenData.uri = item.uri;
        } else {
          tokenData.metadata_uri = item.uri;
        }
        return { id: item.tokenId, data: tokenData };
      });

      const createdTokens = await megadataApi.createTokensBulk(newCollection.id, tokensToCreate);
      console.log(`Successfully created ${createdTokens.length} tokens.`);

      await loadCollections();
      setIsCreateCollectionWizardOpen(false);
      setPendingCollectionSelection(newCollection.id);
      alert(`Successfully created collection '${name}' with ${detectedData.length} tokens.`);

    } catch (error) {
      console.error('Failed to create collection or tokens:', error);
      alert(`Failed to create collection or tokens: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCreatingCollection(false);
    }
  }, [walletAddress, loadCollections]);

  const handleTokenClick = useCallback((token: Token) => {
    if (token.id === selectedToken?.id) return;

    const selectToken = () => {
      setSelectedToken(token);
      setEditedProperties({ ...token.data });
    };

    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes for the current token. Are you sure you want to switch? Changes will be lost.')) {
        selectToken();
      } else {
        // Do nothing, keep current selection and changes
      }
    } else {
      selectToken();
    }
  }, [hasUnsavedChanges, selectedToken?.id]);

  const handleTogglePublishSelection = useCallback((tokenId: string) => {
    setTokensToPublish(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        const token = loadedTokens.find(t => t.id === tokenId);
        if (token && !token.is_published) {
          newSet.add(tokenId);
        }
      }
      return newSet;
    });
  }, [loadedTokens]);

  const handlePublishSelectedTokens = useCallback(async () => {
    if (!selectedCollection || tokensToPublish.size === 0 || !walletAddress) return;

    setIsPublishing(true);
    try {
      await megadataApi.publishTokens(selectedCollection, Array.from(tokensToPublish));

      setLoadedTokens(prevTokens => prevTokens.map(token => tokensToPublish.has(token.id) ? { ...token, is_published: true } : token));
      setTokensToPublish(new Set());
      if (selectedToken && tokensToPublish.has(selectedToken.id)) {
        setSelectedToken(prev => prev ? { ...prev, is_published: true } : null);
        setHasUnsavedChanges(false);
        setEditedProperties({});
      }

      await loadTokens(selectedCollection, 1);
      await loadCollections();

      console.log('Successfully published selected tokens');

    } catch (error: any) {
      console.error('Failed to publish tokens:', error);
      alert(`Publishing failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
    }
  }, [selectedCollection, walletAddress, tokensToPublish, loadTokens]);

  const handlePublishAllTokens = useCallback(async () => {
    if (!selectedCollection || !walletAddress) return;

    if (!confirm('Are you sure you want to publish all tokens in this collection? This action cannot be undone.')) {
      return;
    }

    setIsPublishing(true);
    try {
      await megadataApi.publishTokens(selectedCollection, [], true);

      // Update all tokens to published state
      setLoadedTokens(prevTokens => prevTokens.map(token => ({ ...token, is_published: true })));
      setTokensToPublish(new Set());
      if (selectedToken) {
        setSelectedToken(prev => prev ? { ...prev, is_published: true } : null);
        setHasUnsavedChanges(false);
        setEditedProperties({});
      }

      await loadTokens(selectedCollection, 1);
      await loadCollections();

      console.log('Successfully published all tokens');

    } catch (error: any) {
      console.error('Failed to publish all tokens:', error);
      alert(`Publishing failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
    }
  }, [selectedCollection, walletAddress, selectedToken, loadTokens]);

  const handleSave = useCallback(async () => {
    if (!selectedToken || !selectedCollection || !walletAddress) return;

    setIsSaving(true);
    try {
      const updatedToken = await megadataApi.updateToken(
        selectedCollection,
        selectedToken.id,
        editedProperties
      );

      setLoadedTokens(prev => prev.map(t => t.id === selectedToken.id ? updatedToken : t));
      setSelectedToken(updatedToken);
      setHasUnsavedChanges(false);
      await loadTokens(selectedCollection, 1);
    } catch (error) {
      console.error('Failed to save token data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedToken, selectedCollection, walletAddress, editedProperties, loadTokens]);

  const handleImportData = useCallback(async (items: MegaDataItem[]) => {
    if (!selectedCollection || !walletAddress) return;

    try {
      const tokens = items.map(item => ({
        id: item.tokenId,
        collection_id: selectedCollection,
        data: item.properties,
        is_published: false
      }));

      await megadataApi.createTokensBulk(selectedCollection, tokens);

      setHasUnsavedChanges(false);
      await loadTokens(selectedCollection, 1);
    } catch (error: any) {
      console.error('Failed to import data:', error);
      alert(`Import failed: ${error.message || 'Unknown error'}`);
    }
  }, [selectedCollection, walletAddress, loadTokens]);

  const handleImageUpload = useCallback(async (token: Token, file: File) => {
    if (!selectedCollection || !walletAddress || !token) return;

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

      const updatedToken = await megadataApi.updateToken(
        selectedCollection,
        token.id,
        { ...token.data, image: url }
      );

      setLoadedTokens(prev => prev.map(t => t.id === token.id ? updatedToken : t));
      if (selectedToken?.id === token.id) {
        setSelectedToken(updatedToken);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  }, [selectedCollection, walletAddress]);

  const handleCreateToken = useCallback(async (tokenId: string) => {
    if (!selectedCollection || !walletAddress) return;
    setIsCreatingToken(true);

    let defaultData: Record<string, any> = {};
    if (mergedSchema?.properties) {
      Object.entries(mergedSchema.properties).forEach(([key, propSchema]) => {
        defaultData[key] = generateDefaultValue(propSchema);
      });
    }

    try {
      const [newToken] = await megadataApi.createTokensBulk(selectedCollection, [{ id: tokenId, data: defaultData }]);
      
      // Calculate the new total and last page
      const newTotal = (totalTokens ?? 0) + 1;
      const lastPage = Math.ceil(newTotal / TOKENS_PAGE_SIZE);
      
      // Load the last page
      await loadTokens(selectedCollection, lastPage);
      
      // Select the newly created token for editing
      setSelectedToken(newToken);
      setEditedProperties({ ...newToken.data });
      setHasUnsavedChanges(false);
    } catch (error) {
      throw error;
    } finally {
      setIsCreatingToken(false);
    }
  }, [selectedCollection, walletAddress, mergedSchema, loadTokens, totalTokens]);

  const handleCreateTokenClick = useCallback(() => {
    setIsCreateTokenDialogOpen(true);
  }, []);

  const handleDeleteToken = useCallback(async (tokenId: string) => {
    if (!selectedCollection || !walletAddress || !confirm(`Are you sure you want to delete token ${tokenId}? This cannot be undone.`)) return;

    try {
      await megadataApi.deleteToken(selectedCollection, tokenId);

      setLoadedTokens(prev => prev.filter(token => token.id !== tokenId));
      if (selectedToken?.id === tokenId) {
        setSelectedToken(null);
        setEditedProperties({});
      }
      setTokensToPublish(prev => { const next = new Set(prev); next.delete(tokenId); return next; });
      setTotalTokens(prev => prev ? prev - 1 : null);

      // Optionally reload the current page if counts change significantly or re-sorting is needed
      // await loadTokens(selectedCollection, 1);
    } catch (error) {
      console.error('Failed to delete token:', error);
    }
  }, [selectedCollection, walletAddress, selectedToken, loadTokens]);

  if (!walletAddress) {
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
                handleCollectionSelect(newId);
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
              <>
                <Button
                  onClick={handlePublishSelectedTokens}
                  className="shrink-0"
                  disabled={tokensToPublish.size === 0 || isPublishing}
                >
                  {isPublishing ? 'Publishing...' : `Publish Selected (${tokensToPublish.size})`}
                </Button>
                <Button
                  onClick={handlePublishAllTokens}
                  className="shrink-0"
                  variant="secondary"
                  disabled={isPublishing}
                >
                  {isPublishing ? 'Publishing...' : 'Publish All'}
                </Button>
              </>
            )}
          </div>

          <CreateCollectionWizard
            isOpen={isCreateCollectionWizardOpen}
            onClose={() => setIsCreateCollectionWizardOpen(false)}
            onCreate={handleCreateCollection}
            onAutoDetectCreate={handleAutoDetectCreateCollection}
            isCreating={isCreatingCollection}
          />

          {selectedCollection && (
            <>
              <ImportExportTemplate
                onImport={handleImportData}
                items={loadedTokens.map(token => ({
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
                          {collectionModules.some(module => module.id === EXTENDING_METADATA_MODULE_ID) && (
                            <div className="mt-8">
                              <p className="text-xs text-gray-400 mb-2">
                                Use this MegaRouter as a gateway to your token metadata. It acts as a dynamic gateway, applying Megadata module logic to the Base Token URI's content before serving it.
                              </p>
                              <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-md">
                                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                                <code className="text-sm font-mono text-muted-foreground">
                                  {config.megaRouterUri}
                                </code>
                                <span className="text-xs text-muted-foreground">/</span>
                                <code className="text-sm font-mono text-muted-foreground">
                                  ext
                                </code>
                                <span className="text-xs text-muted-foreground">/</span>
                                {selectedToken && (
                                  <>
                                    <code
                                      title={selectedToken.data?.uri}
                                      className={`block truncate max-w-[200px] text-sm font-mono ${selectedCollectionData?.is_published ? 'text-primary' : 'text-muted-foreground'}`}>
                                      {selectedToken.data?.uri}
                                    </code>
                                  </>
                                )}
                                {selectedToken?.data?.uri && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 ml-2 shrink-0"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `${config.megaRouterUri}/ext/${selectedToken.data.uri}`
                                      );
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                    <span className="sr-only">Copy Gateway URI</span>
                                  </Button>
                                )}
                              </div>
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
                      <TokenPageableList
                        items={loadedTokens}
                        totalItems={totalTokens ?? 0}
                        currentPage={currentPage}
                        pageSize={TOKENS_PAGE_SIZE}
                        isLoading={isLoadingTokens}
                        selectedToken={selectedToken}
                        onTokenClick={handleTokenClick}
                        onPageChange={handlePageChange}
                        onImageUpload={handleImageUpload}
                        tokensToPublish={tokensToPublish}
                        onTogglePublishSelection={handleTogglePublishSelection}
                        onCreateToken={handleCreateTokenClick}
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
                            schema={mergedSchema ?? undefined}
                            value={editedProperties}
                            onChange={setEditedProperties}
                            readOnly={isSaving || isPublishing}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Select a token to view or edit its Megadata.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <CreateTokenDialog
          isOpen={isCreateTokenDialogOpen}
          onClose={() => setIsCreateTokenDialogOpen(false)}
          onConfirm={handleCreateToken}
          isCreating={isCreatingToken}
        />
      </div>
    </section>
  );
}
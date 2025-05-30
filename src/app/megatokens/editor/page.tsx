'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Globe, Save, Upload, Copy, X, Lock, Zap, FolderOpen, FileText, LinkIcon, AlertCircle, FileSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TokenPageableList } from '@/components/TokenPageableList';
import MegadataForm from './components/MegadataForm';
import * as megadataApi from '@/lib/api/megadata';
import type { Collection, Token, Module, ExternalCollectionDetails } from '@/lib/api/megadata';
import { config } from '@/lib/config';
import { CreateTokenDialog } from '@/components/CreateTokenDialog';
import { useWeb3Auth } from '@/providers/web3auth-provider';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SPECIAL_MODULES } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { CompactUriDisplay } from './components/CompactUriDisplay';
import { ModuleSelector } from '@/components/ModuleSelector';

const TOKENS_PAGE_SIZE = 15;

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

const TokenModules: React.FC<{
  token: Token;
  onUpdateModules: (modules: string[]) => void;
  readonly?: boolean;
}> = ({ token, onUpdateModules, readonly = false }) => {
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [selectedNewModules, setSelectedNewModules] = useState<string[]>([]);

  const PROTECTED_MODULES = [SPECIAL_MODULES.EXTENDING_METADATA, SPECIAL_MODULES.EXTENDING_COLLECTION];

  useEffect(() => {
    const loadAvailableModules = async () => {
      try {
        const modules = await megadataApi.getModules();
        setAvailableModules(modules);
      } catch (error) {
        console.error('Failed to load available modules:', error);
      }
    };
    loadAvailableModules();
  }, []);

  const handleAddModules = async () => {
    const newModules = [...new Set([...token.modules, ...selectedNewModules])];
    onUpdateModules(newModules);
    setIsModuleDialogOpen(false);
    setSelectedNewModules([]);
  };

  const isProtectedModule = (moduleId: string) => PROTECTED_MODULES.includes(moduleId);

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-medium text-primary">Attached Modules</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModuleDialogOpen(true)}
          className="border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
          disabled={readonly}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {token.modules.map(moduleId => (
          <Badge
            key={moduleId}
            variant={isProtectedModule(moduleId) ? "default" : "secondary"}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${isProtectedModule(moduleId)
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-secondary/10 text-secondary-foreground border border-secondary/20'
              }`}
          >
            {moduleId}
            {!isProtectedModule(moduleId) && !readonly && (
              <button
                onClick={() => onUpdateModules(token.modules.filter(id => id !== moduleId))}
                className="ml-1 opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {isProtectedModule(moduleId) || readonly && (
              <div className="ml-1 text-primary/80" title="This module is required and cannot be removed">
                <Lock className="h-3 w-3" />
              </div>
            )}
          </Badge>
        ))}
        {token.modules.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No modules attached yet.</p>
        )}
      </div>

      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="max-w-xl bg-card rounded-xl">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl text-primary">Add Available Modules</DialogTitle>
          </DialogHeader>
          <ModuleSelector
            availableModules={availableModules
              .filter(module => !token.modules.includes(module.id))
              .filter(module => !isProtectedModule(module.id))
            }
            selectedModuleIds={selectedNewModules}
            onChange={setSelectedNewModules}
            mode="checkbox"
            label=""
          />
          <div className="flex justify-end gap-3 p-6 bg-background/50 rounded-b-xl">
            <Button variant="ghost" onClick={() => setIsModuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddModules} disabled={selectedNewModules.length === 0}>
              Add Selected ({selectedNewModules.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

type PageProps = {
  params: Promise<{
    collectionId?: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function MegaData({ params, searchParams }: PageProps) {
  console.log('MegaData component rendering with params:', params);

  const [initialCollectionId, setInitialCollectionId] = useState<number | undefined>();
  const { walletAddress } = useWeb3Auth();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [selectedCollectionData, setSelectedCollectionData] = useState<Collection | null>(null);
  const [loadedTokens, setLoadedTokens] = useState<Token[]>([]);
  const [totalTokens, setTotalTokens] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [editedProperties, setEditedProperties] = useState<Record<string, any>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mergedSchema, setMergedSchema] = useState<Record<string, any> | null>(null);
  const [tokensToPublish, setTokensToPublish] = useState<Set<string>>(new Set());
  const [isCreateTokenDialogOpen, setIsCreateTokenDialogOpen] = useState(false);
  const [tokenValidationError, setTokenValidationError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [externalDetails, setExternalDetails] = useState<ExternalCollectionDetails | null>(null);
  const [isLoadingExternalDetails, setIsLoadingExternalDetails] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from URL params
  useEffect(() => {
    const initializeFromParams = async () => {
      console.log('Initializing from params...');
      const [paramsResult, searchParamsResult] = await Promise.all([params, searchParams]);
      console.log('Params resolved:', paramsResult);
      const collectionId = paramsResult.collectionId ? Number(paramsResult.collectionId) : undefined;
      console.log('Setting initial collection ID:', collectionId);
      setInitialCollectionId(collectionId);
      // Only set collection if this is the initial load and not a manual selection
      if (collectionId && isInitialLoad && !isManualSelection) {
        console.log('Setting selected collection from URL:', collectionId);
        setSelectedCollection(collectionId);
      }
    };
    initializeFromParams();
  }, [params, searchParams, isInitialLoad, isManualSelection]);

  // Effect to handle initial collection loading
  useEffect(() => {
    if (isInitialLoad && collections.length > 0) {
      const collectionId = initialCollectionId;
      if (collectionId) {
        const collectionExists = collections.some(c => c.id === collectionId);
        if (collectionExists && !isManualSelection) {
          console.log(`Collection ${collectionId} exists, initializing...`);
          setSelectedCollection(collectionId);
        }
      }
      setIsInitialLoad(false);
    }
  }, [collections, initialCollectionId, isInitialLoad, isManualSelection]);

  const loadCollections = useCallback(async () => {
    console.log('Loading collections...');
    setIsLoading(true);
    try {
      const fetchedCollections = await megadataApi.getCollections();
      console.log('Fetched collections:', fetchedCollections);
      setCollections(fetchedCollections);
    } catch (error) {
      console.error("Failed to load collections", error);
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const loadCollectionData = useCallback(async (id: number | null) => {
    console.log('Loading collection data for ID:', id);
    if (!id) {
      setSelectedCollectionData(null);
      return;
    }
    try {
      const collection = await megadataApi.getCollection(id);
      console.log('Loaded collection data:', collection);
      if (id === selectedCollection) {
        setSelectedCollectionData(collection);
        if (collection.type === 'external') {
          setIsLoadingExternalDetails(true);
          const externalDetails = await megadataApi.getExternalCollection(id);
          setExternalDetails(externalDetails);
          setIsLoadingExternalDetails(false);
        }
      }
    } catch (error) {
      console.error(`Failed to load collection data for ${id}`, error);
      if (id === selectedCollection) setSelectedCollectionData(null);
    }
  }, [selectedCollection]);

  // Load collection data when selected collection changes
  useEffect(() => {
    if (selectedCollection) {
      console.log('Selected collection changed, loading data:', selectedCollection);
      loadCollectionData(selectedCollection);
    }
  }, [selectedCollection, loadCollectionData]);

  const handleCollectionSelect = useCallback((id: number | null) => {
    console.log('handleCollectionSelect called with id:', id);
    if (id === selectedCollection) {
      console.log('Same collection selected, returning early');
      return;
    }

    const updateCollection = () => {
      console.log('Updating collection to:', id);
      setIsManualSelection(true);
      setSelectedCollection(id);
      if (id) {
        router.push(`/megatokens/editor/${id}`, { scroll: false });
      } else {
        router.push('/megatokens/editor', { scroll: false });
      }
    };

    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to switch collections? Changes will be lost.')) {
        updateCollection();
      }
    } else {
      updateCollection();
    }
  }, [selectedCollection, hasUnsavedChanges, router]);

  // Ensure collection data is loaded when selectedCollection changes
  useEffect(() => {
    console.log('Selected collection effect triggered:', selectedCollection);
    if (selectedCollection === null) {
      setSelectedCollectionData(null);
      setLoadedTokens([]);
      setTotalTokens(null);
      return;
    }

    const loadData = async () => {
      console.log('Loading data for collection:', selectedCollection);
      setIsLoadingTokens(true);
      try {
        const [collection, tokensResponse] = await Promise.all([
          megadataApi.getCollection(selectedCollection),
          megadataApi.getTokens(selectedCollection, 1, TOKENS_PAGE_SIZE)
        ]);

        console.log('Loaded collection:', collection);
        console.log('Loaded tokens:', tokensResponse);

        setSelectedCollectionData(collection);
        setLoadedTokens(tokensResponse.tokens);
        setTotalTokens(tokensResponse.total);
        setCurrentPage(1);
      } catch (error) {
        console.error('Failed to load collection data:', error);
        setSelectedCollectionData(null);
        setLoadedTokens([]);
        setTotalTokens(0);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadData();
  }, [selectedCollection]);

  const loadModule = useCallback(async (id: number | null) => {
    if (!id) {
      setMergedSchema(null);
      return;
    }
    if (id === selectedCollection) {
      setMergedSchema(null);
    }
  }, [selectedCollection]);

  const loadTokenModules = useCallback(async (token: Token) => {
    if (!token.modules || token.modules.length === 0) {
      setMergedSchema(null);
      return;
    }
    try {
      const modules = await Promise.all(
        token.modules.map(modId => megadataApi.getModule(modId))
      );
      const combinedSchema = mergeSchemas(modules);
      setMergedSchema(combinedSchema);
    } catch (error) {
      console.error('Failed to load token modules:', error);
      setMergedSchema(null);
    }
  }, []);

  const loadTokens = useCallback(async (id: number, page: number) => {
    if (!id || isLoadingTokens) return;
    console.log(`Loading tokens for collection ID: ${id}, page: ${page}`);
    setIsLoadingTokens(true);
    try {
      const response = await megadataApi.getTokens(id, page, TOKENS_PAGE_SIZE);
      if (id === selectedCollection) {
        console.log(`Setting tokens for collection: ${id}`);
        setLoadedTokens(response.tokens);
        setTotalTokens(response.total);
        setCurrentPage(response.page);
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
  }, [selectedCollection]);

  const handlePageChange = useCallback((page: number) => {
    if (selectedCollection) {
      loadTokens(selectedCollection, page);
    }
  }, [selectedCollection, loadTokens]);

  useEffect(() => {
    console.log('[Effect selectedToken] Triggered. Selected token:', selectedToken?.id);
    if (selectedToken) {
      setEditedProperties(JSON.parse(JSON.stringify(selectedToken.data || {})));
      setHasUnsavedChanges(false);
      setTokenValidationError(null);
      loadTokenModules(selectedToken);
    } else {
      setEditedProperties({});
      setMergedSchema(null);
      setTokenValidationError(null);
    }
  }, [selectedToken, loadTokenModules]);

  useEffect(() => {
    if (!selectedToken) return;
    const currentProps = JSON.stringify(editedProperties);
    const originalProps = JSON.stringify(selectedToken.data || {});
    setHasUnsavedChanges(currentProps !== originalProps);
  }, [editedProperties, selectedToken]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleCreateToken = useCallback(async (tokenData: { id: string, modules: string[], data: Record<string, any> }) => {
    if (!selectedCollection || selectedCollectionData?.type === 'external') {
      alert("Cannot create tokens for this collection.");
      return;
    }
    try {
      const [newToken] = await megadataApi.createTokensBulk(selectedCollection, [tokenData]);
      await loadTokens(selectedCollection, 1);
      const freshTokens = await megadataApi.getTokens(selectedCollection, 1, TOKENS_PAGE_SIZE);
      const foundToken = freshTokens.tokens.find(t => t.id === newToken.id);
      setSelectedToken(foundToken || newToken);
      setIsCreateTokenDialogOpen(false);
    } catch (error) {
      console.error('Failed to create token:', error);
      alert(`Failed to create token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [selectedCollection, selectedCollectionData, loadTokens]);

  const handleTokenClick = useCallback(async (token: Token) => {
    console.log(`[handleTokenClick] Function called for token ID: ${token.id}`);
    if (token.id === selectedToken?.id) {
      console.log('[handleTokenClick] Clicked token is already selected.');
      return;
    }
    const selectTokenAction = () => {
      console.log(`[handleTokenClick] Calling setSelectedToken with token ID: ${token.id}`);
      setSelectedToken(token);
    };
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Discard them and select this token?')) {
        selectTokenAction();
      } else {
        return;
      }
    } else {
      selectTokenAction();
    }
    try {
      if (!walletAddress) {
        setTokenValidationError('Please connect your wallet to select a token.');
        return;
      }
      const validationResult = await megadataApi.validateToken(selectedCollection!, token.id);
      console.log('validationResult', validationResult);
      if (!validationResult.isValid) {
        setTokenValidationError(validationResult.error || 'Token validation failed. Edits may be limited.');
      }
    } catch (error) {
      console.error('Failed to validate token:', error);
      setTokenValidationError(`Validation check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [selectedToken?.id, hasUnsavedChanges, selectedCollection]);

  const handleTogglePublishSelection = useCallback((tokenId: string) => {
    setTokensToPublish(prev => {
      const newSet = new Set(prev);
      const token = loadedTokens.find(t => t.id === tokenId);
      if (token && !token.is_published) {
        if (newSet.has(tokenId)) newSet.delete(tokenId);
        else newSet.add(tokenId);
      }
      return newSet;
    });
  }, [loadedTokens]);

  const handlePublishSelectedTokens = useCallback(async () => {
    if (!selectedCollection || tokensToPublish.size === 0 || !walletAddress) return;
    if (!window.confirm(`Publish ${tokensToPublish.size} selected token(s)? This cannot be undone.`)) return;
    setIsPublishing(true);
    try {
      await megadataApi.publishTokens(selectedCollection, Array.from(tokensToPublish));
      setTokensToPublish(new Set());
      if (selectedToken && tokensToPublish.has(selectedToken.id)) {
        setSelectedToken(prev => prev ? { ...prev, is_published: true } : null);
        setHasUnsavedChanges(false);
      }
      await loadTokens(selectedCollection, currentPage);
      await loadCollectionData(selectedCollection);
    } catch (error: any) {
      console.error('Failed to publish tokens:', error);
      alert(`Publishing failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
    }
  }, [selectedCollection, tokensToPublish, walletAddress, selectedCollectionData, selectedToken, currentPage, loadTokens, loadCollectionData]);

  const handlePublishAllTokens = useCallback(async () => {
    if (!selectedCollection || !walletAddress || selectedCollectionData?.is_published) return;
    if (!window.confirm(`Publish all remaining unpublished tokens in this collection? This cannot be undone.`)) return;
    setIsPublishing(true);
    try {
      await megadataApi.publishTokens(selectedCollection, [], true);
      setTokensToPublish(new Set());
      if (selectedToken) {
        setSelectedToken(prev => prev ? { ...prev, is_published: true } : null);
        setHasUnsavedChanges(false);
      }
      await loadTokens(selectedCollection, 1);
      await loadCollectionData(selectedCollection);
    } catch (error: any) {
      console.error('Failed to publish all tokens:', error);
      alert(`Publishing failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
    }
  }, [selectedCollection, walletAddress, selectedCollectionData, selectedToken, loadTokens, loadCollectionData]);

  const handleSaveToken = useCallback(async () => {
    if (!selectedToken || !selectedCollection || !hasUnsavedChanges || tokenValidationError) return;
    setIsSaving(true);
    try {
      const updatedToken = await megadataApi.updateToken(
        selectedCollection,
        selectedToken.id,
        editedProperties,
        selectedToken.modules || []
      );
      setSelectedToken(updatedToken);
      setEditedProperties(JSON.parse(JSON.stringify(updatedToken.data || {})));
      setHasUnsavedChanges(false);
      setLoadedTokens(prev => prev.map(t => (t.id === updatedToken.id ? updatedToken : t)));
    } catch (error) {
      console.error('Failed to save token:', error);
      alert(`Failed to save token: ${error instanceof Error ? error.message : String(error)}`);
      setTokenValidationError(`Save failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedToken, selectedCollection, hasUnsavedChanges, editedProperties, tokenValidationError]);

  const handleCreateTokenClick = useCallback(() => {
    if (!walletAddress) {
      toast.error("Please connect your wallet to create tokens.");
      return;
    }
    if (!selectedCollection || selectedCollectionData?.type === 'external' || selectedCollectionData?.is_published) {
      alert("Cannot create tokens for external or published collections.");
      return;
    }
    setIsCreateTokenDialogOpen(true);
  }, [selectedCollection, selectedCollectionData, walletAddress]);

  const handleCreateTokenDialogSubmit = useCallback(async (tokenId: string) => {
    if (!selectedCollection || !selectedCollectionData || selectedCollectionData.type === 'external' || selectedCollectionData.is_published) return;
    const defaultModules = selectedCollectionData.modules || [];
    const defaultData = {};
    await handleCreateToken({ id: tokenId, modules: defaultModules, data: defaultData });
  }, [selectedCollection, selectedCollectionData, handleCreateToken]);

  const handleImportData = useCallback(async (items: any[]) => {
    if (!selectedCollection || !selectedCollectionData || selectedCollectionData.type === 'external' || selectedCollectionData.is_published) {
      alert("Cannot import tokens into external or published collections.");
      return;
    }
    if (!items || items.length === 0) {
      alert("No valid token data found to import.");
      return;
    }
    try {
      const tokensToCreate = items.map(item => ({
        id: item.tokenId,
        data: item.megadata || item.data || {},
        modules: selectedCollectionData?.modules || []
      }));
      await megadataApi.createTokensBulk(selectedCollection, tokensToCreate);
      await loadTokens(selectedCollection, 1);
    } catch (error) {
      console.error('Failed to import data:', error);
      alert(`Failed to import data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [selectedCollection, selectedCollectionData, loadTokens]);

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background to-blue-50/30 min-h-screen">
      <div className="container mx-auto max-w-screen-xl px-6 space-y-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl mb-5 text-primary font-bold">Editor</h1>
          <p className="text-xl text-muted-foreground">
            {walletAddress ? 'Create, manage, and publish your on-chain token metadata with advanced features.' : 'View on-chain token metadata.'}
          </p>
        </div>

        <Card className="p-4 shadow-lg rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm sticky top-4 z-10">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-full md:w-auto">
              <Select
                onValueChange={(value) => handleCollectionSelect(value ? Number(value) : null)}
                value={selectedCollection?.toString() || ''}
              >
                <SelectTrigger className="w-full md:w-[350px] h-11 rounded-lg text-base">
                  <SelectValue placeholder="Select a collection..." />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectGroup>
                    <SelectLabel className="px-4 py-2 text-sm">Collections</SelectLabel>
                    {collections.length === 0 && (
                      <SelectItem value="loading" disabled className="px-4 py-2 italic">
                        Loading collections...
                      </SelectItem>
                    )}
                    {collections.map(collection => (
                      <SelectItem key={collection.id} value={collection.id.toString()} className="px-4 py-2 text-base cursor-pointer hover:bg-primary/5">
                        {collection.name || `Collection ${collection.id}`} (ID: {collection.id})
                        {collection.type === 'external' && <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-600">External</Badge>}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {selectedCollection && walletAddress && (
              <div className="flex-grow flex items-center justify-start md:justify-end gap-3 flex-wrap">
                <Button
                  onClick={handlePublishSelectedTokens}
                  disabled={tokensToPublish.size === 0 || isPublishing}
                  title={selectedCollectionData?.is_published ? "Collection published" : "Publish selected tokens"}
                  variant="outline"
                  className="h-11 rounded-lg border-primary/50 text-primary hover:bg-primary/5"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {`Publish Selected (${tokensToPublish.size})`}
                </Button>
                <Button
                  onClick={handlePublishAllTokens}
                  disabled={isPublishing || selectedCollectionData?.is_published}
                  title={selectedCollectionData?.is_published ? "Collection published" : "Publish all remaining tokens"}
                  className="h-11 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Publish All
                </Button>
              </div>
            )}
          </div>
        </Card>

        {!selectedCollection && collections.length > 0 && (
          <Card className="p-12 text-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-card/50">
            <FolderOpen className="w-16 h-16 mx-auto mb-6 text-primary opacity-30" />
            <p className="text-xl">Please select a collection above to begin.</p>
          </Card>
        )}

        {selectedCollection && (
          <div className="space-y-10">
            <div className="grid md:grid-cols-1 gap-10">
              <Card className="shadow-sm rounded-xl border-border/50 bg-card/90 backdrop-blur-sm">
                <CardContent className="p-3">
                  <CompactUriDisplay
                    collection={selectedCollectionData}
                    selectedToken={selectedToken}
                    externalDetails={externalDetails}
                    isLoadingExternalDetails={isLoadingExternalDetails}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1">
                <Card className="shadow-md rounded-xl border-border/50 bg-card/90 backdrop-blur-sm h-[920px]">
                  <CardHeader className="border-b border-border/50 p-6">
                    <CardTitle className="text-xl text-primary font-medium">Tokens ({totalTokens ?? '...'})</CardTitle>
                    <CardDescription>Select a token below to view or edit.</CardDescription>
                  </CardHeader>
                  <div className="flex-1 h-[calc(800px-88px)] mx-4">
                    <TokenPageableList
                      items={loadedTokens}
                      totalItems={totalTokens ?? 0}
                      currentPage={currentPage}
                      pageSize={TOKENS_PAGE_SIZE}
                      isLoading={isLoadingTokens}
                      selectedToken={selectedToken}
                      onTokenClick={handleTokenClick}
                      onPageChange={handlePageChange}
                      tokensToPublish={tokensToPublish}
                      onTogglePublishSelection={walletAddress ? handleTogglePublishSelection : () => { }}
                      onCreateToken={walletAddress ? handleCreateTokenClick : () => { }}
                      allowTokenCreation={Boolean(walletAddress && selectedCollectionData?.type !== 'external' && !selectedCollectionData?.is_published)}
                    />
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="shadow-md rounded-xl border-border/50 bg-card/90 backdrop-blur-sm">
                  <CardHeader className="border-b border-border/50 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl text-primary font-medium">Editor</CardTitle>
                        <CardDescription>
                          {selectedToken ? `Editing Token ID: ${selectedToken.id}` : "Select a token to start editing"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        {selectedToken?.is_published && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-xs">Published</Badge>
                        )}
                        {tokenValidationError && (
                          <Badge variant="destructive" className="px-3 py-1 text-xs">Read-only</Badge>
                        )}
                        {hasUnsavedChanges && !tokenValidationError && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 px-3 py-1 text-xs">Unsaved</Badge>
                        )}
                        {hasUnsavedChanges && !tokenValidationError && (
                          <Button
                            onClick={handleSaveToken}
                            disabled={isSaving}
                            size="sm"
                            className="rounded-md"
                          >
                            <Save className="mr-1.5 h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-6 space-y-8 overflow-y-auto">
                    {selectedToken ? (
                      <>
                        {tokenValidationError && (
                          <div className="rounded-lg bg-destructive/10 p-5 border border-destructive/30 text-destructive">
                            <div className="flex items-start">
                              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                              <div>
                                <h3 className="text-sm font-semibold">Read-only: Validation Error</h3>
                                <p className="mt-1 text-sm opacity-90">{tokenValidationError}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <TokenModules
                          readonly={!!tokenValidationError || !walletAddress}
                          token={selectedToken}
                          onUpdateModules={async (newModules) => {
                            if (!selectedCollection || tokenValidationError || selectedToken.is_published) {
                              alert('Cannot update modules for published, external, or invalid tokens.');
                              return;
                            }
                            setIsSaving(true);
                            try {
                              const updatedToken = await megadataApi.updateToken(
                                selectedCollection, selectedToken.id, selectedToken.data, newModules
                              );
                              setSelectedToken(updatedToken);
                              setLoadedTokens(prev => prev.map(t => t.id === updatedToken.id ? updatedToken : t));
                              await loadTokenModules(updatedToken);
                              setHasUnsavedChanges(true);
                            } catch (error) {
                              const msg = error instanceof Error ? error.message : String(error);
                              alert(`Failed to update modules: ${msg}`);
                            } finally {
                              setIsSaving(false);
                            }
                          }}
                        />
                        <>
                          <MegadataForm
                            schema={mergedSchema ?? undefined}
                            value={editedProperties}
                            onChange={walletAddress ? (value: Record<string, any>) => setEditedProperties(value) : () => { }}
                            readOnly={!walletAddress || isSaving || isPublishing || !!tokenValidationError}
                          />
                          {!mergedSchema && (
                            <p className="text-sm text-muted-foreground mt-4 italic">No metadata schema defined by attached modules.</p>
                          )}
                        </>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-10 rounded-lg border-2 border-dashed border-border/40 bg-background/30">
                        <FileSearch className="w-16 h-16 mb-6 text-primary opacity-30" />
                        <p className="text-xl font-medium mb-2">Select a Token</p>
                        <p className="text-base max-w-xs mx-auto">Choose a token from the list on the left to view and manage its metadata properties and modules.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <CreateTokenDialog
          open={isCreateTokenDialogOpen}
          onOpenChange={setIsCreateTokenDialogOpen}
          onSubmit={handleCreateTokenDialogSubmit}
        />
      </div>
    </section>
  );
}
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
import type { Collection, Token, Module } from '@/lib/api/megadata';
import { config } from '@/lib/config';
import { CreateTokenDialog } from '@/components/CreateTokenDialog';
import { useWeb3Auth } from '@/providers/web3auth-provider';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SPECIAL_MODULES } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

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
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
              isProtectedModule(moduleId)
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-secondary/10 text-secondary-foreground border border-secondary/20'
            }`}
          >
            {moduleId}
            {!isProtectedModule(moduleId) && (
              <button
                onClick={() => onUpdateModules(token.modules.filter(id => id !== moduleId))}
                className="ml-1 opacity-60 hover:opacity-100 hover:text-destructive transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {isProtectedModule(moduleId) && (
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
          <ScrollArea className="h-[50vh] max-h-[500px] border-t border-b">
            <div className="space-y-3 p-6">
              {availableModules
                .filter(module => !token.modules.includes(module.id))
                .map(module => (
                  <div
                    key={module.id}
                    className={`p-4 rounded-lg border transition-all duration-150 cursor-pointer ${
                      selectedNewModules.includes(module.id)
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/50'
                        : 'border-border hover:border-primary/40 hover:bg-accent/30'
                    }`}
                    onClick={() => {
                      setSelectedNewModules(prev =>
                        prev.includes(module.id)
                          ? prev.filter(id => id !== module.id)
                          : [...prev, module.id]
                      );
                    }}
                  >
                    <h4 className="font-medium text-base text-foreground">{module.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                  </div>
                ))}
              {availableModules.filter(module => !token.modules.includes(module.id)).length === 0 && (
                <p className="text-center text-base text-muted-foreground py-8">No more modules available to add.</p>
              )}
            </div>
          </ScrollArea>
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
  const [initialCollectionId, setInitialCollectionId] = useState<number | undefined>();
  const { walletAddress } = useWeb3Auth();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(initialCollectionId || null);
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

  useEffect(() => {
    Promise.all([params, searchParams]).then(([paramsResult, searchParamsResult]) => {
      setInitialCollectionId(paramsResult.collectionId ? Number(paramsResult.collectionId) : undefined);
    });
  }, [params, searchParams]);

  const handleCollectionSelect = useCallback((id: number | null) => {
    console.log('handleCollectionSelect called with id:', id);
    if (id === selectedCollection) {
      console.log('Same collection selected, returning early');
      return;
    }

    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to switch collections? Changes will be lost.')) {
        if (id) {
          router.push(`/megadata/${id}`, { scroll: false });
        } else {
          router.push('/megadata', { scroll: false });
        }
      }
    } else {
      if (id) {
        router.push(`/megadata/${id}`, { scroll: false });
      } else {
        router.push('/megadata', { scroll: false });
      }
    }
  }, [selectedCollection, hasUnsavedChanges, router]);

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
  }, [selectedCollection]);

  const handlePageChange = useCallback((page: number) => {
    if (selectedCollection) {
      loadTokens(selectedCollection, page);
    }
  }, [selectedCollection, loadTokens]);

  const loadCollections = useCallback(async () => {
    if (!walletAddress) return;
    try {
      console.log('Loading collections...');
      const fetchedCollections = await megadataApi.getCollections();
      console.log('Fetched collections:', fetchedCollections);
      setCollections(fetchedCollections);
    } catch (error) {
      console.error("Failed to load collections", error);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      loadCollections();
    }
  }, [walletAddress, loadCollections]);

  useEffect(() => {
    if (isInitialLoad && initialCollectionId && collections.length > 0 && selectedCollection !== initialCollectionId) {
      const collectionExists = collections.some(c => c.id === initialCollectionId);
      if (collectionExists) {
        console.log(`Selecting initial collection: ${initialCollectionId}`);
        handleCollectionSelect(initialCollectionId);
      } else {
        console.log(`Initial collection ${initialCollectionId} not found, selecting none.`);
        handleCollectionSelect(null);
      }
      setIsInitialLoad(false);
    }
  }, [initialCollectionId, collections, selectedCollection, handleCollectionSelect, isInitialLoad]);

  useEffect(() => {
    if (selectedCollection === null) {
      setSelectedCollectionData(null);
      setLoadedTokens([]);
      setTotalTokens(null);
      setSelectedToken(null);
      setMergedSchema(null);
      setTokensToPublish(new Set());
      setHasUnsavedChanges(false);
      setCurrentPage(1);
      setIsLoadingTokens(false);
      return;
    }
    const loadData = async () => {
      console.log(`Loading data for collection: ${selectedCollection}`);
      setIsLoadingTokens(true);
      setSelectedToken(null);
      setEditedProperties({});
      setHasUnsavedChanges(false);
      setMergedSchema(null);
      await Promise.all([
        loadCollectionData(selectedCollection),
        loadModule(selectedCollection)
      ]);
      await loadTokens(selectedCollection, 1);
    };
    loadData();
  }, [selectedCollection, loadCollectionData, loadModule, loadTokens]);

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
      const foundToken = freshTokens.data.find(t => t.id === newToken.id);
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
      const validationResult = await megadataApi.validateToken(selectedCollection!, token.id);
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
    if (!selectedCollection || tokensToPublish.size === 0 || !walletAddress || selectedCollectionData?.is_published) return;
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
    if (!selectedToken || !selectedCollection || !hasUnsavedChanges || selectedToken.is_published || tokenValidationError) return;
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
    if (!selectedCollection || selectedCollectionData?.type === 'external' || selectedCollectionData?.is_published) {
      alert("Cannot create tokens for external or published collections.");
      return;
    }
    setIsCreateTokenDialogOpen(true);
  }, [selectedCollection, selectedCollectionData]);

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

  const handleImageUpload = useCallback(async (token: Token, file: File) => {
    if (!selectedCollection || !walletAddress || !token || token.is_published) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      alert('Invalid image file (must be image type, max 5MB).');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${config.megadataApiUri}/upload`, {
        method: 'POST', body: formData
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
      const { url } = await response.json();
      const updatedData = { ...token.data, image: url };
      const updatedToken = await megadataApi.updateToken(
        selectedCollection,
        token.id,
        updatedData,
        token.modules || []
      );
      setLoadedTokens(prev => prev.map(t => t.id === token.id ? updatedToken : t));
      if (selectedToken?.id === token.id) {
        setSelectedToken(updatedToken);
        setEditedProperties(JSON.parse(JSON.stringify(updatedToken.data || {})));
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [selectedCollection, walletAddress, selectedToken]);

  const handleDeleteToken = useCallback(async (tokenId: string) => {
    if (!selectedCollection || !walletAddress) return;
    const tokenToDelete = loadedTokens.find(t => t.id === tokenId);
    if (!tokenToDelete || tokenToDelete.is_published) {
      alert("Cannot delete published tokens or token not found.");
      return;
    }
    if (!window.confirm(`Delete token ${tokenId}? This cannot be undone.`)) return;
    try {
      await megadataApi.deleteToken(selectedCollection, tokenId);
      setLoadedTokens(prev => prev.filter(token => token.id !== tokenId));
      setTotalTokens(prev => (prev !== null ? Math.max(0, prev - 1) : null));
      if (selectedToken?.id === tokenId) {
        setSelectedToken(null);
      }
      setTokensToPublish(prev => { const next = new Set(prev); next.delete(tokenId); return next; });
      if (loadedTokens.length === 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else {
        loadTokens(selectedCollection, currentPage);
      }
    } catch (error) {
      console.error('Failed to delete token:', error);
      alert(`Failed to delete token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [selectedCollection, walletAddress, loadedTokens, currentPage, selectedToken, handlePageChange, loadTokens]);

  // Effect to handle URL changes
  useEffect(() => {
    if (initialCollectionId && collections.length > 0) {
      const collectionExists = collections.some(c => c.id === initialCollectionId);
      if (collectionExists && selectedCollection !== initialCollectionId) {
        console.log(`Selecting collection from URL: ${initialCollectionId}`);
        setSelectedToken(null);
        setEditedProperties({});
        setHasUnsavedChanges(false);
        setLoadedTokens([]);
        setTotalTokens(null);
        setCurrentPage(1);
        setMergedSchema(null);
        setTokensToPublish(new Set());
        setIsLoadingTokens(false);
        setSelectedCollection(initialCollectionId);
      } else if (!collectionExists) {
        console.log(`Collection ${initialCollectionId} not found, selecting none.`);
        setSelectedCollection(null);
      }
    } else if (!initialCollectionId && selectedCollection !== null) {
      console.log('No collection in URL, selecting none.');
      setSelectedCollection(null);
    }
  }, [initialCollectionId, collections, selectedCollection]);

  if (!walletAddress) {
    return (
      <section className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-background to-blue-50">
        <div className="container mx-auto max-w-md px-4 text-center">
          <Card className="p-10 shadow-xl rounded-2xl bg-card/90 backdrop-blur-sm">
            <Zap className="w-16 h-16 mx-auto mb-6 text-primary opacity-80" />
            <h2 className="text-2xl font-semibold mb-4 text-primary font-serif">Connect Your Wallet</h2>
            <p className="text-base text-muted-foreground mb-8">Please connect your wallet to access the MegaData management tools.</p>
            <p className="text-xs text-muted-foreground mt-6">Wallet connection is required to interact with your collections.</p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background to-blue-50/30 min-h-screen">
      <div className="container mx-auto max-w-screen-xl px-6 space-y-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif mb-5 text-primary font-bold">MegaData Editor</h1>
          <p className="text-xl text-muted-foreground">
            Create, manage, and publish your on-chain token metadata with advanced features.
          </p>
        </div>

        <Card className="p-6 shadow-lg rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm sticky top-4 z-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
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
                    <SelectLabel className="px-4 py-2 text-sm">My Collections</SelectLabel>
                    {collections.length === 0 && (
                      <SelectItem value="loading" disabled className="px-4 py-2 italic">
                        {walletAddress ? "Loading collections..." : "Connect wallet first"}
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
            {selectedCollection && (
              <div className="flex-grow flex items-center justify-start md:justify-end gap-3 flex-wrap">
                <Button
                  onClick={handlePublishSelectedTokens}
                  disabled={tokensToPublish.size === 0 || isPublishing || selectedCollectionData?.is_published}
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
              {/* <Card className="shadow-md rounded-xl border-border/50 bg-card/90 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 p-6">
                  <CardTitle className="text-xl text-primary font-medium">Import / Export</CardTitle>
                  <CardDescription>Download data for offline editing or import changes.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ImportExportTemplate
                    collectionId={selectedCollection.toString()}
                    onImport={handleImportData}
                    items={loadedTokens.map(token => ({
                      collection: selectedCollection.toString(),
                      tokenId: token.id,
                      data: token.data
                    }))}
                    published={selectedCollectionData?.is_published || false}
                    allowImport={selectedCollectionData?.type !== 'external' && !selectedCollectionData?.is_published}
                  />
                </CardContent>
              </Card> */}

              <Card className="shadow-md rounded-xl border-border/50 bg-card/90 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 p-6">
                  <CardTitle className="text-xl text-primary font-medium">Collection URI</CardTitle>
                  <CardDescription>
                    {selectedCollectionData?.is_published
                      ? "Access published metadata via these URIs."
                      : "URIs will be active once published. Preview:"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">Base URI:</p>
                  <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-lg text-sm border border-border/30">
                    <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                    <code className="font-mono text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {config.megaRouterUri}/megadata/
                      <span className={`font-semibold ${selectedCollectionData?.is_published ? 'text-primary' : 'text-muted-foreground/70'}`}>
                        {selectedCollection}
                      </span>/
                    </code>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 shrink-0 relative z-10 pointer-events-auto cursor-pointer"
                      onClick={(_) => {
                        const uri = `${config.megaRouterUri}/megadata/${selectedCollection}/`;
                        navigator.clipboard.writeText(uri)
                          .then(() => toast.success('Base URI copied to clipboard!'))
                          .catch(err => {
                            console.error('Failed to copy base URI:', err);
                            toast.error('Failed to copy base URI.');
                          });
                      }}
                      title="Copy Base URI"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedToken && (
                    <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-2">Token URI:</p>
                    <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-lg text-sm border border-border/30">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <code className="font-mono text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {config.megaRouterUri}/megadata/
                        <span className={`font-semibold ${selectedCollectionData?.is_published ? 'text-primary' : 'text-muted-foreground/70'}`}>
                          {selectedCollection}
                        </span>/
                        <span className={`font-semibold ${selectedCollectionData?.is_published ? 'text-accent-foreground' : 'text-muted-foreground/70'}`}>
                          {selectedToken.id}
                        </span>
                      </code>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 shrink-0 relative z-10 pointer-events-auto cursor-pointer"
                        onClick={(_) => {
                          const uri = `${config.megaRouterUri}/megadata/${selectedCollection}/${selectedToken.id}`;
                          navigator.clipboard.writeText(uri)
                            .then(() => toast.success('Full Token URI copied to clipboard!'))
                            .catch(err => {
                              console.error('Failed to copy token URI:', err);
                              toast.error('Failed to copy token URI.');
                            });
                        }}
                        title="Copy Full Token URI"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      </div>
                    </div>
                  )}
                  {selectedToken && selectedToken.modules.includes(SPECIAL_MODULES.EXTENDING_METADATA) && selectedToken.data?.uri && (
                    <div className="pt-4 mt-4 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-2">MegaRouter Gateway (Extended Metadata):</p>
                      <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-lg text-sm border border-border/30">
                        <LinkIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <code className="font-mono text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={selectedToken.data.uri}>
                          {config.megaRouterUri}/ext/
                          <span className={`font-semibold ${selectedCollectionData?.is_published ? 'text-accent-foreground' : 'text-muted-foreground/70'}`}>
                            {selectedToken.data.uri}
                          </span>
                        </code>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 shrink-0 relative z-10 pointer-events-auto cursor-pointer"
                          onClick={(_) => {
                            const uri = `${config.megaRouterUri}/ext/${selectedToken.data.uri}`;
                            navigator.clipboard.writeText(uri)
                              .then(() => toast.success('Gateway URI copied to clipboard!'))
                              .catch(err => {
                                console.error('Failed to copy gateway URI:', err);
                                toast.error('Failed to copy gateway URI.');
                              });
                          }}
                          title="Copy Gateway URI"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-10 min-h-[700px]">
              <div className="lg:col-span-1 h-full flex flex-col">
                <Card className="shadow-md rounded-xl border-border/50 bg-card/90 backdrop-blur-sm h-full flex flex-col">
                  <CardHeader className="border-b border-border/50 p-6">
                    <CardTitle className="text-xl text-primary font-medium">Tokens ({totalTokens ?? '...'})</CardTitle>
                    <CardDescription>Select a token below to view or edit.</CardDescription>
                  </CardHeader>
                  <div className="flex-1 min-h-0 px-3">
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
                      onTogglePublishSelection={handleTogglePublishSelection}
                      onCreateToken={handleCreateTokenClick}
                      allowTokenCreation={selectedCollectionData?.type !== 'external' && !selectedCollectionData?.is_published}
                    />
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-2 h-full flex flex-col">
                <Card className="shadow-md rounded-xl border-border/50 bg-card/90 backdrop-blur-sm h-full flex flex-col">
                  <CardHeader className="border-b border-border/50 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl text-primary font-medium">MegaData Editor</CardTitle>
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
                        {hasUnsavedChanges && !selectedToken?.is_published && !tokenValidationError && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 px-3 py-1 text-xs">Unsaved</Badge>
                        )}
                        {hasUnsavedChanges && !selectedToken?.is_published && !tokenValidationError && (
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
                          readonly={!!tokenValidationError}
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
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                          <h4 className="text-base font-medium text-primary mb-4">Metadata Properties</h4>
                          <MegadataForm
                            schema={mergedSchema ?? undefined}
                            value={editedProperties}
                            onChange={setEditedProperties}
                            readOnly={isSaving || isPublishing || !!tokenValidationError || selectedToken.is_published}
                          />
                          {!mergedSchema && (
                            <p className="text-sm text-muted-foreground mt-4 italic">No metadata schema defined by attached modules.</p>
                          )}
                        </div>
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
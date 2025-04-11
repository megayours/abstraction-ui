'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, Loader2 } from "lucide-react"
import * as megadataApi from '@/lib/api/megadata'
import type { Module } from '@/lib/api/megadata'
import { useWeb3Auth } from '@/providers/web3auth-provider'
import { SPECIAL_MODULES } from '@/lib/constants'

// Helper functions (similar to megadata/page.tsx)
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

export default function CreateCollectionPage() {
  const router = useRouter();
  const { walletAddress, isConnected } = useWeb3Auth();
  const [name, setName] = useState('');
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isModulesLoading, setIsModulesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available modules
  useEffect(() => {
    const loadModules = async () => {
      if (!isConnected) {
        setIsModulesLoading(false);
        return;
      }
      setIsModulesLoading(true);
      try {
        const modules = await megadataApi.getModules();
        setAvailableModules(modules
          .filter(module => module.id !== SPECIAL_MODULES.EXTENDING_COLLECTION)
          .filter(module => module.id !== SPECIAL_MODULES.EXTENDING_METADATA));
      } catch (err) {
        console.error("Failed to load modules:", err);
        setError("Failed to load available modules. Please refresh.");
      } finally {
        setIsModulesLoading(false);
      }
    };
    loadModules();
  }, [isConnected]);

  const handleModuleChange = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletAddress || !name) {
      setError('Please connect your wallet and provide a collection name.');
      return;
    }
    if (tokenCount < 0 || startIndex < 0) {
      setError('Token count and starting index cannot be negative.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Create Collection
      const newCollection = await megadataApi.createCollection(name);
      const collectionId = newCollection.id;

      // 2. Create Initial Tokens if count > 0
      if (tokenCount > 0) {
        let defaultData: Record<string, any> = {};
        // Fetch schemas only for selected modules
        if (selectedModules.length > 0) {
            const modulesWithSchema = await Promise.all(
                selectedModules.map(id => megadataApi.getModule(id))
            );
            const mergedSchema = mergeSchemas(modulesWithSchema);
            if (mergedSchema?.properties) {
                Object.entries(mergedSchema.properties).forEach(([key, propSchema]) => {
                    defaultData[key] = generateDefaultValue(propSchema);
                });
            }
        }

        const tokenPayloads = Array.from({ length: tokenCount }).map((_, i) => ({
          id: (startIndex + i).toString(),
          data: defaultData, // Use the generated default data
          modules: selectedModules, // Apply selected modules to each token
        }));

        await megadataApi.createTokensBulk(collectionId, tokenPayloads);
      }

      // 3. Redirect
      router.push(`/megadata/${collectionId}`);

    } catch (err) {
      console.error("Failed to create collection or tokens:", err);
      setError(`Operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background to-blue-50/30 min-h-screen">
      <div className="container mx-auto max-w-screen-xl px-6 space-y-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif mb-5 text-primary font-bold">Create Collection</h1>
          <p className="text-xl text-muted-foreground">
            Start a new dynamic token collection from scratch.
          </p>
        </div>

        {!isConnected ? (
          <Card className="max-w-2xl mx-auto p-6 shadow-lg rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Please connect your wallet to create a collection.</p>
            </div>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto p-6 shadow-lg rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary">Collection Details</CardTitle>
              <CardDescription>Enter the name and optionally add modules and initial tokens.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Collection Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Collection Name</Label>
                  <Input 
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Awesome Token Collection"
                    required 
                    className="focus:border-ring"
                  />
                </div>
                
                {/* Module Selection */}
                <div className="space-y-3">
                  <Label className="text-foreground">Assign Modules (Optional)</Label>
                  {isModulesLoading ? (
                    <div className="flex items-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading modules...
                    </div>
                  ) : availableModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No modules available.</p>
                  ) : (
                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                      <div className="space-y-3">
                        {availableModules.map((module) => (
                          <div key={module.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`module-${module.id}`}
                              checked={selectedModules.includes(module.id)}
                              onCheckedChange={() => handleModuleChange(module.id)}
                            />
                            <label
                              htmlFor={`module-${module.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {module.name} <span className="text-xs text-muted-foreground">({module.id})</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Initial Token Creation */}
                <div className="space-y-3">
                  <Label className="text-foreground">Create Initial Tokens (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tokenCount" className="text-sm text-muted-foreground">Number of Tokens</Label>
                      <Input 
                        id="tokenCount"
                        type="number"
                        min="0"
                        value={tokenCount}
                        onChange={(e) => setTokenCount(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="focus:border-ring"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="startIndex" className="text-sm text-muted-foreground">Starting Index</Label>
                      <Input 
                        id="startIndex"
                        type="number"
                        min="0" 
                        value={startIndex}
                        onChange={(e) => setStartIndex(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="focus:border-ring"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create initial tokens with default values. You can add more tokens later.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Collection'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
} 
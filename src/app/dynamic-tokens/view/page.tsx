'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Terminal, ExternalLink, Globe, Zap } from "lucide-react"
import * as megadataApi from '@/lib/api/megadata'
import type { Collection } from '@/lib/api/megadata'
import { useWeb3Auth } from '@/providers/web3auth-provider'
import { Badge } from '@/components/ui/badge'

type FilterType = 'all' | 'owned' | 'external';

export default function ViewCollectionsPage() {
  const { walletAddress, isConnected } = useWeb3Auth();
  const [ownedCollections, setOwnedCollections] = useState<Collection[]>([]);
  const [externalCollections, setExternalCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const allCollections = useMemo(() => {
    return [...ownedCollections, ...externalCollections].sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.id - b.id;
    });
  }, [ownedCollections, externalCollections]);

  const displayedCollections = useMemo(() => {
    let filtered = [];
    if (filter === 'owned') {
      filtered = ownedCollections;
    } else if (filter === 'external') {
      filtered = externalCollections;
    } else {
      filtered = allCollections;
    }
    return filtered.sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.id - b.id;
    });
  }, [filter, ownedCollections, externalCollections, allCollections]);

  useEffect(() => {
    const loadCollections = async () => {
      if (!isConnected || !walletAddress) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedOwnedCollections, fetchedExternalCollections] = await Promise.all([
          megadataApi.getCollections(),
          megadataApi.getCollections({ type: 'external' })
        ]);
        setOwnedCollections(fetchedOwnedCollections);
        setExternalCollections(fetchedExternalCollections);
      } catch (err) {
        console.error("Failed to load collections:", err);
        setError("Failed to load collections. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCollections();
  }, [walletAddress, isConnected]);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="border-border/50 bg-card/90 backdrop-blur-sm">
          <CardHeader className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCollectionItem = (collection: Collection) => (
    <Card key={collection.id} className="group hover:shadow-xl transition-all duration-300 ease-in-out border-border/50 bg-card/90 backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-base font-semibold text-primary leading-tight">
              {collection.name || `Collection ${collection.id}`}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              ID: {collection.id}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {collection.type === 'external' && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200/50">
                <ExternalLink className="h-3 w-3 mr-1" />
                External
              </Badge>
            )}
            {collection.is_published && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200/50">
                <Globe className="h-3 w-3 mr-1" />
                Published
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            <Zap className="h-4 w-4 mr-1.5 text-primary/70" />
            {collection.type === 'external' ? 'External Collection' : 'Your Collection'}
          </div>
          <Button 
            asChild 
            size="sm" 
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors"
          >
            <Link href={`/megadata/${collection.id}`}>Manage</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Please connect your wallet to view collections.</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    const showEmptyState = !isLoading && displayedCollections.length === 0;
    let emptyStateMessage = "";
    if (showEmptyState) {
        if (filter === 'owned') emptyStateMessage = "You haven't created any collections yet.";
        else if (filter === 'external') emptyStateMessage = "No external collections found.";
        else emptyStateMessage = "No collections found.";
    }

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
          <h2 className="text-lg font-medium text-primary">
            {filter === 'all' && 'All Collections'}
            {filter === 'owned' && 'Your Collections'}
            {filter === 'external' && 'External Collections'}
            <span className="ml-2 text-muted-foreground font-normal">({displayedCollections.length})</span>
          </h2>
          <ToggleGroup 
            type="single"
            value={filter}
            onValueChange={(value: string) => { if (value) setFilter(value as FilterType) }}
            aria-label="Filter collections"
            className="px-4 inline-flex h-10 items-center justify-center rounded-lg bg-muted text-muted-foreground isolate overflow-hidden"
          >
            <ToggleGroupItem
              value="all"
              aria-label="Show all collections"
              className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors hover:bg-muted-foreground/10 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              All
            </ToggleGroupItem>
            <ToggleGroupItem
              value="owned"
              aria-label="Show your collections"
              className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors hover:bg-muted-foreground/10 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Yours
            </ToggleGroupItem>
            <ToggleGroupItem
              value="external"
              aria-label="Show external collections"
              className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors hover:bg-muted-foreground/10 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              External
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {isLoading ? (
          renderSkeleton()
        ) : showEmptyState ? (
          <div className="text-center py-12 border border-dashed border-border/50 rounded-lg bg-card/50">
            <p className="text-lg text-muted-foreground">{emptyStateMessage}</p>
            {filter !== 'external' && (
              <Button asChild variant="link" className="mt-4 text-primary">
                <Link href="/dynamic-tokens/create">Create a Collection</Link>
              </Button>
            )}
            {filter === 'external' && (
              <p className="text-sm text-muted-foreground mt-2">
                (External collections are shared and may not be owned by you)
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayedCollections.map(renderCollectionItem)}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background to-blue-50/30 min-h-screen">
      <div className="container mx-auto max-w-screen-xl px-6 space-y-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif mb-5 text-primary font-bold">View Collections</h1>
          <p className="text-xl text-muted-foreground">
            Browse and manage your Dynamic Token collections.
          </p>
        </div>

        <Card className="p-6 shadow-lg rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
          {renderContent()}
        </Card>
      </div>
    </section>
  );
} 
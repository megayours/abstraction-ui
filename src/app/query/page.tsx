"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AssetFilter, AssetGroup } from '@/lib/types';
import { fetchAssetGroups, fetchAssetGroupFilters, fetchEligibleAccounts } from '@/lib/api/abstraction-chain';
import { FilterForm } from './components/FilterForm';
import { ResultsTable } from './components/ResultsTable';
import { useWallet } from '@/contexts/WalletContext';
import { Plus } from 'lucide-react';
import { AssetRegistrationModal } from './components/AssetRegistrationModal';
import { Loading } from "@/components/ui/loading";
import { Loader2 } from 'lucide-react';
import { SaveQueryDialog } from './components/SaveQueryDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toHexBuffer } from '@/lib/util';
import { useWeb3Auth } from '@/providers/web3auth-provider';

export default function QueryPage() {
  const { walletAddress } = useWeb3Auth();
  // Main states
  const [filters, setFilters] = useState<AssetFilter[]>([]);
  const [results, setResults] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isAssetRegistrationOpen, setIsAssetRegistrationOpen] = useState(false);
  const [savedQueries, setSavedQueries] = useState<AssetGroup[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);

  // Load saved queries on mount
  useEffect(() => {
    const loadSavedQueries = async () => {
      if (!walletAddress) return;

      try {
        const queries = await fetchAssetGroups(walletAddress);
        setSavedQueries(queries);
      } catch (error) {
        console.error('Failed to load saved queries:', error);
      }
    };
    loadSavedQueries();
  }, [walletAddress]);

  const handleAddFilter = async (filter: AssetFilter): Promise<void> => {
    setFilters(prevFilters => [...prevFilters, filter]);
    toast.success('Filter added successfully');
  };

  const handleEditFilter = async (index: number, filter: AssetFilter): Promise<void> => {
    setFilters(prevFilters => prevFilters.map((f, i) => i === index ? filter : f));
    setEditingFilterIndex(null);
    toast.success('Filter updated successfully');
  };

  const handleRemoveFilter = async (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
    toast.success('Filter removed successfully');
  };

  const handleClearFilters = async () => {
    setFilters([]);
    toast.success('All filters cleared');
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setDateRange({ from, to });
  };

  const handleQueryExecution = async () => {
    if (filters.length === 0) {
      toast.error('Please add at least one filter');
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchEligibleAccounts(filters, dateRange.from, dateRange.to);
      setResults(data);
      toast.success('Query executed successfully');
    } catch (error) {
      toast.error('Failed to execute query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuerySelect = async (queryId: string) => {
    try {
      const filters = await fetchAssetGroupFilters(toHexBuffer(queryId));
      setFilters(filters);
      setSelectedQueryId(queryId);
      toast.success('Query loaded successfully');
    } catch (error) {
      toast.error('Failed to load query filters');
    }
  };

  if (!walletAddress) {
    return (
      <section className="container py-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center space-y-6">
            <h1 className="text-balance text-4xl font-medium lg:text-5xl">Asset Filters</h1>
            <p className="text-lg text-muted-foreground">Please connect your wallet to access the asset filters.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 md:py-30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-balance text-4xl font-medium lg:text-5xl italic">Query Builder</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Build queries to find eligible assets based on your criteria</p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Query Builder Panel */}
            <Card className="xl:col-span-1">
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Query Management */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium">Build Query</h2>
                    <div className="flex items-center gap-3">
                      <SaveQueryDialog 
                        filters={filters} 
                        existingId={selectedQueryId || undefined}
                        existingName={savedQueries.find(q => q.id === selectedQueryId)?.name}
                        onSave={() => {
                          fetchAssetGroups(walletAddress).then(setSavedQueries);
                        }} 
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAssetRegistrationOpen(true)}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Register Asset
                      </Button>
                    </div>
                  </div>

                  {/* Saved Queries Dropdown */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Saved Queries</label>
                    <Select value={selectedQueryId || ''} onValueChange={handleQuerySelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a saved query" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedQueries.map((query) => (
                          <SelectItem key={query.id.toString()} value={query.id.toString()}>
                            {query.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filter Form */}
                  <div className="space-y-6">
                    <FilterForm
                      onSubmit={handleAddFilter}
                      onEdit={editingFilterIndex !== null ? (filter) => handleEditFilter(editingFilterIndex!, filter) : undefined}
                      initialValues={editingFilterIndex !== null ? filters[editingFilterIndex] : undefined}
                      currentFilters={filters}
                    />
                  </div>

                  {/* Active Filters */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Active Filters</h3>
                      {filters.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFilters}
                          className="text-destructive"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {filters.map((filter, index) => (
                        <div
                          key={`${filter.source}-${filter.asset}`}
                          className="flex items-center justify-between p-4 rounded-md border"
                        >
                          <div className="space-y-2 flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{filter.source}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {filter.asset} (min: {filter.requires})
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingFilterIndex(index)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFilter(index)}
                              className="text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      {filters.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          No filters added yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="xl:col-span-2">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Results</h2>
                    <Button
                      onClick={handleQueryExecution}
                      disabled={filters.length === 0 || isLoading}
                      className="whitespace-nowrap"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        'Execute Query'
                      )}
                    </Button>
                  </div>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loading />
                    </div>
                  ) : (
                    <ResultsTable
                      results={results}
                      isLoading={isLoading}
                      onQuery={handleQueryExecution}
                      onDateRangeChange={handleDateRangeChange}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AssetRegistrationModal
        isOpen={isAssetRegistrationOpen}
        onClose={() => setIsAssetRegistrationOpen(false)}
      />
    </section>
  );
} 
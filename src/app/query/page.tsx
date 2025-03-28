"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AssetFilter, AssetGroup } from '@/lib/types';
import { fetchAssetGroups, fetchAssetGroupFilters, createAssetGroup, addAssetGroupFilter, removeAssetGroupFilter, fetchEligibleAccounts } from '@/lib/api/abstraction-chain';
import { FilterForm } from './components/FilterForm';
import { ResultsTable } from './components/ResultsTable';
import { Input } from "@/components/ui/input";
import { useWallet } from '@/contexts/WalletContext';
import { Plus } from 'lucide-react';
import { AssetRegistrationModal } from './components/AssetRegistrationModal';
import { formatAddress } from '@/lib/util';

export default function QueryPage() {
  const { account } = useWallet();
  // Main states
  const [filters, setFilters] = useState<AssetFilter[]>([]);
  const [results, setResults] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [assetGroups, setAssetGroups] = useState<AssetGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isAssetRegistrationOpen, setIsAssetRegistrationOpen] = useState(false);

  // Load asset groups on mount
  useEffect(() => {
    const loadAssetGroups = async () => {
      try {
        const groupIds = await fetchAssetGroups();
        // Convert string[] to AssetGroup[]
        const groups = await Promise.all(
          groupIds.map(async (id) => {
            const filters = await fetchAssetGroupFilters(id);
            return {
              id,
              filters,
              created_at: Date.now(), // These should come from the API
              updated_at: Date.now()
            };
          })
        );
        setAssetGroups(groups);
      } catch (error) {
        toast.error('Failed to load asset groups');
      }
    };
    loadAssetGroups();
  }, []);

  const handleAddFilter = async (filter: AssetFilter): Promise<void> => {
    try {
      // If a group is selected, save to group
      if (selectedGroupId) {
        await addAssetGroupFilter(selectedGroupId, filter.source, filter.asset, filter.requires);
      }
      
      // Add to local filters regardless of group selection
      setFilters(prevFilters => [...prevFilters, filter]);
      toast.success('Filter added successfully');
    } catch (error) {
      toast.error('Failed to add filter');
      throw error;
    }
  };

  const handleEditFilter = async (index: number, filter: AssetFilter): Promise<void> => {
    try {
      // If a group is selected, update in group
      if (selectedGroupId) {
        const oldFilter = filters[index];
        await removeAssetGroupFilter(selectedGroupId, oldFilter.source, oldFilter.asset);
        await addAssetGroupFilter(selectedGroupId, filter.source, filter.asset, filter.requires);
      }
      
      // Update local filters regardless of group selection
      setFilters(prevFilters => prevFilters.map((f, i) => i === index ? filter : f));
      setEditingFilterIndex(null);
      toast.success('Filter updated successfully');
    } catch (error) {
      toast.error('Failed to update filter');
      throw error;
    }
  };

  const handleRemoveFilter = async (index: number) => {
    try {
      // If a group is selected, remove from group
      if (selectedGroupId) {
        const filter = filters[index];
        await removeAssetGroupFilter(selectedGroupId, filter.source, filter.asset);
      }
      
      // Remove from local filters regardless of group selection
      setFilters(filters.filter((_, i) => i !== index));
      toast.success('Filter removed successfully');
    } catch (error) {
      toast.error('Failed to remove filter');
    }
  };

  const handleClearFilters = async () => {
    try {
      // If a group is selected, clear all filters from group
      if (selectedGroupId) {
        await Promise.all(
          filters.map(filter => 
            removeAssetGroupFilter(selectedGroupId, filter.source, filter.asset)
          )
        );
      }
      
      // Clear local filters regardless of group selection
      setFilters([]);
      toast.success('All filters cleared');
    } catch (error) {
      toast.error('Failed to clear filters');
    }
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

  const handleCreateGroup = async (groupId: string) => {
    try {
      await createAssetGroup(groupId);
      setSelectedGroupId(groupId);
      setFilters([]);
      setIsCreatingNew(false);
      toast.success('Asset group created successfully');
    } catch (error) {
      toast.error('Failed to create asset group');
    }
  };

  const handleGroupSelect = async (groupId: string) => {
    try {
      const filters = await fetchAssetGroupFilters(groupId);
      setFilters(filters);
      setSelectedGroupId(groupId);
      setIsCreatingNew(false);
      toast.success('Asset group filters loaded');
    } catch (error) {
      toast.error('Failed to load asset group filters');
    }
  };

  if (!account) {
    return (
      <section className="py-12 md:py-30">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center space-y-6">
            <h1 className="text-balance text-4xl font-medium lg:text-5xl">Asset Filters</h1>
            <p className="text-lg text-muted-foreground">Please connect your wallet to access the asset filters.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-balance text-4xl font-medium lg:text-5xl italic">Query Builder</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Build queries to find eligible assets based on your criteria</p>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Query Builder Panel */}
            <Card className="xl:col-span-1">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Group Management */}
                  <div className="flex items-center gap-3">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-ellipsis"
                      value={selectedGroupId || ''}
                      onChange={(e) => handleGroupSelect(e.target.value)}
                      style={{ textOverflow: 'ellipsis' }}
                    >
                      <option value="">Select a saved group</option>
                      {assetGroups.map((group) => (
                        <option 
                          key={group.id} 
                          value={group.id}
                          style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                          title={group.id}
                        >
                          {group.id}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreatingNew(true)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Asset Registration Button */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Build Query</h2>
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

                  {/* Filter Form */}
                  <div className="space-y-4">
                    <FilterForm
                      onSubmit={handleAddFilter}
                      onEdit={editingFilterIndex !== null ? (filter) => handleEditFilter(editingFilterIndex!, filter) : undefined}
                      initialValues={editingFilterIndex !== null ? filters[editingFilterIndex] : undefined}
                      currentFilters={filters}
                    />
                  </div>

                  {/* Active Filters */}
                  {filters.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground">Active Filters</h3>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFilters}
                          className="text-xs h-7"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {filters.map((filter, index) => (
                          <div 
                            key={index}
                            className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm"
                          >
                            <div className="flex-1 space-y-1 min-w-0">
                              <div className="font-medium">{filter.source}</div>
                              <div className="text-muted-foreground truncate">
                                Asset: {formatAddress(filter.asset)}
                              </div>
                              <div className="text-muted-foreground">
                                Required: {filter.requires}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingFilterIndex(index)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  <path d="m15 5 4 4" />
                                </svg>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveFilter(index)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Query Results Panel */}
            <Card className="xl:col-span-2">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Query Results</h2>
                    <Button
                      onClick={handleQueryExecution}
                      disabled={filters.length === 0}
                      className="whitespace-nowrap"
                    >
                      Execute Query
                    </Button>
                  </div>

                  <ResultsTable
                    results={results}
                    isLoading={isLoading}
                    onQuery={handleQueryExecution}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Group Modal */}
          {isCreatingNew && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
              <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">Save Filter Group</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCreatingNew(false)}
                        >
                          ✕
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter group name"
                          onChange={(e) => setSelectedGroupId(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setIsCreatingNew(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleCreateGroup(selectedGroupId!)}
                          >
                            Save Group
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Asset Registration Modal */}
          <AssetRegistrationModal
            isOpen={isAssetRegistrationOpen}
            onClose={() => setIsAssetRegistrationOpen(false)}
          />
        </div>
      </div>
    </section>
  );
} 
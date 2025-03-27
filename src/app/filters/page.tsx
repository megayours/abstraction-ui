"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AssetFilter, AssetGroup } from '@/lib/types';
import { fetchAssetGroups, fetchAssetGroupFilters, createAssetGroup, addAssetGroupFilter, removeAssetGroupFilter, fetchEligibleAccounts } from '@/lib/api/abstraction-chain';
import { FilterForm } from './components/FilterForm';
import { FilterList } from './components/FilterList';
import { ResultsTable } from './components/ResultsTable';
import { AssetGroupManager } from './components/AssetGroupManager';
import { Input } from "@/components/ui/input";

export default function FiltersPage() {
  // Main states
  const [filters, setFilters] = useState<AssetFilter[]>([]);
  const [results, setResults] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [assetGroups, setAssetGroups] = useState<AssetGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

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

  const handleAddFilter = async (filter: AssetFilter) => {
    if (!selectedGroupId) {
      toast.error('Please select or create an asset group first');
      return;
    }

    try {
      await addAssetGroupFilter(selectedGroupId, filter.source, filter.asset, filter.requires);
      setFilters([...filters, filter]);
      toast.success('Filter added successfully');
    } catch (error) {
      toast.error('Failed to add filter to asset group');
    }
  };

  const handleRemoveFilter = async (index: number) => {
    if (!selectedGroupId) return;

    const filter = filters[index];
    try {
      await removeAssetGroupFilter(selectedGroupId, filter.source, filter.asset);
      setFilters(filters.filter((_, i) => i !== index));
      toast.success('Filter removed successfully');
    } catch (error) {
      toast.error('Failed to remove filter from asset group');
    }
  };

  const handleEditFilter = async (index: number, filter: AssetFilter) => {
    if (!selectedGroupId) return;

    const oldFilter = filters[index];
    try {
      // Remove old filter
      await removeAssetGroupFilter(selectedGroupId, oldFilter.source, oldFilter.asset);
      // Add new filter
      await addAssetGroupFilter(selectedGroupId, filter.source, filter.asset, filter.requires);
      
      setFilters(filters.map((f, i) => i === index ? filter : f));
      setEditingFilterIndex(null);
      toast.success('Filter updated successfully');
    } catch (error) {
      toast.error('Failed to update filter in asset group');
    }
  };

  const handleClearFilters = async () => {
    if (!selectedGroupId) return;

    try {
      // Remove all filters from the group
      await Promise.all(
        filters.map(filter => 
          removeAssetGroupFilter(selectedGroupId, filter.source, filter.asset)
        )
      );
      setFilters([]);
      toast.success('All filters cleared');
    } catch (error) {
      toast.error('Failed to clear filters from asset group');
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

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Asset Groups</h1>
        <Button onClick={() => setIsCreatingNew(true)}>
          Create New Asset Group
        </Button>
      </div>

      {isCreatingNew ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Create New Asset Group</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter group ID"
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-48"
                />
                <Button onClick={() => handleCreateGroup(selectedGroupId!)}>
                  Create Group
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <AssetGroupManager
                assetGroups={assetGroups}
                onGroupSelect={handleGroupSelect}
              />
            </CardContent>
          </Card>

          {selectedGroupId && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <FilterForm
                    onSubmit={handleAddFilter}
                    onEdit={editingFilterIndex !== null ? (filter) => handleEditFilter(editingFilterIndex!, filter) : undefined}
                    initialValues={editingFilterIndex !== null ? filters[editingFilterIndex] : undefined}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <FilterList
                    filters={filters}
                    onRemove={handleRemoveFilter}
                    onEdit={(index: number) => setEditingFilterIndex(index)}
                    onClear={handleClearFilters}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <ResultsTable
                    results={results}
                    isLoading={isLoading}
                    onQuery={handleQueryExecution}
                    onDateRangeChange={handleDateRangeChange}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
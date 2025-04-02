import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetFilter } from '@/lib/types';
import { fetchSources, fetchAssets } from '@/lib/api/abstraction-chain';
import { formatAddress } from '@/lib/util';

export interface FilterFormProps {
  onSubmit: (filter: AssetFilter) => Promise<void>;
  onEdit?: (filter: AssetFilter) => Promise<void>;
  initialValues?: AssetFilter;
  currentFilters: AssetFilter[];
}

export function FilterForm({ onSubmit, onEdit, initialValues, currentFilters }: FilterFormProps) {
  const [sources, setSources] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>(initialValues?.source || '');
  const [selectedAsset, setSelectedAsset] = useState<string>(initialValues?.asset || '');
  const [requires, setRequires] = useState(initialValues?.requires || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load sources on mount
  useEffect(() => {
    const loadSources = async () => {
      try {
        const sources = await fetchSources();
        setSources(sources);
      } catch (error) {
        console.error('Failed to load sources:', error);
      }
    };
    loadSources();
  }, []);

  // Load assets when source changes or when initialValues is provided
  useEffect(() => {
    const loadAssets = async () => {
      if (!selectedSource) {
        setAssets([]);
        if (!initialValues?.asset) {
          setSelectedAsset('');
        }
        return;
      }

      try {
        const assets = await fetchAssets(selectedSource);
        setAssets(assets);
        if (!initialValues?.asset) {
          setSelectedAsset('');
        }
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };
    loadAssets();
  }, [selectedSource, initialValues]);

  // Update form when initialValues changes
  useEffect(() => {
    if (initialValues) {
      setSelectedSource(initialValues.source);
      setSelectedAsset(initialValues.asset);
      setRequires(initialValues.requires);
    }
  }, [initialValues]);

  // Check if an asset is already used in a filter
  const isAssetUsed = (asset: string) => {
    return currentFilters.some(filter => 
      filter.source === selectedSource && filter.asset === asset && 
      (!initialValues || initialValues.asset !== asset)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || !selectedAsset || isSubmitting) {
      return;
    }

    const filter: AssetFilter = {
      source: selectedSource,
      asset: selectedAsset,
      requires: Number(requires)
    };

    setIsSubmitting(true);
    try {
      if (onEdit) {
        await onEdit(filter);
      } else {
        await onSubmit(filter);
      }

      // Only reset form after successful submission
      setSelectedSource('');
      setSelectedAsset('');
      setRequires(0);
    } catch (error) {
      console.error('Failed to submit filter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="source">Source</Label>
        <Select
          value={selectedSource}
          onValueChange={setSelectedSource}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a source" className="text-ellipsis" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((source) => (
              <SelectItem
                key={source}
                value={source}
                className="truncate"
                title={source}
              >
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="asset">Asset</Label>
        <Select
          value={selectedAsset}
          onValueChange={setSelectedAsset}
          disabled={!selectedSource}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an asset" className="text-ellipsis" />
          </SelectTrigger>
          <SelectContent>
            {assets.map((asset) => {
              const isUsed = isAssetUsed(asset);
              return (
                <SelectItem
                  key={asset}
                  value={asset}
                  className={`truncate ${isUsed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={`${formatAddress(asset)}${isUsed ? ' (already in use)' : ''}`}
                  disabled={isUsed}
                >
                  {formatAddress(asset)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="requires">Required Balance</Label>
        <Input
          id="requires"
          type="number"
          value={requires}
          onChange={(e) => setRequires(Number(e.target.value))}
          placeholder="Enter required balance"
          required
          min={0}
        />
      </div>

      <Button 
        type="submit" 
        disabled={!selectedSource || !selectedAsset || isSubmitting}
      >
        {isSubmitting ? 'Adding...' : (onEdit ? 'Update Filter' : 'Add Filter')}
      </Button>
    </form>
  );
} 
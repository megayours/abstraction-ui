import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetFilter } from '@/lib/types';
import { fetchSources, fetchAssets } from '@/lib/api/abstraction-chain';

export interface FilterFormProps {
  onSubmit: (filter: AssetFilter) => Promise<void>;
  onEdit?: (filter: AssetFilter) => Promise<void>;
  initialValues?: AssetFilter;
}

export function FilterForm({ onSubmit, onEdit, initialValues }: FilterFormProps) {
  const [sources, setSources] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<string>('');
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

  // Load assets when source changes
  useEffect(() => {
    const loadAssets = async () => {
      if (!selectedSource) {
        setAssets([]);
        setSelectedAsset('');
        return;
      }

      try {
        const assets = await fetchAssets(selectedSource);
        setAssets(assets);
        setSelectedAsset('');
      } catch (error) {
        console.error('Failed to load assets:', error);
      }
    };
    loadAssets();
  }, [selectedSource]);

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
          <SelectTrigger>
            <SelectValue placeholder="Select a source" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((source) => (
              <SelectItem
                key={source}
                value={source}
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
          <SelectTrigger>
            <SelectValue placeholder="Select an asset" />
          </SelectTrigger>
          <SelectContent>
            {assets.map((asset) => (
              <SelectItem
                key={asset}
                value={asset}
              >
                {asset}
              </SelectItem>
            ))}
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
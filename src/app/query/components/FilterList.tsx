import { Button } from "@/components/ui/button";
import { AssetFilter } from '@/lib/types';
import { formatAddress } from "@/lib/util";

export interface FilterListProps {
  filters: AssetFilter[];
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onClear: () => void;
}

export function FilterList({ filters, onRemove, onEdit, onClear }: FilterListProps) {
  if (filters.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No filters added yet. Add a filter to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Current Filters</h3>
        <Button variant="outline" onClick={onClear}>
          Clear All
        </Button>
      </div>

      <div className="space-y-2">
        {filters.map((filter, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="space-y-1">
              <div className="font-medium">Contract: {filter.source}</div>
              <div className="text-sm text-muted-foreground">
                Asset: {formatAddress(filter.asset)}
              </div>
              <div className="text-sm text-muted-foreground">
                Required Balance: {filter.requires}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(index)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(index)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
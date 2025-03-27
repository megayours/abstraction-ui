import { Button } from "@/components/ui/button";
import { AssetGroup } from '@/lib/types';

export interface AssetGroupManagerProps {
  assetGroups: AssetGroup[];
  onGroupSelect: (groupId: string) => void;
}

export function AssetGroupManager({
  assetGroups,
  onGroupSelect
}: AssetGroupManagerProps) {
  if (assetGroups.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No asset groups available. Create a new group to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Asset Groups</h3>
      </div>

      <div className="grid gap-4">
        {assetGroups.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="space-y-1">
              <div className="font-medium">Group ID: {group.id}</div>
              <div className="text-sm text-muted-foreground">
                Filters: {group.filters.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Last Updated: {new Date(group.updated_at).toLocaleString()}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => onGroupSelect(group.id)}
            >
              Select Group
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AssetFilter } from '@/lib/types';
import { manageQuery } from '@/lib/api/megaforwarder';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from "sonner";
import { Save } from 'lucide-react';

interface SaveQueryDialogProps {
  filters: AssetFilter[];
  existingId?: string;
  existingName?: string;
  onSave: () => void;
}

export function SaveQueryDialog({ filters, existingId, existingName, onSave }: SaveQueryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const { account, signMessage, accountType } = useWallet();

  // Reset name when dialog closes (only needed for new queries)
  useEffect(() => {
    if (!isOpen && !existingId) {
      setName('');
    }
  }, [isOpen, existingId]);

  const createMessage = (account: string, timestamp: number) => {
    return `MegaYours Query Management: ${account} at ${timestamp}`;
  }

  const handleSave = async () => {
    if (!account || !signMessage || !accountType) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!existingId && !name.trim()) {
      toast.error('Please enter a name for the query');
      return;
    }

    try {
      const timestamp = Date.now();
      const message = createMessage(account, timestamp);
      const signature = await signMessage(message);

      await manageQuery({
        auth: {
          type: accountType,
          timestamp,
          account,
          signature
        },
        name: existingId ? existingName! : name,
        filters,
        id: existingId
      });

      toast.success(existingId ? 'Query updated successfully' : 'Query saved successfully');
      setIsOpen(false);
      onSave();
    } catch (error) {
      console.error('Failed to save query:', error);
      toast.error('Failed to save query');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {existingId ? 'Update Query' : 'Save Query'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingId ? 'Update Query' : 'Save Query'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!existingId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Query Name</label>
              <Input
                placeholder="Enter query name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          {existingId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Query Name</label>
              <p className="text-sm text-muted-foreground">{existingName}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Filters</label>
            <div className="space-y-2">
              {filters.map((filter, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {filter.source}: {filter.asset} (min: {filter.requires})
                </div>
              ))}
              {filters.length === 0 && (
                <div className="text-sm text-muted-foreground">No filters added yet</div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {existingId ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
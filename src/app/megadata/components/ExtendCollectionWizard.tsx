import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { ethers } from 'ethers';
import { ChainSelector } from '@/components/ui/chain-selector';
import { useChain } from '@/providers/chain-provider';

interface ExtendCollectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onExtend: (source: string, id: string, type: string) => void;
  isExtending: boolean;
}

export default function ExtendCollectionWizard({
  isOpen,
  onClose,
  onExtend,
  isExtending
}: ExtendCollectionWizardProps) {
  const { selectedChain } = useChain();

  const [contractAddress, setContractAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContractAddress('');
      setError(null);
    }
  }, [isOpen]);

  const handleExtendAction = async () => {
    if (!ethers.isAddress(contractAddress)) {
        setError('Invalid contract address format.');
        return;
    }

    onExtend(selectedChain.name, contractAddress, 'erc721');
  };

  const renderStepContent = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label>Network</Label>
          <ChainSelector />
        </div>
        <div>
          <Label htmlFor="contract">Contract Address</Label>
          <Input
            id="contract"
            value={contractAddress}
            onChange={(e) => {
                setContractAddress(e.target.value);
                setError(null);
            }}
            placeholder="0x..."
            disabled={isExtending}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isExtending && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Extend NFT Collection</DialogTitle>
          <AlertDescription>Register an existing ERC721 collection to add dynamic metadata.</AlertDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mt-4">
          {renderStepContent()}
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleExtendAction}
            disabled={isExtending || !contractAddress || !ethers.isAddress(contractAddress)}
          >
            {isExtending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              'Register External Collection'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
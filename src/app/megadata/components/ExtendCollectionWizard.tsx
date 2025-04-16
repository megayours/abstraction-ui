import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTokenConfigs, TokenConfig, TokenTypeConfig } from '@/lib/api/megadata';

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
  const [contractAddress, setContractAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tokenConfigs, setTokenConfigs] = useState<TokenConfig[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContractAddress('');
      setError(null);
      setSelectedSource('');
      setSelectedType('');
      setIsLoadingConfigs(true);
      getTokenConfigs()
        .then((configs) => setTokenConfigs(configs))
        .catch(() => setError('Failed to load available sources/types.'))
        .finally(() => setIsLoadingConfigs(false));
    }
  }, [isOpen]);

  const handleExtendAction = async () => {
    if (!selectedSource || !selectedType || !contractAddress) {
      setError('Please select a source, type, and enter a contract address.');
      return;
    }
    onExtend(selectedSource, contractAddress, selectedType);
  };

  const availableTypes: TokenTypeConfig[] =
    tokenConfigs.find((c) => c.name === selectedSource)?.token_types || [];

  const renderStepContent = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label>Source</Label>
          <Select
            value={selectedSource}
            onValueChange={(val) => {
              setSelectedSource(val);
              setSelectedType('');
            }}
            disabled={isLoadingConfigs || isExtending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoadingConfigs ? 'Loading...' : 'Select source'} />
            </SelectTrigger>
            <SelectContent>
              {tokenConfigs.map((config) => (
                <SelectItem key={config.name} value={config.name}>
                  {config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select
            value={selectedType}
            onValueChange={setSelectedType}
            disabled={!selectedSource || isExtending}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={!selectedSource ? 'Select source first' : 'Select type'} />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((type) => (
                <SelectItem key={type.type} value={type.type}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <AlertDescription>Register an existing collection to add dynamic metadata. Source and type are now validated by backend.</AlertDescription>
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
            disabled={
              isExtending ||
              !contractAddress ||
              !selectedSource ||
              !selectedType
            }
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
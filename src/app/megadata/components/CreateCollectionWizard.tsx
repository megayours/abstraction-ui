import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExtendedMegaDataCollection } from '@/lib/api/localStorage';

interface CreateCollectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    name: string, 
    numTokens: number, 
    startingIndex: number, 
    moduleSettings: ExtendedMegaDataCollection['moduleSettings']
  ) => Promise<void>;
  isCreating: boolean;
}

export function CreateCollectionWizard({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: CreateCollectionWizardProps) {
  // Wizard steps
  const [step, setStep] = useState(1);
  
  // Form values
  const [name, setName] = useState('');
  const [numTokens, setNumTokens] = useState(1);
  const [startingIndex, setStartingIndex] = useState(0);
  const [isERC721Selected, setIsERC721Selected] = useState(true);  // Default to true as it's initially the only option
  const [externalUrl, setExternalUrl] = useState('');

  // Form validation
  const canGoToNextStep = (): boolean => {
    switch(step) {
      case 1: return name.trim() !== '';
      case 2: return numTokens > 0;
      case 3: return startingIndex >= 0;
      case 4: return isERC721Selected;
      case 5: return true; // external_url is optional
      default: return false;
    }
  };

  const handleNext = () => {
    if (canGoToNextStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async () => {
    if (isCreating) return;
    
    const moduleSettings: ExtendedMegaDataCollection['moduleSettings'] = {
      erc721: { 
        external_url: externalUrl
      }
    };
    
    await onCreate(name, numTokens, startingIndex, moduleSettings);
    
    // Reset the form
    setName('');
    setNumTokens(1);
    setStartingIndex(0);
    setIsERC721Selected(true);
    setExternalUrl('');
    setStep(1);
  };

  const handleClose = () => {
    setStep(1);
    setName('');
    setNumTokens(1);
    setStartingIndex(0);
    setIsERC721Selected(true);
    setExternalUrl('');
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 1: Collection Name</DialogTitle>
              <DialogDescription>
                Enter a name for your new NFT collection.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input
                id="collection-name"
                type="text"
                placeholder="My Awesome Collection"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
          </>
        );
      
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 2: Number of Tokens</DialogTitle>
              <DialogDescription>
                Specify how many NFT tokens you want to create in this collection.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="num-tokens">Number of Tokens</Label>
              <Input
                id="num-tokens"
                type="number"
                min="1"
                value={numTokens}
                onChange={(e) => setNumTokens(parseInt(e.target.value) || 1)}
                autoFocus
                required
              />
            </div>
          </>
        );
      
      case 3:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 3: Starting Index</DialogTitle>
              <DialogDescription>
                Specify the starting index for your token IDs. This will be the end of your metadata URI.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="starting-index">Starting Index</Label>
              <Input
                id="starting-index"
                type="number"
                min="0"
                value={startingIndex}
                onChange={(e) => setStartingIndex(parseInt(e.target.value) || 0)}
                autoFocus
                required
              />
              <p className="text-sm text-muted-foreground mt-2">
                Token IDs will range from {startingIndex} to {startingIndex + numTokens - 1}
              </p>
            </div>
          </>
        );
      
      case 4:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 4: Attach Modules</DialogTitle>
              <DialogDescription>
                Select the modules you want to attach to this collection.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="erc721-module" 
                  checked={isERC721Selected}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setIsERC721Selected(checked === true)}
                  disabled // Currently only ERC721 is available
                />
                <Label htmlFor="erc721-module">ERC721</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Currently, only the ERC721 module is available. More modules will be added in the future.
              </p>
            </div>
          </>
        );
      
      case 5:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Step 5: ERC721 Settings</DialogTitle>
              <DialogDescription>
                Configure shared properties for all tokens in the ERC721 module.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="external-url">External URL (optional)</Label>
                <Input
                  id="external-url"
                  type="url"
                  placeholder="https://example.com"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  autoFocus
                />
                <p className="text-sm text-muted-foreground mt-2">
                  This URL will be linked from the NFT and is typically a website related to this asset.
                </p>
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {renderStepContent()}
        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isCreating || step === 1}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            {step < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isCreating || !canGoToNextStep()}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isCreating || !canGoToNextStep()}
              >
                {isCreating ? 'Creating...' : 'Create Collection'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
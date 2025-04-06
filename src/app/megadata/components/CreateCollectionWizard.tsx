import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"; // Import Progress component
import * as megadataApi from '@/lib/api/megadata';
import type { Module } from '@/lib/api/megadata';
import { useWallet } from '@/contexts/WalletContext'; // Import wallet context
import { ethers } from 'ethers'; // Import ethers
import { fetchErc721UrisViaEnumeration, DetectedTokenData, FetchProgressCallback } from '@/lib/blockchain/nftUtils'; // Import the new utility

// Define the structure for the props, adding the new callback
interface CreateCollectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, numTokens: number, startingIndex: number, modules: string[]) => void;
  onAutoDetectCreate?: (name: string, modules: string[], detectedData: DetectedTokenData[]) => void; // New prop
  isCreating: boolean;
}

// Define steps - adding new ones for auto-detection
const STEPS = {
  NAME: 1,
  MODULES: 2,
  AUTO_DETECT_CONFIG: 3, // New: Configure auto-detection
  AUTO_DETECT_RUN: 4,    // New: Run detection process
  DETAILS: 5,            // Original details step, now potentially skipped
};

const EXTENDING_METADATA_MODULE_ID = 'extending_metadata'; // Assume this is the ID

export default function CreateCollectionWizard({
  isOpen,
  onClose,
  onCreate,
  onAutoDetectCreate, // Use the new prop
  isCreating
}: CreateCollectionWizardProps) {
  const { provider } = useWallet(); // Get provider from wallet context

  const [currentStep, setCurrentStep] = useState(STEPS.NAME);
  const [name, setName] = useState('');
  const [numTokens, setNumTokens] = useState(1);
  const [startingIndex, setStartingIndex] = useState(0);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // State for auto-detection flow
  const [autoDetectChoice, setAutoDetectChoice] = useState<'yes' | 'no' | null>(null);
  const [network, setNetwork] = useState('ethereum'); // Default or first option
  const [standard, setStandard] = useState('erc721'); // Default or first option
  const [contractAddress, setContractAddress] = useState('');
  const [detectionState, setDetectionState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [detectedTokenData, setDetectedTokenData] = useState<DetectedTokenData[]>([]);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [fetchProgress, setFetchProgress] = useState<{ fetched: number, total: number | null } | null>(null);

  // Derived state to check if the special module is selected
  const isExtendingMetadataSelected = selectedModules.includes(EXTENDING_METADATA_MODULE_ID);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setCurrentStep(STEPS.NAME);
      setName('');
      setNumTokens(1);
      setStartingIndex(0);
      setSelectedModules([]);
      setAutoDetectChoice(null);
      setNetwork('ethereum');
      setStandard('erc721');
      setContractAddress('');
      setDetectionState('idle');
      setDetectedTokenData([]);
      setDetectionError(null);
      setFetchProgress(null);
      loadModules();
    }
  }, [isOpen]);

  const loadModules = async () => {
    try {
      const fetchedModules = await megadataApi.getModules();
      setModules(fetchedModules);
    } catch (error) {
      console.error('Failed to load modules:', error);
      // Handle error appropriately
    }
  };

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModules(prev => {
      const isSelected = prev.includes(moduleId);
      const newSelection = isSelected ? prev.filter(id => id !== moduleId) : [...prev, moduleId];

      // Reset auto-detect choice if extending_metadata selection changes
      if (moduleId === EXTENDING_METADATA_MODULE_ID) {
         setAutoDetectChoice(null);
         setDetectionState('idle');
         setDetectedTokenData([]);
         setContractAddress(''); // Also reset address
      }
      return newSelection;
    });
  };

  // Fetch ERC721 token URIs using the utility function
  const fetchErc721TokenUris = async (address: string, onProgressUpdate: FetchProgressCallback): Promise<DetectedTokenData[]> => {
    console.log(`Attempting to fetch ERC721 data for contract: ${address}`);
    setDetectionState('loading');
    setDetectionError(null);
    setFetchProgress({ fetched: 0, total: null });

    if (!provider) {
        const errorMsg = "Wallet not connected or provider not available.";
        console.error(errorMsg);
        setDetectionError(errorMsg);
        setDetectionState('error');
        throw new Error(errorMsg);
    }

    // Validate address format
    if (!ethers.isAddress(address)) {
        const errorMsg = `Invalid contract address format: ${address}`;
        console.error(errorMsg);
        setDetectionError(errorMsg);
        setDetectionState('error');
        throw new Error(errorMsg);
    }

    try {
        // Call the extensible utility function
        const data = await fetchErc721UrisViaEnumeration(address, provider, onProgressUpdate);
        console.log("Blockchain fetch successful:", data);
        return data; // Return data on success
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An unknown error occurred during token detection.";
        console.error(`Failed to fetch token URIs for ${address}:`, error);
        setDetectionError(errorMsg); // Set specific error message for UI
        setDetectionState('error'); // Update state to error
        throw error; // Re-throw the error to be caught by runAutoDetection
    } finally {
        setFetchProgress(null); // Clear progress on completion or error
    }
  };

  const runAutoDetection = async () => {
     if (!contractAddress.trim()) {
       setDetectionError("Please enter a valid contract address.");
       setDetectionState('error');
       return;
     }
    try {
      const handleProgress: FetchProgressCallback = (fetched, total) => {
        setFetchProgress({ fetched, total });
        console.log(`Progress: ${fetched}/${total}`);
      };
      const data = await fetchErc721TokenUris(contractAddress, handleProgress);
      setDetectedTokenData(data);
      setDetectionState('success');
    } catch (error: any) {
      console.error("Auto-detection failed:", error);
      setDetectionError(error.message || 'Failed to fetch token data.');
      setDetectionState('error');
    }
  };


  const handleNext = async () => {
     // Validation before moving from a step
     if (currentStep === STEPS.NAME && name.trim() === '') {
        alert('Please enter a collection name.'); return;
     }
     if (currentStep === STEPS.MODULES && selectedModules.length === 0) {
        alert('Please select at least one module.'); return;
     }
      if (currentStep === STEPS.AUTO_DETECT_CONFIG && autoDetectChoice === 'yes' && !contractAddress.trim()) {
         alert('Please enter the contract address for auto-detection.'); return;
      }

    // Step Transition Logic
    if (currentStep === STEPS.MODULES) {
      if (isExtendingMetadataSelected) {
        setCurrentStep(STEPS.AUTO_DETECT_CONFIG); // Go to config step
      } else {
        setCurrentStep(STEPS.DETAILS); // Skip to final details step
      }
    } else if (currentStep === STEPS.AUTO_DETECT_CONFIG) {
      if (autoDetectChoice === 'yes') {
         setCurrentStep(STEPS.AUTO_DETECT_RUN); // Go to run step
         await runAutoDetection(); // Start detection immediately
      } else {
         setCurrentStep(STEPS.DETAILS); // Skip to final details step
      }
    } else if (currentStep < STEPS.DETAILS) { // General case for other steps (like NAME -> MODULES)
        setCurrentStep(currentStep + 1);
    }
    // No 'next' from AUTO_DETECT_RUN or DETAILS, they lead to 'Create'
  };

  const handlePrevious = () => {
    setDetectionState('idle'); // Reset detection state when going back
    setDetectionError(null);
    setFetchProgress(null);

    if (currentStep === STEPS.DETAILS) {
       // If we came here skipping auto-detect steps
       if (isExtendingMetadataSelected && autoDetectChoice === 'no') {
         setCurrentStep(STEPS.AUTO_DETECT_CONFIG);
       } else if (!isExtendingMetadataSelected) {
         setCurrentStep(STEPS.MODULES);
       } else {
         // Should not happen if logic is correct, fallback
         setCurrentStep(STEPS.MODULES);
       }
    } else if (currentStep === STEPS.AUTO_DETECT_CONFIG) {
       setCurrentStep(STEPS.MODULES);
    } else if (currentStep === STEPS.AUTO_DETECT_RUN) {
       setCurrentStep(STEPS.AUTO_DETECT_CONFIG);
    } else if (currentStep > STEPS.NAME) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    // If auto-detect was run successfully and the callback exists
    if (isExtendingMetadataSelected && autoDetectChoice === 'yes' && detectionState === 'success' && onAutoDetectCreate) {
       if (detectedTokenData.length > 0) {
          onAutoDetectCreate(name, selectedModules, detectedTokenData);
       } else {
          alert("No token data was detected. Cannot create collection this way.");
          // Optionally allow proceeding to manual entry or reset?
          setDetectionState('error'); // Mark as error state
          setDetectionError("No tokens found or detection failed.");
       }
    }
    // Otherwise, use the standard creation path (manual details)
    else {
      if (!name || selectedModules.length === 0 || numTokens <= 0) {
         alert('Please ensure all fields are filled correctly.');
         return;
      }
      onCreate(name, numTokens, startingIndex, selectedModules);
    }
    // Closing the dialog is handled by the parent component based on isCreating prop
  };

  // Dynamically adjust total steps shown based on path
   const getTotalSteps = () => {
     if (isExtendingMetadataSelected) {
        // If auto-detect is chosen, we skip DETAILS step visually
       return autoDetectChoice === 'yes' ? STEPS.AUTO_DETECT_RUN : STEPS.DETAILS;
     }
     // If not selected, we skip AUTO_DETECT steps
     return STEPS.DETAILS - 2; // NAME, MODULES, DETAILS
   }

   // Dynamically adjust the current step number shown based on path
   const getCurrentStepDisplay = () => {
     if (!isExtendingMetadataSelected && currentStep === STEPS.DETAILS) return 3; // Show as step 3 if skipping
     if (isExtendingMetadataSelected && autoDetectChoice === 'no' && currentStep === STEPS.DETAILS) return 4; // Show as step 4
     // AUTO_DETECT_RUN is always step 4 if reached
     return currentStep;
   }

  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.NAME:
        return (
          <div className="space-y-4">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collection name"
              autoFocus
            />
          </div>
        );
      case STEPS.MODULES:
        return (
          <div className="space-y-4">
            <Label>Select Modules</Label>
            <p className="text-sm text-muted-foreground">Choose the modules to include in this collection.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto p-1">
              {modules.length === 0 && <p>Loading modules...</p>}
              {modules.map((module) => (
                <Card
                  key={module.id}
                  onClick={() => handleModuleSelect(module.id)}
                  className={`cursor-pointer transition-colors ${selectedModules.includes(module.id) ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-muted-foreground/50'}`}
                 >
                  <CardHeader>
                    <CardTitle>{module.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{module.description || 'No description available.'}</CardDescription>
                  </CardContent>
                 </Card>
              ))}
            </div>
          </div>
        );
       case STEPS.AUTO_DETECT_CONFIG:
         return (
           <div className="space-y-6">
             <div>
               <Label className="text-base font-semibold">Auto-Detect Tokens?</Label>
               <p className="text-sm text-muted-foreground pb-3">
                 Automatically fetch token IDs and URIs from an existing contract?
                 Requires the contract to support ERC721 Enumerable.
               </p>
               <RadioGroup value={autoDetectChoice ?? undefined} onValueChange={(value: 'yes' | 'no') => setAutoDetectChoice(value)}>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="yes" id="auto-yes" />
                   <Label htmlFor="auto-yes">Yes</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="no" id="auto-no" />
                   <Label htmlFor="auto-no">No (I'll specify token count manually)</Label>
                 </div>
               </RadioGroup>
             </div>

             {autoDetectChoice === 'yes' && (
               <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                     <Label htmlFor="network">Network</Label>
                     <Select value={network} onValueChange={setNetwork}>
                       <SelectTrigger id="network">
                         <SelectValue placeholder="Select Network" />
                       </SelectTrigger>
                       <SelectContent>
                         {/* Add other networks if needed in the future */}
                         <SelectItem value="ethereum">Ethereum</SelectItem>
                       </SelectContent>
                     </Select>
                 </div>
                  <div className="space-y-2">
                     <Label htmlFor="standard">NFT Standard</Label>
                     <Select value={standard} onValueChange={setStandard}>
                       <SelectTrigger id="standard">
                         <SelectValue placeholder="Select Standard" />
                       </SelectTrigger>
                       <SelectContent>
                         {/* Add other standards if needed */}
                         <SelectItem value="erc721">ERC721 (Enumerable)</SelectItem>
                       </SelectContent>
                     </Select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="contractAddress">Contract Address</Label>
                   <Input
                     id="contractAddress"
                     value={contractAddress}
                     onChange={(e) => setContractAddress(e.target.value)}
                     placeholder="0x..."
                   />
                 </div>
               </div>
             )}
           </div>
         );
       case STEPS.AUTO_DETECT_RUN:
         return (
           <div className="space-y-4 text-center">
             {detectionState === 'loading' && (
                <>
                 <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                 <p className="text-muted-foreground">Detecting tokens from {contractAddress}...</p>
                 <p className="text-xs text-muted-foreground">(This might take a moment)</p>
                 {fetchProgress && (
                   <div className="mt-2 text-sm text-muted-foreground">
                     Fetching tokens: {fetchProgress.fetched} / {fetchProgress.total}...
                     {/* Add Progress Bar - only if total is known and positive */}
                     {fetchProgress.total !== null && fetchProgress.total > 0 && (
                       <Progress 
                         value={fetchProgress.total > 0 ? (fetchProgress.fetched / fetchProgress.total) * 100 : 0}
                         className="h-2 mt-1"
                        />
                     )}
                   </div>
                 )}
                </>
             )}
              {detectionState === 'success' && (
                 <Alert variant="default">
                   <AlertTitle>Detection Successful!</AlertTitle>
                   <AlertDescription>
                     Found {detectedTokenData.length} tokens. Proceed to create the collection.
                   </AlertDescription>
                 </Alert>
             )}
              {detectionState === 'error' && (
                 <Alert variant="destructive">
                   <AlertTitle>Detection Failed</AlertTitle>
                   <AlertDescription>
                     {detectionError || "An unknown error occurred."} <br />
                      Please check the contract address and network, or go back to configure manually.
                   </AlertDescription>
                 </Alert>
             )}
           </div>
         );
      case STEPS.DETAILS:
         // This step is only shown if extending_metadata is NOT selected,
         // OR if it IS selected BUT autoDetectChoice is 'no'.
         if (isExtendingMetadataSelected && autoDetectChoice === 'yes') {
            return null; // Should not be reached in this flow
         }
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numTokens">Number of Tokens</Label>
              <Input
                id="numTokens"
                type="number"
                min="1"
                value={numTokens}
                onChange={(e) => setNumTokens(Math.max(1, Number(e.target.value)))} // Ensure positive number
              />
               <p className="text-sm text-muted-foreground">Total number of tokens this collection will contain.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startingIndex">Starting Token ID</Label>
              <Input
                id="startingIndex"
                type="number"
                min="0"
                value={startingIndex}
                onChange={(e) => setStartingIndex(Math.max(0, Number(e.target.value)))} // Ensure non-negative number
              />
               <p className="text-sm text-muted-foreground">The ID of the first token (e.g., 0 or 1).</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Increase width slightly for more complex steps */}
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
           {/* Adjust title based on flow */}
          <DialogTitle>
             Create New Collection (Step {getCurrentStepDisplay()} of {getTotalSteps()})
           </DialogTitle>
        </DialogHeader>
        {/* Use min-h to prevent layout jumps */}
        <div className="py-4 min-h-[250px] flex flex-col justify-center">
         {renderStepContent()}
        </div>
        {/* Footer Buttons */}
        <div className="flex justify-between pt-4 border-t">
           {/* Previous Button */}
           <Button
              variant="outline"
              onClick={handlePrevious}
              // Disable on first step, or during loading/creation
              disabled={currentStep === STEPS.NAME || detectionState === 'loading' || isCreating}
            >
              Previous
            </Button>

          {/* Next/Create Button Logic */}
          {/* Show 'Next' if not on a final step */}
           {(currentStep < STEPS.DETAILS && !(isExtendingMetadataSelected && autoDetectChoice === 'yes' && currentStep === STEPS.AUTO_DETECT_RUN)) && (
             <Button
               onClick={handleNext}
               // Complex disabled logic based on current step & state
               disabled={
                 isCreating ||
                 detectionState === 'loading' ||
                 (currentStep === STEPS.NAME && !name.trim()) ||
                 (currentStep === STEPS.MODULES && selectedModules.length === 0) ||
                 (currentStep === STEPS.AUTO_DETECT_CONFIG && autoDetectChoice === null) ||
                 (currentStep === STEPS.AUTO_DETECT_CONFIG && autoDetectChoice === 'yes' && !contractAddress.trim()) ||
                 (currentStep === STEPS.AUTO_DETECT_RUN && detectionState !== 'success' && detectionState !== 'error') // Allow next from error? Maybe not. Only on success. Let's rethink. No 'Next' from RUN step.
                }
             >
               {/* Show loading state on button if applicable? Currently handled in content */}
                Next
             </Button>
           )}

            {/* Show 'Create' on the DETAILS step (manual path) */}
            {currentStep === STEPS.DETAILS && !(isExtendingMetadataSelected && autoDetectChoice === 'yes') && (
             <Button
               onClick={handleCreate}
               disabled={isCreating || !name || selectedModules.length === 0 || numTokens <= 0}
             >
               {isCreating ? 'Creating...' : 'Create Collection'}
             </Button>
           )}

            {/* Show 'Create' on the AUTO_DETECT_RUN step (auto path) only after success */}
            {currentStep === STEPS.AUTO_DETECT_RUN && isExtendingMetadataSelected && autoDetectChoice === 'yes' && (
               <Button
                 onClick={handleCreate}
                 // Only enable create if detection was successful and not already creating
                 disabled={isCreating || detectionState !== 'success' || detectedTokenData.length === 0 || !onAutoDetectCreate}
               >
                 {isCreating ? 'Creating...' : 'Create Collection'}
               </Button>
            )}

             {/* Optional: Show a retry button if detection failed? */}
             {currentStep === STEPS.AUTO_DETECT_RUN && detectionState === 'error' && (
                <Button onClick={runAutoDetection} disabled={isCreating}>
                   Retry Detection
                </Button>
             )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
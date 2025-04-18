import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { registerAsset, getAvailableSources } from "@/lib/api/megaforwarder";
import { Loader2, X, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";
import { SignatureData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWeb3Auth } from '@/providers/web3auth-provider';
interface AssetRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssetRegistrationModal({ isOpen, onClose }: AssetRegistrationModalProps) {
  const { walletAddress, signMessage } = useWeb3Auth();
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    contract: '',
    blockNumber: '',
    collection: '',
    type: '',
    source: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const sources = await getAvailableSources();
        setAvailableSources(sources);
      } catch (error) {
        console.error('Error fetching sources:', error);
        toast.error('Failed to fetch available sources');
      }
    };

    if (isOpen) {
      fetchSources();
    }
  }, [isOpen]);

  const createMessage = (account: string, timestamp: number) => {
    return `MegaYours Asset Registration: ${account} at ${timestamp}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !signMessage) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const message = createMessage(walletAddress, timestamp);
      const signature = await signMessage(message);
      const signatureData: SignatureData = {
        type: 'evm', // TODO: Add support for other chains
        timestamp,
        account: walletAddress,
        signature
      };

      await registerAsset(
        formData.source,
        formData.contract.replace('0x', ''),
        parseInt(formData.blockNumber),
        formData.collection,
        formData.type,
        signatureData
      );

      toast.success("Contract registered successfully");
      setFormData({
        contract: '',
        blockNumber: '',
        collection: '',
        type: '',
        source: ''
      });
      onClose();
    } catch (error) {
      console.error('Error registering contract:', error);
      toast.error('Failed to register contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getAvailableTypes = () => {
    if (!formData.source) return [];
    
    const source = formData.source.toLowerCase();
    if (source === 'solana') {
      return [{ value: 'SPL', label: 'SPL Token' }];
    } else if (source === 'ethereum' || source === 'polygon') {
      return [
        { value: 'ERC20', label: 'ERC20 Token' },
        { value: 'ERC721', label: 'ERC721 NFT' }
      ];
    }
    return [];
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Reset type when source changes
      if (name === 'source') {
        newData.type = '';
      }
      return newData;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Register New Asset</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => handleSelectChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="contract">Asset Address</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This can be e.g. a Contract Address or a Token Mint address</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="contract"
                  name="contract"
                  value={formData.contract}
                  onChange={handleChange}
                  required
                  placeholder="0x..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="blockNumber">Start Unit</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This can be a Block or Slot number when the asset was created</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="blockNumber"
                  name="blockNumber"
                  type="number"
                  value={formData.blockNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 12345678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection">Collection Name</Label>
                <Input
                  id="collection"
                  name="collection"
                  value={formData.collection}
                  onChange={handleChange}
                  required
                  placeholder="e.g., nft-collection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Asset Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                  disabled={!formData.source}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.source ? "Select type" : "Select source first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTypes().map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Asset"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
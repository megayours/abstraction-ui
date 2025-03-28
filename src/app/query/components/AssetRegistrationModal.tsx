import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { registerContract } from "@/lib/api/megaforwarder";
import { Loader2, X } from "lucide-react";
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

interface AssetRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssetRegistrationModal({ isOpen, onClose }: AssetRegistrationModalProps) {
  const { account, accountType, signMessage } = useWallet();
  const [formData, setFormData] = useState({
    chain: '',
    contract: '',
    blockNumber: '',
    collection: '',
    type: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMessage = (account: string, timestamp: number) => {
    return `MegaYours Asset Registration: ${account} at ${timestamp}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !accountType || !signMessage) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = Date.now();
      const message = createMessage(account, timestamp);
      const signature = await signMessage(message);
      const signatureData: SignatureData = {
        type: accountType,
        timestamp,
        account,
        signature
      };

      await registerContract(
        formData.chain,
        formData.contract.replace('0x', ''),
        parseInt(formData.blockNumber),
        formData.collection,
        formData.type,
        signatureData
      );

      toast.success("Contract registered successfully");
      setFormData({
        chain: '',
        contract: '',
        blockNumber: '',
        collection: '',
        type: ''
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
                <Label htmlFor="chain">Chain</Label>
                <Select
                  value={formData.chain}
                  onValueChange={(value) => handleSelectChange('chain', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select chain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract">Contract Address</Label>
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
                <Label htmlFor="blockNumber">Block Number</Label>
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
                <Label htmlFor="type">Contract Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERC20">ERC20</SelectItem>
                    <SelectItem value="ERC721">ERC721</SelectItem>
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
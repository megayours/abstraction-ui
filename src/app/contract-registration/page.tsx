"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { registerContract } from "@/lib/api/megaforwarder";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWallet } from "@/contexts/WalletContext";
import { SignatureData } from "@/lib/types";

export default function ContractRegistrationPage() {
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

  return (
    <main className="container mx-auto py-12">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Register New Contract</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Register a new contract to start tracking its events and managing its data.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-gray-100 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-gray-900">Contract Details</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Fill in the details of the contract you want to register.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="block text-xl font-medium text-gray-900">Chain</Label>
                  <Select
                    value={formData.chain}
                    onValueChange={(value) => handleSelectChange('chain', value)}
                  >
                    <SelectTrigger className="w-full h-14 px-4 bg-white border-2 border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-[#0f172a] text-lg">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="block text-xl font-medium text-gray-900">Contract Address</Label>
                  <input
                    type="text"
                    name="contract"
                    value={formData.contract}
                    onChange={handleChange}
                    required
                    className="w-full h-14 px-4 bg-white border-2 border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-[#0f172a] text-lg"
                    placeholder="0x..."
                  />
                </div>

                <div className="space-y-3">
                  <Label className="block text-xl font-medium text-gray-900">Block Number</Label>
                  <input
                    type="number"
                    name="blockNumber"
                    value={formData.blockNumber}
                    onChange={handleChange}
                    required
                    className="w-full h-14 px-4 bg-white border-2 border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-[#0f172a] text-lg"
                    placeholder="e.g., 12345678"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="block text-xl font-medium text-gray-900">Collection Name</Label>
                  <input
                    type="text"
                    name="collection"
                    value={formData.collection}
                    onChange={handleChange}
                    required
                    className="w-full h-14 px-4 bg-white border-2 border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-[#0f172a] text-lg"
                    placeholder="e.g., nft-collection"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="block text-xl font-medium text-gray-900">Contract Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger className="w-full h-14 px-4 bg-white border-2 border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-[#0f172a] focus:border-[#0f172a] text-lg">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERC20">ERC20</SelectItem>
                      <SelectItem value="ERC721">ERC721</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-semibold bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Contract"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </main>
  );
} 
"use client";

import { useState } from 'react';
import { registerContract } from '@/lib/api/megaforwarder';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { SignatureData } from '@/lib/types';

interface ContractRegistrationFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const ContractRegistrationForm = ({ onSuccess, onClose }: ContractRegistrationFormProps) => {
  const { account, signMessage, accountType } = useWallet();
  const [formData, setFormData] = useState({
    chain: '',
    contract: '',
    blockNumber: '',
    collection: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMessage = (account: string, timestamp: number) => {
    return `MegaYours Asset Registration: ${account} at ${timestamp}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !accountType || !signMessage) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

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

      setSuccess(true);
      setFormData({
        chain: '',
        contract: '',
        blockNumber: '',
        collection: '',
        type: ''
      });
      onSuccess?.();
    } catch (err) {
      setError('Failed to register contract');
      console.error(err);
    } finally {
      setLoading(false);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-8 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Register New Contract</h2>
          <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={() => onClose?.()}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600">
              Contract registered successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-2">
              <label htmlFor="chain" className="block text-2xl font-medium text-gray-900">
                Chain *
              </label>
              <Select
                value={formData.chain}
                onValueChange={(value) => handleSelectChange('chain', value)}
              >
                <SelectTrigger className="w-full h-14 px-4 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="contract" className="block text-2xl font-medium text-gray-900">
                Contract Address *
              </label>
              <input
                type="text"
                id="contract"
                name="contract"
                value={formData.contract}
                onChange={handleChange}
                required
                className="w-full h-14 px-4 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="0x..."
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="blockNumber" className="block text-2xl font-medium text-gray-900">
                Block Number *
              </label>
              <input
                type="number"
                id="blockNumber"
                name="blockNumber"
                value={formData.blockNumber}
                onChange={handleChange}
                required
                className="w-full h-14 px-4 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="e.g., 12345678"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="collection" className="block text-2xl font-medium text-gray-900">
                Collection *
              </label>
              <input
                type="text"
                id="collection"
                name="collection"
                value={formData.collection}
                onChange={handleChange}
                required
                className="w-full h-14 px-4 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="e.g., nft-collection"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="block text-2xl font-medium text-gray-900">
                Type *
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger className="w-full h-14 px-4 bg-white border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg">
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
            disabled={loading}
            className="w-full h-14 mt-6 text-lg font-semibold bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-lg"
          >
            {loading ? 'Registering...' : 'Register Contract'}
          </Button>
        </form>
      </div>
    </div>
  );
}; 
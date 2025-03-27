"use client";

import { useEffect, useState } from 'react';
import { getContracts } from '@/lib/api/abstraction-chain';
import { ContractInfo } from '@/lib/types';
import { ContractRegistrationForm } from './ContractRegistrationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export const ContractList = () => {
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchContracts = async () => {
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (err) {
      setError('Failed to fetch contracts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Registered Contracts</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Contract</DialogTitle>
            </DialogHeader>
            <ContractRegistrationForm onSuccess={() => {
              setIsModalOpen(false);
              fetchContracts();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-200">
          {contracts.map((contract, index) => (
            <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {contract.chain}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {contract.type || 'Unknown Type'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Collection: {contract.collection}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    Block: {contract.block_number}
                  </div>
                  <div className="text-sm font-mono text-gray-900">
                    {contract.contract.toString('hex').slice(0, 8)}...
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ContractInfo } from '@/lib/types';
import { getContracts } from '@/lib/api/abstraction-chain';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const [contracts, setContracts] = React.useState<ContractInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast.error('Failed to load contracts');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Contracts</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0f172a]"></div>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">
            No contracts registered yet. Click the button above to register your first contract.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => (
            <Card 
              key={contract.contract.toString('hex')} 
              className="border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900">{contract.collection}</CardTitle>
                  <Badge variant="secondary" className="text-base px-3 py-1 bg-gray-100 text-gray-700">
                    {contract.chain}
                  </Badge>
                </div>
                <CardDescription className="text-lg text-gray-600">{contract.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-700">Address:</span>
                    <span className="text-base font-mono bg-gray-50 px-3 py-1.5 rounded-lg text-gray-700">
                      {contract.contract.toString('hex').slice(0, 6)}...{contract.contract.toString('hex').slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-700">Block Height:</span>
                    <Badge variant="outline" className="text-base px-3 py-1 border-gray-200 text-gray-700">
                      {contract.block_number}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

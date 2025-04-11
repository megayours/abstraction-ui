'use client';

import { useChain } from '@/providers/chain-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ChainSelector() {
  const { selectedChain, setSelectedChain, supportedChains } = useChain();

  return (
    <Select
      value={selectedChain.id}
      onValueChange={(value) => {
        const chain = supportedChains.find(c => c.id === value);
        if (chain) setSelectedChain(chain);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select chain" />
      </SelectTrigger>
      <SelectContent>
        {supportedChains.map((chain) => (
          <SelectItem key={chain.id} value={chain.id}>
            <div className="flex items-center gap-2">
              <img src={chain.logo} alt={chain.name} className="w-5 h-5" />
              {chain.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 
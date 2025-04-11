'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ChainConfig, SUPPORTED_CHAINS, DEFAULT_CHAIN } from '@/lib/config/chains';

interface ChainContextType {
  selectedChain: ChainConfig;
  setSelectedChain: (chain: ChainConfig) => void;
  supportedChains: ChainConfig[];
}

const ChainContext = createContext<ChainContextType>({
  selectedChain: DEFAULT_CHAIN,
  setSelectedChain: () => {},
  supportedChains: SUPPORTED_CHAINS,
});

export const useChain = () => useContext(ChainContext);

interface ChainProviderProps {
  children: ReactNode;
}

export function ChainProvider({ children }: ChainProviderProps) {
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(DEFAULT_CHAIN);

  return (
    <ChainContext.Provider
      value={{
        selectedChain,
        setSelectedChain,
        supportedChains: SUPPORTED_CHAINS,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
} 
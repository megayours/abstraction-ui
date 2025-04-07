"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  connectMetamask, 
  connectPhantom, 
  connectWalletConnectEVM,
  connectWalletConnectSolana,
  signWithMetamask, 
  signWithPhantom,
  signWithWalletConnectEVM,
  signWithWalletConnectSolana,
  disconnectWallet
} from '@/lib/wallets';
import { toast } from 'sonner';
import { submitAccountLinkingRequest } from '@/lib/api/megaforwarder';
import { useWeb3Auth } from '@/providers/web3auth-provider';

interface WalletContextType {
  // Secondary wallet state for account linking
  secondaryAccount: string | null;
  secondaryAccountType: 'evm' | 'solana' | null;
  secondaryWalletType: 'phantom' | 'metamask' | 'walletconnect' | null;
  isConnecting: boolean;
  // Account linking functions
  connectSecondaryWallet: (accountType: 'evm' | 'solana', walletType: 'phantom' | 'metamask' | 'walletconnect') => Promise<void>;
  disconnectSecondaryWallet: () => Promise<void>;
  linkAccount: (accountType: 'evm' | 'solana', walletType: 'phantom' | 'metamask' | 'walletconnect', timestamp: number, newAccount: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { walletAddress, signMessage } = useWeb3Auth();
  const [secondaryAccount, setSecondaryAccount] = useState<string | null>(null);
  const [secondaryAccountType, setSecondaryAccountType] = useState<'evm' | 'solana' | null>(null);
  const [secondaryWalletType, setSecondaryWalletType] = useState<'phantom' | 'metamask' | 'walletconnect' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const disconnectSecondaryWallet = useCallback(async () => {
    if (!secondaryAccountType || !secondaryWalletType) {
      console.warn("Cannot disconnect, accountType or walletType missing.");
      return;
    }

    setIsConnecting(true);
    try {
      const disconnectType = secondaryWalletType === 'walletconnect' ? 'walletconnect' : 'native';
      await disconnectWallet(secondaryAccountType, disconnectType);

      setSecondaryAccount(null);
      setSecondaryAccountType(null);
      setSecondaryWalletType(null);
      toast.success("Secondary wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsConnecting(false);
    }
  }, [secondaryAccountType, secondaryWalletType]);

  const connectSecondaryWallet = async (type: 'evm' | 'solana', wallet: 'phantom' | 'metamask' | 'walletconnect') => {
    setIsConnecting(true);
    try {
      let walletAddress = "";
      
      if (wallet === 'metamask') {
        walletAddress = await connectMetamask();
      } else if (wallet === 'phantom') {
        walletAddress = await connectPhantom(type);
      } else {
        walletAddress = type === 'evm' 
          ? await connectWalletConnectEVM()
          : await connectWalletConnectSolana();
      }

      setSecondaryAccount(walletAddress);
      setSecondaryAccountType(type);
      setSecondaryWalletType(wallet);
      toast.success(`Connected to ${wallet.toUpperCase()}`);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(`Failed to connect to ${wallet.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const linkAccount = async (type: 'evm' | 'solana', wallet: 'phantom' | 'metamask' | 'walletconnect', timestamp: number, newAccount: string) => {
    if (!walletAddress) {
      throw new Error("No main wallet connected");
    }

    try {
      const newMessage = `MegaYours Account Linker: ${newAccount} at ${timestamp}`;
      const mainMessage = `MegaYours Account Linker: ${walletAddress} at ${timestamp}`;
      
      // 1. Get signature from the new wallet first
      let newSignature = "";
      
      if (wallet === 'metamask') {
        await connectMetamask();
        newSignature = await signWithMetamask(newAccount, newMessage);
      } else if (wallet === 'phantom') {
        await connectPhantom();
        newSignature = await signWithPhantom(newMessage);
      } else {
        newSignature = type === 'evm'
          ? await signWithWalletConnectEVM(newAccount, newMessage)
          : await signWithWalletConnectSolana(newMessage);
      }

      // 2. Get signature from the main wallet (Web3Auth)
      const mainSignature = await signMessage(mainMessage);

      await submitAccountLinkingRequest([
        {
          type: 'evm',
          timestamp: timestamp,
          account: walletAddress,
          signature: mainSignature
        },
        {
          type: type,
          timestamp: timestamp,
          account: newAccount,
          signature: newSignature
        }
      ]);

      toast.success("Account linked successfully");
    } catch (error) {
      console.error("Error linking account:", error);
      toast.error(`Failed to link account: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  };

  return (
    <WalletContext.Provider value={{
      secondaryAccount,
      secondaryAccountType,
      secondaryWalletType,
      isConnecting,
      connectSecondaryWallet,
      disconnectSecondaryWallet,
      linkAccount,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 
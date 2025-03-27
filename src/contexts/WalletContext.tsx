"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { fetchAccountLinks } from '@/lib/api/abstraction-chain';
import { toast } from 'sonner';
import { submitAccountLinkingRequest } from '@/lib/api/megaforwarder';
import { AccountLink } from '@/lib/types';

interface WalletContextType {
  account: string | null;
  accountType: 'evm' | 'solana' | null;
  walletType: 'phantom' | 'metamask' | 'walletconnect' | null;
  isConnecting: boolean;
  connectedAccounts: AccountLink[];
  connect: (accountType: 'evm' | 'solana', walletType: 'phantom' | 'metamask' | 'walletconnect') => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  linkAccount: (accountType: 'evm' | 'solana', walletType: 'phantom' | 'metamask' | 'walletconnect', timestamp: number, newAccount: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'evm' | 'solana' | null>(null);
  const [walletType, setWalletType] = useState<'phantom' | 'metamask' | 'walletconnect' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<AccountLink[]>([]);

  // Fetch connected accounts when account changes
  useEffect(() => {
    if (account) {
      console.log("Fetching connected accounts for:", account);
      fetchAccountLinks(account).then(setConnectedAccounts);
    } else {
      setConnectedAccounts([]);
    }
  }, [account]);

  const connect = async (type: 'evm' | 'solana', wallet: 'phantom' | 'metamask' | 'walletconnect') => {
    setIsConnecting(true);
    try {
      let walletAddress = "";
      
      if (wallet === 'metamask') {
        walletAddress = await connectMetamask();
      } else if (wallet === 'phantom') {
        walletAddress = await connectPhantom();
      } else {
        // WalletConnect
        walletAddress = type === 'evm' 
          ? await connectWalletConnectEVM()
          : await connectWalletConnectSolana();
      }

      setAccount(walletAddress);
      setAccountType(type);
      setWalletType(wallet);
      toast.success(`Connected to ${wallet.toUpperCase()}`);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(`Failed to connect to ${wallet.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!accountType || !walletType) return;
    
    try {
      // Convert wallet type to native/walletconnect for disconnect function
      const disconnectWalletType = walletType === 'walletconnect' ? 'walletconnect' : 'native';
      await disconnectWallet(accountType, disconnectWalletType);
      setAccount(null);
      setAccountType(null);
      setWalletType(null);
      setConnectedAccounts([]);
      toast.success("Wallet disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error(`Failed to disconnect wallet: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  };

  const signMessage = async (message: string) => {
    if (!account || !accountType || !walletType) {
      throw new Error("No wallet connected");
    }

    try {
      let signature = "";
      if (walletType === 'metamask') {
        signature = await signWithMetamask(account, message);
      } else if (walletType === 'phantom') {
        signature = await signWithPhantom(message);
      } else {
        // WalletConnect
        signature = accountType === 'evm'
          ? await signWithWalletConnectEVM(account, message)
          : await signWithWalletConnectSolana(message);
      }
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      toast.error(`Failed to sign message: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  };

  const linkAccount = async (type: 'evm' | 'solana', wallet: 'phantom' | 'metamask' | 'walletconnect', timestamp: number, newAccount: string) => {
    if (!account || !accountType || !walletType) {
      throw new Error("No wallet connected");
    }

    try {
      // Store current wallet state
      const currentWalletInfo = {
        account,
        accountType,
        walletType
      };

      const newMessage = `MegaYours Account Linker: ${newAccount} at ${timestamp}`;
      const mainMessage = `MegaYours Account Linker: ${account} at ${timestamp}`;
      // 1. Get signature from the new wallet first (B)
      let newSignature = "";
      
      // First connect to the new wallet
      if (wallet === 'metamask') {
        await connectMetamask();
        newSignature = await signWithMetamask(newAccount, newMessage);
      } else if (wallet === 'phantom') {
        await connectPhantom();
        newSignature = await signWithPhantom(newMessage);
      } else {
        // WalletConnect
        newSignature = type === 'evm'
          ? await signWithWalletConnectEVM(newAccount, newMessage)
          : await signWithWalletConnectSolana(newMessage);
      }

      // 2. Reconnect to the main wallet (A)
      if (currentWalletInfo.walletType === 'metamask') {
        await connectMetamask();
      } else if (currentWalletInfo.walletType === 'phantom') {
        await connectPhantom();
      }

      // 3. Get signature from the main wallet
      const mainSignature = await signMessage(mainMessage);

      console.log('Linking accounts with signatures:', {
        newWallet: { type, address: newAccount, signature: newSignature },
        mainWallet: { type: accountType, address: account, signature: mainSignature }
      });

      await submitAccountLinkingRequest([
        {
          type: accountType,
          timestamp: timestamp,
          account: account,
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
      account,
      accountType,
      walletType,
      isConnecting,
      connectedAccounts,
      connect,
      disconnect,
      signMessage,
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
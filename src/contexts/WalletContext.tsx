"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { ethers } from 'ethers'; // Import ethers
import { useWeb3Auth } from '@/providers/web3auth-provider';

interface WalletContextType {
  account: string | null;
  accountType: 'evm' | 'solana' | null;
  walletType: 'phantom' | 'metamask' | 'walletconnect' | null;
  provider: ethers.Provider | null; // Added provider state
  isConnecting: boolean;
  connect: (accountType: 'evm' | 'solana', walletType: 'phantom' | 'metamask' | 'walletconnect') => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  linkAccount: (accountType: 'evm' | 'solana', walletType: 'phantom' | 'metamask' | 'walletconnect', timestamp: number, newAccount: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { walletAddress, web3auth } = useWeb3Auth();
  const [account, setAccount] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'evm' | 'solana' | null>(null);
  const [walletType, setWalletType] = useState<'phantom' | 'metamask' | 'walletconnect' | null>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null); // Added provider state
  const [isConnecting, setIsConnecting] = useState(false);

  // Define disconnect function before effects that depend on it
  const disconnect = useCallback(async () => {
    // Check for necessary info before proceeding
    if (!accountType || !walletType) {
      console.warn("Cannot disconnect, accountType or walletType missing.");
      return;
    }

    setIsConnecting(true);
    try {
      // Determine the correct type for the disconnect function
      const disconnectType = walletType === 'walletconnect' ? 'walletconnect' : 'native';
      console.log(`Disconnecting wallet: accountType=${accountType}, disconnectType=${disconnectType}`);

      // Call disconnectWallet with the correct arguments
      await disconnectWallet(accountType, disconnectType);

      setAccount(null);
      setAccountType(null);
      setWalletType(null);
      setProvider(null); // Clear provider on disconnect
      localStorage.removeItem('walletAccount');
      localStorage.removeItem('walletAccountType');
      localStorage.removeItem('walletType');
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error(`Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsConnecting(false);
    }
    // Dependencies for useCallback: Include state variables used inside the function
  }, [accountType, walletType]);

  // Effect to update the provider when wallet details change
  useEffect(() => {
    if (account && accountType && walletType) {
      try {
        if (accountType === 'evm') {
          if (walletType === 'metamask' && window.ethereum) {
            setProvider(new ethers.BrowserProvider(window.ethereum));
          } else if (walletType === 'walletconnect') {
            // WalletConnect provider setup might be more complex depending on the library version
            // This is a placeholder - consult WalletConnect documentation for correct provider instantiation
            console.warn('WalletConnect provider setup needed');
            setProvider(null); // Clear provider until WalletConnect setup is implemented
          } else {
            setProvider(null); // No EVM provider for Phantom
          }
        } else if (accountType === 'solana') {
          // Ethers.js v6 doesn't directly support Solana JSON-RPC providers out-of-the-box.
          // You might need a Solana-specific library (like @solana/web3.js) or a compatible RPC endpoint.
          // For now, setting provider to null for Solana.
          console.warn('Ethers.js provider for Solana requires specific setup or alternative library.');
          setProvider(null);
        }
      } catch (error) {
        console.error("Error creating provider:", error);
        setProvider(null);
      }
    } else {
      setProvider(null); // Clear provider if disconnected
    }
  }, [account, accountType, walletType]);

  // Effect to handle network changes from the wallet provider (e.g., Metamask)
  useEffect(() => {
    const handleChainChanged = async (chainIdHex: string) => {
      console.log("Wallet network changed to Chain ID:", chainIdHex);
      toast.info(`Wallet network changed to Chain ID ${parseInt(chainIdHex, 16)}. Re-initializing provider.`);
      setIsConnecting(true); // Indicate activity
      try {
        // Only re-initialize if it's an EVM account connected via Metamask/Browser Wallet
        if (window.ethereum && accountType === 'evm' && (walletType === 'metamask')) { // Assuming only metamask uses window.ethereum directly for now
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          // Optional: Verify account still exists on the new network (might be overkill)
          // const accounts = await newProvider.listAccounts();
          // if (accounts.length === 0 || accounts[0].address.toLowerCase() !== account?.toLowerCase()) {
          //   console.warn("Account not found or mismatched after network change. Disconnecting.");
          //   await disconnect(); // Disconnect if account mismatch
          //   return;
          // }

          setProvider(newProvider);
          console.log("Provider updated for new network.");

          // Re-fetch network details for logging/UI update if needed
          const network = await newProvider.getNetwork();
          console.log(`Switched provider to network: ${network.name} (ID: ${network.chainId})`);

        } else if (walletType === 'walletconnect'){
          // WalletConnect might handle this differently via its own events/provider updates.
          // Placeholder: Log and potentially clear provider if WC needs specific handling.
          console.warn('Network changed for WalletConnect - specific handling might be needed.');
          // For now, let's assume WC provider updates itself or needs manual reconnection
          // setProvider(null);
        } else {
          // Handle non-EVM or other wallet types if necessary
          console.log("Network changed, but provider update logic not applicable for current wallet/account type.");
          setProvider(null); // Clear provider if setup is not applicable
        }
      } catch (error) {
          console.error("Error handling chain change:", error);
          toast.error("Error updating provider after network change.");
          setProvider(null); // Clear provider on error
      } finally {
        setIsConnecting(false);
      }
    };

    // Subscribe to chain changes
    if (window.ethereum?.on) {
      window.ethereum.on('chainChanged', handleChainChanged);
      console.log("WalletContext: Subscribed to chainChanged event.");
    }

    // Cleanup listener on component unmount or dependency change
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        console.log("WalletContext: Unsubscribed from chainChanged event.");
      }
    };
    // Rerun this effect if account details change, as the handler logic might depend on them
  }, [account, accountType, walletType, disconnect]); // Added disconnect as a dependency because it's called inside

  // Add initialization effect
  useEffect(() => {
    const initializeWallet = async () => {
      const savedAccount = localStorage.getItem('walletAccount');
      const savedAccountType = localStorage.getItem('walletAccountType') as 'evm' | 'solana' | null;
      const savedWalletType = localStorage.getItem('walletType') as 'phantom' | 'metamask' | 'walletconnect' | null;

      if (savedAccount && savedAccountType && savedWalletType) {
        try {
          setIsConnecting(true);
          // Attempt to reconnect
          let walletAddress = "";
          
          if (savedWalletType === 'metamask') {
            walletAddress = await connectMetamask();
          } else if (savedWalletType === 'phantom') {
            walletAddress = await connectPhantom(savedAccountType);
          } else {
            walletAddress = savedAccountType === 'evm' 
              ? await connectWalletConnectEVM()
              : await connectWalletConnectSolana();
          }

          // Only restore if the addresses match
          if (walletAddress.toLowerCase() === savedAccount.toLowerCase()) {
            setAccount(walletAddress);
            setAccountType(savedAccountType);
            setWalletType(savedWalletType);
          } else {
            // Clear storage if addresses don't match
            localStorage.removeItem('walletAccount');
            localStorage.removeItem('walletAccountType');
            localStorage.removeItem('walletType');
          }
        } catch (error) {
          console.error("Failed to restore wallet connection:", error);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    initializeWallet();
  }, []);

  const connect = async (type: 'evm' | 'solana', wallet: 'phantom' | 'metamask' | 'walletconnect') => {
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

      // Save to localStorage
      localStorage.setItem('walletAccount', walletAddress);
      localStorage.setItem('walletAccountType', type);
      localStorage.setItem('walletType', wallet);

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

  const signMessage = async (message: string) => {
    if (!web3auth) {
      throw new Error("No wallet connected");
    }

    try {
      const provider = await web3auth.connect();
      if (!provider) {
        throw new Error("Failed to connect to Web3Auth provider");
      }
      const ethersProvider = new ethers.BrowserProvider(provider as ethers.Eip1193Provider);
      const signer = await ethersProvider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      toast.error(`Failed to sign message: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  };

  const linkAccount = async (type: 'evm' | 'solana', wallet: 'phantom' | 'metamask' | 'walletconnect', timestamp: number, newAccount: string) => {
    if (!walletAddress) {
      throw new Error("No main wallet connected");
    }

    try {
      const newMessage = `MegaYours Account Linker: ${newAccount} at ${timestamp}`;
      const mainMessage = `MegaYours Account Linker: ${walletAddress} at ${timestamp}`;
      
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

      // 2. Get signature from the main wallet (Web3Auth)
      const mainSignature = await signMessage(mainMessage);

      console.log('Linking accounts with signatures:', {
        newWallet: { type, address: newAccount, signature: newSignature },
        mainWallet: { type: 'evm', address: walletAddress, signature: mainSignature }
      });

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
      account,
      accountType,
      walletType,
      provider, // Include provider in context value
      isConnecting,
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
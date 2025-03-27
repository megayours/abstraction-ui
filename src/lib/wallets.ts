"use client";

import { createConfig, http } from 'wagmi'
import { mainnet, polygon } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { clusterApiUrl, Transaction, VersionedTransaction, TransactionVersion, PublicKey } from '@solana/web3.js'
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect'
import { BaseMessageSignerWalletAdapter, WalletName, WalletReadyState } from '@solana/wallet-adapter-base'

// Define the solana provider interface
interface SolanaProvider {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: string }>;
  disconnect: () => Promise<void>;
}

// Extend the Window interface
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
    solana?: SolanaProvider;
  }
}

// Configure chains for WalletConnect
const chains = [mainnet, polygon] as const
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Create wagmi config
const wagmiConfig = createConfig({
  chains,
  connectors: [
    walletConnect({
      projectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
})

// Solana WalletConnect setup
const solanaNetwork = clusterApiUrl('mainnet-beta')
const phantom = new PhantomWalletAdapter()

// Create a custom WalletConnect adapter
class CustomWalletConnectAdapter extends BaseMessageSignerWalletAdapter {
  private _connecting: boolean = false;
  private _wallet: WalletConnectWalletAdapter | null = null;
  private _publicKey: PublicKey | null = null;

  constructor() {
    super();
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get name(): WalletName {
    return 'WalletConnect' as WalletName;
  }

  get url() {
    return 'https://walletconnect.com/';
  }

  get icon() {
    return 'https://walletconnect.com/walletconnect-logo.svg';
  }

  get readyState(): WalletReadyState {
    return this._wallet ? WalletReadyState.Installed : WalletReadyState.NotDetected;
  }

  get connecting() {
    return this._connecting;
  }

  get supportedTransactionVersions(): ReadonlySet<TransactionVersion> {
    return new Set(['legacy']);
  }

  async connect(): Promise<void> {
    try {
      if (this._connecting) return;
      if (this._wallet) return;

      this._connecting = true;

      // Initialize WalletConnect
      const walletConnect = new WalletConnectWalletAdapter({
        network: 'mainnet-beta',
        options: {
          projectId,
          relayUrl: 'wss://relay.walletconnect.com',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await walletConnect.connect();
      this._wallet = walletConnect;
      this._publicKey = walletConnect.publicKey;
    } catch (error) {
      this._wallet = null;
      this._publicKey = null;
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect() {
    const wallet = this._wallet;
    if (wallet) {
      this._wallet = null;
      this._publicKey = null;
      await wallet.disconnect();
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new Error('Wallet not connected');

      const signedMessage = await wallet.signMessage(message);
      return signedMessage;
    } catch (error) {
      throw error;
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new Error('Wallet not connected');

      const signedTransaction = await wallet.signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      throw error;
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    try {
      const wallet = this._wallet;
      if (!wallet) throw new Error('Wallet not connected');

      const signedTransactions = await wallet.signAllTransactions(transactions);
      return signedTransactions;
    } catch (error) {
      throw error;
    }
  }
}

const walletConnectAdapter = new CustomWalletConnectAdapter();

// Function to connect to Metamask (EVM)
export async function connectMetamask() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error("Metamask not found. Please install Metamask.");
  }

  // Debug provider information
  console.log("Available ethereum providers:", {
    isMetaMask: window.ethereum.isMetaMask,
    isPhantom: window.ethereum.isPhantom,
    providers: window.ethereum.providers,
    providerState: window.ethereum,
  });

  // If multiple providers exist, find MetaMask specifically
  if (window.ethereum.providers?.length) {
    const metaMaskProvider = window.ethereum.providers.find((p: { isMetaMask: boolean; isPhantom: boolean }) => p.isMetaMask && !p.isPhantom);
    if (metaMaskProvider) {
      try {
        const accounts = await metaMaskProvider.request({
          method: 'eth_requestAccounts'
        }) as string[];
        return accounts[0];
      } catch (error) {
        console.error("Error connecting to Metamask:", error);
        throw error;
      }
    }
  }

  // Check specifically for MetaMask provider and ensure it's not Phantom
  if (!window.ethereum.isMetaMask || window.ethereum.isPhantom) {
    throw new Error("Please use MetaMask for EVM connections. Other EVM wallets are not supported.");
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    }) as string[];
    return accounts[0];
  } catch (error) {
    console.error("Error connecting to Metamask:", error);
    throw error;
  }
}

// Function to connect to Phantom (Solana)
export async function connectPhantom() {
  if (typeof window === 'undefined') {
    throw new Error("Browser environment required");
  }

  console.log("Checking for Phantom wallet:", {
    solana: !!window.solana,
    isPhantom: window.solana?.isPhantom,
    connect: !!window.solana?.connect
  });

  if (!window.solana) {
    throw new Error("Phantom wallet not found. Please install Phantom.");
  }

  try {
    // Request connection
    const response = await window.solana.connect();
    console.log("Phantom connection response:", response);
    
    if (!response?.publicKey?.toString()) {
      throw new Error("Failed to get public key from Phantom wallet");
    }
    
    return response.publicKey.toString();
  } catch (error) {
    console.error("Detailed Phantom connection error:", error);
    throw error;
  }
}

// Function to connect using WalletConnect (EVM)
export async function connectWalletConnectEVM() {
  try {
    const connector = wagmiConfig.connectors[0];
    const result = await connector.connect();
    return result.accounts[0];
  } catch (error) {
    console.error("Error connecting with WalletConnect:", error);
    throw error;
  }
}

// Function to connect using WalletConnect (Solana)
export async function connectWalletConnectSolana() {
  try {
    // Disconnect any existing connections first
    if (window.solana) {
      await window.solana.disconnect();
    }
    await phantom.disconnect();

    // Connect using WalletConnect
    await walletConnectAdapter.connect();
    return walletConnectAdapter.publicKey?.toString() || '';
  } catch (error) {
    console.error("Error connecting with WalletConnect Solana:", error);
    throw error;
  }
}

// Function to sign message with Metamask
export async function signWithMetamask(account: string, message: string) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error("Metamask not found. Please install Metamask.");
  }

  try {
    // If multiple providers exist, find MetaMask specifically
    if (window.ethereum.providers?.length) {
      const metaMaskProvider = window.ethereum.providers.find((p: { isMetaMask: boolean; isPhantom: boolean }) => p.isMetaMask && !p.isPhantom);
      if (metaMaskProvider) {
        console.log("Signing message with MetaMask:", {
          message,
          account,
          provider: metaMaskProvider
        });
        return await metaMaskProvider.request({
          method: 'personal_sign',
          params: [message, account]
        });
      }
    }

    // Check specifically for MetaMask provider and ensure it's not Phantom
    if (!window.ethereum.isMetaMask || window.ethereum.isPhantom) {
      throw new Error("Please use MetaMask for EVM connections. Other EVM wallets are not supported.");
    }

    return await window.ethereum.request({
      method: 'personal_sign',
      params: [message, account]
    });
  } catch (error) {
    console.error("Error signing message with Metamask:", error);
    throw error;
  }
}

// Function to sign message with Phantom
export async function signWithPhantom(message: string) {
  if (typeof window === 'undefined' || !window.solana || !window.solana.isPhantom) {
    throw new Error("Phantom wallet not found. Please install Phantom.");
  }

  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
    return signedMessage.signature;
  } catch (error) {
    console.error("Error signing message with Phantom:", error);
    throw error;
  }
}

// Function to sign message with WalletConnect (EVM)
export async function signWithWalletConnectEVM(account: string, message: string) {
  try {
    const connector = wagmiConfig.connectors[0];
    const provider = await connector.getProvider();
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, account],
    });
    return signature as string;
  } catch (error) {
    console.error("Error signing message with WalletConnect:", error);
    throw error;
  }
}

// Function to sign message with WalletConnect (Solana)
export async function signWithWalletConnectSolana(message: string) {
  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await walletConnectAdapter.signMessage(encodedMessage);
    return Buffer.from(signedMessage).toString('base64');
  } catch (error) {
    console.error("Error signing message with WalletConnect Solana:", error);
    throw error;
  }
}

// Function to disconnect wallet
export async function disconnectWallet(accountType: "evm" | "solana", walletType: "native" | "walletconnect") {
  try {
    if (accountType === "evm") {
      if (walletType === "native") {
        if (window.ethereum) {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
          });
        }
      } else {
        const connector = wagmiConfig.connectors[0];
        await connector.disconnect();
      }
    } else {
      // For Solana, we need to disconnect both native and WalletConnect
      if (window.solana) {
        try {
          await window.solana.disconnect();
        } catch (error) {
          console.warn("Error disconnecting native Phantom:", error);
        }
      }
      try {
        await phantom.disconnect();
        await walletConnectAdapter.disconnect();
      } catch (error) {
        console.warn("Error disconnecting WalletConnect:", error);
      }
    }
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    throw error;
  }
}

export {
  wagmiConfig,
  phantom,
  walletConnectAdapter,
  solanaNetwork,
}; 
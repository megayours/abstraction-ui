'use client';

import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getPublicCompressed } from '@toruslabs/eccrypto';
import { Web3 } from 'web3';
import { AccountLink } from '@/lib/types';
import { fetchAccountLinks } from '@/lib/api/abstraction-chain';

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: any;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isConnected: boolean;
  token: string | null;
  walletAddress: string | null;
  isLoading: boolean;
  connectedAccounts: AccountLink[];
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  login: async () => { },
  logout: async () => { },
  isConnected: false,
  token: null,
  walletAddress: null,
  isLoading: true,
  connectedAccounts: [],
});

export const useWeb3Auth = () => useContext(Web3AuthContext);

interface Web3AuthProviderProps {
  children: ReactNode;
}

interface Wallet {
  type: string;
  address?: string;
  public_key?: string;
  curve?: string;
}

interface JwtPayload {
  iat?: number;
  exp?: number;
  verifier: string;
  verifierId: string;
  aggregateVerifier?: string;
  wallets?: Wallet[];
  [key: string]: unknown;
}

interface UserAuthInfo {
  idToken: string;
  aggregateVerifier?: string;
  [key: string]: unknown;
}

export function Web3AuthProvider({ children }: Web3AuthProviderProps) {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState<AccountLink[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: "0xA86A", // hex of 43114 for Avalanche Mainnet
          rpcTarget: "https://api.avax.network/ext/bc/C/rpc",
          displayName: "Avalanche C-Chain",
          blockExplorerUrl: "https://subnets.avax.network/c-chain",
          ticker: "AVAX",
          tickerName: "Avalanche",
          logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
        };

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig }
        });

        const web3authInstance = new Web3Auth({
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '',
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chainConfig,
          privateKeyProvider,
        });

        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);

        // Check if already connected
        if (web3authInstance.connected) {
          const web3authProvider = await web3authInstance.connect();
          if (!web3authProvider) return;

          setProvider(web3authProvider);
          await handleAuthentication(web3authInstance, web3authProvider);
        } else {
          // Check localStorage for existing token
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
            setToken(storedToken);
            // Try to get wallet address from token
            try {
              const decodedToken = jwtDecode(storedToken) as any;
              const ethereumWallet = decodedToken.wallets?.find((w: any) => w.type === 'ethereum');
              if (ethereumWallet?.address) {
                setWalletAddress(ethereumWallet.address);
              }
            } catch (error) {
              console.error('Error decoding stored token:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize Web3Auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Fetch connected accounts when account changes
  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching connected accounts for:", walletAddress);
      fetchAccountLinks(walletAddress).then(setConnectedAccounts);
    } else {
      setConnectedAccounts([]);
    }
  }, [walletAddress]);

  const handleAuthentication = async (web3authInstance: Web3Auth, web3authProvider: any) => {
    try {
      // Get the JWT token from Web3Auth
      const userInfo = await web3authInstance.authenticateUser() as UserAuthInfo;
      console.log('User info:', userInfo);

      // Get wallet address
      const web3 = new Web3(web3authProvider);
      const walletAddress = (await web3.eth.getAccounts())[0];
      setWalletAddress(walletAddress);

      // For social logins, get the app_pub_key
      console.log('userInfo', userInfo);
      const app_scoped_privkey = await web3authProvider.request({
        method: "eth_private_key",
      }) as string;
      const app_pub_key = getPublicCompressed(
        Buffer.from(app_scoped_privkey.padStart(64, "0"), "hex"),
      ).toString("hex");
      localStorage.setItem('app_pub_key', app_pub_key);

      // Store the original token and wallet address
      setToken(userInfo.idToken);
      setWalletAddress(walletAddress);
      localStorage.setItem('token', userInfo.idToken);

      // Fetch connected accounts

    } catch (error) {
      console.error('Error during authentication:', error);
      throw error; // Re-throw to handle in the login function
    }
  };

  const login = async () => {
    if (!web3auth) return;
    try {
      const web3authProvider = await web3auth.connect();
      if (!web3authProvider) return;

      setProvider(web3authProvider);
      await handleAuthentication(web3auth, web3authProvider);
    } catch (error) {
      console.error('Error logging in:', error);
      // Clear any partial state on error
      setProvider(null);
      setToken(null);
      setWalletAddress(null);
      localStorage.removeItem('token');
    }
  };

  const logout = async () => {
    if (!web3auth) return;
    try {
      await web3auth.logout();
      setProvider(null);
      setToken(null);
      setWalletAddress(null);
      localStorage.removeItem('app_pub_key');
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        provider,
        login,
        logout,
        isConnected: !!provider,
        token,
        walletAddress,
        isLoading,
        connectedAccounts,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
} 
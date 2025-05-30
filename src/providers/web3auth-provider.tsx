'use client';

import { Web3Auth, Web3AuthOptions } from '@web3auth/modal';
import { IWeb3AuthCoreOptions, WEB3AUTH_NETWORK } from '@web3auth/base';
import { WalletConnectModal } from "@walletconnect/modal";
import {
  getWalletConnectV2Settings,
  WalletConnectV2Adapter,
} from "@web3auth/wallet-connect-v2-adapter";
import { getInjectedAdapters } from "@web3auth/default-evm-adapter";
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getPublicCompressed } from '@toruslabs/eccrypto';
import { Web3 } from 'web3';
import { AccountLink } from '@/lib/types';
import { fetchAccountLinks } from '@/lib/api/abstraction-chain';
import { useChain } from './chain-provider';

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
  signMessage: (message: string) => Promise<string>;
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
  signMessage: async () => { throw new Error('Not initialized'); },
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
  const { selectedChain } = useChain();

  useEffect(() => {
    const init = async () => {
      try {
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig: selectedChain.web3AuthConfig }
        });

        const web3AuthOptions: IWeb3AuthCoreOptions = {
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '',
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chainConfig: selectedChain.web3AuthConfig,
          privateKeyProvider,
          uiConfig: { appName: 'MegaYours', logoDark: 'favicon.ico', logoLight: 'favicon.ico' }
        }

        const web3authInstance = new Web3Auth({
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '',
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chainConfig: selectedChain.web3AuthConfig,
          privateKeyProvider,
          uiConfig: { appName: 'MegaYours', logoDark: 'favicon.ico', logoLight: 'favicon.ico' }
        });

        const adapters = getInjectedAdapters({ options: web3AuthOptions });

        adapters.forEach((adapter) => {
          web3authInstance.configureAdapter(adapter);
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
            try {
              const decodedToken = jwtDecode(storedToken) as JwtPayload;
              const now = Math.floor(Date.now() / 1000);
              if (decodedToken.exp && decodedToken.exp < now) {
                // Token expired, remove it
                localStorage.removeItem('token');
                localStorage.removeItem('app_pub_key');
              } else {
                setToken(storedToken);
                // Try to get wallet address from token
                const ethereumWallet = decodedToken.wallets?.find((w: any) => w.type === 'ethereum');
                if (ethereumWallet?.address) {
                  setWalletAddress(ethereumWallet.address);
                }
              }
            } catch (error) {
              console.error('Error decoding stored token:', error);
              localStorage.removeItem('token');
              localStorage.removeItem('app_pub_key');
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
  }, [selectedChain]);

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
      setToken(userInfo.idToken);
      localStorage.setItem('token', userInfo.idToken);

      // For social logins, get the app_pub_key
      try {
        console.log('userInfo', userInfo);
        const app_scoped_privkey = await web3authProvider.request({
          method: "eth_private_key",
        }) as string;
        const app_pub_key = getPublicCompressed(
          Buffer.from(app_scoped_privkey.padStart(64, "0"), "hex"),
        ).toString("hex");
        localStorage.setItem('app_pub_key', app_pub_key);
      } catch (error) {
        console.log('Detected external wallet sign-in method');
      }
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
      localStorage.removeItem('app_pub_key');
    }
  };

  const logout = async () => {
    if (!web3auth) return;
    try {
      await web3auth.logout();
      setProvider(null);
      setToken(null);
      setWalletAddress(null);
      localStorage.removeItem('token');
      localStorage.removeItem('app_pub_key');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const signMessage = async (message: string) => {
    if (!provider) throw new Error('No provider available');
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const signature = await web3.eth.personal.sign(message, accounts[0], '');
    return signature;
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
        signMessage,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
} 
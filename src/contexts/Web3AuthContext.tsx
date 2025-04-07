import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<any>;
}

const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};

interface Web3AuthProviderProps {
  children: ReactNode;
}

export const Web3AuthProvider = ({ children }: Web3AuthProviderProps) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: '0x1', // Ethereum mainnet
          rpcTarget: process.env.NEXT_PUBLIC_RPC_URL || '',
        };

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig }
        });

        const web3auth = new Web3Auth({
          clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || '',
          web3AuthNetwork: 'testnet',
          chainConfig,
          privateKeyProvider
        });

        const openloginAdapter = new OpenloginAdapter({
          adapterSettings: {
            network: 'testnet',
          },
        });

        web3auth.configureAdapter(openloginAdapter);
        await web3auth.initModal();
        
        setWeb3auth(web3auth);
        if (web3auth.connected) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to initialize Web3Auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      throw new Error('Web3Auth not initialized');
    }
    try {
      await web3auth.connect();
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!web3auth) {
      throw new Error('Web3Auth not initialized');
    }
    try {
      await web3auth.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const getUserInfo = async () => {
    if (!web3auth) {
      throw new Error('Web3Auth not initialized');
    }
    try {
      const userInfo = await web3auth.getUserInfo();
      return userInfo;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        isLoading,
        isAuthenticated,
        login,
        logout,
        getUserInfo,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}; 
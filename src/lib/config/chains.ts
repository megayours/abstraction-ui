import { CHAIN_NAMESPACES, ChainNamespaceType } from '@web3auth/base';

export interface ChainConfig {
  id: string;
  name: string;
  chainId: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  logo: string;
  web3AuthConfig: {
    chainNamespace: ChainNamespaceType;
    chainId: string;
    rpcTarget: string;
    displayName: string;
    blockExplorerUrl: string;
    ticker: string;
    tickerName: string;
    logo: string;
  };
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: '0x1',
    rpcUrl: 'https://ethereum-rpc.publicnode.com',
    blockExplorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    web3AuthConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: '0x1',
      rpcTarget: 'https://ethereum-rpc.publicnode.com',
      displayName: 'Ethereum Mainnet',
      blockExplorerUrl: 'https://etherscan.io',
      ticker: 'ETH',
      tickerName: 'Ethereum',
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    },
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    chainId: '0xA86A',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorerUrl: 'https://subnets.avax.network/c-chain',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    web3AuthConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: '0xA86A',
      rpcTarget: 'https://api.avax.network/ext/bc/C/rpc',
      displayName: 'Avalanche C-Chain',
      blockExplorerUrl: 'https://subnets.avax.network/c-chain',
      ticker: 'AVAX',
      tickerName: 'Avalanche',
      logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    },
  },
];

export const DEFAULT_CHAIN = SUPPORTED_CHAINS[0]; 
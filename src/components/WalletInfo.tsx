'use client';

import { useWeb3Auth } from '../providers/web3auth-provider';
import { Button } from './ui/button';

export function WalletInfo() {
  const { walletAddress, isConnected, login, logout, isLoading } = useWeb3Auth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <>
          <div className="text-sm">
            {walletAddress ? (
              <span className="font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            ) : (
              <span>Connected</span>
            )}
          </div>
          <Button onClick={logout} variant="outline">
            Disconnect
          </Button>
        </>
      ) : (
        <Button onClick={login}>
          Connect Wallet
        </Button>
      )}
    </div>
  );
} 
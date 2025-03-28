"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import MetaMask from '@/components/logos/metamask';
import WalletConnect from '@/components/logos/wallet-connect';
import Phantom from '@/components/logos/phantom';
import Ethereum from '@/components/logos/ethereum';
import Solana from '@/components/logos/solana';

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletDialog({ open, onOpenChange }: WalletDialogProps) {
  const { connect, isConnecting, account, connectedAccounts } = useWallet();

  const handleConnect = async (type: 'evm' | 'solana', wallet: 'phantom' | 'metamask' | 'walletconnect') => {
    try {
      if (wallet === 'phantom') {
        await connect(type, wallet);
      } else {
        await connect(type, wallet);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Connect Account</DialogTitle>
        </DialogHeader>
        
        {/* Connected Accounts Section */}
        {account && connectedAccounts.length > 0 && (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Connected Accounts</h3>
              <div className="space-y-1">
                {connectedAccounts.map((link, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                    <span className="font-mono">
                      {link.account.slice(0, 6)}...{link.account.slice(-4)}
                    </span>
                    {link.link && (
                      <span className="text-xs text-muted-foreground">
                        linked to: {link.link.slice(0, 6)}...{link.link.slice(-4)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Separator className="my-4" />
          </>
        )}

        {/* Wallet Connection Sections */}
        <div className="space-y-8">
          {/* Ethereum Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mt-8 justify-center">
              <Ethereum className="w-6 h-6" />
              <h3 className="text-sm font-medium text-muted-foreground">Ethereum</h3>
            </div>
            <div className="grid gap-3">
              <Button
                onClick={() => handleConnect('evm', 'metamask')}
                disabled={isConnecting}
                className="w-full h-14 text-lg font-semibold flex items-center justify-start gap-3"
                variant="outline"
              >
                <MetaMask className="w-12 h-12" />
                MetaMask
              </Button>
              <Button
                onClick={() => handleConnect('evm', 'walletconnect')}
                disabled={isConnecting}
                className="w-full h-14 text-lg font-semibold flex items-center justify-start gap-3"
                variant="outline"
              >
                <WalletConnect className="w-12 h-12" />
                WalletConnect
              </Button>
              <Button
                onClick={() => handleConnect('evm', 'phantom')}
                disabled={isConnecting}
                className="w-full h-14 text-lg font-semibold flex items-center justify-start gap-3"
                variant="outline"
              >
                <Phantom className="w-12 h-12" />
                Phantom
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Solana Section */}
          <div className="space-y-4 my-8">
            <div className="flex items-center gap-2 justify-center">
              <Solana className="w-6 h-6" />
              <h3 className="text-sm font-medium text-muted-foreground">Solana</h3>
            </div>
            <div className="grid gap-3">
              <Button
                onClick={() => handleConnect('solana', 'phantom')}
                disabled={isConnecting}
                className="w-full h-14 text-lg font-semibold flex items-center justify-start gap-3"
                variant="outline"
              >
                <Phantom className="w-12 h-12" />
                Phantom
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
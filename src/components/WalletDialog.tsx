"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletDialog({ open, onOpenChange }: WalletDialogProps) {
  const { connect, isConnecting, account, connectedAccounts } = useWallet();

  const handleConnect = async (type: 'evm' | 'solana', wallet: 'phantom' | 'metamask' | 'walletconnect') => {
    try {
      await connect(type, wallet);
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
          <DialogTitle>Connect Wallet</DialogTitle>
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

        {/* Wallet Connection Buttons */}
        <div className="grid gap-4 py-4">
          <Button
            onClick={() => handleConnect('solana', 'phantom')}
            disabled={isConnecting}
            className="w-full h-14 text-lg font-semibold"
            variant="outline"
          >
            Phantom (Solana)
          </Button>
          <Button
            onClick={() => handleConnect('evm', 'metamask')}
            disabled={isConnecting}
            className="w-full h-14 text-lg font-semibold"
            variant="outline"
          >
            MetaMask (EVM)
          </Button>
          <Button
            onClick={() => handleConnect('evm', 'walletconnect')}
            disabled={isConnecting}
            className="w-full h-14 text-lg font-semibold"
            variant="outline"
          >
            WalletConnect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
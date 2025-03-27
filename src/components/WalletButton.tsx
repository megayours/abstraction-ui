"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { WalletDialog } from '@/components/WalletDialog';

export function WalletButton() {
  const { account, disconnect } = useWallet();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleClick = () => {
    if (account) {
      disconnect();
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className="w-[200px]"
      >
        {account ? `Disconnect ${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
      </Button>
      <WalletDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
} 
"use client";

import Link from "next/link";
import { User, LogOut, Link as LinkIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { WalletDialog } from "@/components/WalletDialog";
import { useState } from "react";

export function Navbar() {
  const { account, disconnect, connectedAccounts } = useWallet();
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  return (
    <nav className="border-b border-gray-100 bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <div className="mr-8">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              Abstraction UI
            </Link>
          </div>
          <div className="flex gap-6">
            {account && (
              <>
                <Link href="/megadata" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Megadata
                </Link>
                <Link href="/contract-registration" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Assets
                </Link>
                <Link href="/filters" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Filters
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {account ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10 rounded-full hover:bg-gray-100"
                >
                  <User className="h-5 w-5 text-gray-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-mono text-sm">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account-linking" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>Link Account</span>
                  </Link>
                </DropdownMenuItem>
                {connectedAccounts.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Connected Accounts</DropdownMenuLabel>
                    {connectedAccounts.map(({ account: connectedAccount, link }) => (
                      <DropdownMenuItem key={account} className="font-mono text-sm">
                        {account.toLowerCase() === connectedAccount.toLowerCase() ? `${link.slice(0,6)}...${link.slice(-4)}` : `${connectedAccount.slice(0,6)}...${connectedAccount.slice(-4)}`}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              onClick={() => setWalletDialogOpen(true)}
              className="h-10"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      <WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
    </nav>
  );
} 
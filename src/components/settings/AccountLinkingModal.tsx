'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { 
  connectMetamask, 
  connectPhantom, 
  connectWalletConnectEVM,
  connectWalletConnectSolana,
  disconnectWallet
} from "@/lib/wallets"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { useWallet } from "@/contexts/WalletContext"
import { useWeb3Auth } from '@/providers/web3auth-provider'
import { useState } from "react"

interface AccountLinkingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AccountLinkingModal({ open, onOpenChange }: AccountLinkingModalProps) {
    const { linkAccount } = useWallet()
    const { walletAddress } = useWeb3Auth()
    const [newAccountType, setNewAccountType] = useState<"evm" | "solana">("evm")
    const [newWalletType, setNewWalletType] = useState<"phantom" | "metamask" | "walletconnect">("metamask")
    const [newAccount, setNewAccount] = useState("")
    const [isConnecting, setIsConnecting] = useState(false)
    const [isDisconnecting, setIsDisconnecting] = useState(false)
    const [isLinking, setIsLinking] = useState(false)

    // Connect to new wallet
    const connectNewWallet = async () => {
        setIsConnecting(true)
        try {
            let walletAddress = ""
            if (newWalletType === "metamask") {
                walletAddress = await connectMetamask()
            } else if (newWalletType === "phantom") {
                walletAddress = await connectPhantom()
            } else {
                // WalletConnect
                walletAddress = newAccountType === "evm"
                    ? await connectWalletConnectEVM()
                    : await connectWalletConnectSolana()
            }
            setNewAccount(walletAddress)
            toast.success(`Connected to ${newWalletType.toUpperCase()}`)
        } catch (error) {
            console.error("Error connecting wallet:", error)
            toast.error(`Failed to connect to ${newWalletType.toUpperCase()}: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsConnecting(false)
        }
    }

    // Disconnect new wallet
    const handleDisconnect = async () => {
        setIsDisconnecting(true)
        try {
            const disconnectWalletType = newWalletType === 'walletconnect' ? 'walletconnect' : 'native'
            await disconnectWallet(newAccountType, disconnectWalletType)
            setNewAccount("")
            toast.success("Wallet disconnected successfully")
        } catch (error) {
            console.error("Error disconnecting wallet:", error)
            toast.error(`Failed to disconnect wallet: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsDisconnecting(false)
        }
    }

    // Link accounts
    const handleLinkAccount = async () => {
        if (!walletAddress) {
            toast.error("Please connect your main wallet first")
            return
        }

        if (!newAccount) {
            toast.error("Please connect the wallet you want to link")
            return
        }

        setIsLinking(true)
        try {
            const timestamp = Date.now()
            await linkAccount(newAccountType, newWalletType, timestamp, newAccount)
            setNewAccount("")
            toast.success("Account linked successfully")
            onOpenChange(false)
        } catch (error) {
            console.error("Error linking account:", error)
            toast.error(`Failed to link account: ${error instanceof Error ? error.message : String(error)}`)
        } finally {
            setIsLinking(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Link Your Accounts</DialogTitle>
                    <DialogDescription>
                        Link additional accounts to your main wallet by signing messages with both wallets.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                        <Label className="text-lg font-medium">Main Wallet</Label>
                        {walletAddress ? (
                            <Alert className="border-2 border-green-100 bg-green-50">
                                <Check className="h-5 w-5 text-green-600" />
                                <AlertTitle className="text-lg font-semibold text-green-800">Connected</AlertTitle>
                                <AlertDescription className="font-mono text-base break-all text-green-700">
                                    {walletAddress}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="border-2 border-yellow-100 bg-yellow-50">
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                <AlertTitle className="text-lg font-semibold text-yellow-800">Not Connected</AlertTitle>
                                <AlertDescription className="text-base text-yellow-700">
                                    Please connect your main wallet first.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-lg font-medium">Chain Type</Label>
                            <RadioGroup 
                                value={newAccountType} 
                                onValueChange={(value: string) => {
                                    setNewAccountType(value as "evm" | "solana")
                                    setNewWalletType(value === "evm" ? "metamask" : "phantom")
                                    setNewAccount("")
                                }}
                                className="flex space-x-6"
                            >
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="evm" id="evm" className="h-5 w-5" />
                                    <Label htmlFor="evm" className="text-lg">Ethereum</Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="solana" id="solana" className="h-5 w-5" />
                                    <Label htmlFor="solana" className="text-lg">Solana</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-lg font-medium">Wallet</Label>
                            <RadioGroup 
                                value={newWalletType} 
                                onValueChange={(value: string) => {
                                    setNewWalletType(value as "phantom" | "metamask" | "walletconnect")
                                    setNewAccount("")
                                }}
                                className="flex space-x-6"
                            >
                                {newAccountType === "evm" ? (
                                    <>
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value="metamask" id="metamask" className="h-5 w-5" />
                                            <Label htmlFor="metamask" className="text-lg">MetaMask</Label>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value="walletconnect" id="walletconnect" className="h-5 w-5" />
                                            <Label htmlFor="walletconnect" className="text-lg">WalletConnect</Label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value="phantom" id="phantom" className="h-5 w-5" />
                                            <Label htmlFor="phantom" className="text-lg">Phantom</Label>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <RadioGroupItem value="walletconnect" id="walletconnect" className="h-5 w-5" />
                                            <Label htmlFor="walletconnect" className="text-lg">WalletConnect</Label>
                                        </div>
                                    </>
                                )}
                            </RadioGroup>
                        </div>

                        {!newAccount ? (
                            <Button 
                                onClick={connectNewWallet} 
                                disabled={isConnecting}
                                className="w-full h-14 text-lg font-semibold bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-lg"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    `Connect ${newWalletType.toUpperCase()}`
                                )}
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <Alert className="border-2 border-green-100 bg-green-50">
                                    <Check className="h-5 w-5 text-green-600" />
                                    <AlertTitle className="text-lg font-semibold text-green-800">Connected</AlertTitle>
                                    <AlertDescription className="font-mono text-base break-all text-green-700">
                                        {newAccount}
                                    </AlertDescription>
                                </Alert>

                                <Button 
                                    onClick={handleLinkAccount}
                                    disabled={isLinking || !walletAddress}
                                    className="w-full h-14 text-lg font-semibold bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-lg"
                                >
                                    {isLinking ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Linking...
                                        </>
                                    ) : (
                                        "Link Account"
                                    )}
                                </Button>

                                <Button 
                                    onClick={handleDisconnect}
                                    disabled={isDisconnecting}
                                    variant="destructive"
                                    className="w-full h-14 text-lg font-semibold rounded-lg"
                                >
                                    {isDisconnecting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Disconnecting...
                                        </>
                                    ) : (
                                        "Disconnect Wallet"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <Toaster />
            </DialogContent>
        </Dialog>
    )
}
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { User, Plus, Unlink, Copy, LogOut } from "lucide-react"
import { AccountLinkingModal } from "@/components/settings/AccountLinkingModal"
import { useState } from "react"
import { useWallet } from "@/contexts/WalletContext"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AccountLink } from "@/lib/types"
import { toast } from "sonner"
import { useWeb3Auth } from '@/providers/web3auth-provider'

export default function SettingsPage() {
  const [isAccountLinkingOpen, setIsAccountLinkingOpen] = useState(false)
  const { connectedAccounts, unlinkAccount } = useWallet()
  const { walletAddress, logout } = useWeb3Auth()

  const handleUnlink = async (linkedAccount: AccountLink) => {
    try {
      await unlinkAccount(linkedAccount)
    } catch (error) {
      console.error("Error unlinking account:", error)
      toast.error(`Failed to unlink account: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      toast.success('Address copied to clipboard')
    }
  }

  return (
    <section className="py-24 md:py-30">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <Tabs defaultValue="account" className="space-y-4">
          <TabsList>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Linked Accounts</CardTitle>
                <CardDescription>
                  Manage your linked accounts across different chains.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Account */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Main Account</h3>
                  {walletAddress ? (
                    <Alert className="border-2 border-green-100 bg-green-50">
                      <AlertTitle className="text-lg font-semibold text-green-800">
                        Connected
                      </AlertTitle>
                      <AlertDescription className="font-mono text-base break-all text-green-700">
                        {walletAddress}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTitle>Not Connected</AlertTitle>
                      <AlertDescription>
                        Please connect your wallet to manage linked accounts.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Linked Accounts List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Linked Accounts</h3>
                    <Button
                      onClick={() => setIsAccountLinkingOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Link New Account
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {connectedAccounts && connectedAccounts.length > 0 ? (
                      connectedAccounts.map((linkedAccount, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="space-y-1">
                            <p className="font-mono text-sm">
                              {linkedAccount.account}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Linked Account #{index + 1}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnlink(linkedAccount)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No linked accounts yet.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your security preferences and authentication methods.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Security settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Notification settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>Your connected wallet information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Wallet Address</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {walletAddress || 'Not connected'}
                </p>
              </div>
              {walletAddress && (
                <Button variant="outline" size="icon" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect Wallet
            </Button>
          </CardContent>
        </Card>

        <AccountLinkingModal
          open={isAccountLinkingOpen}
          onOpenChange={setIsAccountLinkingOpen}
        />
      </div>
    </section >
  )
}
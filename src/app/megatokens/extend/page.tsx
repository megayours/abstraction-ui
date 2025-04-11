'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, Info, Loader2 } from "lucide-react"
import * as megadataApi from '@/lib/api/megadata'
import { useWeb3Auth } from '@/providers/web3auth-provider'

export default function ExtendCollectionPage() {
  const router = useRouter();
  const { walletAddress, isConnected } = useWeb3Auth();
  const [source, setSource] = useState('ethereum'); // The blockchain the collection is deployed on
  const [id, setId] = useState(''); // The contract address or collection ID
  const [type, setType] = useState('erc721'); // Default type, adjust as needed
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletAddress || !source) {
      setError('Please connect your wallet and provide a source collection ID or contract address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: megadataApi.ExternalCollectionCreatePayload = {
        source: source,
        id: id,
        type: type, 
      };
      const newCollection = await megadataApi.createExternalCollection(payload);
      router.push(`/megadata/${newCollection.id}`);
    } catch (err) {
      console.error("Failed to extend collection:", err);
      setError(`Failed to extend collection: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background to-blue-50/30 min-h-screen">
      <div className="container mx-auto max-w-screen-xl px-6 space-y-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif mb-5 text-primary font-bold">Extend Collection</h1>
          <p className="text-xl text-muted-foreground">
            Add dynamic metadata capabilities to an existing collection.
          </p>
        </div>

        {!isConnected ? (
          <Card className="max-w-2xl mx-auto p-6 shadow-lg rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Please connect your wallet to extend a collection.</p>
            </div>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto p-6 shadow-lg rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-primary">Extend Existing Collection</CardTitle>
              <CardDescription>Connect an existing collection to add dynamic metadata capabilities.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-700" />
                  <AlertTitle className="text-blue-800">How Extending Works</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Extending allows you to add dynamic metadata capabilities to an existing collection.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="source" className="text-foreground">Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      {/* Add other sources if supported by API */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id" className="text-foreground">Contract Address</Label>
                  <Input 
                    id="id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="0x... or Collection ID"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-foreground">Source Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="erc721">ERC721</SelectItem>
                      {/* Add other types if supported by API */}
                    </SelectContent>
                  </Select>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isLoading || !id}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extending...
                      </>
                    ) : (
                      'Extend Collection'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
} 
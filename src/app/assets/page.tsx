"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getContracts } from "@/lib/api/abstraction-chain"
import { ContractInfo } from "@/lib/types"
import Ethereum from "@/components/logos/ethereum"
import Solana from "@/components/logos/solana"
import BNB from "@/components/logos/bnb"
import { formatAddress, fromHexBuffer } from "@/lib/util"
import { getIndexingProgress } from "@/lib/api/blockchains/progress"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ContractWithProgress extends ContractInfo {
  progress?: {
    currentBlock: number
    indexedBlock: number
    progress: number
    isBehind: boolean
  }
}

const ChainIcon = ({ chain }: { chain: string }) => {
  const chainLower = chain.toLowerCase()

  switch (chainLower) {
    case "ethereum":
      return <Ethereum className="w-10 h-10" />
    case "solana":
      return <Solana className="w-10 h-10" />
    case "bnb":
      return <BNB className="w-10 h-10" />
    default:
      return null
  }
}

export default function AssetsPage() {
  const [contracts, setContracts] = useState<ContractWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await getContracts()
        const contractsWithProgress = await Promise.all(
          data.map(async (contract) => {
            try {
              const progress = await getIndexingProgress(contract.chain, contract.block_number)
              return { ...contract, progress }
            } catch (error) {
              console.error(`Failed to get progress for contract on ${contract.chain}:`, error)
              return contract
            }
          })
        )
        setContracts(contractsWithProgress)
      } catch (error) {
        console.error("Failed to fetch contracts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContracts()
  }, [])

  if (loading) {
    return (
      <section className="py-12 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h1 className="text-balance text-4xl font-medium lg:text-5xl italic">Loading Assets...</h1>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-balance text-4xl font-medium lg:text-5xl italic">Assets</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">View monitored assets across all chains</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {contracts.map((contract, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between pb-6 border-b">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-semibold">
                    {contract.collection}
                  </CardTitle>
                  <div className="font-mono text-sm text-muted-foreground break-all">
                    {formatAddress(fromHexBuffer(contract.contract))}
                  </div>
                </div>
                <ChainIcon chain={contract.chain} />
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Block Height</div>
                    <div className="text-lg">{contract.block_number.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Type</div>
                    <div className="text-lg uppercase">{contract.type}</div>
                  </div>
                </div>

                {contract.progress && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">Indexing Progress</div>
                      <div className="text-sm font-medium">{contract.progress.progress.toFixed(1)}%</div>
                    </div>
                    <Progress value={contract.progress.progress} className="h-2" />
                    {contract.progress.isBehind && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Indexer is {contract.progress.currentBlock - contract.progress.indexedBlock} blocks behind
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 
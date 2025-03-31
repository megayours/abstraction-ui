"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getContracts, getSources, getTypes } from "@/lib/api/abstraction-chain"
import { AssetInfo } from "@/lib/types"
import Ethereum from "@/components/logos/ethereum"
import Solana from "@/components/logos/solana"
import BNB from "@/components/logos/bnb"
import { formatAddress } from "@/lib/util"
import { getIndexingProgress } from "@/lib/api/blockchains/progress"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loading } from "@/components/ui/loading"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Polygon from "@/components/logos/polygon"

interface AssetWithProgress extends AssetInfo {
  progress?: {
    currentUnit: number
    indexedUnit: number
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
    case "polygon":
      return <Polygon className="w-10 h-10" />
    default:
      return null
  }
}

export default function AssetsPage() {
  const [contracts, setContracts] = useState<AssetWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState<string[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined)
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [fetchedSources, fetchedTypes] = await Promise.all([
          getSources(),
          getTypes({})
        ]);
        setSources(fetchedSources);
        setTypes(fetchedTypes);
      } catch (error) {
        console.error("Failed to fetch initial filter data:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchTypesForSource = async () => {
      if (selectedSource) {
        try {
          const fetchedTypes = await getTypes({ source: selectedSource });
          setTypes(fetchedTypes);
          if (selectedType && !fetchedTypes.includes(selectedType)) {
             setSelectedType(undefined);
          }
        } catch (error) {
          console.error(`Failed to fetch types for source ${selectedSource}:`, error);
          setTypes([]);
        }
      } else {
        try {
           const allTypes = await getTypes({});
           setTypes(allTypes);
        } catch (error) {
            console.error("Failed to fetch all types:", error);
            setTypes([]);
        }
      }
    };
    if (sources.length > 0) {
       fetchTypesForSource();
    }
  }, [selectedSource, sources]);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        const data = await getContracts({ source: selectedSource, type: selectedType })
        const contractsWithProgress = await Promise.all(
          data.map(async (contract) => {
            try {
              const progress = await getIndexingProgress(contract.source, contract.unit)
              return { ...contract, progress }
            } catch (error) {
              console.error(`Failed to get progress for contract on ${contract.source}:`, error)
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
  }, [selectedSource, selectedType])

  if (loading && contracts.length === 0) {
    return (
      <section className="py-24 md:py-30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-balance text-4xl font-medium lg:text-5xl italic">Assets</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">View monitored assets across all chains</p>
          </div>
          <Loading text="Loading your assets..." />
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 md:py-30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-balance text-4xl font-medium lg:text-5xl italic">Assets</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">View monitored assets across all chains</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Select value={selectedSource} onValueChange={(value) => setSelectedSource(value === 'all' ? undefined : value)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={(value) => setSelectedType(value === 'all' ? undefined : value)} disabled={!types.length}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && <Loading text="Loading filtered assets..." className="py-8" />}
        {!loading && contracts.length === 0 && (
           <div className="text-center py-10 text-muted-foreground">No assets found matching your criteria.</div>
        )}
        <div className="flex flex-col space-y-4">
          {contracts.map((contract, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                 <div className="flex-shrink-0">
                   <ChainIcon chain={contract.source} />
                 </div>

                 <div className="flex-grow space-y-1">
                    <CardTitle className="text-xl font-semibold">
                      {contract.name}
                    </CardTitle>
                    <div className="font-mono text-sm text-muted-foreground break-all">
                      {formatAddress(contract.id)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
                       <div>
                         <span className="text-muted-foreground">Source: </span>
                         <span className="font-medium">{contract.source}</span>
                       </div>
                       <div>
                         <span className="text-muted-foreground">Type: </span>
                         <span className="font-medium uppercase">{contract.type}</span>
                       </div>
                        <div>
                         <span className="text-muted-foreground">Block: </span>
                         <span className="font-medium">{contract.unit.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>

                 {contract.progress && (
                   <div className="w-full md:w-64 flex-shrink-0 space-y-2 pt-2 md:pt-0 md:pl-4">
                     <div className="flex justify-between items-center">
                       <div className="text-xs font-medium text-muted-foreground">Indexing Progress</div>
                       <div className="text-xs font-medium">{contract.progress.progress.toFixed(1)}%</div>
                     </div>
                     <Progress value={contract.progress.progress} className="h-1.5" />
                     {contract.progress.isBehind && (
                       <Alert variant="destructive" className="text-xs justify-center text-center">
                         <AlertDescription className="mt-0.5">
                           {(contract.progress.currentUnit - contract.progress.indexedUnit).toLocaleString()} blocks behind
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
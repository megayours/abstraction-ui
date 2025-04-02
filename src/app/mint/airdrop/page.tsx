'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database, Search, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { fetchAssetGroups } from '@/lib/api/abstraction-chain'
import { getCollections } from '@/lib/api/abstraction-chain'
import type { AssetGroup, MegaDataCollection } from '@/lib/types'

type Step = {
  id: number
  title: string
  description: string
  icon: React.ElementType
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Select Collection',
    description: 'Choose a MegaData collection to create your airdrop from',
    icon: Database,
  },
  {
    id: 2,
    title: 'Select Query',
    description: 'Choose a saved query to determine eligible recipients',
    icon: Search,
  },
  // Step 3 will be added later
]

export default function AirdropWizard() {
  const router = useRouter()
  const { account } = useWallet()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [selectedCollection, setSelectedCollection] = React.useState<string>('')
  const [selectedQuery, setSelectedQuery] = React.useState<string>('')
  const [collections, setCollections] = React.useState<MegaDataCollection[]>([])
  const [assetGroups, setAssetGroups] = React.useState<AssetGroup[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      if (!account) return
      
      try {
        setIsLoading(true)
        const [collectionsData, assetGroupsData] = await Promise.all([
          getCollections(account),
          fetchAssetGroups(account)
        ])
        setCollections(collectionsData)
        setAssetGroups(assetGroupsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [account])

  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-4">Please connect your wallet to create an airdrop</p>
          <Button onClick={() => router.push('/')}>Connect Wallet</Button>
        </Card>
      </div>
    )
  }

  const renderStepContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => router.push('/megadata')}
                className="mt-4"
              >
                Create New Collection
              </Button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <Select value={selectedQuery} onValueChange={setSelectedQuery}>
              <SelectTrigger>
                <SelectValue placeholder="Select a query" />
              </SelectTrigger>
              <SelectContent>
                {assetGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Create Airdrop</h1>
        
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <step.icon className="w-4 h-4" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">{steps[currentStep - 1].title}</h2>
            <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
          </div>

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => {
                if (currentStep < steps.length) {
                  setCurrentStep((prev) => prev + 1)
                }
              }}
              disabled={
                isLoading ||
                (currentStep === 1 && !selectedCollection) ||
                (currentStep === 2 && !selectedQuery)
              }
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
} 
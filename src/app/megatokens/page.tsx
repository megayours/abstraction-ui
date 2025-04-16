'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, PlusCircle, GitBranchPlus } from 'lucide-react'

export default function DynamicNFTsPage() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-background to-blue-50/30 min-h-screen">
      <div className="container mx-auto max-w-screen-xl px-6 space-y-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif mb-5 text-primary font-bold">Dynamic Tokens</h1>
          <p className="text-xl text-muted-foreground">
            Create, manage, and extend your dynamic token collections with advanced features.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Link href="/megatokens/view" passHref>
            <Card className="group hover:shadow-xl transition-all duration-300 ease-in-out h-full flex flex-col border-border/50 bg-card/90 backdrop-blur-sm overflow-hidden transform hover:-translate-y-1">
              <CardHeader className="items-center text-center p-6">
                <Eye className="w-12 h-12 mb-4 text-primary group-hover:text-accent-foreground transition-colors duration-300" />
                <CardTitle className="text-xl font-medium text-primary group-hover:text-accent-foreground transition-colors duration-300">View Collection</CardTitle>
                <CardDescription className="text-foreground/80 mt-2">Browse and explore existing dynamic token collections.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-end justify-center p-6 pt-0">
                <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                  View Collections
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/megatokens/create" passHref>
            <Card className="group hover:shadow-xl transition-all duration-300 ease-in-out h-full flex flex-col border-border/50 bg-card/90 backdrop-blur-sm overflow-hidden transform hover:-translate-y-1">
              <CardHeader className="items-center text-center p-6">
                <PlusCircle className="w-12 h-12 mb-4 text-primary group-hover:text-accent-foreground transition-colors duration-300" />
                <CardTitle className="text-xl font-medium text-primary group-hover:text-accent-foreground transition-colors duration-300">Create New Collection</CardTitle>
                <CardDescription className="text-foreground/80 mt-2">Start a new dynamic token collection from scratch.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-end justify-center p-6 pt-0">
                <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                  Create Collection
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/megatokens/extend" passHref>
            <Card className="group hover:shadow-xl transition-all duration-300 ease-in-out h-full flex flex-col border-border/50 bg-card/90 backdrop-blur-sm overflow-hidden transform hover:-translate-y-1">
              <CardHeader className="items-center text-center p-6">
                <GitBranchPlus className="w-12 h-12 mb-4 text-primary group-hover:text-accent-foreground transition-colors duration-300" />
                <CardTitle className="text-xl font-medium text-primary group-hover:text-accent-foreground transition-colors duration-300">Extend Collection</CardTitle>
                <CardDescription className="text-foreground/80 mt-2">Add new features or functionalities to an existing collection.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-end justify-center p-6 pt-0">
                <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                  Extend Collection
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </section>
  )
} 
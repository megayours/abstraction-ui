"use client"

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CallToAction() {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText('yarn add @megayours/megadata')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <section className="py-16 md:py-0">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center">                    
                    <div className="flex justify-center">
                        <div className="relative rounded-md border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                            <div className="flex items-center px-4 py-3">
                                <code className="text-sm font-mono">yarn add @megayours/megadata</code>
                                <button 
                                    className="ml-3 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer"
                                    onClick={copyToClipboard}
                                    aria-label="Copy to clipboard"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg">
                            <Link href="https://docs.megayours.com/megadata/solana-integration" target="_blank">
                                <span>Documentation</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

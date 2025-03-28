import { Code, Database, Globe, Play } from 'lucide-react'

export default function Features() {
    return (
        <section className="py-12 md:py-20">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl">Key Features</h2>
                </div>

                <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-2 lg:grid-cols-2">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Code className="size-4" />
                            <h3 className="text-sm font-medium">Bridge-less Multi-chain Interoperability</h3>
                        </div>
                        <p className='text-sm'>Supports any token—no bridging, no locked tokens, no risk. MegaChain enables cryptographically secure cross-chain interoperability while keeping assets on their native chain, eliminating liquidity fragmentation.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Globe className="size-4" />
                            <h3 className="text-sm font-medium">On-chain Utility Layer</h3>
                        </div>
                        <p className="text-sm">Provide on-chain utility for your tokens through re-usable modules. Store your metadata on our utility layer while keeping your tokens on any chain.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Play className="size-4" />
                            <h3 className="text-sm font-medium">Plug-and-Play Logic</h3>
                        </div>
                        <p className="text-sm">Yours Protocols: Your Logic, Your Data. A token standard that enables developers to publish, attach, extend, and reuse on-chain logic and data easily.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Database className="size-4" />
                            <h3 className="text-sm font-medium">Easy Data Storage</h3>
                        </div>
                        <p className="text-sm">SQL Databases on Chain. High-performance SQL-based decentralized database solution optimized for queries and indexing.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

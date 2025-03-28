import { Code, Database } from "lucide-react";

export default function FeatureHighlights() {
  return (
    <section className="py-12 py-30 md:py-30">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">Solana Integration</h2>
        </div>

        <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-1 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="size-4" />
              <h3 className="text-sm font-medium">Megadata</h3>
            </div>
            <p className='text-sm'>Store your token metadata on-chain and allow for dynamic metadata without compromising on decentralization.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code className="size-4" />
              <h3 className="text-sm font-medium">SDK</h3>
            </div>
            <p className="text-sm">An SDK that feels native to the Solana ecosystem with integrations to existing token programs in order to make it easy for developers to mint tokens with megadata.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code className="size-4" />
              <h3 className="text-sm font-medium">Metaplex</h3>
            </div>
            <p className="text-sm">Integrates natively with Metaplex in order to make it easy for developers to mint tokens with megadata.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
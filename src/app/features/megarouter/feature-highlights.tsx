import { Code } from "lucide-react";

import { Database, Globe } from "lucide-react";

export default function FeatureHighlights() {
  return (
    <section className="py-12 md:py-30">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">MegaRouter</h2>
        </div>

        <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-1 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code className="size-4" />
              <h3 className="text-sm font-medium">Extendable Metadata</h3>
            </div>
            <p className='text-sm'>May be used with all tokens, whether it has dynamic megadata or not.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="size-4" />
              <h3 className="text-sm font-medium">Seamless Transition with Automatic Routing</h3>
            </div>
            <p className="text-sm">Existing tokens with static metadata can attach megadata and receive automatic routing to the megadata when available.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="size-4" />
              <h3 className="text-sm font-medium">Arcweave, IPFS and HTTP Integration</h3>
            </div>
            <p className="text-sm">Supports any type of URI, including Arcweave, IPFS and HTTP URIs.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
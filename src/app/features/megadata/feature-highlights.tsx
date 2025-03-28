import { Code, Link } from "lucide-react";

import { Database, Globe } from "lucide-react";

export default function FeatureHighlights() {
  return (
    <section className="py-12 md:py-30">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <h2 className="text-balance text-4xl font-medium lg:text-5xl">Megadata</h2>
        </div>

        <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-1 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link className="size-4" />
              <h3 className="text-sm font-medium">On-Chain</h3>
            </div>
            <p className='text-sm'>Your token metadata lives entirely on the blockchain, ensuring true decentralization and permanence.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="size-4" />
              <h3 className="text-sm font-medium">MegaRouter Integration</h3>
            </div>
            <p className="text-sm">A native integration with our MegaRouter to provide a gateway to your megadata in the form of a traditional token URI.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code className="size-4" />
              <h3 className="text-sm font-medium">Dynamic Metadata</h3>
            </div>
            <p className="text-sm">Metadata that evolves over time through decentralized, attachable, reusable modules for shared logic.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
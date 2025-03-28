"use client"
import { Copy } from "lucide-react";
import { Trophy } from "lucide-react";

export default function TryGateway() {
  return (
    <section className="py-12 md:py-10">
      <div className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-1 lg:grid-cols-1">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="size-4" />
            <h3 className="text-sm font-medium">Try our Token URI Gateway</h3>
          </div>
          <p className='text-sm'>Try our TokenUri gateway right away to access your token metadata. Simply paste your token URI at the end of the URL.</p>
          <div className="flex items-center gap-2 p-3 bg-white/50 rounded-lg overflow-hidden">
            <code className="text-sm font-mono text-primary break-all flex-grow">
              https://router1.testnet.megayours.com/ext/
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://router1.testnet.megayours.com/ext/');
              }}
              className="text-primary p-2 rounded-md hover:bg-white transition-colors flex-shrink-0 cursor-pointer"
              title="Copy to clipboard"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
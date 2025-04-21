"use client";

import TokenGallery from "@/components/home/megatokens/token-gallery";
import ModuleGraph from "@/components/module-graph/module-graph";
import ModuleGraphD3 from "@/components/module-graph/module-graph-d3";
import PageWrapper from "@/components/page-wrapper";
import { Card } from "@/components/ui/card";
import { Token } from "@/lib/api/megadata";
import { useState } from "react";

export default function GraphTest() {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  return (
    <PageWrapper>
      <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full max-w-6xl mx-auto px-2 md:px-6 py-8">
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <TokenGallery 
            onTokenSelect={setSelectedToken} 
            selectedToken={selectedToken}
            instructionBanner={
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F8F1DB] text-[#2A4A59] text-base font-medium shadow-sm border border-[#E9D973]/40 mx-auto my-2">
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="#E9D973" className="inline-block mr-2">
                  <circle cx={12} cy={12} r={10} stroke="#E9D973" strokeWidth={2} fill="#fffbe6" />
                  <path d="M8 12h8M12 8v8" stroke="#E9D973" strokeWidth={2} strokeLinecap="round" />
                </svg>
                Click an experience to explore its graph
              </div>
            }
          />
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center pt-0 lg:pt-24">
          <ModuleGraphD3 token={selectedToken} />
        </div>
      </div>
    </PageWrapper>
  )
}
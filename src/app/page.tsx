"use client";

import MegaHubSection from "@/components/home/megahub/megahub";
import Megatokens from "@/components/home/megatokens/megatokens";
import { ScrollSection } from "@/components/ui/scroll-section";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Force scroll to top
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      
      // Prevent scroll restoration
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* First section slides up */}
      <ScrollSection direction="up" className="flex items-center">
        <Megatokens />
      </ScrollSection>

      {/* Second section slides up with a slight delay */}
      <ScrollSection direction="up" delay={0.2} className="flex items-center">
        <MegaHubSection />
      </ScrollSection>
    </div>
  );
}

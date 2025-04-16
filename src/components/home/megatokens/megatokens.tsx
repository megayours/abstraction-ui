"use client";

import HeroSection from "./hero";
import TokenGallery from "./token-gallery";
import UserJourney from "./user-journey";
import { ScrollSection } from "@/components/ui/scroll-section";

export default function Megatokens() {
  return (
    <div className="overflow-hidden w-full">
      <ScrollSection direction="up">
        <HeroSection />
      </ScrollSection>

      <ScrollSection direction="right" delay={0.2}>
        <UserJourney />
      </ScrollSection>

      <ScrollSection direction="left" delay={0.2}>
        <TokenGallery />
      </ScrollSection>
    </div>
  );
}
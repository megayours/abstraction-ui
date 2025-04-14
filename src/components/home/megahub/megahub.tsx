"use client";

import HeroSection from "./hero";
import CreateSection from "./create";
import ShareSection from "./share";
import { ScrollSection } from "@/components/ui/scroll-section";

export default function MegaHubSection() {
    return (
        <div className="overflow-hidden w-full">
            <ScrollSection direction="up">
                <HeroSection />
            </ScrollSection>
            
            <ScrollSection direction="left" delay={0.2}>
                <CreateSection />
            </ScrollSection>
            
            <ScrollSection direction="right" delay={0.3}>
                <ShareSection />
            </ScrollSection>
        </div>
    );
}

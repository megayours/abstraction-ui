import HeroSection from "@/components/hero-section";
import MegaHubSection from "@/components/home/megahub";
import MegaDropsSection from "@/components/home/megadrops";
import UserJourney from "@/components/home/user-journey";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <UserJourney />
      <MegaHubSection />
      <MegaDropsSection />
    </div>
  );
}

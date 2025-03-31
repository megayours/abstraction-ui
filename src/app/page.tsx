import Features from "@/components/home/features-4";
import HeroSection from "@/components/hero-section";
import NPMForWeb3Section from "@/components/home/npm-for-web3";
import UserJourney from "@/components/user-journey";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <UserJourney />
    </div>
  );
}

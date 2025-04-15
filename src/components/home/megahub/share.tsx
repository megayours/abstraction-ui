import { Puzzle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ShareSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="grid gap-6 order-2 md:order-1">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#2A4A59]/10">
                  <Puzzle className="h-6 w-6 text-[#2A4A59]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Modular Integration</h3>
                  <p className="text-gray-600">Easily plug modules into your MegaTokens to unlock enhanced features and functionality — no friction, no rewrites.</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#0B2B59]/10">
                  <Zap className="h-6 w-6 text-[#0B2B59]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Instant Power-Up</h3>
                  <p className="text-gray-600">Add advanced features like rewards, governance, and custom logic instantly</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-8 order-1 md:order-2">
            <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#2A4A59] to-[#0B2B59]">
              Supercharge Your Megatokens
            </h2>
            <div className="space-y-6 text-gray-600">
              <p className="text-lg">
                Add extensible features to your tokens with plug-and-play modules from our ecosystem. Each module integrates seamlessly, ensuring secure and reliable behavior by design.
              </p>
              <p className="text-lg">
                Unlock advanced capabilities — like automated rewards, governance tools, and custom transfer logic — without writing a single line of code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

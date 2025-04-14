import { CodeIcon, ShareIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CreateSection() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#2A4A59] to-[#0B2B59]">
              Collaborate on On-chain Logic
            </h2>
            <div className="space-y-6 text-gray-600">
              <p className="text-lg">
                Build and share powerful token modules that define custom behaviors and logic. You can publish your modules for others to discover and use.
              </p>
              <p className="text-lg">
                Our collaborative platform enables developers to contribute to a growing ecosystem of on-chain logic. Create once, share with many, and earn recognition for your contributions to the community.
              </p>
            </div>
          </div>
          <div className="grid gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#2A4A59]/10">
                  <CodeIcon className="h-6 w-6 text-[#2A4A59]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Build Modules</h3>
                  <p className="text-gray-600">Create reusable token logic modules with our intuitive development tools</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-[#0B2B59]/10">
                  <ShareIcon className="h-6 w-6 text-[#0B2B59]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Share & Earn</h3>
                  <p className="text-gray-600">Publish your modules to the marketplace and earn from their adoption</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

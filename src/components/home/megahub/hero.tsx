import { Button } from "@/components/ui/button";
import { links } from "@/lib/links";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="relative">
            <div className="mx-auto max-w-5xl px-6 lg:px-8 my-24">
                <div className="relative z-10">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="font-serif text-balance text-4xl font-medium md:text-5xl xl:text-7xl">
                            Megahub: The On-Chain Logic Marketplace
                        </h1>
                        <p className="mt-4 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
                            Create, upgrade and discover powerful token modules. Join a thriving ecosystem of developers and creators building the future of tokenization.
                        </p>
                        <div className="mt-8 flex items-center justify-center gap-x-6">
                            <Link href={links.megahub}>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="border-[#2A4A59] text-[#2A4A59] hover:bg-[#2A4A59] hover:text-white"
                                >
                                    Explore Modules
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-[50%] top-[50%] h-[60rem] w-[90rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] bg-gradient-to-r from-[#F8F1DB]/20 via-[#AAC4E7]/20 to-[#F8F1DB]/20 opacity-30">
                    </div>
                </div>
            </div>
        </section>
    );
} 
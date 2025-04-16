"use client"
import React, { useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { InfiniteSlider } from '../../ui/infinite-slider'
import { ProgressiveBlur } from '../../ui/progressive-blur'
import Ethereum from '../../logos/ethereum'
import Solana from '../../logos/solana'
import BNB from '../../logos/bnb'
import { motion } from 'framer-motion'
import Polygon from '../../logos/polygon'
import { Base } from '@/components/logos/base'
import { Arbitrum } from '@/components/logos/arbitrum'
import ExternalCollectionsCarousel from '@/components/home/megatokens/token-gallery'

export default function HeroSection() {
    const ref = useRef(null)

    const chains = [
        {
            name: 'Ethereum',
            logo: Ethereum,
            href: 'https://ethereum.org/'
        },
        {
            name: 'Solana',
            logo: Solana,
            href: 'https://solana.com/'
        },
        {
            name: 'BNB Smart Chain',
            logo: BNB,
            href: 'https://bscscan.com/'
        },
        {
            name: 'Polygon',
            logo: Polygon,
            href: 'https://polygon.technology/'
        },
        {
            name: 'Base',
            logo: Base,
            href: 'https://base.org/'
        },
        {
            name: 'Arbitrum',
            logo: Arbitrum,
            href: 'https://arbitrum.io/'
        }
    ];

    return (
        <>
            <main className="overflow-x-hidden pb-12 md:mx-18">
                <section className="relative">
                    <div className="absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute left-[50%] top-[50%] h-[60rem] w-[90rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] bg-gradient-to-r from-[#F8F1DB]/20 via-[#AAC4E7]/20 to-[#F8F1DB]/20 opacity-30">
                        </div>
                    </div>
                    <div
                        className="pb-12 pt-24 md:pb-12 md:pt-16 lg:pb-32 lg:pt-32"
                        ref={ref}
                    >
                        <div className="relative mx-auto flex max-w-6xl flex-col px-4 lg:block">
                            <motion.div
                                initial={{ scale: 1, opacity: 1 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="mx-auto mb-8 lg:mb-0 lg:-z-10 lg:ml-auto 
                                lg:absolute lg:right-0 lg:-top-20">
                                <Image
                                    className="h-40 w-40 object-cover rounded-full 
                                    lg:h-[500px] lg:w-[500px] lg:mt-10 lg:object-contain dark:mix-blend-lighten 
                                    dark:invert-0 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
                                    src="/images/homepage.jpg"
                                    alt="Abstract Object"
                                    height="800"
                                    width="800"
                                    priority
                                />
                            </motion.div>

                            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:w-1/2 lg:text-left">
                                <h1 className="font-serif max-w-2xl text-balance text-4xl font-medium md:text-5xl lg:mt-16 xl:text-7xl">
                                    Megatokens
                                </h1>
                                <p className="mt-6 md:mt-6 font-bold">Bring tokens to life.</p>
                                <p className="mt-1 md:mt-2 max-w-2xl text-pretty text-base md:text-lg">
                                    Attach rich media — PDFs, videos, 3D models, GIFs, animations — to tokens and define how they behave over time. 
                                    Create interactive, evolving experiences with custom business logic.
                                </p>
                                <p className="mt-4 md:mt-4 font-bold">Fully on-chain. Instantly upgradeable</p>
                                <p className="mt-1 md:mt-2 max-w-2xl text-pretty text-base md:text-lg">
                                    Our smart token infrastructure works with both new and existing collections — even those using IPFS, Arweave, or other off-chain storage solutions.
                                </p>

                                <div className="mt-4 md:mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                                    <Button
                                        variant="outline"
                                        asChild
                                        size="lg"
                                        className="px-5 text-base"
                                    >
                                        <Link href="#user-journey">
                                            <span className="text-nowrap">Launch a Collection</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-background pb-2 md:pb-8 lg:pb-8 md:pt-0">
                    <div className="group relative m-auto max-w-6xl px-4 md:px-6">
                        <div className="flex flex-col items-center md:flex-row">
                            <div className="md:max-w-44 md:border-r md:pr-6">
                                <p className="text-end text-sm">Interoperable with multiple chains</p>
                            </div>
                            <div className="relative py-8 md:py-4 md:w-[calc(100%-11rem)]">
                                <InfiniteSlider
                                    speedOnHover={20}
                                    speed={40}
                                    gap={112}>
                                    {chains.map((chain) => (
                                        <div className="flex" key={chain.name}>
                                            <chain.logo height={32} width={32} />
                                            <p className="ml-2 mt-1 text-end text-sm">{chain.name}</p>
                                        </div>
                                    ))}
                                </InfiniteSlider>

                                <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                                <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                                <ProgressiveBlur
                                    className="pointer-events-none absolute left-0 top-0 h-full w-20"
                                    direction="left"
                                    blurIntensity={1}
                                />
                                <ProgressiveBlur
                                    className="pointer-events-none absolute right-0 top-0 h-full w-20"
                                    direction="right"
                                    blurIntensity={1}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

"use client"
import React, { useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { InfiniteSlider } from './ui/infinite-slider'
import { ProgressiveBlur } from './ui/progressive-blur'
import { links } from '@/lib/links'
import Ethereum from './logos/ethereum'
import Solana from './logos/solana'
import BNB from './logos/bnb'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function HeroSection() {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    })

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.5])
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [1, 1, 1, 0])
    const blur = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0, 0, 20])

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
        }
    ];

    return (
        <>
            <main className="overflow-x-hidden">
                <section>
                    <motion.div
                        style={{
                            opacity,
                            filter: `blur(${blur}px)`,
                            transform: `scale(${scale.get()})`,
                            willChange: 'transform, filter, opacity'
                        }}
                        className="pb-24 pt-12 md:pb-32 lg:pb-56 lg:pt-44"
                        ref={ref}
                    >
                        <div className="relative mx-auto flex max-w-6xl flex-col px-6 lg:block">
                            <div className="mx-auto max-w-lg text-center lg:ml-0 lg:w-1/2 lg:text-left">
                                <h1 className="font-serif mt-8 max-w-2xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 xl:text-7xl">
                                    MegaTokens
                                </h1>
                                <p className="mt-8 max-w-2xl text-pretty text-lg">
                                    Fully on-chain programmable tokens and metadata.
                                    On-chain metadata enables the creation of rich and dynamic experiences where
                                    the token can evolve over time.
                                </p>

                                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="px-5 text-base"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById('user-journey')?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start'
                                            });
                                        }}>
                                        <Link href="#user-journey">
                                            <span className="text-nowrap">Launch Tokens</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <motion.div
                                style={{
                                    scale,
                                    opacity
                                }}
                                initial={{ scale: 0.8, opacity: 0 }}
                                whileInView={{ scale: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="hidden lg:block -z-10 order-first ml-auto 
                                lg:absolute lg:right-0 lg:-top-20 lg:order-last">
                                <Image
                                    className="h-48 w-48 object-cover rounded-full sm:h-72 sm:w-72 
                                    lg:h-[500px] lg:w-[500px] lg:object-contain dark:mix-blend-lighten 
                                    dark:invert-0 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
                                    src="/images/homepage.jpg"
                                    alt="Abstract Object"
                                    height="800"
                                    width="800"
                                    priority
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                </section>
                <section className="bg-background pb-16 md:pb-32">
                    <div className="group relative m-auto max-w-6xl px-6">
                        <div className="flex flex-col items-center md:flex-row">
                            <div className="md:max-w-44 md:border-r md:pr-6">
                                <p className="text-end text-sm">Interoperable with multiple chains</p>
                            </div>
                            <div className="relative py-6 md:w-[calc(100%-11rem)]">
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

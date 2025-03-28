"use client"

import React from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { ArrowDown, Boxes, Gift, Link as LinkIcon, Split } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const JourneyStep = ({ 
  title, 
  description, 
  icon: Icon, 
  delay = 0,
  href,
  isComingSoon = false,
  className = ""
}: { 
  title: string
  description: string
  icon: any
  delay?: number
  href?: string
  isComingSoon?: boolean
  className?: string
}) => {
  const content = (
    <motion.div
      {...fadeInUp}
      transition={{ delay }}
      className={`relative ${className}`}
    >
      <Card className={`p-6 transition-all duration-300 ${isComingSoon ? 'opacity-60 hover:opacity-70' : 'hover:shadow-lg hover:scale-105'}`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${isComingSoon ? 'bg-muted' : 'bg-primary/10'}`}>
            <Icon className={`w-6 h-6 ${isComingSoon ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
            {isComingSoon && (
              <span className="inline-block mt-2 text-sm text-primary">Coming Soon</span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )

  if (href && !isComingSoon) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}

const AnimatedArrow = ({ 
  delay = 0, 
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: [0, 10, 0] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
      className={`flex justify-center ${className}`}
    >
      <ArrowDown className="w-6 h-6 text-muted-foreground" />
    </motion.div>
  )
}

export default function UserJourney() {
  const containerRef = React.useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1])
  const blur = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [20, 0, 0, 20])

  return (
    <section id="user-journey" ref={containerRef} className="py-24 bg-background relative">
      <motion.div
        style={{ 
          opacity, 
          scale, 
          filter: `blur(${blur}px)`,
          willChange: 'transform, filter, opacity'
        }}
        className="container mx-auto px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-serif mb-4">Your Journey Starts Here</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow these steps to create your own programmable tokens with on-chain metadata
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8 relative">
          {/* First Step */}
          <div className="flex justify-center">
            <JourneyStep
              title="Mint MegaData"
              description="Create your first on-chain metadata token"
              icon={Boxes}
              href="/megadata"
            />
          </div>

          {/* Split Indicator */}
          <div className="flex flex-col items-center gap-4">
            <AnimatedArrow delay={0.5} />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Split className="w-5 h-5" />
              <span className="text-sm">Choose your path</span>
            </div>
          </div>

          {/* Forked Path */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative">
            {/* Left Path */}
            <div className="space-y-4 relative">
              <div className="absolute inset-0 -m-4 rounded-lg bg-primary/5 -z-10" />
              <h3 className="text-center text-sm font-medium text-muted-foreground">Path 1</h3>
              <JourneyStep
                title="Mint your own NFTs"
                description="Create your own NFT contract using MegaData via our MegaRouter Token URI gateway."
                icon={Boxes}
                delay={0.2}
              />
              <AnimatedArrow delay={0.7} />
            </div>

            {/* Right Path */}
            <div className="space-y-4 relative">
              <div className="absolute inset-0 -m-4 rounded-lg bg-primary/5 -z-10" />
              <h3 className="text-center text-sm font-medium text-muted-foreground">Path 2</h3>
              <JourneyStep
                title="Create Airdrop"
                description="Allow your community to automatically claim their airdrop based on your defined query filters. E.g. Hold a specific NFT, and/or have a certain balance of a token."
                icon={Gift}
                delay={0.2}
                href="/airdrop"
              />
              <AnimatedArrow delay={0.7} />
            </div>
          </div>

          {/* Final Unified Step */}
          <div className="flex justify-center mt-16">
            <JourneyStep
              title="Attach Custom Modules"
              description="Enhance your tokens with custom & reusable modules from our repository in the style of NPM, but for Web3."
              icon={LinkIcon}
              delay={1.2}
              isComingSoon
              className="w-full max-w-xl"
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
} 
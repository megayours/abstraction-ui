"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { ArrowDown, Boxes, Gift, Link as LinkIcon, Split } from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
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
      <Card className={`p-4 md:p-6 transition-all duration-300 ${isComingSoon ? 'opacity-60 hover:opacity-70' : 'hover:shadow-lg hover:scale-105'}`}>
        <div className="flex items-start gap-3 md:gap-4">
          <div className={`p-2 rounded-lg ${isComingSoon ? 'bg-muted' : 'bg-primary/10'}`}>
            <Icon className={`w-5 h-5 md:w-6 md:h-6 ${isComingSoon ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2">{title}</h3>
            <p className="text-sm md:text-base text-muted-foreground">{description}</p>
            {isComingSoon && (
              <span className="inline-block mt-2 text-xs md:text-sm text-primary">Coming Soon</span>
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
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: [0, 5, 0] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
      className={`flex justify-center ${className}`}
    >
      <ArrowDown className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
    </motion.div>
  )
}

export default function UserJourney() {

  return (
    <section id="user-journey" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-4 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif mb-2 md:mb-4">Launch an experience</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Creating your own Megatoken is simple. Follow these steps to build fully programmable assets that go beyond ownership — with dynamic, on-chain metadata.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4 md:space-y-8 relative">
          {/* Split Indicator */}
          <div className="flex flex-col items-center gap-2 md:gap-4 pt-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Split className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm">Choose your path</span>
            </div>
          </div>

          {/* Forked Path */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 lg:gap-16 relative">
            {/* Left Path */}
            <div className="space-y-3 md:space-y-4 relative">
              <div className="absolute inset-0 -m-2 md:-m-4 rounded-lg bg-primary/5 -z-10" />
              <h3 className="text-center text-xs md:text-sm font-medium text-muted-foreground">Option 1</h3>
              <JourneyStep
                title="Create a new Collection"
                description="Create your own Dynamic Token Collection using MegaData via our MegaRouter Token URI gateway."
                icon={Boxes}
                delay={0.2}
                href="/megatokens/create"
              />
              <AnimatedArrow delay={0.7} />
            </div>

            {/* Right Path */}
            <div className="space-y-3 md:space-y-4 relative">
              <div className="absolute inset-0 -m-2 md:-m-4 rounded-lg bg-primary/5 -z-10" />
              <h3 className="text-center text-xs md:text-sm font-medium text-muted-foreground">Option 2</h3>
              <JourneyStep
                title="Extend a Collection"
                description="Extend an existing Dynamic Token Collection using MegaData via our MegaRouter Token URI gateway."
                icon={Gift}
                delay={0.2}
                href="/megatokens/extend"
              />
              <AnimatedArrow delay={0.7} />
            </div>
          </div>

          {/* Final Unified Step */}
          <div className="flex justify-center mt-4 md:mt-8 lg:mt-16">
            <JourneyStep
              title="Attach Modules"
              description="Enhance your tokens with custom & reusable modules from our repository in the style of NPM, but for Web3."
              icon={LinkIcon}
              delay={0}
              className="w-full max-w-xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
} 
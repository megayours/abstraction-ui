"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type ScrollSectionProps = {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
};

export function ScrollSection({ 
  children, 
  className = "", 
  direction = "up",
  delay = 0 
}: ScrollSectionProps) {
  const directionOffset = {
    up: { y: 100 },
    down: { y: -100 },
    left: { x: 100 },
    right: { x: -100 },
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...directionOffset[direction],
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ 
        margin: "-100px",
        amount: "some"
      }}
      transition={{
        duration: 0.4,
        delay,
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
} 
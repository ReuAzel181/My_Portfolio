'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

interface SectionTransitionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function SectionTransition({ children, className = "" }: SectionTransitionProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
} 
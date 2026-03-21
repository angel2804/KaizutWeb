'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

type Padding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  hover?: boolean
  glow?: boolean
  glowColor?: string
  padding?: Padding
  className?: string
}

const paddingMap: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({
  children,
  hover = false,
  glow = false,
  glowColor = 'rgba(37,99,235,0.4)',
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={
        hover
          ? { y: -4, boxShadow: `0 0 30px ${glowColor}` }
          : undefined
      }
      transition={{ duration: 0.2 }}
      className={`
        glass-card
        ${glow ? 'animate-[glowPulse_2.5s_ease-in-out_infinite]' : ''}
        ${hover ? 'glass-card-hover cursor-default' : ''}
        ${paddingMap[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}

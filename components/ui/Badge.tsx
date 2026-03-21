'use client'

import { ReactNode } from 'react'

type BadgeColor = 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'gray'

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  className?: string
}

const colorMap: Record<BadgeColor, string> = {
  blue:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  yellow: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
  green:  'bg-green-500/10 text-green-400 border border-green-500/20',
  orange: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  red:    'bg-red-500/10 text-red-400 border border-red-500/20',
  gray:   'bg-white/5 text-slate-400 border border-white/10',
}

export default function Badge({ children, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  )
}

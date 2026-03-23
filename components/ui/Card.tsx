import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  onDrop?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glow = false,
  onClick,
  style,
  onDrop,
  onDragOver,
  onDragLeave,
}) => {
  return (
    <div
      className={cn(
        'bg-card-background border border-border-color rounded-3xl p-8 shadow-xl transition-all duration-400',
        glow && 'shadow-lg border-blue-400/30 dark:border-blue-500/40',
        onClick && 'cursor-pointer hover:shadow-xl hover:-translate-y-1',
        className
      )}
      onClick={onClick}
      style={style}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {glow && (
        <div className="absolute inset-0 bg-gradient-radial from-blue-500/3 via-transparent to-transparent pointer-events-none"></div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}


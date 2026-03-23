import React from 'react'
import { cn } from '@/lib/utils'

interface LiquidGlassButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  const baseClasses = 'relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30',
    secondary: 'bg-white/20 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 text-gray-900 dark:text-white shadow-lg hover:shadow-xl',
    accent: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Liquid Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 ease-out" />
      
      {/* Inner Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <span className="relative z-10 font-medium">{children}</span>
    </button>
  )
}

interface LiquidGlassSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  showValue?: boolean
}

export const LiquidGlassSlider: React.FC<LiquidGlassSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  showValue = true
}) => {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('relative', className)}>
      {showValue && (
        <div className="mb-2 text-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {value}
          </span>
        </div>
      )}
      
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden backdrop-blur-xl">
        {/* Track Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50" />
        
        {/* Active Track */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        >
          {/* Liquid Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </div>
        
        {/* Thumb */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-lg border-2 border-blue-500 transition-all duration-300 hover:scale-110 hover:shadow-xl"
          style={{ left: `calc(${percentage}% - 12px)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse" />
        </div>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  )
}

interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'glass' | 'neon'
  padding?: 'sm' | 'md' | 'lg'
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  variant = 'glass',
  padding = 'md'
}) => {
  const baseClasses = 'relative rounded-3xl transition-all duration-300 hover:scale-[1.02]'
  
  const variantClasses = {
    default: 'bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700',
    glass: 'bg-white/20 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl',
    neon: 'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-blue-500/30 dark:border-blue-500/20 shadow-2xl shadow-blue-500/20'
  }
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      className
    )}>
      {/* Liquid Glass Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 ease-out" />
      
      {/* Inner Glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

interface LiquidGlassToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LiquidGlassToggle: React.FC<LiquidGlassToggleProps> = ({
  checked,
  onChange,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-12 h-6',
    md: 'w-16 h-8',
    lg: 'w-20 h-10'
  }

  const thumbSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative rounded-full transition-all duration-300 cursor-pointer',
        sizeClasses[size],
        checked 
          ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/25' 
          : 'bg-gray-200 dark:bg-gray-700',
        className
      )}
    >
      {/* Liquid Effect */}
      {checked && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
      )}
      
      {/* Thumb */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-full shadow-lg transition-all duration-300 hover:scale-110',
          thumbSizeClasses[size],
          checked ? 'translate-x-full' : 'translate-x-1'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse" />
      </div>
    </button>
  )
}

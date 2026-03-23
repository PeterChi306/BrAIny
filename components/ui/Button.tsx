import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  children: React.ReactNode
  haptic?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  glow = false,
  haptic = true,
  className,
  children,
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    onClick?.(e)
  }

  const baseStyles = 'rounded-2xl font-bold transition-all duration-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden button-premium active:scale-95'

  const variants = {
    primary: glow
      ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white hover:from-blue-500 hover:via-blue-400 hover:to-blue-500 focus:ring-blue-400 shadow-md hover:shadow-lg text-glow'
      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 focus:ring-blue-400 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-blue-700 to-blue-600 text-white hover:from-blue-600 hover:to-blue-500 focus:ring-blue-400 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-black/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-400 focus:ring-blue-400 hover:shadow-glow',
    ghost: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 focus:ring-blue-400',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
  }

  const sizes = {
    sm: 'px-5 py-2.5 text-sm min-h-[36px]',
    md: 'px-7 py-3.5 text-base min-h-[44px]',
    lg: 'px-10 py-4.5 text-lg min-h-[52px]',
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
      {glow && variant === 'primary' && (
        <>
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000 shimmer"></span>
          <span className="absolute inset-0 bg-gradient-radial from-blue-400/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></span>
        </>
      )}
    </button>
  )
}


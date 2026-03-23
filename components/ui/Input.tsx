import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showPasswordToggle?: boolean
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  showPasswordToggle = false,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = props.type === 'password'
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            'w-full px-4 py-4 pr-12 min-h-[44px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm text-base',
            error && 'border-red-300 focus:border-red-500',
            className
          )}
          type={isPassword && showPasswordToggle ? (showPassword ? 'text' : 'password') : props.type}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => {
              if ('vibrate' in navigator) {
                navigator.vibrate(5)
              }
              setShowPassword(!showPassword)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center justify-center"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}


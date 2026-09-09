import React from 'react'

const VARIANTS = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 disabled:bg-ink-300',
  secondary: 'bg-white text-ink-800 border border-ink-200 hover:bg-ink-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-ink-600 hover:bg-ink-100',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  children, variant = 'primary', size = 'md', className = '', icon: Icon, disabled, ...rest
}) {
  return (
    <button
      disabled={disabled}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  )
}

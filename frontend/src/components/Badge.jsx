import React from 'react'

const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  teal: 'bg-teal-100 text-teal-800',
  amber: 'bg-clay-100 text-clay-700',
  rose: 'bg-rose-100 text-rose-700',
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-clay-100 text-clay-700',
  low: 'bg-teal-100 text-teal-800',
  positive: 'bg-teal-100 text-teal-800',
  negative: 'bg-rose-100 text-rose-700',
  neutral_sentiment: 'bg-ink-100 text-ink-700',
  completed: 'bg-teal-100 text-teal-800',
  pending: 'bg-clay-100 text-clay-700',
  overdue: 'bg-rose-100 text-rose-700',
  planned: 'bg-ink-100 text-ink-700',
  in_progress: 'bg-clay-100 text-clay-700',
  missed: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-ink-100 text-ink-500',
  today: 'bg-clay-100 text-clay-700',
  upcoming: 'bg-teal-100 text-teal-800',
}

export default function Badge({ tone = 'neutral', children, className = '' }) {
  const toneClass = TONES[tone?.toLowerCase?.()] || TONES.neutral
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass} ${className}`}>
      {children}
    </span>
  )
}

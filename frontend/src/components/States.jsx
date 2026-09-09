import React from 'react'
import { Inbox, Loader2 } from 'lucide-react'

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center mb-4">
        <Icon size={22} className="text-ink-400" />
      </div>
      <p className="font-display font-semibold text-ink-800">{title}</p>
      {description && <p className="text-sm text-ink-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-ink-400 text-sm">
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  )
}

export function InlineLoader() {
  return <Loader2 size={16} className="animate-spin" />
}

import React from 'react'

export function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-ink-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-400 mt-1">{hint}</span>}
    </label>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`focus-ring w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 ${props.className || ''}`}
    />
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`focus-ring w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 ${props.className || ''}`}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`focus-ring w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 bg-white ${props.className || ''}`}
    >
      {children}
    </select>
  )
}

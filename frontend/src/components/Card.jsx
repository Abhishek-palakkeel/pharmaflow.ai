import React from 'react'

export default function Card({ children, className = '', padded = true, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`bg-white rounded-xl border border-ink-200 shadow-soft ${padded ? 'p-5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const TITLES = {
  '/': 'Dashboard',
  '/employees': 'Employees',
  '/customers': 'Customers',
  '/work-plans': 'Work Plans',
  '/visits': 'Visits',
  '/follow-ups': 'Follow-Ups',
  '/analytics': 'Analytics',
  '/ai-insights': 'AI Insights',
  '/settings': 'Settings',
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const title = TITLES[location.pathname] || 'PharmaFlow AI'

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      {open && (
        <div className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <Topbar onMenuClick={() => setOpen(true)} title={title} />
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

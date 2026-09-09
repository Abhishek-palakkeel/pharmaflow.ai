import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, CalendarDays, MapPinned,
  ClipboardList, BarChart3, Sparkles, Settings as SettingsIcon, Activity,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'employee'] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['admin'] },
  { to: '/customers', label: 'Customers', icon: Building2, roles: ['admin', 'employee'] },
  { to: '/work-plans', label: 'Work Plans', icon: CalendarDays, roles: ['admin', 'employee'] },
  { to: '/visits', label: 'Visits', icon: MapPinned, roles: ['admin', 'employee'] },
  { to: '/follow-ups', label: 'Follow-Ups', icon: ClipboardList, roles: ['admin', 'employee'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'employee'] },
  { to: '/ai-insights', label: 'AI Insights', icon: Sparkles, roles: ['admin', 'employee'] },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['admin', 'employee'] },
]

export default function Sidebar({ open, onNavigate }) {
  const { user } = useAuth()
  const items = NAV.filter((i) => i.roles.includes(user?.role))

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-ink-950 text-ink-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
          <Activity size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="font-display font-bold text-white text-[15px] leading-tight">
          PharmaFlow <span className="text-teal-400">AI</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-700/90 text-white'
                  : 'text-ink-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-xs text-ink-500">
        PharmaFlow AI v1.0.0
      </div>
    </aside>
  )
}

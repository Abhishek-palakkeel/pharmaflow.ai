import React from 'react'
import { Menu, LogOut, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { initials } from '../utils/format'

export default function Topbar({ onMenuClick, title }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-ink-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="focus-ring lg:hidden p-2 rounded-lg hover:bg-ink-100">
          <Menu size={20} />
        </button>
        <h1 className="font-display font-semibold text-ink-900 text-lg">{title}</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="focus-ring flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-ink-100"
        >
          <div className="w-8 h-8 rounded-full bg-teal-700 text-white text-xs font-semibold flex items-center justify-center">
            {initials(user?.name)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-ink-800 leading-tight">{user?.name}</div>
            <div className="text-xs text-ink-500 leading-tight capitalize">{user?.role}</div>
          </div>
          <ChevronDown size={15} className="text-ink-400" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white border border-ink-200 rounded-lg shadow-card z-20 py-1">
              <button
                onClick={() => { signOut(); navigate('/login') }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

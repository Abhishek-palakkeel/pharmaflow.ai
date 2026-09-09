import React, { createContext, useContext, useState, useCallback } from 'react'
import * as api from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pf_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  const signIn = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const res = await api.login(email, password)
      localStorage.setItem('pf_token', res.data.access_token)
      const me = await api.getMe()
      const userData = {
        id: me.data.id,
        name: me.data.name,
        email: me.data.email,
        role: me.data.role,
        employeeId: me.data.employee_id || null,
        territory: me.data.territory || null,
      }
      localStorage.setItem('pf_user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('pf_token')
    localStorage.removeItem('pf_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

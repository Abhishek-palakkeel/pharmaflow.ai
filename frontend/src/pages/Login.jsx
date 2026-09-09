import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Field, Input } from '../components/Form'
import Button from '../components/Button'

export default function Login() {
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@pharmaflow.ai')
  const [password, setPassword] = useState('Admin@123')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid email or password')
      toast.error('Login failed')
    }
  }

  function fillDemo(role) {
    if (role === 'admin') {
      setEmail('admin@pharmaflow.ai')
      setPassword('Admin@123')
    } else {
      setEmail('aditya.kapoor@pharmaflow.ai')
      setPassword('Employee@123')
    }
  }

  return (
    <div className="min-h-screen flex bg-ink-950">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-ink-950 via-ink-900 to-teal-950 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg">PharmaFlow <span className="text-teal-400">AI</span></span>
        </div>
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight mb-4">
            Field force intelligence for pharmaceutical teams.
          </h2>
          <p className="text-ink-300 leading-relaxed">
            Plan visits, track follow-ups, and let priority scoring and ML
            predictions tell your reps exactly who to see next — and why.
          </p>
        </div>
        <p className="text-xs text-ink-500">© 2026 PharmaFlow AI. Portfolio demo project.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-ink-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center">
              <Activity size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg text-ink-900">PharmaFlow AI</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Welcome back</h1>
          <p className="text-sm text-ink-500 mb-6">Sign in to your PharmaFlow AI account.</p>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-ink-200 shadow-soft p-6">
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@pharmaflow.ai" />
            </Field>
            <Field label="Password">
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            {error && <p className="text-sm text-rose-600 mb-4">{error}</p>}
            <Button type="submit" className="w-full" icon={LogIn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-5 bg-ink-100 rounded-lg p-4 text-xs text-ink-600 space-y-2">
            <p className="font-semibold text-ink-700">Demo credentials</p>
            <button type="button" onClick={() => fillDemo('admin')} className="focus-ring block w-full text-left hover:text-teal-700">
              Admin — admin@pharmaflow.ai / Admin@123
            </button>
            <button type="button" onClick={() => fillDemo('employee')} className="focus-ring block w-full text-left hover:text-teal-700">
              Employee — aditya.kapoor@pharmaflow.ai / Employee@123
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

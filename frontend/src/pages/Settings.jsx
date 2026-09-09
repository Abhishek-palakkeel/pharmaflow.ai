import React from 'react'
import { User, Shield, Info } from 'lucide-react'
import Card from '../components/Card'
import Badge from '../components/Badge'
import { useAuth } from '../context/AuthContext'
import { initials, titleCase } from '../utils/format'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-700 text-white font-display font-bold flex items-center justify-center text-lg">
            {initials(user?.name)}
          </div>
          <div>
            <p className="font-display font-semibold text-ink-900 text-lg">{user?.name}</p>
            <p className="text-sm text-ink-500">{user?.email}</p>
          </div>
          <Badge tone="teal" className="ml-auto">{titleCase(user?.role)}</Badge>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-ink-500" />
          <h3 className="font-display font-semibold text-ink-900">Account Details</h3>
        </div>
        <dl className="divide-y divide-ink-100 text-sm">
          <div className="flex justify-between py-2.5">
            <dt className="text-ink-500">Role</dt>
            <dd className="text-ink-800 font-medium">{titleCase(user?.role)}</dd>
          </div>
          {user?.territory && (
            <div className="flex justify-between py-2.5">
              <dt className="text-ink-500">Territory</dt>
              <dd className="text-ink-800 font-medium">{user.territory}</dd>
            </div>
          )}
          <div className="flex justify-between py-2.5">
            <dt className="text-ink-500">Email</dt>
            <dd className="text-ink-800 font-medium">{user?.email}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-ink-500" />
          <h3 className="font-display font-semibold text-ink-900">Access & Security</h3>
        </div>
        <p className="text-sm text-ink-600 leading-relaxed">
          PharmaFlow AI uses JWT-based authentication with role-based access control.
          Admins manage employees, customers, and organization-wide data. Employees can only
          access customers assigned to them and their own visits, work plans, and follow-ups.
        </p>
      </Card>

      <Card className="bg-ink-50 border-dashed">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-ink-400 mt-0.5 shrink-0" />
          <p className="text-xs text-ink-500">
            This is a portfolio demo project. Passwords are hashed with bcrypt and the API is documented at
            <code className="mx-1 px-1.5 py-0.5 bg-white rounded border border-ink-200">/docs</code>
            on the backend server.
          </p>
        </div>
      </Card>
    </div>
  )
}

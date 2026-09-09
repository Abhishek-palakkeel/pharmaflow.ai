import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import * as api from '../api/endpoints'
import Card from '../components/Card'
import { Loader } from '../components/States'
import { useAuth } from '../context/AuthContext'

export default function Analytics() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [insights, setInsights] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)

  const employeeId = user.role === 'employee' ? user.employeeId : undefined

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const params = employeeId ? { employee_id: employeeId } : {}
        const [s, i, f] = await Promise.all([
          api.getDashboardSummary(params),
          api.getDashboardInsights({ ...params, days: 30 }),
          api.listFollowUps(params),
        ])
        if (mounted) {
          setSummary(s.data)
          setInsights(i.data.insights)
          setFollowUps(f.data)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, []) // eslint-disable-line

  if (loading || !summary) return <Loader label="Crunching the numbers…" />

  const bucketCounts = ['overdue', 'today', 'upcoming'].map((b) => ({
    bucket: b[0].toUpperCase() + b.slice(1),
    count: followUps.filter((f) => f.bucket === b).length,
  }))
  const bucketColor = { Overdue: '#DC2626', Today: '#D97706', Upcoming: '#0D9488' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-semibold text-ink-900 mb-4">Visits: Scheduled vs Completed (6 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
              <Bar dataKey="total" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Scheduled" />
              <Bar dataKey="completed" fill="#0D9488" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-display font-semibold text-ink-900 mb-4">Follow-Up Pipeline</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bucketCounts} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="bucket" tick={{ fontSize: 13, fill: '#334155' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {bucketCounts.map((b) => <Cell key={b.bucket} fill={bucketColor[b.bucket]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="font-display font-semibold text-ink-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3.5 rounded-lg bg-ink-50 border border-ink-100">
              {ins.trend === 'up' && <TrendingUp size={17} className="text-teal-700 mt-0.5 shrink-0" />}
              {ins.trend === 'down' && <TrendingDown size={17} className="text-rose-600 mt-0.5 shrink-0" />}
              {ins.trend === 'neutral' && <AlertTriangle size={17} className="text-clay-600 mt-0.5 shrink-0" />}
              <p className="text-sm text-ink-700">{ins.message}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

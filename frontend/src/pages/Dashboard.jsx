import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, Building2, CalendarCheck2, ListChecks, TrendingUp, TrendingDown,
  AlertTriangle, Sparkles,
} from 'lucide-react'
import * as api from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import Card from '../components/Card'
import { Loader } from '../components/States'
import { titleCase } from '../utils/format'

const PIE_COLORS = ['#0D9488', '#2DD4BF', '#D97706', '#64748B']

function StatCard({ icon: Icon, label, value, tone = 'teal', sub }) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
        tone === 'teal' ? 'bg-teal-100 text-teal-800' : tone === 'amber' ? 'bg-clay-100 text-clay-700' : 'bg-rose-100 text-rose-700'
      }`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink-500">{label}</p>
        <p className="text-2xl font-display font-bold text-ink-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  const employeeId = user.role === 'employee' ? user.employeeId : undefined

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [s, i] = await Promise.all([
          api.getDashboardSummary(employeeId ? { employee_id: employeeId } : {}),
          api.getDashboardInsights(employeeId ? { employee_id: employeeId } : {}),
        ])
        if (mounted) {
          setSummary(s.data)
          setInsights(i.data.insights)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [employeeId])

  if (loading || !summary) return <Loader label="Loading dashboard…" />

  const distribution = summary.customer_distribution.map((d) => ({ name: titleCase(d.type), value: d.count }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900">
          Welcome back, {user.name.split(' ')[0]}
        </h2>
        <p className="text-sm text-ink-500 mt-0.5">
          Here's what's happening across {employeeId ? 'your territory' : 'the organization'} today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!employeeId && (
          <StatCard icon={Users} label="Total Employees" value={summary.total_employees} />
        )}
        <StatCard icon={Building2} label="Total Customers" value={summary.total_customers} />
        <StatCard icon={CalendarCheck2} label="Today's Visits" value={`${summary.completed_today}/${summary.todays_visits}`} sub="Completed / Scheduled" />
        <StatCard
          icon={ListChecks}
          label="Pending Follow-Ups"
          value={summary.pending_follow_ups}
          tone={summary.overdue_follow_ups > 0 ? 'rose' : 'teal'}
          sub={`${summary.overdue_follow_ups} overdue`}
        />
        <StatCard
          icon={summary.visit_completion_rate >= 70 ? TrendingUp : TrendingDown}
          label="Visit Completion Rate"
          value={`${summary.visit_completion_rate}%`}
          tone={summary.visit_completion_rate >= 70 ? 'teal' : 'amber'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Monthly Visit Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={summary.monthly_trend}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
              <Area type="monotone" dataKey="total" stroke="#0D9488" fill="url(#totalGrad)" strokeWidth={2} name="Scheduled" />
              <Area type="monotone" dataKey="completed" stroke="#D97706" fill="url(#completedGrad)" strokeWidth={2} name="Completed" />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-display font-semibold text-ink-900 mb-4">Customer Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {distribution.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {distribution.map((d, idx) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  {d.name}
                </span>
                <span className="font-medium text-ink-800">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-teal-700" />
          <h3 className="font-display font-semibold text-ink-900">AI-Generated Insights</h3>
        </div>
        <div className="space-y-3">
          {insights.map((ins, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-ink-50 border border-ink-100">
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

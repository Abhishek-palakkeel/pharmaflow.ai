import React, { useEffect, useState } from 'react'
import { Plus, LogIn, LogOut, MapPinned, Smile, Meh, Frown } from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../api/endpoints'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Field, Input, Select, Textarea } from '../components/Form'
import { EmptyState, Loader } from '../components/States'
import { formatDateTime, toInputDateTime, titleCase } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const SENTIMENT_ICON = { positive: Smile, neutral: Meh, negative: Frown }

export default function Visits() {
  const { user } = useAuth()
  const [visits, setVisits] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [checkoutTarget, setCheckoutTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customer_id: '', scheduled_date: toInputDateTime() })
  const [checkoutForm, setCheckoutForm] = useState({ notes: '', outcome: 'positive' })

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (user.role === 'employee') params.employee_id = user.employeeId
      if (statusFilter) params.status = statusFilter
      const res = await api.listVisits(params)
      setVisits(res.data)
    } catch {
      toast.error('Failed to load visits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const custParams = user.role === 'employee' ? { assigned_employee_id: user.employeeId } : {}
    api.listCustomers(custParams).then((res) => setCustomers(res.data)).catch(() => {})
  }, []) // eslint-disable-line

  useEffect(() => { load() }, [statusFilter]) // eslint-disable-line

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createVisit({
        employee_id: user.employeeId,
        customer_id: Number(form.customer_id),
        scheduled_date: new Date(form.scheduled_date).toISOString(),
      })
      toast.success('Visit scheduled')
      setCreateOpen(false)
      load()
    } catch {
      toast.error('Failed to schedule visit')
    } finally {
      setSaving(false)
    }
  }

  async function handleCheckIn(visit) {
    try {
      await api.checkInVisit(visit.id)
      toast.success(`Checked in at ${visit.customer_name}`)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Check-in failed')
    }
  }

  function openCheckout(visit) {
    setCheckoutTarget(visit)
    setCheckoutForm({ notes: '', outcome: 'positive' })
  }

  async function handleCheckout(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.checkOutVisit(checkoutTarget.id, checkoutForm)
      toast.success('Visit completed — notes analyzed with NLP')
      setCheckoutTarget(null)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Check-out failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="focus-ring rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm w-full sm:w-52">
          <option value="">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="missed">Missed</option>
        </select>
        {user.role === 'employee' && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Schedule Visit</Button>}
      </div>

      <Card padded={false}>
        {loading ? (
          <Loader />
        ) : visits.length === 0 ? (
          <EmptyState icon={MapPinned} title="No visits found" description="Scheduled and completed visits will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-ink-500">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  {user.role === 'admin' && <th className="px-5 py-3 font-medium">Employee</th>}
                  <th className="px-5 py-3 font-medium">Scheduled</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Outcome</th>
                  <th className="px-5 py-3 font-medium">Sentiment</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => {
                  const SentimentIcon = SENTIMENT_ICON[v.sentiment] || null
                  return (
                    <tr key={v.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 align-top">
                      <td className="px-5 py-3 font-medium text-ink-800">{v.customer_name}</td>
                      {user.role === 'admin' && <td className="px-5 py-3 text-ink-600">{v.employee_name}</td>}
                      <td className="px-5 py-3 text-ink-600">{formatDateTime(v.scheduled_date)}</td>
                      <td className="px-5 py-3"><Badge tone={v.status}>{titleCase(v.status)}</Badge></td>
                      <td className="px-5 py-3">{v.status === 'completed' ? <Badge tone={v.outcome === 'positive' ? 'positive' : v.outcome === 'negative' ? 'negative' : 'neutral'}>{titleCase(v.outcome)}</Badge> : '—'}</td>
                      <td className="px-5 py-3">
                        {SentimentIcon ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${v.sentiment === 'positive' ? 'text-teal-700' : v.sentiment === 'negative' ? 'text-rose-600' : 'text-ink-500'}`}>
                            <SentimentIcon size={14} /> {titleCase(v.sentiment)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {user.role === 'employee' && v.status === 'planned' && (
                          <Button size="sm" variant="secondary" icon={LogIn} onClick={() => handleCheckIn(v)}>Check In</Button>
                        )}
                        {user.role === 'employee' && v.status === 'in_progress' && (
                          <Button size="sm" icon={LogOut} onClick={() => openCheckout(v)}>Check Out</Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Schedule Visit">
        <form onSubmit={handleCreate}>
          <Field label="Customer">
            <Select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Scheduled Date & Time">
            <Input type="datetime-local" required value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Schedule'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!checkoutTarget} onClose={() => setCheckoutTarget(null)} title={`Check Out — ${checkoutTarget?.customer_name || ''}`}>
        <form onSubmit={handleCheckout}>
          <Field label="Visit Outcome">
            <Select value={checkoutForm.outcome} onChange={(e) => setCheckoutForm({ ...checkoutForm, outcome: e.target.value })}>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
              <option value="no_outcome">No specific outcome</option>
            </Select>
          </Field>
          <Field label="Visit Notes" hint="Notes are automatically analyzed for sentiment, keywords, and follow-up requirement.">
            <Textarea rows={4} required value={checkoutForm.notes} onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })} placeholder="What happened during the visit?" />
          </Field>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setCheckoutTarget(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Complete Visit'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

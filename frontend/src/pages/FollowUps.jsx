import React, { useEffect, useState } from 'react'
import { Plus, CheckCircle2, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../api/endpoints'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Field, Input, Select, Textarea } from '../components/Form'
import { EmptyState, Loader } from '../components/States'
import { formatDate, toInputDateTime } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { key: 'overdue', label: 'Overdue', tone: 'rose' },
  { key: 'today', label: 'Today', tone: 'amber' },
  { key: 'upcoming', label: 'Upcoming', tone: 'teal' },
]

export default function FollowUps() {
  const { user } = useAuth()
  const [tab, setTab] = useState('overdue')
  const [followUps, setFollowUps] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ customer_id: '', due_date: toInputDateTime(), reason: '', notes: '' })

  async function load() {
    setLoading(true)
    try {
      const params = { status: 'pending' }
      if (user.role === 'employee') params.employee_id = user.employeeId
      const res = await api.listFollowUps(params)
      setFollowUps(res.data)
    } catch {
      toast.error('Failed to load follow-ups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const custParams = user.role === 'employee' ? { assigned_employee_id: user.employeeId } : {}
    api.listCustomers(custParams).then((res) => setCustomers(res.data)).catch(() => {})
  }, []) // eslint-disable-line

  const filtered = followUps.filter((f) => f.bucket === tab)
  const counts = TABS.reduce((acc, t) => ({ ...acc, [t.key]: followUps.filter((f) => f.bucket === t.key).length }), {})

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createFollowUp({
        employee_id: user.employeeId || customers.find((c) => c.id === Number(form.customer_id))?.assigned_employee_id,
        customer_id: Number(form.customer_id),
        due_date: new Date(form.due_date).toISOString(),
        reason: form.reason,
        notes: form.notes,
      })
      toast.success('Follow-up created')
      setModalOpen(false)
      load()
    } catch {
      toast.error('Failed to create follow-up')
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(id) {
    try {
      await api.updateFollowUp(id, { status: 'completed' })
      toast.success('Follow-up completed')
      load()
    } catch {
      toast.error('Failed to update follow-up')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`focus-ring px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                tab === t.key ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:bg-ink-50'
              }`}
            >
              {t.label} <span className="opacity-70">({counts[t.key] || 0})</span>
            </button>
          ))}
        </div>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>New Follow-Up</Button>
      </div>

      {loading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={ClipboardList} title={`No ${tab} follow-ups`} description="You're all caught up in this category." />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <Card key={f.id} className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-ink-800">{f.customer_name}</p>
                  <Badge tone={f.bucket}>{f.bucket}</Badge>
                </div>
                <p className="text-sm text-ink-600">{f.reason}</p>
                <p className="text-xs text-ink-400 mt-1">Due {formatDate(f.due_date)}</p>
                {f.notes && <p className="text-xs text-ink-500 mt-1">{f.notes}</p>}
              </div>
              <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => handleComplete(f.id)}>Complete</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Follow-Up">
        <form onSubmit={handleSubmit}>
          <Field label="Customer">
            <Select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Due Date">
            <Input type="datetime-local" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </Field>
          <Field label="Reason">
            <Input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Send updated pricing" />
          </Field>
          <Field label="Notes (optional)">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Follow-Up'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

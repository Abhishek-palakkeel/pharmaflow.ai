import React, { useEffect, useState } from 'react'
import { Plus, CheckCircle2, Trash2, CalendarDays } from 'lucide-react'
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

export default function WorkPlans() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employee_id: user.role === 'employee' ? user.employeeId : '',
    plan_date: toInputDateTime(),
    title: '',
    notes: '',
    customer_ids: [],
  })

  async function load() {
    setLoading(true)
    try {
      const params = user.role === 'employee' ? { employee_id: user.employeeId } : {}
      const res = await api.listWorkPlans(params)
      setPlans(res.data)
    } catch {
      toast.error('Failed to load work plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const custParams = user.role === 'employee' ? { assigned_employee_id: user.employeeId } : {}
    api.listCustomers(custParams).then((res) => setCustomers(res.data)).catch(() => {})
    if (user.role === 'admin') {
      api.listEmployees().then((res) => setEmployees(res.data)).catch(() => {})
    }
  }, []) // eslint-disable-line

  function openCreate() {
    setForm({
      employee_id: user.role === 'employee' ? user.employeeId : (employees[0]?.id || ''),
      plan_date: toInputDateTime(),
      title: '',
      notes: '',
      customer_ids: [],
    })
    setModalOpen(true)
  }

  function toggleCustomer(id) {
    setForm((f) => ({
      ...f,
      customer_ids: f.customer_ids.includes(id) ? f.customer_ids.filter((c) => c !== id) : [...f.customer_ids, id],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createWorkPlan({ ...form, employee_id: Number(form.employee_id), plan_date: new Date(form.plan_date).toISOString() })
      toast.success('Work plan created')
      setModalOpen(false)
      load()
    } catch {
      toast.error('Failed to create work plan')
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(id) {
    try {
      await api.completeWorkPlan(id)
      toast.success('Marked as completed')
      load()
    } catch {
      toast.error('Failed to update')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this work plan?')) return
    try {
      await api.deleteWorkPlan(id)
      toast.success('Work plan deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">Plan daily field activity and assign customers to visit.</p>
        <Button icon={Plus} onClick={openCreate}>New Work Plan</Button>
      </div>

      {loading ? (
        <Loader />
      ) : plans.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarDays} title="No work plans yet" description="Create a daily work plan and assign the customers to visit." action={<Button icon={Plus} onClick={openCreate}>New Work Plan</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-display font-semibold text-ink-900">{p.title}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{formatDate(p.plan_date)}</p>
                </div>
                <Badge tone={p.is_completed ? 'teal' : 'amber'}>{p.is_completed ? 'Completed' : 'Active'}</Badge>
              </div>
              {p.notes && <p className="text-sm text-ink-600 mb-3">{p.notes}</p>}
              <p className="text-xs text-ink-500 mb-4">{p.customer_ids.length} customer(s) planned</p>
              <div className="mt-auto flex items-center gap-2">
                {!p.is_completed && (
                  <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => handleComplete(p.id)}>Mark Done</Button>
                )}
                <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDelete(p.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Work Plan">
        <form onSubmit={handleSubmit}>
          {user.role === 'admin' && (
            <Field label="Employee">
              <Select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Plan Date">
            <Input type="datetime-local" required value={form.plan_date} onChange={(e) => setForm({ ...form, plan_date: e.target.value })} />
          </Field>
          <Field label="Title">
            <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. North Zone coverage" />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Field label={`Customers to visit (${form.customer_ids.length} selected)`}>
            <div className="max-h-40 overflow-y-auto border border-ink-200 rounded-lg divide-y divide-ink-100">
              {customers.map((c) => (
                <label key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-ink-50 cursor-pointer">
                  <input type="checkbox" checked={form.customer_ids.includes(c.id)} onChange={() => toggleCustomer(c.id)} className="accent-teal-700" />
                  {c.name}
                </label>
              ))}
              {customers.length === 0 && <p className="text-xs text-ink-400 px-3 py-3">No customers available</p>}
            </div>
          </Field>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

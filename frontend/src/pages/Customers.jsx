import React, { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../api/endpoints'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Field, Input, Select } from '../components/Form'
import { EmptyState, Loader } from '../components/States'
import { titleCase } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const TYPES = ['doctor', 'hospital', 'chemist', 'distributor']
const TERRITORIES = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone']

const EMPTY_FORM = { name: '', type: 'doctor', specialty: '', phone: '', email: '', address: '', territory: TERRITORIES[0], assigned_employee_id: '' }

export default function Customers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [priorityMap, setPriorityMap] = useState({})

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (typeFilter) params.type = typeFilter
      if (user.role === 'employee') params.assigned_employee_id = user.employeeId
      const res = await api.listCustomers(params)
      setCustomers(res.data)
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user.role === 'admin') {
      api.listEmployees().then((res) => setEmployees(res.data)).catch(() => {})
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, typeFilter]) // eslint-disable-line

  async function loadPriority(customerId) {
    if (priorityMap[customerId]) return
    try {
      const res = await api.getCustomerPriority(customerId)
      setPriorityMap((m) => ({ ...m, [customerId]: res.data }))
    } catch { /* noop */ }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(c) {
    setEditing(c)
    setForm({
      name: c.name, type: c.type, specialty: c.specialty || '', phone: c.phone || '',
      email: c.email || '', address: c.address || '', territory: c.territory,
      assigned_employee_id: c.assigned_employee_id || '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, assigned_employee_id: form.assigned_employee_id ? Number(form.assigned_employee_id) : null }
      if (editing) {
        await api.updateCustomer(editing.id, payload)
        toast.success('Customer updated')
      } else {
        await api.createCustomer(payload)
        toast.success('Customer added')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(c) {
    if (!confirm(`Remove ${c.name} from active customers?`)) return
    try {
      await api.deleteCustomer(c.id)
      toast.success('Customer removed')
      load()
    } catch {
      toast.error('Failed to remove customer')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="focus-ring w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="focus-ring rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm">
            <option value="">All Types</option>
            {TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
        </div>
        {user.role === 'admin' && <Button icon={Plus} onClick={openCreate}>Add Customer</Button>}
      </div>

      <Card padded={false}>
        {loading ? (
          <Loader />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" description="Try adjusting your filters, or add a new customer." action={user.role === 'admin' && <Button icon={Plus} onClick={openCreate}>Add Customer</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-ink-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Territory</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">AI Priority</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-800">{c.name}</p>
                      {c.specialty && <p className="text-xs text-ink-500">{c.specialty}</p>}
                    </td>
                    <td className="px-5 py-3"><Badge tone="neutral">{titleCase(c.type)}</Badge></td>
                    <td className="px-5 py-3 text-ink-600">{c.territory}</td>
                    <td className="px-5 py-3 text-ink-600">
                      <div>{c.phone || '—'}</div>
                      <div className="text-xs text-ink-400">{c.email || ''}</div>
                    </td>
                    <td className="px-5 py-3">
                      {priorityMap[c.id] ? (
                        <Badge tone={priorityMap[c.id].priority.toLowerCase()}>{priorityMap[c.id].priority} · {priorityMap[c.id].score}</Badge>
                      ) : (
                        <button onClick={() => loadPriority(c.id)} className="focus-ring flex items-center gap-1 text-xs text-teal-700 hover:underline">
                          <Sparkles size={12} /> Compute
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {user.role === 'admin' && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(c)} className="focus-ring p-1.5 rounded-md hover:bg-ink-100 text-ink-500">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(c)} className="focus-ring p-1.5 rounded-md hover:bg-rose-50 text-rose-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit}>
          <Field label="Name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </Field>
          {form.type === 'doctor' && (
            <Field label="Specialty">
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            </Field>
          )}
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Territory">
            <Select value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })}>
              {TERRITORIES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Assigned Employee">
            <Select value={form.assigned_employee_id} onChange={(e) => setForm({ ...form, assigned_employee_id: e.target.value })}>
              <option value="">Unassigned</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.territory})</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

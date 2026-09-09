import React, { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../api/endpoints'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { Field, Input, Select } from '../components/Form'
import { EmptyState, Loader } from '../components/States'
import { formatDate, initials } from '../utils/format'

const TERRITORIES = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone']

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', territory: TERRITORIES[0], designation: 'Medical Representative' }

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.listEmployees(search ? { search } : {})
      setEmployees(res.data)
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(emp) {
    setEditing(emp)
    setForm({ name: emp.name, email: emp.email, password: '', phone: emp.phone || '', territory: emp.territory, designation: emp.designation })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.updateEmployee(editing.id, {
          name: form.name, phone: form.phone, territory: form.territory, designation: form.designation,
        })
        toast.success('Employee updated')
      } else {
        await api.createEmployee(form)
        toast.success('Employee created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save employee')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(emp) {
    if (!confirm(`Deactivate ${emp.name}? They will lose access to their account.`)) return
    try {
      await api.deleteEmployee(emp.id)
      toast.success('Employee deactivated')
      load()
    } catch {
      toast.error('Failed to deactivate employee')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="focus-ring w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <Button icon={Plus} onClick={openCreate}>Add Employee</Button>
      </div>

      <Card padded={false}>
        {loading ? (
          <Loader />
        ) : employees.length === 0 ? (
          <EmptyState title="No employees found" description="Add your first medical representative to get started." action={<Button icon={Plus} onClick={openCreate}>Add Employee</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-ink-500">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Territory</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold flex items-center justify-center shrink-0">
                          {initials(emp.name)}
                        </div>
                        <div>
                          <p className="font-medium text-ink-800">{emp.name}</p>
                          <p className="text-xs text-ink-500">{emp.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{emp.employee_code}</td>
                    <td className="px-5 py-3 text-ink-600">{emp.territory}</td>
                    <td className="px-5 py-3 text-ink-600">
                      <div>{emp.email}</div>
                      {emp.phone && <div className="flex items-center gap-1 text-xs text-ink-400"><Phone size={11} />{emp.phone}</div>}
                    </td>
                    <td className="px-5 py-3 text-ink-600">{formatDate(emp.joining_date)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={emp.is_active ? 'teal' : 'neutral'}>{emp.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(emp)} className="focus-ring p-1.5 rounded-md hover:bg-ink-100 text-ink-500">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeactivate(emp)} className="focus-ring p-1.5 rounded-md hover:bg-rose-50 text-rose-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit}>
          <Field label="Full Name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" required disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          {!editing && (
            <Field label="Temporary Password">
              <Input type="text" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          )}
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Territory">
            <Select value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })}>
              {TERRITORIES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Designation">
            <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Employee'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { Sparkles, Brain, Target, MessageSquareText, RefreshCw, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import * as api from '../api/endpoints'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { Textarea, Select, Field } from '../components/Form'
import { Loader, EmptyState } from '../components/States'
import { titleCase } from '../utils/format'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { key: 'priority', label: 'Priority Scoring', icon: Target },
  { key: 'ml', label: 'ML Prediction', icon: Brain },
  { key: 'recommend', label: 'Recommendations', icon: Sparkles },
  { key: 'nlp', label: 'Notes Analyzer', icon: MessageSquareText },
]

function PriorityTab({ employeeId }) {
  const [priorities, setPriorities] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const params = employeeId ? { employee_id: employeeId } : {}
      const res = await api.getAllPriorities(params)
      setPriorities(res.data.priorities)
    } catch {
      toast.error('Failed to compute priorities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  if (loading) return <Loader label="Scoring customers…" />
  if (priorities.length === 0) return <EmptyState title="No customers to score" />

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-500 mb-3">
        Explainable 0–100 score using recency, follow-up urgency, customer category, visit frequency, and past outcomes.
      </p>
      {priorities.map((p) => (
        <Card key={p.customer_id} className="cursor-pointer" onClick={() => setExpanded(expanded === p.customer_id ? null : p.customer_id)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center font-display font-bold text-ink-800 text-sm">
                {p.score}
              </div>
              <div>
                <p className="font-medium text-ink-800">{p.customer_name}</p>
                <p className="text-xs text-ink-500">{p.overdue_follow_ups} overdue · {p.pending_follow_ups} pending follow-ups</p>
              </div>
            </div>
            <Badge tone={p.priority.toLowerCase()}>{p.priority}</Badge>
          </div>
          {expanded === p.customer_id && (
            <ul className="mt-3 pt-3 border-t border-ink-100 space-y-1.5">
              {p.reasons.map((r, idx) => (
                <li key={idx} className="text-xs text-ink-600 flex items-start gap-1.5">
                  <span className="text-teal-600 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  )
}

function MlTab({ employeeId }) {
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [result, setResult] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [retraining, setRetraining] = useState(false)

  useEffect(() => {
    const params = employeeId ? { assigned_employee_id: employeeId } : {}
    api.listCustomers(params).then((res) => setCustomers(res.data)).catch(() => {})
    api.getModelInfo().then((res) => setModelInfo(res.data)).catch(() => {})
  }, []) // eslint-disable-line

  async function predict() {
    if (!customerId) return
    setLoading(true)
    setResult(null)
    try {
      const res = await api.getMlPredict(customerId)
      setResult(res.data)
    } catch {
      toast.error('Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  async function retrain() {
    setRetraining(true)
    try {
      const res = await api.retrainModel()
      toast.success(`Model retrained — test accuracy ${(res.data.accuracy * 100).toFixed(1)}%`)
      const info = await api.getModelInfo()
      setModelInfo(info.data)
    } catch {
      toast.error('Retrain failed')
    } finally {
      setRetraining(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="bg-ink-50 border-dashed">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-ink-400 mt-0.5 shrink-0" />
          <p className="text-xs text-ink-500">
            A RandomForestClassifier trained on {modelInfo ? 'seed-derived historical data' : '…'} predicts High / Medium / Low
            priority with a confidence score, using days since last visit, total visits, follow-up load, customer type,
            and outcome history as features.
          </p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="sm:w-72">
          <option value="">Select a customer…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Button onClick={predict} disabled={!customerId || loading} icon={Brain}>{loading ? 'Predicting…' : 'Predict Priority'}</Button>
        <Button onClick={retrain} disabled={retraining} variant="secondary" icon={RefreshCw}>{retraining ? 'Retraining…' : 'Retrain Model'}</Button>
      </div>

      {result && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display font-semibold text-ink-900">{result.customer_name}</p>
              <p className="text-xs text-ink-500">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
            </div>
            <Badge tone={result.predicted_priority.toLowerCase()} className="text-sm px-3 py-1.5">{result.predicted_priority} Priority</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {Object.entries(result.probabilities).map(([cls, p]) => (
              <div key={cls} className="text-center bg-ink-50 rounded-lg py-2.5">
                <p className="text-xs text-ink-500">{cls}</p>
                <p className="font-display font-bold text-ink-800">{(p * 100).toFixed(0)}%</p>
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-ink-600 mb-2">Top influencing factors</p>
          <div className="space-y-1.5">
            {result.top_factors.map((f) => (
              <div key={f.feature} className="flex items-center justify-between text-xs">
                <span className="text-ink-600">{titleCase(f.feature)}</span>
                <span className="font-medium text-ink-800">{(f.importance * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function RecommendTab({ employeeId, employees }) {
  const [selectedEmp, setSelectedEmp] = useState(employeeId || employees?.[0]?.id || '')
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    if (!selectedEmp) return
    setLoading(true)
    try {
      const res = await api.getRecommendations(selectedEmp, 5)
      setRecs(res.data.recommendations)
    } catch {
      toast.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [selectedEmp]) // eslint-disable-line

  return (
    <div className="space-y-4">
      {!employeeId && employees?.length > 0 && (
        <Select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="sm:w-72">
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      )}
      {loading ? <Loader label="Ranking recommendations…" /> : recs.length === 0 ? (
        <EmptyState title="No recommendations available" description="Assign customers to this employee's territory to generate recommendations." />
      ) : (
        <div className="space-y-3">
          {recs.map((r, idx) => (
            <Card key={r.customer_id} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-teal-700 text-white font-display font-bold flex items-center justify-center shrink-0 text-sm">
                #{idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-ink-800">{r.customer_name}</p>
                  <Badge tone="neutral">{titleCase(r.customer_type)}</Badge>
                  <Badge tone={r.ml_predicted_priority.toLowerCase()}>ML: {r.ml_predicted_priority}</Badge>
                </div>
                <p className="text-sm text-ink-600 mt-1">{r.explanation}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-ink-900">{r.combined_score}</p>
                <p className="text-xs text-ink-400">score</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function NlpTab() {
  const [text, setText] = useState('Doctor was very happy with the samples but reported a delay in the last order. Requires follow up next week to resolve the shortage issue.')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await api.analyzeNote(text)
      setResult(res.data)
    } catch {
      toast.error('Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-ink-500">
        Local, keyword-based NLP — no external API calls. Detects sentiment, follow-up requirement, and key terms from visit notes.
      </p>
      <Field label="Visit Notes">
        <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Button onClick={analyze} disabled={loading} icon={MessageSquareText}>{loading ? 'Analyzing…' : 'Analyze Notes'}</Button>

      {result && (
        <Card className="mt-2">
          <div className="flex items-center gap-3 mb-4">
            <Badge tone={result.sentiment}>{titleCase(result.sentiment)} sentiment</Badge>
            <Badge tone={result.requires_follow_up ? 'amber' : 'teal'}>
              {result.requires_follow_up ? 'Follow-up required' : 'No follow-up needed'}
            </Badge>
          </div>
          <p className="text-xs font-medium text-ink-600 mb-2">Extracted keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.length === 0 ? (
              <span className="text-xs text-ink-400">No significant keywords found</span>
            ) : result.keywords.map((k) => (
              <Badge key={k} tone="neutral">{k}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default function AIInsights() {
  const { user } = useAuth()
  const [tab, setTab] = useState('priority')
  const [employees, setEmployees] = useState([])
  const employeeId = user.role === 'employee' ? user.employeeId : undefined

  useEffect(() => {
    if (user.role === 'admin') {
      api.listEmployees().then((res) => setEmployees(res.data)).catch(() => {})
    }
  }, []) // eslint-disable-line

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`focus-ring flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:bg-ink-50'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'priority' && <PriorityTab employeeId={employeeId} />}
      {tab === 'ml' && <MlTab employeeId={employeeId} />}
      {tab === 'recommend' && <RecommendTab employeeId={employeeId} employees={employees} />}
      {tab === 'nlp' && <NlpTab />}
    </div>
  )
}

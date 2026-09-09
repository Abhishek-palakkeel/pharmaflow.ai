import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Customers from './pages/Customers'
import WorkPlans from './pages/WorkPlans'
import Visits from './pages/Visits'
import FollowUps from './pages/FollowUps'
import Analytics from './pages/Analytics'
import AIInsights from './pages/AIInsights'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { fontSize: '14px', borderRadius: '8px' },
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/work-plans" element={<WorkPlans />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/follow-ups" element={<FollowUps />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </>
  )
}

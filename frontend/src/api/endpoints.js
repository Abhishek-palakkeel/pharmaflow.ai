import client from './client'

// Auth
export const login = (email, password) => client.post('/auth/login', { email, password })
export const getMe = () => client.get('/auth/me')

// Employees
export const listEmployees = (params) => client.get('/employees', { params })
export const createEmployee = (data) => client.post('/employees', data)
export const updateEmployee = (id, data) => client.put(`/employees/${id}`, data)
export const deleteEmployee = (id) => client.delete(`/employees/${id}`)

// Customers
export const listCustomers = (params) => client.get('/customers', { params })
export const createCustomer = (data) => client.post('/customers', data)
export const updateCustomer = (id, data) => client.put(`/customers/${id}`, data)
export const deleteCustomer = (id) => client.delete(`/customers/${id}`)

// Work Plans
export const listWorkPlans = (params) => client.get('/work-plans', { params })
export const createWorkPlan = (data) => client.post('/work-plans', data)
export const completeWorkPlan = (id) => client.put(`/work-plans/${id}/complete`)
export const deleteWorkPlan = (id) => client.delete(`/work-plans/${id}`)

// Visits
export const listVisits = (params) => client.get('/visits', { params })
export const createVisit = (data) => client.post('/visits', data)
export const updateVisit = (id, data) => client.put(`/visits/${id}`, data)
export const checkInVisit = (id) => client.post(`/visits/${id}/check-in`)
export const checkOutVisit = (id, data) => client.post(`/visits/${id}/check-out`, data)
export const deleteVisit = (id) => client.delete(`/visits/${id}`)

// Follow-ups
export const listFollowUps = (params) => client.get('/follow-ups', { params })
export const createFollowUp = (data) => client.post('/follow-ups', data)
export const updateFollowUp = (id, data) => client.put(`/follow-ups/${id}`, data)
export const deleteFollowUp = (id) => client.delete(`/follow-ups/${id}`)

// Dashboard
export const getDashboardSummary = (params) => client.get('/dashboard/summary', { params })
export const getDashboardInsights = (params) => client.get('/dashboard/insights', { params })

// AI
export const getAllPriorities = (params) => client.get('/ai/priority', { params })
export const getCustomerPriority = (id) => client.get(`/ai/priority/${id}`)
export const getMlPredict = (id) => client.get(`/ai/ml-predict/${id}`)
export const getModelInfo = () => client.get('/ai/model-info')
export const retrainModel = () => client.post('/ai/model-retrain')
export const getRecommendations = (employeeId, topN = 5) =>
  client.get(`/ai/recommendations/${employeeId}`, { params: { top_n: topN } })
export const analyzeNote = (text) => client.post('/ai/analyze-note', { text })

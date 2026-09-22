const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.message || `Request failed: ${response.status}`)
    error.status = response.status
    throw error
  }

  return response.status === 204 ? null : response.json()
}

const json = (method, data) => ({ method, body: JSON.stringify(data) })

// Les GET d'un document unique renvoient null (204) tant que rien n'est enregistré.
export const api = {
  projects: {
    list: () => request('/projects'),
    create: (data) => request('/projects', json('POST', data)),
    get: (id) => request(`/projects/${id}`),
    // Vue agrégée : alimente le stepper du workflow et la vue globale du projet.
    overview: (id) => request(`/projects/${id}/overview`),
    // Même vue agrégée que `overview`, mais pour tous les projets en un seul appel (listes page Projets / tableau de bord).
    summary: () => request('/projects/summary'),
    history: (id) => request(`/projects/${id}/history`),
  },
  cabinets: {
    list: (projectId) => request(`/cabinets?projectId=${projectId}`),
    create: (data) => request('/cabinets', json('POST', data)),
    get: (id) => request(`/cabinets/${id}`),
    update: (id, data) => request(`/cabinets/${id}`, json('PATCH', data)),
    // Calculs de tous les départs d'une armoire (source du bilan de puissance).
    calculations: (cabinetId) => request(`/cabinets/${cabinetId}/calculations`),
    getBalance: (id) => request(`/cabinets/${id}/power-balance`),
    saveBalance: (id, data) => request(`/cabinets/${id}/power-balance`, json('PUT', data)),
    getMainFeeder: (id) => request(`/cabinets/${id}/main-feeder`),
    saveMainFeeder: (id, data) => request(`/cabinets/${id}/main-feeder`, json('PUT', data)),
    getBom: (id) => request(`/cabinets/${id}/bom`),
    saveBom: (id, items) => request(`/cabinets/${id}/bom`, json('PUT', { items })),
    getQuotation: (id) => request(`/cabinets/${id}/quotation`),
    saveQuotation: (id, data) => request(`/cabinets/${id}/quotation`, json('PUT', data)),
    getInstallation: (id) => request(`/cabinets/${id}/installation`),
    saveInstallation: (id, data) => request(`/cabinets/${id}/installation`, json('PUT', data)),
  },
  quotations: {
    nextReference: () => request('/quotations/next-reference'),
  },
  feeders: {
    list: (cabinetId) => request(`/feeders?cabinetId=${cabinetId}`),
    create: (data) => request('/feeders', json('POST', data)),
    get: (id) => request(`/feeders/${id}`),
    update: (id, data) => request(`/feeders/${id}`, json('PATCH', data)),
    remove: (id) => request(`/feeders/${id}`, { method: 'DELETE' }),
    getCalculation: (feederId) => request(`/feeders/${feederId}/calculation`),
    saveCalculation: (feederId, data) => request(`/feeders/${feederId}/calculation`, json('PUT', data)),
  },
  // Les actifs sont adressés par leur identifiant métier (ACT-2026-001).
  assets: {
    list: () => request('/assets'),
    get: (assetId) => request(`/assets/${assetId}`),
    update: (assetId, data) => request(`/assets/${assetId}`, json('PATCH', data)),
    getMaintenance: (assetId) => request(`/assets/${assetId}/maintenance`),
    savePlan: (assetId, data) => request(`/assets/${assetId}/maintenance-plan`, json('PUT', data)),
    addIntervention: (assetId, data) => request(`/assets/${assetId}/interventions`, json('POST', data)),
    tickets: (assetId) => request(`/assets/${assetId}/tickets`),
    createTicket: (assetId, data) => request(`/assets/${assetId}/tickets`, json('POST', data)),
  },
  maintenancePlans: {
    list: () => request('/maintenance-plans'),
  },
  tickets: {
    list: (status) => request(`/tickets${status ? `?status=${status}` : ''}`),
    update: (id, data) => request(`/tickets/${id}`, json('PATCH', data)),
  },
  dashboard: {
    // Comptages agrégés côté serveur (projets, armoires, actifs, tickets, maintenance) pour le tableau de bord.
    metrics: () => request('/dashboard/metrics'),
  },
}

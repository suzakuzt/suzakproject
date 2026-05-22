const DEFAULT_API_BASE_URL = ''

const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

const emitApiLog = (entry) => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent('gaokao-h5-api-log', {
      detail: {
        ...entry,
        logged_at: new Date().toLocaleTimeString(),
      },
    }),
  )
}

const buildUrl = (path, params) => {
  const configuredBaseUrl = getApiBaseUrl()
  const runtimeOrigin = typeof window === 'undefined' ? 'http://127.0.0.1:5173' : window.location.origin
  const baseUrl = configuredBaseUrl || runtimeOrigin
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const url = new URL(path.replace(/^\//, ''), normalizedBaseUrl)

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url
}

const request = async (path, { method = 'GET', params, body } = {}) => {
  const url = buildUrl(path, params)
  const startedAt = performance.now()
  let response

  try {
    response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    emitApiLog({
      method,
      url: url.href,
      status: 'ERR',
      ok: false,
      duration_ms: Math.round(performance.now() - startedAt),
      message: error instanceof Error ? error.message : 'network error',
    })
    throw error
  }

  emitApiLog({
    method,
    url: url.href,
    status: response.status,
    ok: response.ok,
    duration_ms: Math.round(performance.now() - startedAt),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Activity API request failed: ${response.status}`)
  }

  return response.json()
}

export const activityApi = {
  createSession: (body) => request('/api/h5/session/create', { method: 'POST', body }),
  getActivityState: ({ session_token }) => request('/api/activity/state', { params: { session_token } }),
  executeDraw: (body) => request('/api/draw/execute', { method: 'POST', body }),
  getDrawResultDetail: ({ session_token, draw_id, result_code }) =>
    request('/api/draw/result/detail', { params: { session_token, draw_id, result_code } }),
  getExplainDetail: ({ session_token, draw_id, result_code }) =>
    request('/api/explain/detail', { params: { session_token, draw_id, result_code } }),
  randomizeBenefit: (body) => request('/api/benefit/randomize', { method: 'POST', body }),
  claimBenefit: (body) => request('/api/benefit/claim', { method: 'POST', body }),
  getClaimResult: ({ session_token, claim_no }) =>
    request('/api/benefit/claim/result', { params: { session_token, claim_no } }),
  recordShare: (body) => request('/api/share/record', { method: 'POST', body }),
  getRewardCenter: ({ session_token }) => request('/api/reward/center/detail', { params: { session_token } }),
  getGrandPrizeDetail: ({ session_token }) =>
    request('/api/grand-prize/qualification/detail', { params: { session_token } }),
  getRulesDetail: (params = {}) => request('/api/activity/rules/detail', { params }),
  trackEvent: (body) => request('/api/tracking/event', { method: 'POST', body }),
}

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorData = await res.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Competitors
  getCompetitors: () => fetchApi<any[]>('/api/competitors'),
  getCompetitor: (id: string) => fetchApi<any>(`/api/competitors/${id}`),
  createCompetitor: (data: any) =>
    fetchApi<any>('/api/competitors', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCompetitor: (id: string, data: any) =>
    fetchApi<any>(`/api/competitors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCompetitor: (id: string) =>
    fetchApi<any>(`/api/competitors/${id}`, {
      method: 'DELETE'
    }),
  analyzeUrl: (url: string) =>
    fetchApi<any>('/api/competitors/analyze-url', {
      method: 'POST',
      body: JSON.stringify({ url })
    }),
  checkCompetitor: (id: string) =>
    fetchApi<any>(`/api/competitors/${id}/check`, {
      method: 'POST'
    }),
  toggleCompetitor: (id: string) =>
    fetchApi<any>(`/api/competitors/${id}/toggle`, {
      method: 'POST'
    }),

  // Articles
  getArticles: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<any>(`/api/articles${query ? `?${query}` : ''}`);
  },
  getArticle: (id: string) => fetchApi<any>(`/api/articles/${id}`),

  // Monitoring
  getMonitoringLogs: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<any>(`/api/monitoring/logs${query ? `?${query}` : ''}`);
  },
  getMonitoringStatus: () => fetchApi<any>('/api/monitoring/status'),
  startMonitoring: (intervalSeconds?: number) =>
    fetchApi<any>('/api/monitoring/start', {
      method: 'POST',
      body: JSON.stringify({ intervalSeconds })
    }),
  stopMonitoring: () =>
    fetchApi<any>('/api/monitoring/stop', {
      method: 'POST'
    }),
  triggerAllMonitoring: () =>
    fetchApi<any>('/api/monitoring/trigger-all', {
      method: 'POST'
    }),

  // Analytics
  getAnalytics: () => fetchApi<any>('/api/analytics'),

  // Scale Test
  getScaleTestStatus: () => fetchApi<any>('/api/scale-test/status'),
  runScaleTest: (config: { siteCount?: number; concurrency?: number }) =>
    fetchApi<any>('/api/scale-test/run', {
      method: 'POST',
      body: JSON.stringify(config)
    }),
  cancelScaleTest: () =>
    fetchApi<any>('/api/scale-test/cancel', {
      method: 'POST'
    }),

  // Demo
  publishDemoArticle: (data: any) =>
    fetchApi<any>('/api/demo/publish', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  runLiveDetectionDemo: (params: { simulatedDelaySeconds?: number; customTitle?: string } = {}) =>
    fetchApi<any>('/api/demo/run-live-detection', {
      method: 'POST',
      body: JSON.stringify(params)
    }),

  // Health & Notifications
  getSystemHealth: () => fetchApi<any>('/api/system-health'),
  getNotifications: () => fetchApi<any>('/api/notifications'),
  markNotificationsRead: () =>
    fetchApi<any>('/api/notifications/mark-all-read', {
      method: 'POST'
    }),

  // Stored Website Searches (Backend Database)
  getSearchedWebsites: () => fetchApi<any[]>('/api/searches'),
  searchAndSaveWebsite: (url: string, query?: string) =>
    fetchApi<any>('/api/searches', {
      method: 'POST',
      body: JSON.stringify({ url, query })
    }),
  deleteSearchedWebsite: (id: string) =>
    fetchApi<any>(`/api/searches/${id}`, {
      method: 'DELETE'
    })
};

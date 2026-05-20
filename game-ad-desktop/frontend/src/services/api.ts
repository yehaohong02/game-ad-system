import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error(err);
    return Promise.reject(err);
  }
);

// Inject AI provider config from settings store into AI requests
api.interceptors.request.use((config) => {
  if (config.url?.startsWith('/ai/')) {
    try {
      const saved = localStorage.getItem('app_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.apiKey) {
          config.data = {
            ...config.data,
            provider: settings.providerId || settings.provider,
            model: settings.model,
            apiKey: settings.apiKey,
            baseUrl: settings.baseUrl,
            apiFormat: settings.apiFormat,
          };
        }
      }
    } catch {}
  }
  return config;
});

export default api;
export const dataApi = {
  getPerformance: (params: any) => api.get('/data/performance', { params }),
  getAlerts: (params?: any) => api.get('/data/alerts', { params }),
};
export const executionApi = {
  runAgent: (data: any) => api.post('/execution/agent/run', data),
};
export const aiApi = {
  chat: (data: any) => api.post('/ai/chat', data),
};
export const platformApi = {
  getConfigs: () => api.get('/platform/configs'),
  saveConfig: (data: any) => api.post('/platform/configs', data),
  deleteConfig: (id: string) => api.delete(`/platform/configs/${id}`),
  analyzePage: (data: { html: string; url: string; mode?: string }) => api.post('/platform/analyze-page', data),
  storeScrapedData: (data: any) => api.post('/platform/scraped-data', data),
  scrapeProxy: (data: { platform_id: string; url: string }) => api.post('/platform/scrape-proxy', data),
  directFetch: (data: { url: string; platform_id: string }) => api.post('/platform/direct-fetch', data),
  getScrapedData: (platformId: string, dataType?: string) =>
    api.get(`/platform/scraped-data/${platformId}`, { params: { data_type: dataType || 'creatives' } }),
  getCreatives: (platform: string) => api.get('/platform/creatives', { params: { platform } }),
  getRankings: (type: string) => api.get('/platform/rankings', { params: { type } }),
  crossValidate: () => api.post('/platform/cross-validate'),
};
export const reportsApi = {
  getDaily: (date?: string) => api.get('/reports/daily', { params: date ? { date } : {} }),
  getWeekly: () => api.get('/reports/weekly'),
};

import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
});

// Track active requests for AbortController support
const controllers = new Map<string, AbortController>();

export function createRequestKey(config: any): string {
  return `${config.method || ''}:${config.url || ''}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`;
}

export function abortRequest(key: string) {
  const controller = controllers.get(key);
  if (controller) { controller.abort(); controllers.delete(key); }
}

export function abortAllRequests() {
  controllers.forEach((c) => c.abort());
  controllers.clear();
}

api.interceptors.request.use((config) => {
  // AbortController support
  if (!config.signal) {
    const key = createRequestKey(config);
    const controller = new AbortController();
    controllers.set(key, controller);
    config.signal = controller.signal;
    (config as any).__requestKey = key;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Clean up controller
    const key = (res.config as any).__requestKey;
    if (key) controllers.delete(key);
    // Handle both { data: [...] } and raw [...] response formats
    const data = res.data;
    if (data && typeof data === 'object' && 'data' in data && !Array.isArray(data)) {
      return data.data;
    }
    return data;
  },
  (err) => {
    // Clean up controller
    const key = (err.config as any).__requestKey;
    if (key) controllers.delete(key);
    if (axios.isCancel(err)) return Promise.reject(err);

    const status = err.response?.status;
    if (status === 401) {
      message.error('未授权，请检查登录状态');
    } else if (status === 403) {
      message.error('无权限访问该资源');
    } else if (status === 500) {
      message.error('服务器内部错误，请稍后重试');
    } else if (status) {
      message.error(`请求失败 (${status})`);
    }

    if (import.meta.env.DEV) {
      console.error(err);
    }
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
    } catch {
      // Settings not available or malformed JSON — skip injection
    }
  }
  return config;
});

export default api;
export const dataApi = {
  getPerformance: (params: any, config?: { signal?: AbortSignal }) => api.get('/data/performance', { params, signal: config?.signal }),
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
  scrapeProxy: (data: { platform_id: string; url: string }, config?: { signal?: AbortSignal }) => api.post('/platform/scrape-proxy', data, { signal: config?.signal }),
  directFetch: (data: { url: string; platform_id: string }, config?: { signal?: AbortSignal }) => api.post('/platform/direct-fetch', data, { signal: config?.signal }),
  getScrapedData: (platformId: string, dataType?: string) =>
    api.get(`/platform/scraped-data/${platformId}`, { params: { data_type: dataType || 'creatives' } }),
  getCreatives: (platform: string, config?: { signal?: AbortSignal }) => api.get('/platform/creatives', { params: { platform }, signal: config?.signal }),
  getRankings: (type: string, config?: { signal?: AbortSignal }) => api.get('/platform/rankings', { params: { type }, signal: config?.signal }),
  crossValidate: () => api.post('/platform/cross-validate'),
  // Data sources & collection
  getDataSources: () => api.get('/platform/data-sources'),
  syncDataSource: (sourceId: string) => api.post(`/platform/data-sources/${sourceId}/sync`),
  runCollectionTask: (sourceId: string) => api.post(`/platform/data-sources/${sourceId}/collect`),
  // Local file access (browser mode fallback for electronAPI)
  listLocalFiles: (crawlDir: string) =>
    api.get('/platform/files', { params: { crawl_dir: crawlDir } }),
  readLocalFile: (filePath: string) =>
    api.get('/platform/file', { params: { path: filePath }, responseType: 'arraybuffer' }),
};
export const reportsApi = {
  getDaily: (date?: string) => api.get('/reports/daily', { params: date ? { date } : {} }),
  getWeekly: () => api.get('/reports/weekly'),
};
export const managerApi = {
  getDesigners: () => api.get('/manager/designers'),
  getDesignerDetail: (name: string) => api.get(`/manager/designers/${name}`),
};
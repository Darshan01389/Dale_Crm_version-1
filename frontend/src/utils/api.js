import axios from 'axios';

// Configure default API base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Global request interceptor for Axios
axios.interceptors.request.use(config => {
  // Check token in sessionStorage first, fallback to localStorage
  const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
  const authHeader = config.headers.Authorization || config.headers.authorization;
  if (token && (!authHeader || authHeader === 'Bearer null' || authHeader === 'Bearer undefined')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Global monkey-patch interceptor for fetch
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const token = sessionStorage.getItem('voiceiq_token') || localStorage.getItem('voiceiq_token');
  if (token) {
    if (!options.headers) {
      options.headers = {};
    }
    if (options.headers instanceof Headers) {
      const auth = options.headers.get('Authorization') || options.headers.get('authorization');
      if (!auth || auth === 'Bearer null' || auth === 'Bearer undefined') {
        options.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (typeof options.headers === 'object') {
      const auth = options.headers['Authorization'] || options.headers['authorization'];
      if (!auth || auth === 'Bearer null' || auth === 'Bearer undefined') {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }
  return originalFetch(url, options);
};

// Global response interceptor for token refresh (401 status handling)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(response => {
  return response;
}, async error => {
  const originalRequest = error.config;

  // If request is from the refresh endpoint itself and fails, do not loop
  if (originalRequest.url?.includes('/auth/refresh') || originalRequest._retry) {
    return Promise.reject(error);
  }

  if (error.response?.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        originalRequest._retry = true;
        return axios(originalRequest);
      })
      .catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = sessionStorage.getItem('voiceiq_refresh_token') || localStorage.getItem('voiceiq_refresh_token');
    if (!refreshToken) {
      isRefreshing = false;
      // Only redirect if we are not already on the login or register page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password' && currentPath !== '/reset-password') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    try {
      const res = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
      const { access_token, refresh_token } = res.data;

      // Persist in whichever storage was originally used
      if (sessionStorage.getItem('voiceiq_token') || sessionStorage.getItem('voiceiq_refresh_token')) {
        sessionStorage.setItem('voiceiq_token', access_token);
        sessionStorage.setItem('voiceiq_refresh_token', refresh_token);
      } else {
        localStorage.setItem('voiceiq_token', access_token);
        localStorage.setItem('voiceiq_refresh_token', refresh_token);
      }

      processQueue(null, access_token);
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return axios(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Clean up session details and redirect
      sessionStorage.removeItem('voiceiq_token');
      sessionStorage.removeItem('voiceiq_refresh_token');
      localStorage.removeItem('voiceiq_token');
      localStorage.removeItem('voiceiq_refresh_token');
      
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password' && currentPath !== '/reset-password') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  return Promise.reject(error);
});

export default axios;

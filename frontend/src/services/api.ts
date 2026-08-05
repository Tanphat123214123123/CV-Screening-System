import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Tu dong gan JWT vao moi request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth');
  if (raw) {
    const { token } = JSON.parse(raw);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Het han token -> quay ve trang dang nhap
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

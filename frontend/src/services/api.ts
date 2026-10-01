import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

// Tu dong gan JWT vao moi request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth');
  if (raw) {
    try {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      localStorage.removeItem('auth');
    }
  }
  return config;
});

/** Phat ra khi token het han / khong hop le. SessionWatcher (trong router) xu ly dieu huong. */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

// 401 tu API can dang nhap -> bao phien het han. KHONG reload trang (window.location) nhu truoc:
// reload lam mat moi state dang go do va khong nho duoc trang dang dung.
// Bo qua /auth/*: dang nhap sai mat khau cung tra 401 nhung do la loi cua form, khong phai het phien.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;

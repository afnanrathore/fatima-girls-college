import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export function getAuthToken() {
  return localStorage.getItem('fgc_token') || sessionStorage.getItem('fgc_token') || '';
}

export function setAuthToken(token, rememberMe = true) {
  localStorage.removeItem('fgc_token');
  sessionStorage.removeItem('fgc_token');
  if (!token) return;
  if (rememberMe) localStorage.setItem('fgc_token', token);
  else sessionStorage.setItem('fgc_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('fgc_token');
  sessionStorage.removeItem('fgc_token');
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/uploads/${path}`;
}

export function isBsProgram(program) {
  if (!program) return false;
  const name = String(program.name || '').toUpperCase();
  const code = String(program.code || '').toUpperCase();
  return name.startsWith('BS') || code.startsWith('BS');
}

export function formatFee(n) {
  return `Rs ${Number(n || 0).toLocaleString('en-PK')}`;
}

export function statusLabel(s) {
  return String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

import axios from 'axios';
import { useAuthStore } from './auth';

const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const deviceApi = {
  list: () => apiClient.get('/devices'),
  get: (id: number) => apiClient.get(`/devices/${id}`),
  create: (data: any) => apiClient.post('/devices', data),
  update: (id: number, data: any) => apiClient.put(`/devices/${id}`, data),
  delete: (id: number) => apiClient.delete(`/devices/${id}`),
};

export const networkApi = {
  list: () => apiClient.get('/networks'),
  get: (id: number) => apiClient.get(`/networks/${id}`),
  create: (data: any) => apiClient.post('/networks', data),
  update: (id: number, data: any) => apiClient.put(`/networks/${id}`, data),
  delete: (id: number) => apiClient.delete(`/networks/${id}`),
  getTopology: (id: number) => apiClient.get(`/networks/${id}/topology`),
  getStats: (id: number) => apiClient.get(`/networks/${id}/stats`),
};

export default apiClient;
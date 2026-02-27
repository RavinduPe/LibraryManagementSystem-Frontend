import axios from 'axios';
import.meta.env.VITE_MY_VAR
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
    baseURL: import.meta.env.BASEURL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

export default api;
import { reactive } from 'vue';
import { authAPI } from '@/api/endpoints';
import type { User, AuthResponse } from '@/types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const state = reactive<AuthState>({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
});

export const useAuthStore = () => {
  const login = async (username: string, password: string) => {
    state.loading = true;
    state.error = null;
    
    try {
      const response = await authAPI.login({ username, password });
      const data = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        username: data.username,
        role: data.role
      }));
      
      // Update state
      state.token = data.token;
      state.user = {
        id: data.id,
        username: data.username,
        role: data.role
      };
      state.isAuthenticated = true;
      
      return true;
    } catch (error: any) {
      state.error = error.response?.data?.message || 'Login failed';
      return false;
    } finally {
      state.loading = false;
    }
  };

  const register = async (username: string, password: string) => {
    state.loading = true;
    state.error = null;
    
    try {
      const response = await authAPI.register({ username, password });
      const data = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        username: data.username,
        role: data.role
      }));
      
      // Update state
      state.token = data.token;
      state.user = {
        id: data.id,
        username: data.username,
        role: data.role
      };
      state.isAuthenticated = true;
      
      return true;
    } catch (error: any) {
      state.error = error.response?.data?.message || 'Registration failed';
      return false;
    } finally {
      state.loading = false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    state.user = null;
    state.token = null;
    state.isAuthenticated = false;
  };

  return {
    state,
    login,
    register,
    logout,
  };
};
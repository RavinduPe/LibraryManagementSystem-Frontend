import axios from '@/api/axios';
import type { User, AuthResponse } from '@/types/models';

class AuthService {
  private tokenKey = 'token';
  private userKey = 'user';

  async login(credentials: User): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>('/auth/login', credentials);
      
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser({
          username: response.data.username,
          role: response.data.role
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: User): Promise<void> {
    try {
      await axios.post('/auth/register', userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'ADMIN';
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getUser(): { username: string; role: string } | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: { username: string; role: string }): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUsername(): string {
    return this.getUser()?.username || '';
  }

  getRole(): string {
    return this.getUser()?.role || '';
  }
}

export const authService = new AuthService();
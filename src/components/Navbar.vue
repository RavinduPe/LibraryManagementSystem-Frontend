<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-logo">
        <router-link to="/">
          <span class="logo-icon">📚</span>
          <span class="logo-text">BookManager</span>
        </router-link>
      </div>

      <div class="nav-links" v-if="authStore.state.isAuthenticated">
        <router-link to="/dashboard" class="nav-link" active-class="active">
          <span>🏠</span> Dashboard
        </router-link>
        <router-link to="/borrow" class="nav-link" active-class="active">
          <span>📖</span> Borrow Books
        </router-link>
        <router-link to="/return" class="nav-link" active-class="active">
          <span>↩️</span> Return Books
        </router-link>
        <router-link v-if="isAdmin" to="/admin" class="nav-link admin-link" active-class="active">
          <span>⚡</span> Admin
        </router-link>
      </div>

      <div class="nav-user" v-if="authStore.state.isAuthenticated">
        <span class="user-badge" :class="userRole">
          {{ userRole === 'ADMIN' ? '👑' : '👤' }}
          {{ authStore.state.user?.username }}
        </span>
        <button @click="handleLogout" class="logout-btn">
          <span>🚪</span> Logout
        </button>
      </div>

      <div class="nav-auth" v-else>
        <router-link to="/login" class="auth-link">Login</router-link>
        <router-link to="/register" class="auth-link register">Register</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const userRole = computed(() => authStore.state.user?.role || 'USER');
const isAdmin = computed(() => userRole.value === 'ADMIN');

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-size: 1.3rem;
  font-weight: bold;
  color: #667eea;
}

.logo-icon {
  font-size: 1.8rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  text-decoration: none;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: #f5f5f5;
  color: #333;
}

.nav-link.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.admin-link {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.admin-link:hover {
  background: rgba(231, 76, 60, 0.2);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.user-badge.ADMIN {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.user-badge.USER {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e74c3c;
  background: transparent;
  color: #e74c3c;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #e74c3c;
  color: white;
}

.nav-auth {
  display: flex;
  gap: 1rem;
}

.auth-link {
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.auth-link:first-child {
  color: #667eea;
  border: 1px solid #667eea;
}

.auth-link:first-child:hover {
  background: #667eea;
  color: white;
}

.auth-link.register {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.auth-link.register:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-user {
    width: 100%;
    justify-content: center;
  }
}
</style>
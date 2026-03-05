<template>
  <div class="auth-view">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <span class="auth-icon">📝</span>
          <h1>Create Account</h1>
          <p>Join BookManager today</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div v-if="error" class="error-message">
            <span>⚠️</span> {{ error }}
          </div>

          <div class="form-group">
            <label for="username">Username</label>
            <div class="input-group">
              <span class="input-icon">👤</span>
              <input
                id="username"
                v-model="username"
                type="text"
                required
                minlength="3"
                placeholder="Choose a username"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-group">
              <span class="input-icon">🔑</span>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                minlength="6"
                placeholder="Choose a password"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <div class="input-group">
              <span class="input-icon">✓</span>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                placeholder="Confirm your password"
                :disabled="loading"
              />
            </div>
          </div>

          <button type="submit" class="auth-btn" :disabled="loading || !passwordsMatch">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Register</span>
          </button>

          <p class="auth-footer">
            Already have an account?
            <router-link to="/login">Login here</router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const passwordsMatch = computed(() => password.value === confirmPassword.value);

const handleRegister = async () => {
  if (!passwordsMatch.value) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;
  error.value = '';

  const success = await authStore.register(username.value, password.value);
  
  if (success) {
    router.push('/dashboard');
  } else {
    error.value = authStore.state.error || 'Registration failed';
  }

  loading.value = false;
};
</script>

<style scoped>
/* Same styles as LoginView */
.auth-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.5s ease;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.auth-header h1 {
  color: #333;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #666;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.error-message {
  background: #fee;
  color: #e74c3c;
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #333;
  font-weight: 600;
}

.input-group {
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.input-group:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-icon {
  padding: 0.75rem;
  background: #f5f5f5;
  color: #666;
}

.input-group input {
  flex: 1;
  padding: 0.75rem;
  border: none;
  outline: none;
  font-size: 1rem;
}

.auth-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.auth-footer {
  text-align: center;
  color: #666;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
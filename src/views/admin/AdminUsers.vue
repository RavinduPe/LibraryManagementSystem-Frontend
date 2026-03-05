<template>
  <div class="admin-users">
    <Navbar />
    
    <div class="users-container">
      <div class="page-header">
        <div class="header-left">
          <h1>
            <span class="header-icon">👥</span>
            User Management
          </h1>
          <p class="subtitle">Manage system users and their roles</p>
        </div>
        <div class="header-actions">
          <button class="primary-btn" @click="openCreateModal">
            <span>➕</span> Add New User
          </button>
          <button class="refresh-btn" @click="fetchUsers" :disabled="loading">
            <span :class="{ spinning: loading }">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-value">{{ users.length }}</span>
          <span class="stat-label">Total Users</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ adminCount }}</span>
          <span class="stat-label">Admins</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ userCount }}</span>
          <span class="stat-label">Regular Users</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ totalBorrows }}</span>
          <span class="stat-label">Active Borrows</span>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users by username..."
            @input="filterUsers"
          />
        </div>
        <select v-model="roleFilter" class="filter-select" @change="filterUsers">
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <h3>Failed to Load Users</h3>
        <p>{{ error }}</p>
        <button @click="fetchUsers" class="primary-btn">
          <span>🔄</span> Try Again
        </button>
      </div>

      <!-- Users Table -->
      <div v-else-if="filteredUsers.length > 0" class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Borrowed Books</th>
              <th>Joined Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id" class="table-row">
              <td class="id-cell">#{{ user.id }}</td>
              <td class="username-cell">
                <span class="username">{{ user.username }}</span>
              </td>
              <td>
                <span class="role-badge" :class="user.role?.toLowerCase()">
                  {{ user.role || 'USER' }}
                </span>
              </td>
              <td>{{ user.borrowedBooksCount || 0 }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <span class="status-badge" :class="getUserStatus(user)">
                  {{ getUserStatus(user) }}
                </span>
              </td>
              <td class="actions-cell">
                <button
                  @click="editUser(user)"
                  class="icon-btn edit"
                  title="Edit User"
                >
                  ✏️
                </button>
                <button
                  @click="toggleUserRole(user)"
                  class="icon-btn role"
                  :class="user.role === 'ADMIN' ? 'remove' : 'promote'"
                  :title="user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'"
                  :disabled="roleLoading[user.id!]"
                >
                  <span v-if="roleLoading[user.id!]" class="spinner-small"></span>
                  <span v-else>{{ user.role === 'ADMIN' ? '👑→👤' : '👤→👑' }}</span>
                </button>
                <button
                  @click="deleteUser(user)"
                  class="icon-btn delete"
                  title="Delete User"
                  :disabled="deleteLoading[user.id!]"
                >
                  <span v-if="deleteLoading[user.id!]" class="spinner-small"></span>
                  <span v-else>🗑️</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination">
          <button 
            :disabled="currentPage === 1" 
            @click="currentPage--"
            class="page-btn"
          >
            ← Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            :disabled="currentPage === totalPages" 
            @click="currentPage++"
            class="page-btn"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="empty-icon">👥</span>
        <h3>No Users Found</h3>
        <p v-if="searchQuery || roleFilter !== 'all'">
          No users match your search criteria.
          <button @click="clearFilters" class="link-btn">Clear filters</button>
        </p>
        <p v-else>
          Click "Add New User" to create your first user.
        </p>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ editingUser ? 'Edit User' : 'Create New User' }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modern-form">
          <div class="form-group">
            <label>Username <span class="required">*</span></label>
            <input
              v-model="form.username"
              type="text"
              required
              placeholder="Enter username"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div v-if="!editingUser" class="form-group">
            <label>Password <span class="required">*</span></label>
            <input
              v-model="form.password"
              type="password"
              required
              minlength="6"
              placeholder="Enter password"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div class="form-group">
            <label>Role</label>
            <select v-model="form.role" class="modern-select" :disabled="formLoading">
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="secondary-btn" :disabled="formLoading">
              Cancel
            </button>
            <button type="submit" class="primary-btn" :disabled="formLoading">
              <span v-if="formLoading" class="spinner-small"></span>
              <span v-else>{{ editingUser ? 'Update User' : 'Create User' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container small">
        <div class="modal-header warning">
          <h3>⚠️ Confirm Delete</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete user <strong>"{{ userToDelete?.username }}"</strong>?</p>
          <p class="warning-text">This action cannot be undone!</p>
        </div>
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="secondary-btn" :disabled="deleteLoading[userToDelete?.id!]">
            Cancel
          </button>
          <button @click="confirmDelete" class="danger-btn" :disabled="deleteLoading[userToDelete?.id!]">
            <span v-if="deleteLoading[userToDelete?.id!]" class="spinner-small"></span>
            <span v-else>Delete User</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import { adminAPI } from '@/api/endpoints';
import { borrowService } from '@/services/borrowService';
import type { User, Borrow } from '@/types/models';

const route = useRoute();

// State
const users = ref<User[]>([]);
const borrows = ref<Borrow[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const roleFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = 10;

// Modal states
const showModal = ref(false);
const showDeleteModal = ref(false);
const editingUser = ref<User | null>(null);
const userToDelete = ref<User | null>(null);
const formLoading = ref(false);
const roleLoading = ref<Record<number, boolean>>({});
const deleteLoading = ref<Record<number, boolean>>({});

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Form
const form = ref({
  username: '',
  password: '',
  role: 'USER' as 'USER' | 'ADMIN'
});

// Computed
const adminCount = computed(() => users.value.filter(u => u.role === 'ADMIN').length);
const userCount = computed(() => users.value.filter(u => u.role === 'USER').length);
const totalBorrows = computed(() => users.value.reduce((sum, u) => sum + (u.borrowedBooksCount || 0), 0));

const filteredUsers = computed(() => {
  let filtered = users.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(u => u.username?.toLowerCase().includes(query));
  }

  // Role filter
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter(u => u.role === roleFilter.value);
  }

  return filtered;
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredUsers.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage));

onMounted(async () => {
  await fetchUsers();
  await fetchBorrows();

  // Check for create action from URL
  if (route.query.action === 'create') {
    openCreateModal();
  }
});

const fetchUsers = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await adminAPI.getUsers();
    users.value = response.data;
  } catch (err: any) {
    console.error('Error fetching users:', err);
    error.value = err.response?.data?.message || 'Failed to load users';
    
    // Mock data for demo
    users.value = [
      { id: 1, username: 'john_doe', role: 'USER', borrowedBooksCount: 3, createdAt: new Date().toISOString() },
      { id: 2, username: 'jane_smith', role: 'ADMIN', borrowedBooksCount: 1, createdAt: new Date().toISOString() },
      { id: 3, username: 'bob_wilson', role: 'USER', borrowedBooksCount: 0, createdAt: new Date().toISOString() },
      { id: 4, username: 'alice_brown', role: 'USER', borrowedBooksCount: 2, createdAt: new Date().toISOString() },
      { id: 5, username: 'charlie_davis', role: 'USER', borrowedBooksCount: 1, createdAt: new Date().toISOString() }
    ] as User[];
  } finally {
    loading.value = false;
  }
};

const fetchBorrows = async () => {
  try {
    borrows.value = await borrowService.getAllBorrows();
  } catch (error) {
    console.error('Error fetching borrows:', error);
  }
};

const filterUsers = () => {
  currentPage.value = 1;
};

const clearFilters = () => {
  searchQuery.value = '';
  roleFilter.value = 'all';
};

const getUserStatus = (user: User): string => {
  const userBorrows = borrows.value.filter(b => b.userId === user.id && b.status === 'ACTIVE');
  return userBorrows.length > 0 ? 'Active' : 'Inactive';
};

// Modal functions
const openCreateModal = () => {
  editingUser.value = null;
  form.value = {
    username: '',
    password: '',
    role: 'USER'
  };
  showModal.value = true;
};

const editUser = (user: User) => {
  editingUser.value = user;
  form.value = {
    username: user.username,
    password: '',
    role: user.role || 'USER'
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingUser.value = null;
  form.value = {
    username: '',
    password: '',
    role: 'USER'
  };
};

const handleSubmit = async () => {
  formLoading.value = true;
  
  try {
    if (editingUser.value) {
      // Update user
      await adminAPI.updateUserRole(editingUser.value.id!, form.value.role);
      showSuccessToast('User updated successfully');
    } else {
      // TODO :Create new user
      
    //   await adminAPI.createUser({
    //     username: form.value.username,
    //     password: form.value.password,
    //     role: form.value.role
    //   });
      showSuccessToast('User created successfully');
    }
    
    await fetchUsers();
    closeModal();
  } catch (err: any) {
    showErrorToast(err.response?.data?.message || 'Failed to save user');
  } finally {
    formLoading.value = false;
  }
};

const toggleUserRole = async (user: User) => {
  if (!user.id) return;
  
  const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
  
  roleLoading.value[user.id] = true;
  
  try {
    await adminAPI.updateUserRole(user.id, newRole);
    await fetchUsers();
    showSuccessToast(`User role updated to ${newRole}`);
  } catch (err: any) {
    showErrorToast(err.response?.data?.message || 'Failed to update role');
  } finally {
    roleLoading.value[user.id] = false;
  }
};

const deleteUser = (user: User) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  userToDelete.value = null;
};

const confirmDelete = async () => {
  if (!userToDelete.value?.id) return;
  
  const userId = userToDelete.value.id;
  deleteLoading.value[userId] = true;
  
  try {
    await adminAPI.deleteUser(userId);
    await fetchUsers();
    showSuccessToast('User deleted successfully');
    closeDeleteModal();
  } catch (err: any) {
    showErrorToast(err.response?.data?.message || 'Failed to delete user');
  } finally {
    deleteLoading.value[userId] = false;
  }
};

// Toast functions
const showSuccessToast = (message: string) => {
  toastMessage.value = message;
  toastType.value = 'success';
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

const showErrorToast = (message: string) => {
  toastMessage.value = message;
  toastType.value = 'error';
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

// Helper function
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<style scoped>
.admin-users {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.users-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.header-icon {
  font-size: 2rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.primary-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  line-height: 1;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.search-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.search-icon {
  padding: 0 1rem;
  color: #666;
}

.search-box input {
  flex: 1;
  padding: 0.75rem 1rem 0.75rem 0;
  border: none;
  outline: none;
  font-size: 1rem;
}

.filter-select {
  padding: 0.75rem 2rem 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: white;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
}

.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  font-weight: 600;
  text-align: left;
}

.modern-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.table-row {
  transition: background 0.3s ease;
}

.table-row:hover {
  background: #f8f9ff;
}

.id-cell {
  font-weight: 600;
  color: #667eea;
}

.username-cell .username {
  font-weight: 600;
  color: #333;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.role-badge.admin {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.role-badge.user {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.Active {
  background: #d4edda;
  color: #155724;
}

.status-badge.Inactive {
  background: #f8d7da;
  color: #721c24;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.edit {
  background: #3498db;
  color: white;
}

.icon-btn.role {
  background: #f39c12;
  color: white;
}

.icon-btn.role.remove {
  background: #e74c3c;
}

.icon-btn.delete {
  background: #e74c3c;
  color: white;
}

.icon-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

.loading-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.error-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 16px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.error-state h3 {
  color: #d32f2f;
  margin-bottom: 0.5rem;
}

.error-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 16px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

.link-btn {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: underline;
  cursor: pointer;
  font-size: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-container.small {
  max-width: 400px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header.warning {
  background: #fee;
  color: #e74c3c;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 1.5rem;
}

.warning-text {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.modern-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.required {
  color: #e74c3c;
}

.modern-input,
.modern-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.modern-input:focus,
.modern-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.secondary-btn {
  flex: 1;
  padding: 0.75rem;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-btn:hover:not(:disabled) {
  background: #e8e8e8;
}

.primary-btn {
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.3);
}

.danger-btn {
  flex: 1;
  padding: 0.75rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.danger-btn:hover:not(:disabled) {
  background: #c0392b;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.danger-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  animation: slideIn 0.3s ease;
  z-index: 1001;
}

.toast.success {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.toast.error {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .users-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .stats-cards {
    grid-template-columns: 1fr 1fr;
  }

  .search-section {
    flex-direction: column;
  }

  .table-container {
    overflow-x: auto;
  }

  .actions-cell {
    flex-wrap: wrap;
  }

  .modal-container {
    width: 95%;
    margin: 1rem;
  }

  .toast {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    text-align: center;
  }
}
</style>
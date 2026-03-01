<template>
  <div class="dashboard-view">
    <Navbar />
    
    <div class="dashboard-container">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1>
          <span class="welcome-icon">👋</span>
          Welcome back, {{ authStore.state.user?.username }}!
        </h1>
        <p class="welcome-subtitle">Manage your books and borrowings</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <span class="stat-label">Total Books</span>
            <span class="stat-value">{{ books.length }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📖</div>
          <div class="stat-content">
            <span class="stat-label">Available</span>
            <span class="stat-value">{{ availableBooksCount }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <span class="stat-label">My Borrows</span>
            <span class="stat-value">{{ myBorrows.length }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <span class="stat-label">Active</span>
            <span class="stat-value">{{ activeBorrowsCount }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <router-link to="/borrow" class="action-btn borrow">
            <span>📖</span>
            Borrow Books
          </router-link>
          <router-link to="/return" class="action-btn return">
            <span>↩️</span>
            Return Books
          </router-link>
        </div>
      </div>

      <!-- Recent Books -->
      <div class="recent-section">
        <div class="section-header">
          <h2>
            <span class="section-icon">🔥</span>
            Popular Books
          </h2>
          <router-link to="/borrow" class="view-all">View All →</router-link>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="books.length === 0" class="empty-state">
          <p>No books available</p>
        </div>

        <div v-else class="books-grid">
          <div v-for="book in books.slice(0, 4)" :key="book.id" class="book-card">
            <div class="book-cover">
              <span class="book-emoji">📕</span>
            </div>
            <div class="book-details">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">by {{ book.authorName || 'Unknown' }}</p>
              <div class="book-meta">
                <span class="book-genre">{{ book.genre }}</span>
                <span class="book-price">${{ book.price?.toFixed(2) }}</span>
              </div>
              <span class="book-status" :class="book.available ? 'available' : 'borrowed'">
                {{ book.available ? 'Available' : 'Borrowed' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Borrows -->
      <div class="recent-section">
        <div class="section-header">
          <h2>
            <span class="section-icon">📋</span>
            My Recent Borrows
          </h2>
          <router-link to="/return" class="view-all">View All →</router-link>
        </div>

        <div v-if="borrowsLoading" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="myBorrows.length === 0" class="empty-state">
          <p>You haven't borrowed any books yet</p>
        </div>

        <div v-else class="borrows-list">
          <div v-for="borrow in myBorrows.slice(0, 3)" :key="borrow.id" class="borrow-item">
            <div class="borrow-info">
              <span class="borrow-title">{{ borrow.bookTitle }}</span>
              <span class="borrow-date">Borrowed: {{ formatDate(borrow.borrowDate) }}</span>
            </div>
            <span class="borrow-status" :class="borrow.status.toLowerCase()">
              {{ borrow.status }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Navbar from '@/components/Navbar.vue';
import { useAuthStore } from '@/stores/auth';
import { userAPI } from '@/api/endpoints';
import { borrowService } from '@/services/borrowService';
import type { Book, Borrow } from '@/types/models';

const authStore = useAuthStore();

const books = ref<Book[]>([]);
const myBorrows = ref<Borrow[]>([]);
const loading = ref(false);
const borrowsLoading = ref(false);

const availableBooksCount = computed(() => books.value.filter(b => b.available).length);
const activeBorrowsCount = computed(() => myBorrows.value.filter(b => b.status === 'ACTIVE').length);

onMounted(async () => {
  await Promise.all([fetchBooks(), fetchMyBorrows()]);
});

const fetchBooks = async () => {
  loading.value = true;
  try {
    const response = await userAPI.getBooks();
    books.value = response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
  } finally {
    loading.value = false;
  }
};

const fetchMyBorrows = async () => {
  borrowsLoading.value = true;
  try {
    myBorrows.value = await borrowService.getMyBorrows();
  } catch (error) {
    console.error('Error fetching borrows:', error);
  } finally {
    borrowsLoading.value = false;
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.welcome-section h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.welcome-icon {
  font-size: 2rem;
}

.welcome-subtitle {
  color: #666;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  color: #333;
  font-size: 2rem;
  font-weight: bold;
}

.quick-actions {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.quick-actions h2 {
  color: #333;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.action-btn.borrow {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.return {
  background: #2ecc71;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.recent-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
}

.section-icon {
  font-size: 1.5rem;
}

.view-all {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.view-all:hover {
  text-decoration: underline;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.book-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  transition: all 0.3s ease;
}

.book-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.book-cover {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-emoji {
  font-size: 1.5rem;
}

.book-details {
  flex: 1;
}

.book-title {
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.book-author {
  color: #666;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.book-genre {
  background: #e0e0e0;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  color: #666;
}

.book-price {
  font-size: 0.8rem;
  font-weight: bold;
  color: #2ecc71;
}

.book-status {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.book-status.available {
  background: #d4edda;
  color: #155724;
}

.book-status.borrowed {
  background: #f8d7da;
  color: #721c24;
}

.borrows-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.borrow-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.borrow-info {
  display: flex;
  flex-direction: column;
}

.borrow-title {
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
}

.borrow-date {
  color: #666;
  font-size: 0.8rem;
}

.borrow-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.borrow-status.active {
  background: #d4edda;
  color: #155724;
}

.borrow-status.returned {
  background: #d1ecf1;
  color: #0c5460;
}

.borrow-status.overdue {
  background: #f8d7da;
  color: #721c24;
}

.loading-state {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .books-grid {
    grid-template-columns: 1fr;
  }
}
</style>
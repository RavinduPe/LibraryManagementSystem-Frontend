<template>
  <div class="return-view">
    <Navbar />
    
    <div class="return-container">
      <div class="return-header">
        <h1>
          <span class="header-icon">↩️</span>
          Return Books
        </h1>
        <p class="subtitle">View and manage your borrowed books</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your borrowed books...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <h3>Failed to Load</h3>
        <p>{{ error }}</p>
        <button @click="fetchBorrows" class="primary-btn">
          <span>🔄</span> Try Again
        </button>
      </div>

      <!-- Borrowed Books -->
      <div v-else-if="borrowedBooks.length > 0" class="borrowed-section">
        <!-- Stats -->
        <div class="stats-cards">
          <div class="stat-card">
            <span class="stat-value">{{ borrowedBooks.length }}</span>
            <span class="stat-label">Total Borrowed</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ activeBorrows.length }}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ overdueBorrows.length }}</span>
            <span class="stat-label">Overdue</span>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters">
          <button
            v-for="filter in filters"
            :key="filter.value"
            class="filter-btn"
            :class="{ active: currentFilter === filter.value }"
            @click="currentFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- Books Grid -->
        <div class="books-grid">
          <div
            v-for="borrow in filteredBorrows"
            :key="borrow.id"
            class="book-card"
            :class="borrow.status.toLowerCase()"
          >
            <div class="book-cover">
              <span class="book-emoji">📕</span>
            </div>
            <div class="book-details">
              <h3 class="book-title">{{ borrow.bookTitle }}</h3>
              <p class="book-meta">
                Borrowed: {{ formatDate(borrow.borrowDate) }}
              </p>
              <p v-if="borrow.status === 'OVERDUE'" class="overdue-badge">
                ⚠️ Overdue
              </p>
              <p v-else-if="borrow.status === 'RETURNED'" class="returned-badge">
                ✓ Returned on {{ formatDate(borrow.returnDate) }}
              </p>
              <button
                v-if="borrow.status === 'ACTIVE'"
                @click="returnBook(borrow)"
                class="return-btn"
                :disabled="returningId === borrow.id"
              >
                <span v-if="returningId === borrow.id" class="spinner-small"></span>
                <span v-else>↩️ Return Book</span>
              </button>
              <span v-else-if="borrow.status === 'RETURNED'" class="returned-label">
                Already Returned
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Borrowed Books -->
      <div v-else class="empty-state">
        <span class="empty-icon">📭</span>
        <h3>No Borrowed Books</h3>
        <p>You haven't borrowed any books yet.</p>
        <router-link to="/borrow" class="primary-btn">
          <span>📚</span> Browse Books
        </router-link>
      </div>

      <!-- Success Toast -->
      <div v-if="showToast" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Navbar from '@/components/Navbar.vue';
import { borrowService } from '@/services/borrowService';
import type { Borrow } from '@/types/models';

// State
const borrowedBooks = ref<Borrow[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const returningId = ref<number | null>(null);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const currentFilter = ref('all');

// Filters
const filters = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Returned', value: 'returned' }
];

// Computed properties
const activeBorrows = computed(() => 
  borrowedBooks.value.filter(b => b.status === 'ACTIVE')
);

const overdueBorrows = computed(() => 
  borrowedBooks.value.filter(b => b.status === 'OVERDUE')
);

const filteredBorrows = computed(() => {
  if (currentFilter.value === 'all') return borrowedBooks.value;
  if (currentFilter.value === 'active') return activeBorrows.value;
  if (currentFilter.value === 'overdue') return overdueBorrows.value;
  if (currentFilter.value === 'returned') 
    return borrowedBooks.value.filter(b => b.status === 'RETURNED');
  return borrowedBooks.value;
});

// Load data on mount
onMounted(() => {
  fetchBorrows();
});

// Fetch borrows
const fetchBorrows = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    borrowedBooks.value = await borrowService.getMyBorrows();
  } catch (err: any) {
    console.error('Error fetching borrows:', err);
    error.value = err.response?.data?.message || 'Failed to load borrowed books';
  } finally {
    loading.value = false;
  }
};

// Return a book
const returnBook = async (borrow: Borrow) => {
  if (!borrow.id) return;
  
  returningId.value = borrow.id;

  try {
    await borrowService.returnBook(borrow.id);
    
    // Refresh data
    await fetchBorrows();
    
    showSuccessToast(`Successfully returned "${borrow.bookTitle}"`);
  } catch (err: any) {
    console.error('Error returning book:', err);
    showErrorToast(err.response?.data?.message || 'Failed to return book');
  } finally {
    returningId.value = null;
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
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<style scoped>
.return-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.return-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.return-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.return-header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.header-icon {
  font-size: 2.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
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

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1.5rem;
  border: none;
  background: white;
  border-radius: 20px;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #ddd;
}

.filter-btn:hover {
  background: #f5f5f5;
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.book-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  border-left: 4px solid transparent;
}

.book-card.active {
  border-left-color: #2ecc71;
}

.book-card.overdue {
  border-left-color: #e74c3c;
}

.book-card.returned {
  border-left-color: #95a5a6;
  opacity: 0.8;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.book-cover {
  width: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-emoji {
  font-size: 2.5rem;
}

.book-details {
  flex: 1;
  padding: 1rem;
}

.book-title {
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.book-meta {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.overdue-badge {
  color: #e74c3c;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.returned-badge {
  color: #27ae60;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.return-btn {
  width: 100%;
  padding: 0.75rem;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.return-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);
}

.return-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.returned-label {
  display: block;
  text-align: center;
  padding: 0.75rem;
  background: #ecf0f1;
  color: #7f8c8d;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

.primary-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.loading-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
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
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
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
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 1.5rem;
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
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  .return-container {
    padding: 1rem;
  }

  .return-header h1 {
    font-size: 1.5rem;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .filters {
    justify-content: center;
  }

  .books-grid {
    grid-template-columns: 1fr;
  }

  .book-card {
    flex-direction: column;
  }

  .book-cover {
    width: 100%;
    height: 80px;
  }

  .toast {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    text-align: center;
  }
}
</style>
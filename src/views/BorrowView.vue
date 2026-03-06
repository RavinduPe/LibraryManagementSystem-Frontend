<template>
  <div class="borrow-view">
    <Navbar />
    
    <div class="borrow-container">
      <div class="borrow-header">
        <h1>
          <span class="header-icon">📚</span>
          Borrow Books
        </h1>
        <p class="subtitle">Browse available books and borrow your favorites</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading available books...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <h3>Failed to Load Books</h3>
        <p>{{ error }}</p>
        <button @click="fetchAvailableBooks" class="primary-btn">
          <span>🔄</span> Try Again
        </button>
      </div>

      <!-- Available Books Grid -->
      <div v-else-if="availableBooks.length > 0" class="books-section">
        <h2 class="section-title">
          <span class="section-icon">📖</span>
          Available Books ({{ availableBooks.length }})
        </h2>
        
        <div class="books-grid">
          <div
            v-for="book in availableBooks"
            :key="book.id"
            class="book-card"
            :class="{ 'borrowing': borrowingId === book.id }"
          >
            <div class="book-cover">
              <span class="book-emoji">📕</span>
            </div>
            <div class="book-details">
            <div class="book-inventory">
              <span class="inventory-badge"
                :class="book.availableCopies > 0 ? 'available' : 'borrowed'">
                {{ book.availableCopies }} / {{ book.totalCopies }} copies available
            </span>
            </div>
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">by {{ book.authorName || 'Unknown Author' }}</p>
              <div class="book-meta">
                <span class="book-genre">{{ book.genre || 'General' }}</span>
                <span class="book-price">${{ book.price?.toFixed(2) || '0.00' }}</span>
              </div>
              <button
                @click="borrowBook(book)"
                class="borrow-btn"
                :disabled="borrowingId === book.id"
              >
                <span v-if="borrowingId === book.id" class="spinner-small"></span>
                <span v-else>📥 Borrow Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Books Available -->
      <div v-else class="empty-state">
        <span class="empty-icon">📭</span>
        <h3>No Books Available</h3>
        <p>All books are currently borrowed. Please check back later.</p>
        <button @click="fetchAvailableBooks" class="secondary-btn">
          <span>🔄</span> Refresh
        </button>
      </div>

      <!-- My Borrowed Books Section -->
      <div v-if="myBorrows.length > 0" class="borrowed-section">
        <h2 class="section-title">
          <span class="section-icon">📋</span>
          My Borrowed Books ({{ myBorrows.length }})
        </h2>

        <div class="borrowed-grid">
          <div
            v-for="borrow in myBorrows"
            :key="borrow.id"
            class="borrowed-card"
          >
            <div class="borrowed-header">
              <span class="borrowed-id">#{{ borrow.id }}</span>
              <span
                class="borrowed-status"
                :class="borrow.status.toLowerCase()"
              >
                {{ borrow.status }}
              </span>
            </div>
            <div class="borrowed-details">
              <h4 class="borrowed-title">{{ borrow.bookTitle }}</h4>
              <p class="borrowed-date">
                Borrowed: {{ formatDate(borrow.borrowDate) }}
              </p>
              <p v-if="borrow.returnDate" class="borrowed-date">
                Returned: {{ formatDate(borrow.returnDate) }}
              </p>
              <p v-else-if="borrow.status === 'OVERDUE'" class="overdue-warning">
                ⚠️ Overdue - Please return immediately
              </p>
            </div>
            <div class="borrowed-actions">
              <button
                v-if="!borrow.returnDate && borrow.status === 'ACTIVE'"
                @click="returnBook(borrow)"
                class="return-btn"
                :disabled="returningId === borrow.id"
              >
                <span v-if="returningId === borrow.id" class="spinner-small"></span>
                <span v-else>↩️ Return</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Toast -->
      <div v-if="showToast" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import { userAPI } from '@/api/endpoints';
import { borrowService } from '@/services/borrowService';
import type { Book, Borrow } from '@/types/models';

const router = useRouter();

// State
const availableBooks = ref<Book[]>([]);
const myBorrows = ref<Borrow[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const borrowingId = ref<number | null>(null);
const returningId = ref<number | null>(null);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Load data on mount
onMounted(() => {
  fetchAvailableBooks();
  fetchMyBorrows();
});

onUnmounted(() => {
  borrowService.cancelRequests();
});

// Fetch available books
const fetchAvailableBooks = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await userAPI.getAvailableBooks();
    availableBooks.value = response.data;
  } catch (err: any) {
    console.error('Error fetching books:', err);
    error.value = err.response?.data?.message || 'Failed to load books';
  } finally {
    loading.value = false;
  }
};

// Fetch user's borrowed books
const fetchMyBorrows = async () => {
  try {
    myBorrows.value = await borrowService.getMyBorrows();
  } catch (err) {
    console.error('Error fetching borrows:', err);
  }
};

// Borrow a book
const borrowBook = async (book: Book & { id: number }) => {
  if (!book.id) return;
  
  borrowingId.value = book.id;
  
  try {
    await borrowService.borrowBook(book.id);
    
    // Refresh data
    await Promise.all([
      fetchAvailableBooks(),
      fetchMyBorrows()
    ]);
    
    showSuccessToast(`Successfully borrowed "${book.title}"`);
  } catch (err: any) {
    console.error('Error borrowing book:', err);
    showErrorToast(err.response?.data?.message || 'Failed to borrow book');
  } finally {
    borrowingId.value = null;
  }
};

// Return a book
const returnBook = async (borrow: Borrow) => {
  if (!borrow.id) return;
  
  returningId.value = borrow.id;
  
  try {
    await borrowService.returnBook(borrow.id);
    
    // Refresh data
    await Promise.all([
      fetchAvailableBooks(),
      fetchMyBorrows()
    ]);
    
    showSuccessToast(`Successfully returned "${borrow.bookTitle}"`);
    
    // Navigate to return page after successful return
    setTimeout(() => {
      router.push('/return');
    }, 1500);
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
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<style scoped>
.borrow-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.borrow-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.borrow-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.borrow-header h1 {
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

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.section-icon {
  font-size: 1.8rem;
}

.books-section,
.borrowed-section {
  margin-bottom: 3rem;
}

.books-grid,
.borrowed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.book-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.book-card:hover:not(.borrowing) {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.book-card.borrowing {
  opacity: 0.7;
  pointer-events: none;
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
  margin-bottom: 0.25rem;
}

.book-author {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.book-genre {
  background: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
}

.book-price {
  font-weight: bold;
  color: #2ecc71;
}

.borrowed-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.borrowed-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.borrowed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.borrowed-id {
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 600;
}

.borrowed-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.borrowed-status.active {
  background: #d4edda;
  color: #155724;
}

.borrowed-status.returned {
  background: #d1ecf1;
  color: #0c5460;
}

.borrowed-status.overdue {
  background: #f8d7da;
  color: #721c24;
}

.borrowed-details {
  margin-bottom: 1rem;
}

.borrowed-title {
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.borrowed-date {
  color: #666;
  font-size: 0.85rem;
  margin: 0.25rem 0;
}

.overdue-warning {
  color: #e74c3c;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.borrow-btn,
.return-btn {
  width: 100%;
  padding: 0.75rem;
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

.borrow-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.borrow-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.return-btn {
  background: #2ecc71;
  color: white;
}

.return-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);
}

.borrow-btn:disabled,
.return-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.primary-btn,
.secondary-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.book-inventory {
  margin-top: 0.5rem;
}

.inventory-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.secondary-btn {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
}

.secondary-btn:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
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

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
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
  .borrow-container {
    padding: 1rem;
  }

  .borrow-header h1 {
    font-size: 1.5rem;
  }

  .books-grid,
  .borrowed-grid {
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
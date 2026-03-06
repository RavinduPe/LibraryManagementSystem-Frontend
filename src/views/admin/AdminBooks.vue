<template>
  <div class="admin-books">
    <Navbar />
    
    <div class="books-container">
      <div class="page-header">
        <div class="header-left">
          <h1>
            <span class="header-icon">📚</span>
            Book Management
          </h1>
          <p class="subtitle">Manage your library's book collection</p>
        </div>
        <div class="header-actions">
          <button class="primary-btn" @click="openCreateModal">
            <span>➕</span> Add New Book
          </button>
          <button class="refresh-btn" @click="fetchBooks" :disabled="loading">
            <span :class="{ spinning: loading }">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-value">{{ books.length }}</span>
          <span class="stat-label">Total Books</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ availableCount }}</span>
          <span class="stat-label">Available</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ borrowedCount }}</span>
          <span class="stat-label">Borrowed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ authors.length }}</span>
          <span class="stat-label">Authors</span>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search books by title, author, or genre..."
            @input="filterBooks"
          />
        </div>
        <div class="filter-group">
          <select v-model="genreFilter" class="filter-select" @change="filterBooks">
            <option value="all">All Genres</option>
            <option v-for="genre in uniqueGenres" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>
          <select v-model="availabilityFilter" class="filter-select" @change="filterBooks">
            <option value="all">All Books</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading books...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <h3>Failed to Load Books</h3>
        <p>{{ error }}</p>
        <button @click="fetchBooks" class="primary-btn">
          <span>🔄</span> Try Again
        </button>
      </div>

      <!-- Books Grid -->
      <div v-else-if="filteredBooks.length > 0" class="books-grid">
        <div v-for="book in paginatedBooks" :key="book.id" class="book-card">
          <div class="book-cover">
            <span class="book-emoji">📖</span>
          </div>
          <div class="book-content">
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-author">by {{ getAuthorName(book.authorId) }}</p>
            <div class="book-meta">
              <span class="book-genre">{{ book.genre }}</span>
              <span class="book-price">${{ book.price?.toFixed(2) }}</span>
            </div>
            <div class="book-status">
              <span class="status-indicator" :class="book.availableCopies > 0 ? 'available' : 'borrowed'">
                {{ book.availableCopies > 0 ? 'Available' : 'Borrowed' }}
              </span>
            </div>
            <div class="book-actions">
              <button @click="editBook(book)" class="icon-btn edit" title="Edit Book">
                ✏️
              </button>
              <button @click="deleteBook(book)" class="icon-btn delete" title="Delete Book">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="empty-icon">📚</span>
        <h3>No Books Found</h3>
        <p v-if="searchQuery || genreFilter !== 'all' || availabilityFilter !== 'all'">
          No books match your search criteria.
          <button @click="clearFilters" class="link-btn">Clear filters</button>
        </p>
        <p v-else>
          Click "Add New Book" to add your first book.
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="filteredBooks.length > 0" class="pagination">
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

    <!-- Create/Edit Book Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ editingBook ? 'Edit Book' : 'Create New Book' }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modern-form">
          <div class="form-group">
            <label>Title <span class="required">*</span></label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Enter book title"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div class="form-group">
            <label>Genre <span class="required">*</span></label>
            <input
              v-model="form.genre"
              type="text"
              required
              placeholder="Enter genre (e.g., Fiction)"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div class="form-group">
            <label>Price ($) <span class="required">*</span></label>
            <input
              v-model.number="form.price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div class="form-group">
            <label>Author <span class="required">*</span></label>
            <select v-model="form.authorId" required class="modern-select" :disabled="formLoading">
              <option value="">Select an author</option>
              <option v-for="author in authors" :key="author.id" :value="author.id">
                {{ author.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Total Copies <span class="required">*</span></label>
            <input
              v-model.number="form.totalCopies"
              type="number"
              min="1"
              required
              placeholder="Enter total copies"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.available" :disabled="formLoading" />
              <span>Available for borrowing</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="secondary-btn" :disabled="formLoading">
              Cancel
            </button>
            <button type="submit" class="primary-btn" :disabled="formLoading">
              <span v-if="formLoading" class="spinner-small"></span>
              <span v-else>{{ editingBook ? 'Update Book' : 'Create Book' }}</span>
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
          <p>Are you sure you want to delete book <strong>"{{ bookToDelete?.title }}"</strong>?</p>
          <p class="warning-text">This action cannot be undone!</p>
        </div>
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="secondary-btn" :disabled="deleteLoading">
            Cancel
          </button>
          <button @click="confirmDelete" class="danger-btn" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner-small"></span>
            <span v-else>Delete Book</span>
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
import { adminAPI, userAPI } from '@/api/endpoints';
import type { Book, Author } from '@/types/models';

const route = useRoute();

// State
const books = ref<Book[]>([]);
const authors = ref<Author[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const genreFilter = ref('all');
const availabilityFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = 12;

// Modal states
const showModal = ref(false);
const showDeleteModal = ref(false);
const editingBook = ref<Book | null>(null);
const bookToDelete = ref<Book | null>(null);
const formLoading = ref(false);
const deleteLoading = ref(false);

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Form
const form = ref({
  title: '',
  genre: '',
  price: 0,
  authorId: 0,
  totalCopies: 1,
  available: true
});
// Computed
const availableCount = computed(() =>
  books.value.filter(b => b.availableCopies > 0).length
);

const borrowedCount = computed(() =>
  books.value.filter(b => b.availableCopies === 0).length
);

const uniqueGenres = computed(() => {
  const genres = books.value.map(b => b.genre).filter(Boolean);
  return [...new Set(genres)];
});

const filteredBooks = computed(() => {
  let filtered = books.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(b => 
      b.title?.toLowerCase().includes(query) ||
      b.genre?.toLowerCase().includes(query) ||
      getAuthorName(b.authorId).toLowerCase().includes(query)
    );
  }

  // Genre filter
  if (genreFilter.value !== 'all') {
    filtered = filtered.filter(b => b.genre === genreFilter.value);
  }

  // Availability filter
  if (availabilityFilter.value !== 'all') {
    const isAvailable = availabilityFilter.value === 'available';
    filtered = filtered.filter(b => b.available === isAvailable);
  }

  return filtered;
});

const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredBooks.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredBooks.value.length / itemsPerPage));

onMounted(async () => {
  await Promise.all([fetchBooks(), fetchAuthors()]);

  // Check for create action from URL
  if (route.query.action === 'create') {
    openCreateModal();
  }
});

const fetchBooks = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await adminAPI.getBooks();
    books.value = response.data;
  } catch (err: any) {
    console.error('Error fetching books:', err);
    error.value = err.response?.data?.message || 'Failed to load books';
    
    // Mock data for demo
    books.value = [
      { id: 1, title: 'The Great Gatsby', genre: 'Fiction', price: 12.99, authorId: 1, authorName: 'F. Scott Fitzgerald', available: true },
      { id: 2, title: '1984', genre: 'Science Fiction', price: 10.99, authorId: 2, authorName: 'George Orwell', available: false },
      { id: 3, title: 'Pride and Prejudice', genre: 'Romance', price: 9.99, authorId: 3, authorName: 'Jane Austen', available: true },
      { id: 4, title: 'To Kill a Mockingbird', genre: 'Fiction', price: 11.99, authorId: 4, authorName: 'Harper Lee', available: true },
      { id: 5, title: 'The Catcher in the Rye', genre: 'Fiction', price: 10.99, authorId: 5, authorName: 'J.D. Salinger', available: false }
    ] as Book[];
  } finally {
    loading.value = false;
  }
};

const fetchAuthors = async () => {
  try {
    const response = await userAPI.getAuthors();
    authors.value = response.data;
  } catch (err) {
    console.error('Error fetching authors:', err);
    // Mock authors
    authors.value = [
      { id: 1, name: 'F. Scott Fitzgerald', bio: 'American novelist' },
      { id: 2, name: 'George Orwell', bio: 'English novelist' },
      { id: 3, name: 'Jane Austen', bio: 'English novelist' },
      { id: 4, name: 'Harper Lee', bio: 'American novelist' },
      { id: 5, name: 'J.D. Salinger', bio: 'American writer' }
    ] as Author[];
  }
};

const getAuthorName = (authorId: number): string => {
  const author = authors.value.find(a => a.id === authorId);
  return author ? author.name : 'Unknown Author';
};

const filterBooks = () => {
  currentPage.value = 1;
};

const clearFilters = () => {
  searchQuery.value = '';
  genreFilter.value = 'all';
  availabilityFilter.value = 'all';
};

// Modal functions
const openCreateModal = () => {
  editingBook.value = null;
  form.value = {
    title: '',
    genre: '',
    price: 0,
    authorId: 0,
    totalCopies: 1,
    available: true
  };
  showModal.value = true;
};

const editBook = (book: Book) => {
  editingBook.value = book;
  form.value = {
    title: book.title,
    genre: book.genre,
    price: book.price,
    authorId: book.authorId,
    totalCopies: book.totalCopies,
    available: book.available
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingBook.value = null;
};

const handleSubmit = async () => {
  formLoading.value = true;
  
  try {
    if (editingBook.value) {
      // Update book
      await adminAPI.updateBook(editingBook.value.id!, {
        title: form.value.title,
        genre: form.value.genre,
        price: form.value.price,
        authorId: form.value.authorId,
        totalCopies: form.value.totalCopies,
        available: form.value.available
      });
      showSuccessToast('Book updated successfully');
    } else {
      // Create new book
      await adminAPI.createBook({
        title: form.value.title,
        genre: form.value.genre,
        price: form.value.price,
        authorId: form.value.authorId,
        totalCopies: form.value.totalCopies,
        available: form.value.available

      });
      showSuccessToast('Book created successfully');
    }
    
    await fetchBooks();
    closeModal();
  } catch (err: any) {
    showErrorToast(err.response?.data?.message || 'Failed to save book');
  } finally {
    formLoading.value = false;
  }
};

const deleteBook = (book: Book) => {
  bookToDelete.value = book;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  bookToDelete.value = null;
};

const confirmDelete = async () => {
  if (!bookToDelete.value?.id) return;
  
  deleteLoading.value = true;
  
  try {
    await adminAPI.deleteBook(bookToDelete.value.id);
    await fetchBooks();
    showSuccessToast('Book deleted successfully');
    closeDeleteModal();
  } catch (err: any) {
    showErrorToast(err.response?.data?.message || 'Failed to delete book');
  } finally {
    deleteLoading.value = false;
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
</script>

<style scoped>
.admin-books {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.books-container {
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
  flex: 2;
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

.filter-group {
  flex: 1;
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: white;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.book-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.book-cover {
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-emoji {
  font-size: 3rem;
}

.book-content {
  padding: 1.5rem;
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
  margin-bottom: 1rem;
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

.book-status {
  margin-bottom: 1rem;
}

.status-indicator {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-indicator.available {
  background: #d4edda;
  color: #155724;
}

.status-indicator.borrowed {
  background: #f8d7da;
  color: #721c24;
}

.book-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.icon-btn.edit {
  background: #3498db;
  color: white;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
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

.spinner-small {
  width: 16px;
  height: 16px;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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
  .books-container {
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

  .filter-group {
    flex-direction: column;
  }

  .books-grid {
    grid-template-columns: 1fr;
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
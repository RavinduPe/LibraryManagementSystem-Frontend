<template>
  <div class="admin-authors">
    <Navbar />
    
    <div class="authors-container">
      <div class="page-header">
        <div class="header-left">
          <h1>
            <span class="header-icon">✍️</span>
            Author Management
          </h1>
          <p class="subtitle">Manage author information and biographies</p>
        </div>
        <div class="header-actions">
          <button class="primary-btn" @click="openCreateModal">
            <span>➕</span> Add New Author
          </button>
          <button class="refresh-btn" @click="fetchAuthors" :disabled="loading">
            <span :class="{ spinning: loading }">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-value">{{ authors.length }}</span>
          <span class="stat-label">Total Authors</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ totalBooks }}</span>
          <span class="stat-label">Total Books</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ avgBooksPerAuthor }}</span>
          <span class="stat-label">Avg Books/Author</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ topAuthor.books }}</span>
          <span class="stat-label">Most Published</span>
          <span class="stat-subtitle">{{ topAuthor.name }}</span>
        </div>
      </div>

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search authors by name or bio..."
            @input="filterAuthors"
          />
        </div>
        <div class="sort-group">
          <select v-model="sortBy" class="sort-select" @change="filterAuthors">
            <option value="name">Sort by Name</option>
            <option value="books">Sort by Books Count</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading authors...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <h3>Failed to Load Authors</h3>
        <p>{{ error }}</p>
        <button @click="fetchAuthors" class="primary-btn">
          <span>🔄</span> Try Again
        </button>
      </div>

      <!-- Authors Grid -->
      <div v-else-if="filteredAuthors.length > 0" class="authors-grid">
        <div v-for="author in paginatedAuthors" :key="author.id" class="author-card">
          <div class="author-avatar">
            <span class="author-initial">{{ author.name.charAt(0) }}</span>
          </div>
          <div class="author-content">
            <h3 class="author-name">{{ author.name }}</h3>
            <p class="author-bio">{{ truncateBio(author.bio) }}</p>
            <div class="author-stats">
              <span class="books-count">
                📚 {{ author.bookCount || 0 }} books
              </span>
              <span class="created-date">
                📅 {{ formatDate(author.createdAt) }}
              </span>
            </div>
            <div class="author-actions">
              <button @click="editAuthor(author)" class="icon-btn edit" title="Edit Author">
                ✏️ Edit
              </button>
              <button @click="viewAuthorBooks(author)" class="icon-btn view" title="View Books">
                📖 Books
              </button>
              <button @click="deleteAuthor(author)" class="icon-btn delete" title="Delete Author">
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="empty-icon">✍️</span>
        <h3>No Authors Found</h3>
        <p v-if="searchQuery">
          No authors match your search criteria.
          <button @click="clearSearch" class="link-btn">Clear search</button>
        </p>
        <p v-else>
          Click "Add New Author" to add your first author.
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="filteredAuthors.length > 0" class="pagination">
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

    <!-- Create/Edit Author Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ editingAuthor ? 'Edit Author' : 'Create New Author' }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="modern-form">
          <div class="form-group">
            <label>Author Name <span class="required">*</span></label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Enter author's full name"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div class="form-group">
            <label>Biography <span class="required">*</span></label>
            <textarea
              v-model="form.bio"
              required
              rows="5"
              placeholder="Enter author's biography, achievements, and notable works..."
              class="modern-textarea"
              :disabled="formLoading"
            ></textarea>
            <span class="char-count">{{ form.bio.length }}/500</span>
          </div>

          <div class="form-group">
            <label>Birth Date (Optional)</label>
            <input
              v-model="form.birthDate"
              type="date"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div class="form-group">
            <label>Nationality (Optional)</label>
            <input
              v-model="form.nationality"
              type="text"
              placeholder="e.g., American, British"
              class="modern-input"
              :disabled="formLoading"
            />
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="secondary-btn" :disabled="formLoading">
              Cancel
            </button>
            <button type="submit" class="primary-btn" :disabled="formLoading">
              <span v-if="formLoading" class="spinner-small"></span>
              <span v-else>{{ editingAuthor ? 'Update Author' : 'Create Author' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Author Books Modal -->
    <div v-if="showBooksModal" class="modal-overlay" @click.self="closeBooksModal">
      <div class="modal-container large">
        <div class="modal-header">
          <h3>
            <span class="header-icon">📚</span>
            Books by {{ selectedAuthor?.name }}
          </h3>
          <button class="close-btn" @click="closeBooksModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div v-if="authorBooksLoading" class="loading-state small">
            <div class="spinner-small"></div>
            <p>Loading books...</p>
          </div>

          <div v-else-if="authorBooks.length === 0" class="empty-state small">
            <p>No books found for this author.</p>
          </div>

          <div v-else class="books-list">
            <div v-for="book in authorBooks" :key="book.id" class="book-item">
              <div class="book-info">
                <span class="book-title">{{ book.title }}</span>
                <span class="book-genre">{{ book.genre }}</span>
              </div>
              <div class="book-meta">
                <span class="book-price">${{ book.price?.toFixed(2) }}</span>
                <span class="book-status" :class="book.available ? 'available' : 'borrowed'">
                  {{ book.available ? 'Available' : 'Borrowed' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeBooksModal" class="secondary-btn">Close</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container small">
        <div class="modal-header warning">
          <h3>⚠️ Confirm Delete</h3>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete author <strong>"{{ authorToDelete?.name }}"</strong>?</p>
          <p class="warning-text">This will also affect all books by this author!</p>
          <div class="warning-details" v-if="authorBooksCount > 0">
            <p>This author has <strong>{{ authorBooksCount }} books</strong> in the library.</p>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeDeleteModal" class="secondary-btn" :disabled="deleteLoading">
            Cancel
          </button>
          <button @click="confirmDelete" class="danger-btn" :disabled="deleteLoading">
            <span v-if="deleteLoading" class="spinner-small"></span>
            <span v-else>Delete Author</span>
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
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import { adminAPI, userAPI } from '@/api/endpoints';
import type { Author, Book } from '@/types/models';

const router = useRouter();

// State
const authors = ref<Author[]>([]);
const books = ref<Book[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const sortBy = ref('name');
const currentPage = ref(1);
const itemsPerPage = 9;

// Modal states
const showModal = ref(false);
const showBooksModal = ref(false);
const showDeleteModal = ref(false);
const editingAuthor = ref<Author | null>(null);
const selectedAuthor = ref<Author | null>(null);
const authorToDelete = ref<Author | null>(null);
const formLoading = ref(false);
const deleteLoading = ref(false);
const authorBooksLoading = ref(false);
const authorBooks = ref<Book[]>([]);

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Form
const form = ref({
  name: '',
  bio: '',
  birthDate: '',
  nationality: ''
});

// Computed
const totalBooks = computed(() => {
  return authors.value.reduce((sum, author) => sum + (author.bookCount || 0), 0);
});

const avgBooksPerAuthor = computed(() => {
  if (authors.value.length === 0) return 0;
  return (totalBooks.value / authors.value.length).toFixed(1);
});

const topAuthor = computed(() => {
  if (authors.value.length === 0) return { name: 'N/A', books: 0 };
  const top = authors.value.reduce((max, author) => 
    (author.bookCount || 0) > (max.bookCount || 0) ? author : max
  );
  return {
    name: top.name,
    books: top.bookCount || 0
  };
});

const filteredAuthors = computed(() => {
  let filtered = [...authors.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(a => 
      a.name?.toLowerCase().includes(query) ||
      a.bio?.toLowerCase().includes(query)
    );
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'books':
        return (b.bookCount || 0) - (a.bookCount || 0);
      case 'recent':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  return filtered;
});

const paginatedAuthors = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredAuthors.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredAuthors.value.length / itemsPerPage));

const authorBooksCount = computed(() => {
  if (!authorToDelete.value) return 0;
  return books.value.filter(b => b.authorId === authorToDelete.value.id).length;
});

onMounted(async () => {
  await Promise.all([fetchAuthors(), fetchBooks()]);
});

const fetchAuthors = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await adminAPI.getAuthors();
    authors.value = response.data;
  } catch (err: any) {
    console.error('Error fetching authors:', err);
    error.value = err.response?.data?.message || 'Failed to load authors';
    
    // Mock data for demo
    authors.value = [
        {
            id: 1,
            name: 'F. Scott Fitzgerald',
            bio: 'American novelist, essayist, and short story writer. He is best known for his novels depicting the flamboyance and excess of the Jazz Age.',
            bookCount: 5,
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'George Orwell',
            bio: 'English novelist, essayist, journalist and critic. His work is characterized by lucid prose, social criticism, opposition to totalitarianism.',
            bookCount: 3,
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            name: 'Jane Austen',
            bio: 'English novelist known primarily for her six major novels, which interpret, critique and comment upon the British landed gentry.',
            bookCount: 6,
            createdAt: new Date().toISOString()
        },
        {
            id: 4,
            name: 'Harper Lee',
            bio: 'American novelist best known for her 1960 novel To Kill a Mockingbird. It won the Pulitzer Prize and has become a classic of modern American literature.',
            bookCount: 2,
            createdAt: new Date().toISOString()
        },
        {
            id: 5,
            name: 'J.D. Salinger',
            bio: 'American writer best known for his 1951 novel The Catcher in the Rye. His last original published work was in 1965.',
            bookCount: 4,
            createdAt: new Date().toISOString()
        }
    ] as unknown as Author[];
  } finally {
    loading.value = false;
  }
};

const fetchBooks = async () => {
  try {
    const response = await adminAPI.getBooks();
    books.value = response.data;
  } catch (err) {
    console.error('Error fetching books:', err);
  }
};

const fetchAuthorBooks = async (authorId: number) => {
  authorBooksLoading.value = true;
  try {
    const response = await userAPI.getBooks();
    authorBooks.value = response.data.filter(b => b.authorId === authorId);
  } catch (err) {
    console.error('Error fetching author books:', err);
    authorBooks.value = books.value.filter(b => b.authorId === authorId);
  } finally {
    authorBooksLoading.value = false;
  }
};

const truncateBio = (bio: string, length = 100): string => {
  if (!bio) return '';
  if (bio.length <= length) return bio;
  return bio.substring(0, length) + '...';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const filterAuthors = () => {
  currentPage.value = 1;
};

const clearSearch = () => {
  searchQuery.value = '';
};

// Modal functions
const openCreateModal = () => {
  editingAuthor.value = null;
  form.value = {
    name: '',
    bio: '',
    birthDate: '',
    nationality: ''
  };
  showModal.value = true;
};

const editAuthor = (author: Author) => {
  editingAuthor.value = author;
  form.value = {
    name: author.name,
    bio: author.bio,
    birthDate: '',
    nationality: ''
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingAuthor.value = null;
};

const handleSubmit = async () => {
  formLoading.value = true;
  
  try {
    if (editingAuthor.value) {
      // Update author
      await adminAPI.updateAuthor(editingAuthor.value.id!, {
        name: form.value.name,
        bio: form.value.bio
      });
      showSuccessToast('Author updated successfully');
    } else {
      // Create new author
      await adminAPI.createAuthor({
        name: form.value.name,
        bio: form.value.bio
      });
      showSuccessToast('Author created successfully');
    }
    
    await fetchAuthors();
    closeModal();
  } catch (err: any) {
    showErrorToast(err.response?.data?.message || 'Failed to save author');
  } finally {
    formLoading.value = false;
  }
};

const viewAuthorBooks = async (author: Author) => {
  selectedAuthor.value = author;
  await fetchAuthorBooks(author.id!);
  showBooksModal.value = true;
};

const closeBooksModal = () => {
  showBooksModal.value = false;
  selectedAuthor.value = null;
  authorBooks.value = [];
};

const deleteAuthor = (author: Author) => {
  authorToDelete.value = author;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  authorToDelete.value = null;
};

const confirmDelete = async () => {
  if (!authorToDelete.value?.id) return;
  
  deleteLoading.value = true;
  
  try {
    await adminAPI.deleteAuthor(authorToDelete.value.id);
    await fetchAuthors();
    showSuccessToast('Author deleted successfully');
    closeDeleteModal();
  } catch (err: any) {
    showErrorToast(err.response?.data?.message || 'Failed to delete author');
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
.admin-authors {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.authors-container {
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
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
  margin-top: 0.25rem;
}

.stat-subtitle {
  display: block;
  color: #764ba2;
  font-size: 0.8rem;
  font-weight: 600;
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

.sort-group {
  flex: 1;
}

.sort-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: white;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
}

.authors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.author-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
}

.author-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.author-avatar {
  width: 80px;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.author-initial {
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
}

.author-content {
  flex: 1;
  padding: 1rem;
}

.author-name {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.author-bio {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.author-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.books-count {
  background: #f0f0ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: #667eea;
}

.created-date {
  color: #999;
}

.author-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
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

.icon-btn.view {
  background: #2ecc71;
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

.loading-state.small {
  padding: 2rem;
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

.empty-state.small {
  padding: 2rem;
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

/* Modal Styles */
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

.modal-container.large {
  max-width: 600px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.warning-details {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.modern-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
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
.modern-select,
.modern-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.modern-textarea {
  resize: vertical;
  min-height: 100px;
}

.modern-input:focus,
.modern-select:focus,
.modern-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.char-count {
  position: absolute;
  bottom: -1.2rem;
  right: 0;
  font-size: 0.8rem;
  color: #999;
}

/* Books List Modal */
.books-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.book-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.book-item:hover {
  background: #f0f0f0;
}

.book-info {
  display: flex;
  flex-direction: column;
}

.book-title {
  color: #333;
  font-weight: 600;
  font-size: 1rem;
}

.book-genre {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.book-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.book-price {
  font-weight: bold;
  color: #2ecc71;
}

.book-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
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
  .authors-container {
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

  .authors-grid {
    grid-template-columns: 1fr;
  }

  .author-card {
    flex-direction: column;
  }

  .author-avatar {
    width: 100%;
    height: 60px;
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
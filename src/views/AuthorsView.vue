<template>
  <div class="authors-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1>
          <span class="header-icon">✍️</span>
          Authors
        </h1>
        <p class="header-subtitle">Discover our collection of talented authors</p>
      </div>
      
      <!-- Search and Filter -->
      <div class="search-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search authors by name..."
            class="search-input"
          />
        </div>
        <select v-model="sortBy" class="sort-select">
          <option value="name">Sort by Name</option>
          <option value="books">Sort by Books Count</option>
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
      <button @click="fetchAuthors" class="retry-btn">
        <span>🔄</span> Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAuthors.length === 0" class="empty-state">
      <span class="empty-icon">📚</span>
      <h3>No Authors Found</h3>
      <p v-if="searchQuery">No authors matching "{{ searchQuery }}"</p>
      <p v-else>There are no authors in the library yet.</p>
      <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
        Clear Search
      </button>
    </div>

    <!-- Authors Grid -->
    <div v-else class="authors-grid">
      <div 
        v-for="author in filteredAuthors" 
        :key="author.id" 
        class="author-card"
        @click="selectAuthor(author)"
      >
        <div class="author-avatar" :style="{ background: getAvatarColor(author.name) }">
          <span class="author-initial">{{ getInitial(author.name) }}</span>
        </div>
        
        <div class="author-info">
          <h3 class="author-name">{{ author.name }}</h3>
          <p class="author-bio">{{ truncateText(author.bio, 120) }}</p>
          
          <div class="author-meta">
            <div class="meta-item">
              <span class="meta-icon">📚</span>
              <span class="meta-text">{{ author.bookCount || 0 }} books</span>
            </div>
            <div class="meta-item" v-if="author.birthDate">
              <span class="meta-icon">🎂</span>
              <span class="meta-text">{{ formatDate(author.birthDate) }}</span>
            </div>
          </div>

          <div class="author-books-preview" v-if="author.books && author.books.length > 0">
            <span class="preview-label">Popular books:</span>
            <div class="book-chips">
              <span 
                v-for="book in author.books.slice(0, 3)" 
                :key="book.id" 
                class="book-chip"
              >
                {{ book.title }}
              </span>
              <span v-if="author.books.length > 3" class="more-chip">
                +{{ author.books.length - 3 }} more
              </span>
            </div>
          </div>
        </div>

        <button class="view-details-btn">
          View Details →
        </button>
      </div>
    </div>

    <!-- Author Details Modal -->
    <div v-if="selectedAuthor" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <button class="close-btn" @click="closeModal">✕</button>
        
        <div class="modal-content">
          <div class="modal-header">
            <div class="author-avatar large" :style="{ background: getAvatarColor(selectedAuthor.name) }">
              <span class="author-initial">{{ getInitial(selectedAuthor.name) }}</span>
            </div>
            <div class="author-title-info">
              <h2>{{ selectedAuthor.name }}</h2>
              <p class="author-bio-full">{{ selectedAuthor.bio }}</p>
            </div>
          </div>

          <div class="author-stats">
            <div class="stat-card">
              <span class="stat-value">{{ selectedAuthor.bookCount || 0 }}</span>
              <span class="stat-label">Books</span>
            </div>
            <div class="stat-card" v-if="selectedAuthor.birthDate">
              <span class="stat-value">{{ calculateAge(selectedAuthor.birthDate) }}</span>
              <span class="stat-label">Age</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ selectedAuthor.genres?.length || 0 }}</span>
              <span class="stat-label">Genres</span>
            </div>
          </div>

          <!-- Author's Books -->
          <div class="author-books-section" v-if="selectedAuthor.books && selectedAuthor.books.length > 0">
            <h3>Books by {{ selectedAuthor.name }}</h3>
            <div class="books-grid">
              <div v-for="book in selectedAuthor.books" :key="book.id" class="book-card">
                <div class="book-cover">
                  <span class="book-emoji">📖</span>
                </div>
                <div class="book-details">
                  <h4 class="book-title">{{ book.title }}</h4>
                  <p class="book-genre">{{ book.genre }}</p>
                  <p class="book-price">${{ book.price?.toFixed(2) }}</p>
                  <span class="book-status" :class="book.available ? 'available' : 'borrowed'">
                    {{ book.available ? 'Available' : 'Borrowed' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-books">
            <p>No books found for this author.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { userAPI } from '@/api/endpoints';
import type { Author, Book } from '@/types/models';

// State
const authors = ref<Author[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const sortBy = ref('name');
const selectedAuthor = ref<Author | null>(null);

// Mock data for development
const mockAuthors: Author[] = [
  {
    id: 1,
    name: "F. Scott Fitzgerald",
    bio: "American novelist, essayist, and short story writer. He is best known for his novels depicting the flamboyance and excess of the Jazz Age.",
    bookCount: 5,
    birthDate: "1896-09-24",
    books: [
      { id: 1, title: "The Great Gatsby", genre: "Fiction", price: 12.99, available: true },
      { id: 2, title: "Tender Is the Night", genre: "Fiction", price: 14.99, available: true },
      { id: 3, title: "This Side of Paradise", genre: "Fiction", price: 11.99, available: false }
    ],
    genres: ["Fiction", "Classic"]
  },
  {
    id: 2,
    name: "Harper Lee",
    bio: "American novelist best known for her 1960 novel To Kill a Mockingbird. It won the Pulitzer Prize and has become a classic of modern American literature.",
    bookCount: 2,
    birthDate: "1926-04-28",
    books: [
      { id: 4, title: "To Kill a Mockingbird", genre: "Classic", price: 14.99, available: true },
      { id: 5, title: "Go Set a Watchman", genre: "Fiction", price: 13.99, available: true }
    ],
    genres: ["Classic", "Literature"]
  },
  {
    id: 3,
    name: "George Orwell",
    bio: "English novelist, essayist, journalist and critic. His work is characterized by lucid prose, biting social criticism, and opposition to totalitarianism.",
    bookCount: 7,
    birthDate: "1903-06-25",
    books: [
      { id: 6, title: "1984", genre: "Science Fiction", price: 11.99, available: false },
      { id: 7, title: "Animal Farm", genre: "Satire", price: 10.99, available: true }
    ],
    genres: ["Science Fiction", "Satire", "Political Fiction"]
  },
  {
    id: 4,
    name: "Jane Austen",
    bio: "English novelist known primarily for her six major novels, which interpret, critique and comment upon the British landed gentry at the end of the 18th century.",
    bookCount: 6,
    birthDate: "1775-12-16",
    books: [
      { id: 8, title: "Pride and Prejudice", genre: "Romance", price: 9.99, available: true },
      { id: 9, title: "Sense and Sensibility", genre: "Romance", price: 9.99, available: true }
    ],
    genres: ["Romance", "Classic"]
  }
];

// Computed
const filteredAuthors = computed(() => {
  let filtered = [...authors.value];
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(author => 
      author.name.toLowerCase().includes(query) || 
      author.bio.toLowerCase().includes(query)
    );
  }
  
  // Apply sorting
  if (sortBy.value === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy.value === 'books') {
    filtered.sort((a, b) => (b.bookCount || 0) - (a.bookCount || 0));
  }
  
  return filtered;
});

// Lifecycle
onMounted(() => {
  fetchAuthors();
});

// Methods
const fetchAuthors = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Try to fetch from API
    const response = await userAPI.getAuthors();
    authors.value = response.data;
  } catch (err: any) {
    console.error('Error fetching authors:', err);
    
    // If API fails, use mock data
    if (mockAuthors.length > 0) {
      console.log('Using mock authors data');
      authors.value = mockAuthors;
      error.value = null; // Clear error when using mock data
    } else {
      error.value = 'Failed to load authors. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};

const selectAuthor = (author: Author) => {
  selectedAuthor.value = author;
};

const closeModal = () => {
  selectedAuthor.value = null;
};

const clearSearch = () => {
  searchQuery.value = '';
};

// Helper functions
const getInitial = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (name: string): string => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  ];
  
  const index = name.length % colors.length;
  return colors[index];
};

const truncateText = (text: string, length: number): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateAge = (birthDate?: string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};
</script>

<style scoped>
.authors-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

/* Header Styles */
.page-header {
  max-width: 1200px;
  margin: 0 auto 2rem;
}

.header-content {
  text-align: center;
  margin-bottom: 2rem;
}

.header-content h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: white;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.header-icon {
  font-size: 2.5rem;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
}

/* Search Section */
.search-section {
  display: flex;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 0.5rem;
  border-radius: 50px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
}

.search-icon {
  color: #999;
  font-size: 1.2rem;
}

.search-input {
  flex: 1;
  border: none;
  padding: 0.75rem 0;
  font-size: 1rem;
  outline: none;
}

.sort-select {
  padding: 0.75rem 2rem 0.75rem 1rem;
  border: none;
  background: #f5f5f5;
  border-radius: 40px;
  font-size: 0.95rem;
  color: #333;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.5rem;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 20px;
  max-width: 400px;
  margin: 2rem auto;
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

/* Error State */
.error-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 20px;
  max-width: 500px;
  margin: 2rem auto;
}

.error-icon {
  font-size: 3rem;
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

.retry-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.3s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 20px;
  max-width: 500px;
  margin: 2rem auto;
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

.clear-btn {
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #e8e8e8;
  transform: translateY(-2px);
}

/* Authors Grid */
.authors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.author-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.author-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.author-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.author-avatar.large {
  width: 100px;
  height: 100px;
}

.author-initial {
  color: white;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.author-info {
  flex: 1;
}

.author-name {
  color: #333;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.author-bio {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.author-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #f5f5f5;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #666;
}

.meta-icon {
  font-size: 0.9rem;
}

/* Books Preview */
.author-books-preview {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 12px;
}

.preview-label {
  font-size: 0.8rem;
  color: #666;
  display: block;
  margin-bottom: 0.5rem;
}

.book-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.book-chip {
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #667eea;
  border: 1px solid #e0e0e0;
}

.more-chip {
  background: #f0f0f0;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #666;
}

.view-details-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
}

.author-card:hover .view-details-btn {
  opacity: 1;
  transform: translateX(0);
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
  animation: fadeIn 0.3s ease;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 30px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.modal-content {
  padding: 2rem;
}

.modal-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #f0f0f0;
}

.author-title-info h2 {
  color: #333;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.author-bio-full {
  color: #666;
  line-height: 1.6;
  font-size: 1rem;
}

/* Author Stats */
.author-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

/* Books Section */
.author-books-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.book-card {
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  transition: transform 0.3s ease;
}

.book-card:hover {
  transform: translateY(-3px);
}

.book-cover {
  width: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-emoji {
  font-size: 1.5rem;
}

.book-details {
  flex: 1;
  padding: 0.75rem;
}

.book-title {
  color: #333;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.book-genre {
  color: #666;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.book-price {
  color: #2ecc71;
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
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

.no-books {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  color: #666;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .authors-page {
    padding: 1rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .search-section {
    flex-direction: column;
    border-radius: 20px;
  }

  .authors-grid {
    grid-template-columns: 1fr;
  }

  .author-card {
    flex-direction: column;
    text-align: center;
  }

  .author-avatar {
    margin: 0 auto;
  }

  .view-details-btn {
    position: static;
    opacity: 1;
    transform: none;
    margin-top: 1rem;
  }

  .modal-header {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .author-stats {
    grid-template-columns: 1fr;
  }
}
</style>
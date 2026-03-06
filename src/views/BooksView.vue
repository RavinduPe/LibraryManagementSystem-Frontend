<template>
  <div class="books-container">
    <h1>Library Books</h1>
    
    <div v-if="loading" class="loading">
      Loading books...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else class="books-grid">
      <div v-for="book in books" :key="book.id" class="book-card">
        <h3>{{ book.title }}</h3>
        <p class="author">By: {{ book.authorName || 'Unknown' }}</p>
        <p class="genre">Genre: {{ book.genre }}</p>
        <p class="price">${{ book.price.toFixed(2) }}</p>
        
        <button 
          v-if="book.availableCopies > 0"
          @click="borrowBook(book.id!)"
          class="borrow-btn"
          :disabled="borrowingId === book.id"
        >
          {{ borrowingId === book.id ? 'Borrowing...' : 'Borrow' }}
        </button>
        <button v-else class="borrow-btn disabled" disabled>
          Not Available
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { userAPI } from '@/api/endpoints';
import type { Book } from '@/types/models';

const books = ref<Book[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const borrowingId = ref<number | null>(null);

const fetchBooks = async () => {
  try {
    const response = await userAPI.getBooks();
    books.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch books';
  } finally {
    loading.value = false;
  }
};

const borrowBook = async (bookId: number) => {
  borrowingId.value = bookId;
  try {
    await userAPI.borrowBook(bookId);
    await fetchBooks(); // Refresh the list
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to borrow book');
  } finally {
    borrowingId.value = null;
  }
};

onMounted(fetchBooks);
</script>

<style scoped>
.books-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.books-container h1 {
  color: white;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.loading, .error {
  text-align: center;
  color: white;
  font-size: 1.2rem;
  padding: 2rem;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.book-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.book-card:hover {
  transform: translateY(-5px);
}

.book-card h3 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.author {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.genre {
  color: #667eea;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2ecc71;
  margin-bottom: 1rem;
}

.borrow-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.borrow-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.borrow-btn.disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.borrow-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
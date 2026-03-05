<template>
  <div class="book-card" :class="{ 'admin-view': isAdmin }">
    <div class="book-cover">
      <span class="book-icon">📚</span>
    </div>
    
    <div class="book-details">
      <h3 class="book-title">{{ book.title }}</h3>
      <p class="book-author">by {{ book.authorName || 'Unknown Author' }}</p>
      
      <div class="book-info">
        <span class="book-genre">{{ book.genre }}</span>
        <span class="book-price">${{ book.price.toFixed(2) }}</span>
      </div>
      
      <div class="book-status">
        <span class="status-badge" :class="book.available ? 'available' : 'unavailable'">
          {{ book.available ? 'Available' : 'Borrowed' }}
        </span>
      </div>
      
      <div class="book-actions">
        <template v-if="!isAdmin">
          <button 
            v-if="book.available"
            @click="$emit('borrow', book.id!)"
            class="action-btn borrow"
            :disabled="borrowing"
          >
            <span class="btn-icon">📖</span>
            {{ borrowing ? 'Borrowing...' : 'Borrow' }}
          </button>
          <button 
            v-else-if="borrowedByUser"
            @click="$emit('return', book.id!)"
            class="action-btn return"
            :disabled="returning"
          >
            <span class="btn-icon">↩️</span>
            {{ returning ? 'Returning...' : 'Return' }}
          </button>
          <button v-else class="action-btn disabled" disabled>
            Not Available
          </button>
        </template>
        
        <template v-else>
          <button @click="$emit('edit', book)" class="action-btn edit">
            <span class="btn-icon">✏️</span>
            Edit
          </button>
          <button @click="$emit('delete', book.id!)" class="action-btn delete">
            <span class="btn-icon">🗑️</span>
            Delete
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '@/types/models';

defineProps<{
  book: Book;
  isAdmin?: boolean;
  borrowing?: boolean;
  returning?: boolean;
  borrowedByUser?: boolean;
}>();

defineEmits<{
  (e: 'borrow', bookId: number): void;
  (e: 'return', bookId: number): void;
  (e: 'edit', book: Book): void;
  (e: 'delete', bookId: number): void;
}>();
</script>

<style scoped>
.book-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.2);
}

.book-card.admin-view {
  border: 2px solid #f39c12;
}

.book-cover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.book-icon {
  font-size: 3rem;
  filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2));
}

.book-details {
  padding: 1.5rem;
}

.book-title {
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.book-author {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.book-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.book-genre {
  background: #f0f0f0;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #555;
}

.book-price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2ecc71;
}

.book-status {
  margin-bottom: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.available {
  background: #d4edda;
  color: #155724;
}

.status-badge.unavailable {
  background: #f8d7da;
  color: #721c24;
}

.book-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  transition: all 0.3s ease;
}

.action-btn.borrow {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.return {
  background: #3498db;
  color: white;
}

.action-btn.edit {
  background: #f39c12;
  color: white;
}

.action-btn.delete {
  background: #e74c3c;
  color: white;
}

.action-btn.disabled {
  background: #95a5a6;
  color: white;
  cursor: not-allowed;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1rem;
}
</style>
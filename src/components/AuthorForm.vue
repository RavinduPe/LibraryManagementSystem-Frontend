<template>
  <div class="author-form-container">
    <h3>{{ isEditing ? 'Edit Author' : 'Create New Author' }}</h3>
    
    <form @submit.prevent="handleSubmit" class="author-form">
      <div class="form-group">
        <label for="name">Author Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          placeholder="Enter author name"
          :class="{ 'error': errors.name }"
        />
        <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
      </div>
      
      <div class="form-group">
        <label for="bio">Biography</label>
        <textarea
          id="bio"
          v-model="form.bio"
          required
          rows="4"
          placeholder="Enter author biography"
          :class="{ 'error': errors.bio }"
        ></textarea>
        <span v-if="errors.bio" class="error-text">{{ errors.bio }}</span>
      </div>
      
      <div class="form-actions">
        <button type="button" @click="$emit('cancel')" class="cancel-btn">
          Cancel
        </button>
        <button 
          type="submit" 
          class="submit-btn"
          :disabled="loading"
        >
          {{ loading ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import type { Author } from '@/types/models';

const props = defineProps<{
  author?: Author | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', authorData: Omit<Author, 'id'>): void;
  (e: 'cancel'): void;
}>();

const isEditing = computed(() => !!props.author);

const form = reactive({
  name: '',
  bio: ''
});

const errors = reactive({
  name: '',
  bio: ''
});

// Watch for author prop changes
watch(() => props.author, (newAuthor) => {
  if (newAuthor) {
    form.name = newAuthor.name;
    form.bio = newAuthor.bio;
  } else {
    form.name = '';
    form.bio = '';
  }
}, { immediate: true });

const validateForm = (): boolean => {
  let isValid = true;
  
  if (!form.name.trim()) {
    errors.name = 'Author name is required';
    isValid = false;
  } else if (form.name.length < 2) {
    errors.name = 'Author name must be at least 2 characters';
    isValid = false;
  } else {
    errors.name = '';
  }
  
  if (!form.bio.trim()) {
    errors.bio = 'Biography is required';
    isValid = false;
  } else if (form.bio.length < 10) {
    errors.bio = 'Biography must be at least 10 characters';
    isValid = false;
  } else {
    errors.bio = '';
  }
  
  return isValid;
};

const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', {
      name: form.name.trim(),
      bio: form.bio.trim()
    });
  }
};
</script>

<style scoped>
.author-form-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  margin: 0 auto;
}

.author-form-container h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.author-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #555;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-group input.error,
.form-group textarea.error {
  border-color: #e74c3c;
}

.error-text {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.cancel-btn:hover {
  background: #7f8c8d;
}

.submit-btn {
  flex: 2;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
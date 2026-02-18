<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { addBook } from '../api/bookApi'
import { getAllAuthors } from '../api/authorsApi'
import type { Book } from '../types/Book'
import type { Author } from '../types/Author'

const message = ref('')
const authors = ref<Author[]>([])

const book = ref<Book>({
  id: undefined,
  title: '',
  genre: '',
  price: 0,
  available: false,
  authorId: 0,
  authorName: ''
})

const fetchAuthors = async () => {
  const response = await getAllAuthors()
  authors.value = response.data
}

const saveBook = async () => {
  try {
    await addBook(book.value)
    message.value = 'Book saved successfully ✅'
  } catch (error) {
    message.value = 'Failed to save book ❌'
  }
}

onMounted(fetchAuthors)
</script>


<template>
  <div>
    <h2>Add Book</h2>

    <form @submit.prevent="saveBook">
      <input v-model="book.title" placeholder="Title" required />
      <input v-model="book.genre" placeholder="Genre" required />
      <input type="number" v-model="book.price" placeholder="Price" required />
      
      <label>
        Available
        <input type="checkbox" v-model="book.available" />
      </label>

      <select v-model="book.authorId" required>
        <option disabled value="0">Select Author</option>
        <option v-for="author in authors" :key="author.id" :value="author.id">
          {{ author.name }}
        </option>
      </select>

      <button type="submit">Save</button>
    </form>

    <p>{{ message }}</p>
  </div>
</template>

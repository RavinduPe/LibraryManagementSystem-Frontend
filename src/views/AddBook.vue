<script setup lang="ts">
import { ref } from 'vue'
import { addBook } from '../api/bookApi'
import type { Book } from '../types/Book'

const message = ref('')

const book = ref<Book>({
  id: undefined,
  title: '',
  genre: '',
  price: 0,
  available: false,
  authorId: 1,
  authorName: ''
})

const saveBook = async () => {
  try {
    const response = await addBook(book.value)
    message.value = 'Book saved successfully ✅'
    console.log(response.data)

    // reset form
    book.value = {
      id: undefined,
      title: '',
      genre: '',
      price: 0,
      available: false,
      authorId: 1,
      authorName: ''
    }
  } catch (error) {
    message.value = 'Failed to save book ❌'
    console.error(error)
  }
}
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

      <input type="number" v-model="book.authorId" placeholder="Author ID" required />

      <button type="submit">Save</button>
    </form>

    <p>{{ message }}</p>
  </div>
</template>

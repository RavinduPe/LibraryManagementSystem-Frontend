<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllBooks , deleteBook  } from '../api/bookApi'
import type { Book } from '../types/Book'

const books = ref<Book[]>([])
const error = ref('')

const fetchBooks = async () => {
  try {
    const response = await getAllBooks()
    books.value = response.data
    console.log(response.data)
  } catch (err) {
    error.value = 'Failed to load books'
    console.error(err)
  }
}

const removeBook = async (id: number) => {
  try {
    await deleteBook(id)
    books.value = books.value.filter(book => book.id !== id)
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchBooks)
</script>

<template>
  <div>
    <h2>All Books</h2>

    <p v-if="error">{{ error }}</p>

    <table v-if="books.length" border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Genre</th>
            <th>Price</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="book in books" :key="book.id">
            <td>{{ book.authorId }}</td>
            <td>{{ book.title }}</td>
            <td>{{ book.genre }}</td>
            <td>{{ book.price }}</td>
            <td>{{ book.available }}</td>
            <td>
              <button @click="removeBook(book.id!)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>


    <p v-else>No books found</p>
  </div>
</template>

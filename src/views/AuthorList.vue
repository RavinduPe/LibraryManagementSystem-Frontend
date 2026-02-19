<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllAuthors, addAuthor, deleteAuthor } from '../api/authorsApi'
import type { Author } from '../types/Author'

const authors = ref<Author[]>([])
const newAuthorName = ref('')
const message = ref('')

const fetchAuthors = async () => {
  const response = await getAllAuthors()
  authors.value = response.data
}

const createAuthor = async () => {
  if (!newAuthorName.value) return

  await addAuthor({ name: newAuthorName.value })
  newAuthorName.value = ''
  message.value = 'Author added ✅'
  fetchAuthors()
}

const removeAuthor = async (id: number) => {
  try {
    await deleteAuthor(id)
    authors.value = authors.value.filter(a => a.id !== id)
  } catch (error: any) {
    alert(error.response?.data || "Cannot delete author")
  }
}


onMounted(fetchAuthors)
</script>

<template>
  <div>
    <h2>Authors</h2>

    <input v-model="newAuthorName" placeholder="Author Name" />
    <button @click="createAuthor">Add Author</button>

    <p>{{ message }}</p>

    <table border="1" v-if="authors.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="author in authors" :key="author.id">
          <td>{{ author.id }}</td>
          <td>{{ author.name }}</td>
          <td>
            <button @click="removeAuthor(author.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>No authors found</p>
  </div>
</template>

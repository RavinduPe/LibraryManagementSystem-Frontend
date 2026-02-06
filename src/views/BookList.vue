<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getAllBooks } from "../api/bookApi";
import type { Book } from "../types/Book";

const books = ref<Book[]>([]);

onMounted(async () => {
  const response = await getAllBooks();
  books.value = response.data;
});
</script>

<template>
  <h2>Books</h2>
  <ul>
    <li v-for="book in books" :key="book.id">
      {{ book.title }} - {{ book.authorName }}
    </li>
  </ul>
</template>

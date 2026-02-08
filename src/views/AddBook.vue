<script setup lang="ts">
import { ref } from "vue";
import { addBook } from "../api/bookApi";
import type { Book } from "../types/Book";

const book = ref<Book>({
  title: "",
  genre: "",
  price: 0,
  available: true,
  authorId: 0,
});

const errors = ref<Record<string, string>>({});

const submitForm = async () => {
  errors.value = {};
  try {
    await addBook(book.value);
    alert("Book added successfully");
  } catch (err: any) {
    if (err.response?.status === 400) {
      errors.value = err.response.data;
    }
  }
};
</script>

<template>
  <h2>Add Book</h2>

  <form @submit.prevent="submitForm">
    <div>
      <input v-model="book.title" placeholder="Title" />
      <span v-if="errors.title">{{ errors.title }}</span>
    </div>

    <div>
      <input v-model="book.genre" placeholder="Genre" />
      <span v-if="errors.genre">{{ errors.genre }}</span>
    </div>

    <div>
      <input type="number" v-model="book.price" placeholder="Price" />
      <span v-if="errors.price">{{ errors.price }}</span>
    </div>

    <div>
      <input type="number" v-model="book.authorId" placeholder="Author ID" />
      <span v-if="errors.authorId">{{ errors.authorId }}</span>
    </div>

    <button type="submit">Save</button>
  </form>
</template>

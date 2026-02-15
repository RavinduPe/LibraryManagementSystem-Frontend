<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";

const title = ref("");
const author = ref("");
const price = ref(0);

const addBook = async () => {
  try {
    const response = await axios.post("http://localhost:8080/books", {
      title: title.value,
      author: author.value,
      price: price.value,
    });

    alert("Book Added Successfully!");
    console.log(response.data);

    title.value = "";
    author.value = "";
    price.value = 0;
  } catch (error) {
    console.error("Error adding book:", error);
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

    <button @click="addBook">Add Book</button>
  </form>
</template>

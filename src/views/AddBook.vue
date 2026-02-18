<template>
  <div>
    <h2>Add Book</h2>

    <form @submit.prevent="addBook">
      <div>
        <label>Title:</label>
        <input v-model="book.title" required />
      </div>

      <div>
        <label>Genre:</label>
        <input v-model="book.genre" required />
      </div>

      <div>
        <label>Price:</label>
        <input type="number" v-model="book.price" required />
      </div>

      <div>
        <label>Available:</label>
        <input type="checkbox" v-model="book.available" />
      </div>

      <div>
        <label>Author ID:</label>
        <input type="number" v-model="book.authorId" required />
      </div>

      <button type="submit">Save</button>
    </form>

    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "AddBook",
  data() {
    return {
      book: {
        title: "",
        genre: "",
        price: 0,
        available: false,
        authorId: null
      },
      message: ""
    };
  },
  methods: {
    async addBook() {
      try {
        const response = await axios.post(
          "http://localhost:8080/api/books",
          this.book
        );

        console.log(response.data);
        this.message = "Book saved successfully ✅";

        // Clear form
        this.book = {
          title: "",
          genre: "",
          price: 0,
          available: false,
          authorId: null
        };

      } catch (error) {
        console.error("Error adding book:", error);
        this.message = "Failed to save book ❌";
      }
    }
  }
};
</script>

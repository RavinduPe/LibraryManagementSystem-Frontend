import { createRouter, createWebHistory } from "vue-router";
import AddBook from "../views/AddBook.vue";
import BookList from "../views/BookList.vue";

const routes = [
  {
    path: "/add-book",
    name: "AddBook",
    component: AddBook,
  },
  {
    path: "/books",
    name: "Books",
    component: BookList
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

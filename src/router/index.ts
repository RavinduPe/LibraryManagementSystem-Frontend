import { createRouter, createWebHistory } from "vue-router";
import AddBook from "../views/AddBook.vue";
import BookList from "../views/BookList.vue";
import AuthorList from "../views/AuthorList.vue";

const routes = [
  {
  path: '/',
  redirect: '/books'
  },
  {
    path: "/add-book",
    name: "AddBook",
    component: AddBook,
  },
  {
    path: "/books",
    name: "Books",
    component: BookList,
  },
  {
    path: "/authors",
    name: "Authors",
    component: AuthorList,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

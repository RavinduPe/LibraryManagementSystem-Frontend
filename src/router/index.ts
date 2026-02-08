import { createRouter, createWebHistory } from "vue-router";
import AddBook from "../views/AddBook.vue";

const routes = [
  {
    path: "/add-book",
    name: "AddBook",
    component: AddBook,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

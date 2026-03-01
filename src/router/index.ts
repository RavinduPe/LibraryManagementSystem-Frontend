import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "@/stores/auth";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    role?: string[];
  }
}

// Views
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import UserDashboard from "@/views/UserDashboard.vue";
import BorrowView from "@/views/BorrowView.vue";
import ReturnView from "@/views/ReturnView.vue";

// Admin Views
import AdminDashboard from "@/views/AdminDashboard.vue";
import AdminUsers from "@/views/admin/AdminUsers.vue";
import AdminBooks from "@/views/admin/AdminBooks.vue";
import AdminAuthors from "@/views/admin/AdminAuthors.vue";
import AdminBorrows from "@/views/admin/AdminBorrows.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterView,
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: UserDashboard,
    meta: { requiresAuth: true, role: ["USER", "ADMIN"] },
  },
  {
    path: "/borrow",
    name: "Borrow",
    component: BorrowView,
    meta: { requiresAuth: true, role: ["USER", "ADMIN"] },
  },
  {
    path: "/return",
    name: "Return",
    component: ReturnView,
    meta: { requiresAuth: true, role: ["USER", "ADMIN"] },
  },
  // Admin Routes
  {
    path: "/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAuth: true, role: ["ADMIN"] },
  },
  {
    path: "/admin/users",
    name: "AdminUsers",
    component: AdminUsers,
    meta: { requiresAuth: true, role: ["ADMIN"] },
  },
  {
    path: "/admin/books",
    name: "AdminBooks",
    component: AdminBooks,
    meta: { requiresAuth: true, role: ["ADMIN"] },
  },
  {
    path: "/admin/authors",
    name: "AdminAuthors",
    component: AdminAuthors,
    meta: { requiresAuth: true, role: ["ADMIN"] },
  },
  {
    path: "/admin/borrows",
    name: "AdminBorrows",
    component: AdminBorrows,
    meta: { requiresAuth: true, role: ["ADMIN"] },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.state.isAuthenticated;
  const userRole = authStore.state.user?.role;

  // Public routes
  if (to.meta.requiresAuth === false) {
    if (isAuthenticated && (to.path === "/login" || to.path === "/register")) {
      next(userRole === "ADMIN" ? "/admin" : "/dashboard");
    } else {
      next();
    }
    return;
  }

  // Protected routes
  if (!isAuthenticated) {
    next("/login");
    return;
  }

  // Role-based access
  if (to.meta.role && userRole && !to.meta.role.includes(userRole)) {
    next(userRole === "ADMIN" ? "/admin" : "/dashboard");
    return;
  }

  next();
});

export default router;

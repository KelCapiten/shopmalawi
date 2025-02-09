//\src\router\index.ts
import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import SellDashboard from "@/views/SellDashboard.vue";
import HomePage from "@/views/HomePage.vue";
import LoginPage from "@/views/LoginPage.vue";
import CreateAccount from "@/views/CreateAccount.vue";
import ProfilePage from "@/views/ProfilePage.vue";
import ShopPage from "@/views/ShopPage.vue";
import SearchResultsPage from "@/views/searchResultsPage.vue";
import ProductPage from "@/views/productPage.vue";
import PayPage from "@/views/PayPage.vue";
import LookingForPage from "@/views/LookingForPage.vue";
import StorePage from "@/components/StorePage.vue"; // New store page
import { useAuthStore } from "@/stores/authStore";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
  },
  {
    path: "/home",
    name: "Home",
    component: HomePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/sell",
    component: SellDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: "/createAccount",
    component: CreateAccount,
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/shop",
    name: "shop",
    component: ShopPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/searchResults",
    name: "SearchResults",
    component: SearchResultsPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/product/:id",
    name: "ProductPage",
    component: ProductPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/pay",
    name: "PayPage",
    component: PayPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/looking-for",
    name: "LookingFor",
    component: LookingForPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/store",
    name: "Store",
    component: StorePage,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const decodeToken = (token: string): { exp: number } | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      throw new Error("Invalid token format");
    }
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return payload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const isTokenValid = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return false;
  }
  return payload.exp * 1000 > Date.now();
};

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.path === "/login") {
    next();
    return;
  }

  if (to.meta.requiresAuth) {
    const token = authStore.token;

    if (!token) {
      authStore.clearAuth();
      next({ name: "Login" });
      return;
    }

    if (isTokenValid(token)) {
      next();
    } else {
      authStore.clearAuth();
      next({ name: "Login" });
    }
  } else {
    next();
  }
});

export default router;

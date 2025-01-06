import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import SellDashboard from "@/views/SellDashboard.vue";
import HomePage from "@/views/HomePage.vue";
import LoginPage from "@/views/LoginPage.vue";
import CreateAccount from "@/views/CreateAccount.vue";
import ProfilePage from "@/views/ProfilePage.vue";
import ShopPage from "@/views/ShopPage.vue";
import SearchResultsPage from "@/views/searchResultsPage.vue";
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
    path: "/shop", // New Shop route
    name: "Shop",
    component: ShopPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/searchResults",
    name: "SearchResults",
    component: SearchResultsPage,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Utility to manually decode a JWT token
const decodeToken = (token: string): { exp: number } | null => {
  try {
    // Split the token into its three parts
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      throw new Error("Invalid token format");
    }

    // Decode the base64 payload
    const payloadJson = atob(payloadBase64);

    // Parse the payload as JSON
    const payload = JSON.parse(payloadJson);

    return payload;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Utility to check token validity
const isTokenValid = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) {
    return false;
  }

  // Check if the token is expired
  return payload.exp * 1000 > Date.now();
};

// Navigation guard to check authentication and token expiry
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
      next(); // Token is valid, proceed to the route
    } else {
      authStore.clearAuth(); // Clear auth state
      next({ name: "Login" }); // Redirect to login
    }
  } else {
    next(); // Route does not require authentication, proceed
  }
});

export default router;

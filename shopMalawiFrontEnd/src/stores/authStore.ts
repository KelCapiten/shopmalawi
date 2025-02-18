//src/stores/authStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("token") || null);
  const user = ref<User | null>(
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const router = useRouter();

  // Set token and user data
  const setAuth = (newToken: string, newUser: User): void => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // Clear token and user data (logout)
  const clearAuth = (): void => {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Check if the user is authenticated
  const isAuthenticated = (): boolean => {
    return !!token.value;
  };

  return {
    token,
    user,
    setAuth,
    clearAuth,
    isAuthenticated,
  };
});

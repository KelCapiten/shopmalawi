// src/services/apiClient.ts
import axios, { AxiosInstance } from "axios";
import { useAuthStore } from "@/stores/authStore";

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:1994",
});

// Function to initialize interceptors with the provided authStore
export function initializeApiClient(
  authStore: ReturnType<typeof useAuthStore>
) {
  // Request interceptor to add the Authorization header
  apiClient.interceptors.request.use(
    (config) => {
      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // (Optional) Response interceptor for global error handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      // You can handle global errors here
      return Promise.reject(error);
    }
  );
}

export default apiClient;

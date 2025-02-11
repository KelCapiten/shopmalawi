// src/stores/userstoreStore.ts
import { defineStore } from "pinia";
import { getStore, addStore, updateStore } from "@/services/userstoreService";
import type { Store, Product } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useProducts } from "@/composables/useProducts";

export const useUserstoreStore = defineStore("userstoreStore", {
  state: () => ({
    store: null as Store | null,
    products: [] as Product[],
    productsLoading: false,
    productsError: null as Error | null,
  }),
  actions: {
    async fetchStore(query: { id?: number; owner_id?: number } = {}) {
      const authStore = useAuthStore();

      // If no filter is provided, use the logged-in user's ID as owner_id
      if (!query.id && !query.owner_id && authStore.user) {
        query.owner_id = authStore.user.id;
      }

      try {
        const result = await getStore(query);

        // If the endpoint returns multiple stores, pick the first
        if (Array.isArray(result)) {
          if (result.length) {
            this.store = result[0];
          } else {
            // No store found for this user: use default placeholders
            this.store = this.getDefaultStore(authStore.user?.id);
          }
        } else {
          // Single store result
          this.store = result;
        }
      } catch (error) {
        console.error("Error fetching store:", error);
        // If there's an error, or no store found, set defaults
        this.store = this.getDefaultStore(authStore.user?.id);
      }
    },

    async fetchUserProducts() {
      // Ensure we have a store and an owner id
      if (!this.store) {
        console.warn("No store available; cannot fetch products.");
        return;
      }
      // Use the composable to fetch products
      const { fetchProducts, products, loading, error } = useProducts();
      // Here we group by "owner" and pass the store's owner_id as the uploaded_by parameter.
      await fetchProducts(
        "subcategory",
        undefined,
        undefined,
        undefined,
        this.store.owner_id
      );
      // Update our store state
      this.products = products.value;
      this.productsLoading = loading.value;
      this.productsError = error.value;
    },

    async createStore(newStore: Store) {
      try {
        const result = await addStore(newStore);
        this.store = result;
        return result;
      } catch (error) {
        console.error("Error creating store:", error);
        throw error;
      }
    },

    async updateStoreRecord(updatedStore: Partial<Store>) {
      if (!this.store?.id) {
        throw new Error("No store available to update.");
      }
      try {
        await updateStore(this.store.id, updatedStore);
        this.store = { ...this.store, ...updatedStore };
      } catch (error) {
        console.error("Error updating store:", error);
        throw error;
      }
    },

    // Helper: return a default Store object if the user has no registered store
    getDefaultStore(ownerId: number | undefined): Store {
      return {
        id: 0,
        owner_id: ownerId ?? 0,
        brand_name: "ShopMalawi",
        tagline: "Segulani Shop Fada",
        description: "",
        banner_url: "/assets/shopmalawi.jpg",
        profile_picture_url: "/assets/theLogo.jpg",
        is_active: true,
        created_at: "",
        updated_at: "",
      };
    },

    // Optional helper actions to update individual fields locally
    setBannerUrl(url: string) {
      if (this.store) {
        this.store.banner_url = url;
      }
    },
    setBrandName(name: string) {
      if (this.store) {
        this.store.brand_name = name;
      }
    },
    setTagline(tagline: string) {
      if (this.store) {
        this.store.tagline = tagline;
      }
    },
  },
  persist: true,
});

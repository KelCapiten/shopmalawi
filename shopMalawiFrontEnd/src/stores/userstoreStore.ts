// src/stores/userstoreStore.ts
import { defineStore } from "pinia";
import { getStore, addStore, updateStore } from "@/services/userstoreService";
import type { Store, Product } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useProducts } from "@/composables/useProducts";

export const useUserstoreStore = defineStore("userstoreStore", {
  state: () => ({
    store: null as Store | null,
    // Note: The products returned from the API are grouped objects
    // e.g., { id, name, products: Product[] }
    products: [] as any[],
    productsLoading: false,
    productsError: null as string | null,
    // New state property for filtering products: "all", "active", or "inactive"
    productFilter: "all",
  }),
  getters: {
    filteredProducts(state): any[] {
      if (state.productFilter === "active") {
        return state.products
          .map((group: any) => ({
            ...group,
            products: group.products.filter((p: Product) => p.is_active),
          }))
          .filter((group: any) => group.products.length > 0);
      }
      if (state.productFilter === "inactive") {
        return state.products
          .map((group: any) => ({
            ...group,
            products: group.products.filter((p: Product) => !p.is_active),
          }))
          .filter((group: any) => group.products.length > 0);
      }
      return state.products;
    },
  },
  actions: {
    async fetchStore(query: { id?: number; owner_id?: number } = {}) {
      const authStore = useAuthStore();
      if (!query.id && !query.owner_id && authStore.user) {
        query.owner_id = authStore.user.id;
      }
      try {
        const result = await getStore(query);
        if (Array.isArray(result)) {
          if (result.length) {
            this.store = result[0];
          } else {
            this.store = this.getDefaultStore(authStore.user?.id);
          }
        } else {
          this.store = result;
        }
      } catch (error) {
        console.error("Error fetching store:", error);
        this.store = this.getDefaultStore(authStore.user?.id);
      }
    },

    async fetchUserProducts() {
      if (!this.store) {
        console.warn("No store available; cannot fetch products.");
        return;
      }
      const { fetchProducts, products, loading, error } = useProducts();
      await fetchProducts({
        groupBy: "subcategory",
        uploaded_by: this.store.owner_id,
        includeInactive: true,
      });
      // Ensure products is always an array
      this.products = products.value || [];
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

    // Action to update the product filter
    setProductFilter(filter: string) {
      this.productFilter = filter;
    },

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

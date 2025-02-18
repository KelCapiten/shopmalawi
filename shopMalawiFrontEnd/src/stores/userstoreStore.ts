//src/stores/userstoreStore.ts
import { defineStore } from "pinia";
import { getStore, addStore, updateStore } from "@/services/userstoreService";
import { getUserInfoService } from "@/services/userService";
import type { Store, Product } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useProducts } from "@/composables/useProducts";
import { useProductsStore } from "@/stores/productsStore";
import { updateImageUrl } from "@/utils/utilities";

export const useUserstoreStore = defineStore("userstoreStore", {
  state: () => ({
    stores: [] as Store[],
    selectedStore: null as Store | null,
    newStoreForm: {
      brand_name: "",
      tagline: "",
      description: "",
      category_id: undefined as number | undefined,
    },
    products: [] as any[],
    productsLoading: false,
    productsError: null as string | null,
    productFilter: "all",
    uploadedBannerImages: [] as File[],
    uploadedProfileImages: [] as File[],
    originalId: undefined as number | undefined,
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
    registrationLabel(state): string {
      if (!state.selectedStore) return "";
      return state.selectedStore.id === 0
        ? "Register Your Store"
        : "Edit Store";
    },
    enableEdit(state): boolean {
      const authStore = useAuthStore();
      return (
        state.selectedStore?.owner_id === authStore.user?.id &&
        state.selectedStore?.id !== 0
      );
    },
  },
  actions: {
    async fetchStore(query: { id?: number; owner_id?: number } = {}) {
      const authStore = useAuthStore();
      if (!query.id && !query.owner_id && authStore.user) {
        this.originalId = query.owner_id;
        query.owner_id = authStore.user.id;
      }
      this.selectedStore = this.getDefaultStore(query.owner_id);
      try {
        const result = await getStore(query);
        this.stores = Array.isArray(result) ? result : [];
        this.selectedStore = this.stores.length
          ? this.stores[0]
          : this.getDefaultStore(query.owner_id);
        if (this.selectedStore && this.selectedStore.id !== 0) {
          this.selectedStore.banner_url = updateImageUrl(
            this.selectedStore.banner_url || ""
          );
          this.selectedStore.profile_picture_url = updateImageUrl(
            this.selectedStore.profile_picture_url || ""
          );
        }
      } catch (error) {
        console.error("Error fetching store:", error);
        this.selectedStore = this.getDefaultStore(query.owner_id);
        this.stores = [this.selectedStore];
      }
      if (
        query.owner_id &&
        this.originalId &&
        this.selectedStore &&
        this.selectedStore.id === 0
      ) {
        try {
          const userInfo = await getUserInfoService({ id: query.owner_id });
          this.selectedStore.brand_name = userInfo.firstName;
          this.selectedStore.tagline = userInfo.lastName;
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }
    },
    async fetchUserProducts({ ownerId }: { ownerId?: number } = {}) {
      const authStore = useAuthStore();
      if (!this.selectedStore) {
        console.warn("No store available; cannot fetch products.");
        return;
      }
      const { fetchProducts, products, loading, error } = useProducts();
      await fetchProducts({
        groupBy: "subcategory",
        uploaded_by: ownerId ?? authStore.user?.id,
        includeInactive: true,
      });
      this.products = products.value || [];
      this.productsLoading = loading.value;
      this.productsError = error.value;
    },
    async createStore(newStore: Store) {
      try {
        const result = await addStore(newStore);
        this.stores.push(result);
        this.selectedStore = result;
        if (this.selectedStore && this.selectedStore.id !== 0) {
          this.selectedStore.banner_url = updateImageUrl(
            this.selectedStore.banner_url || ""
          );
          this.selectedStore.profile_picture_url = updateImageUrl(
            this.selectedStore.profile_picture_url || ""
          );
        }
        return result;
      } catch (error) {
        console.error("Error creating store:", error);
        throw error;
      }
    },
    async registerStore() {
      const authStore = useAuthStore();
      const fullStore: Store = {
        ...this.getDefaultStore(authStore.user?.id),
        brand_name: this.newStoreForm.brand_name,
        tagline: this.newStoreForm.tagline,
        description: this.newStoreForm.description,
        category_id: this.newStoreForm.category_id ?? undefined,
      };
      try {
        const result = await addStore(fullStore);
        this.stores.push(result);
        this.selectedStore = result;
        this.newStoreForm.brand_name = "";
        this.newStoreForm.tagline = "";
        this.newStoreForm.description = "";
        this.newStoreForm.category_id = undefined;
        return result;
      } catch (error) {
        console.error("Error registering store:", error);
        throw error;
      }
    },
    async updateStoreRecord(updatedStore: Partial<Store>) {
      if (!this.selectedStore?.id) {
        throw new Error("No store available to update.");
      }
      const stripBaseUrl = (url: string): string => {
        const base =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:1994";
        return url.startsWith(base) ? url.replace(base, "") : url;
      };

      const prevBanner = this.selectedStore.banner_url
        ? stripBaseUrl(this.selectedStore.banner_url)
        : "";
      const prevProfile = this.selectedStore.profile_picture_url
        ? stripBaseUrl(this.selectedStore.profile_picture_url)
        : "";

      const mergedData = { ...this.selectedStore, ...updatedStore };
      mergedData.banner_url = mergedData.banner_url
        ? stripBaseUrl(mergedData.banner_url)
        : prevBanner;
      mergedData.profile_picture_url = mergedData.profile_picture_url
        ? stripBaseUrl(mergedData.profile_picture_url)
        : prevProfile;

      const formData = new FormData();
      Object.keys(mergedData).forEach((key) => {
        const value = (mergedData as any)[key];
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      if (this.uploadedBannerImages.length > 0) {
        formData.append("banner", this.uploadedBannerImages[0]);
      }
      if (this.uploadedProfileImages.length > 0) {
        formData.append("profile", this.uploadedProfileImages[0]);
      }
      try {
        const response = await updateStore(this.selectedStore.id, formData);
        const updated = response.store;
        if (updated.banner_url && !updated.banner_url.includes("/assets/")) {
          updated.banner_url = updateImageUrl(updated.banner_url ?? "");
        }
        if (
          updated.profile_picture_url &&
          !updated.profile_picture_url.includes("/assets/")
        ) {
          updated.profile_picture_url = updateImageUrl(
            updated.profile_picture_url ?? ""
          );
        }
        this.selectedStore = updated;
        const index = this.stores.findIndex(
          (store) => store.id === this.selectedStore!.id
        );
        if (index !== -1) {
          this.stores.splice(index, 1, this.selectedStore);
        }
        this.uploadedBannerImages = [];
        this.uploadedProfileImages = [];
      } catch (error) {
        console.error("Error updating store:", error);
        throw error;
      }
    },
    setProductFilter(filter: string) {
      this.productFilter = filter;
    },
    selectStore(storeId: number) {
      const store = this.stores.find((s) => s.id === storeId);
      if (store) {
        this.selectedStore = store;
      }
    },
    getDefaultStore(ownerId: number | undefined): Store {
      return {
        id: 0,
        owner_id: ownerId ?? 0,
        brand_name: "ShopMalawi",
        tagline: "Segulani Shop Fada",
        description: "",
        banner_url: "/assets/blendBoard.jpg",
        profile_picture_url: "/assets/theLogo.jpg",
        is_active: true,
        created_at: "",
        updated_at: "",
        category_id: undefined,
      };
    },
    setBannerUrl(url: string) {
      if (this.selectedStore) {
        this.selectedStore.banner_url = url;
      }
    },
    setBrandName(name: string) {
      if (this.selectedStore) {
        this.selectedStore.brand_name = name;
      }
    },
    setTagline(tagline: string) {
      if (this.selectedStore) {
        this.selectedStore.tagline = tagline;
      }
    },
    prefillProductForEdit(productId: number) {
      let selectedProduct: any = null;
      for (const group of this.products) {
        selectedProduct = group.products.find((p: any) => p.id === productId);
        if (selectedProduct) break;
      }
      const productsStore = useProductsStore();
      if (selectedProduct) {
        productsStore.product = {
          id: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
          price: parseFloat(selectedProduct.price),
          categoryId: selectedProduct.subcategory_id,
          stockQuantity: selectedProduct.stock_quantity,
          images: selectedProduct.images || [],
        };
      } else {
        productsStore.clearProduct();
      }
    },
  },
});

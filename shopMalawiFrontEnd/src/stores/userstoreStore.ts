// src/stores/userstoreStore.ts
import { defineStore } from "pinia";
import {
  getStore,
  addStore,
  updateStore,
  deleteStore,
  addProductToStore,
  removeProductFromStore,
  updateIsSellerPickStatus,
} from "@/services/userstoreService";
import { getUserInfoService } from "@/services/userService";
import type { Store, Product } from "@/types/types";
import { useAuthStore } from "@/stores/authStore";
import { useProducts } from "@/composables/useProducts";
import { useProductsStore } from "@/stores/sellStore";
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
    productsCache: {} as { [key: string]: { data: any; fetchedAt: number } },
    ownerIdFromQuery: undefined as number | undefined,
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
    showAddToStoreIcon(state): boolean {
      const authStore = useAuthStore();
      if (!state.stores || state.stores.length === 0) return false;
      return (
        !!state.selectedStore &&
        state.selectedStore.id === 0 &&
        !!authStore.user &&
        authStore.user.id === state.selectedStore.owner_id
      );
    },
    showRemoveFromStoreIcon(state): boolean {
      const authStore = useAuthStore();
      if (!state.stores || state.stores.length === 0) return false;
      return (
        !!state.selectedStore &&
        state.selectedStore.id !== 0 &&
        !!authStore.user &&
        authStore.user.id === state.selectedStore.owner_id
      );
    },
  },
  actions: {
    setOwnerIdFromQuery(ownerId: number | undefined) {
      this.ownerIdFromQuery = ownerId;
    },
    async fetchStore() {
      const authStore = useAuthStore();
      const ownerId = this.ownerIdFromQuery || authStore.user?.id;
      this.originalId = ownerId;
      try {
        const result = await getStore({ owner_id: ownerId });
        this.stores = Array.isArray(result) ? result : [];
        this.selectedStore = this.stores.length
          ? this.stores[0]
          : this.getDefaultStore(ownerId);
        if (this.selectedStore && this.selectedStore.id !== 0) {
          // Only update URLs if they're not the default assets
          if (this.selectedStore.banner_url !== "/assets/blendBoard.jpg") {
            this.selectedStore.banner_url = updateImageUrl(
              this.selectedStore.banner_url || ""
            );
          }
          if (
            this.selectedStore.profile_picture_url !== "/assets/theLogo.jpg"
          ) {
            this.selectedStore.profile_picture_url = updateImageUrl(
              this.selectedStore.profile_picture_url || ""
            );
          }
        }
      } catch (error) {
        console.error("Error fetching store:", error);
        this.selectedStore = this.getDefaultStore(ownerId);
        this.stores = [this.selectedStore];
      }
      if (ownerId && this.selectedStore && this.selectedStore.id === 0) {
        try {
          const userInfo = await getUserInfoService({ id: ownerId });
          this.selectedStore.brand_name = userInfo.firstName;
          this.selectedStore.tagline = userInfo.lastName;
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }
    },
    async fetchSelectedStoreProducts(storeId?: number) {
      const authStore = useAuthStore();
      if (!this.selectedStore && storeId === undefined) {
        console.warn("No store available; cannot fetch products.");
        return;
      }
      const effectiveStoreId = storeId ?? this.selectedStore!.id;
      const effectiveOwnerId = this.ownerIdFromQuery ?? authStore.user?.id;
      const cacheKey = `${effectiveStoreId}_${effectiveOwnerId}`;
      const now = Date.now();
      const time = 600000;

      if (
        this.productsCache[cacheKey] &&
        now - this.productsCache[cacheKey].fetchedAt < time
      ) {
        this.products = this.productsCache[cacheKey].data;
        return;
      }
      const { fetchProducts, products, loading, error } = useProducts();
      const params: any = {
        groupBy: "subcategory",
        uploaded_by: effectiveOwnerId,
        includeInactive: true,
      };
      if (effectiveStoreId !== 0) {
        params.store_id = effectiveStoreId;
      }
      await fetchProducts(params);
      this.products = products.value || [];
      this.productsLoading = loading.value;
      this.productsError = error.value;
      this.productsCache[cacheKey] = {
        data: this.products,
        fetchedAt: now,
      };
    },
    async getAllStoreProducts() {
      for (const store of this.stores) {
        await this.fetchSelectedStoreProducts(store.id);
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
    async selectStore(storeId: number) {
      const authStore = useAuthStore();
      if (storeId === 0) {
        const ownerId = this.ownerIdFromQuery ?? authStore.user?.id;
        this.selectedStore = this.getDefaultStore(ownerId);
        try {
          const userInfo = await getUserInfoService({ id: ownerId });
          this.selectedStore.brand_name = userInfo.firstName;
          this.selectedStore.tagline = userInfo.lastName;
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      } else {
        const store = this.stores.find((s) => s.id === storeId);
        if (store) {
          this.selectedStore = store;
        }
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
    async removeStore() {
      if (!this.selectedStore) return;
      try {
        await deleteStore(this.selectedStore.id);
        this.stores = this.stores.filter(
          (store) => store.id !== this.selectedStore!.id
        );
        if (this.stores.length > 0) {
          this.selectedStore = this.stores[0];
        } else {
          this.fetchStore;
        }
      } catch (error) {
        console.error("Error deleting store:", error);
        throw error;
      }
    },
    updateProductInCache(productId: number, updatedFields: Partial<Product>) {
      const authStore = useAuthStore();
      const effectiveOwnerId = this.ownerIdFromQuery ?? authStore.user?.id;
      const cacheKey = `${this.selectedStore?.id}_${effectiveOwnerId}`;
      if (this.productsCache[cacheKey]) {
        this.productsCache[cacheKey].data.forEach((group: any) => {
          group.products = group.products.map((product: any) =>
            product.id === productId
              ? { ...product, ...updatedFields }
              : product
          );
        });
      }
      this.products = this.products.map((group: any) => ({
        ...group,
        products: group.products.map((product: any) =>
          product.id === productId ? { ...product, ...updatedFields } : product
        ),
      }));
    },
    async addThisProductToStore(storeId: number, productId: number) {
      try {
        const response = await addProductToStore(storeId, productId);
        const resp = response as any;
        console.log("resp", resp);
        if (resp.updatedProducts) {
          const authStore = useAuthStore();
          const effectiveOwnerId = this.ownerIdFromQuery ?? authStore.user?.id;
          const cacheKey = `${storeId}_${effectiveOwnerId}`;
          this.productsCache[cacheKey] = {
            data: resp.updatedProducts,
            fetchedAt: Date.now(),
          };
          this.products = resp.updatedProducts;
          console.log("products", this.products);
        }
        return response;
      } catch (error) {
        console.error("Error adding product to store:", error);
        throw error;
      }
    },
    async removeThisProductFromStore(productId: number) {
      if (!this.selectedStore) {
        throw new Error("No store selected.");
      }
      try {
        const storeId = this.selectedStore.id;
        const response = await removeProductFromStore(storeId, productId);
        const resp = response as any;
        if (resp.updatedProducts) {
          const authStore = useAuthStore();
          const effectiveOwnerId = this.ownerIdFromQuery ?? authStore.user?.id;
          const cacheKey = `${storeId}_${effectiveOwnerId}`;
          this.productsCache[cacheKey] = {
            data: resp.updatedProducts,
            fetchedAt: Date.now(),
          };
          this.products = resp.updatedProducts;
        }
      } catch (error) {
        console.error("Error removing product from store:", error);
        throw error;
      }
    },
    isProductInStoreProductsCache(productId: number): boolean {
      if (this.selectedStore?.id === 0) return false;
      for (const cacheKey in this.productsCache) {
        // Skip cache keys that include "0"
        if (cacheKey.includes("0")) continue;
        const cachedData = this.productsCache[cacheKey].data;
        for (const group of cachedData) {
          if (group.products && Array.isArray(group.products)) {
            if (
              group.products.some((product: any) => product.id === productId)
            ) {
              return true;
            }
          }
        }
      }
      return false;
    },
    async toggleSellerPick(productId: number) {
      if (!this.selectedStore) return;
      let product: any;
      for (const group of this.products) {
        group.products?.forEach((p: any) => {
          if (p.id === productId) product = p;
        });
        if (product) break;
      }
      if (!product) return;
      const newStatus = !product.isSellerPick;
      await updateIsSellerPickStatus(
        this.selectedStore.id,
        productId,
        newStatus
      );
      this.updateProductInCache(productId, { isSellerPick: newStatus });
    },
    getStoresForProduct(productId: number): {
      inStore: boolean;
      storeIds: number[];
    } {
      const foundStoreIds: number[] = [];
      for (const cacheKey in this.productsCache) {
        if (cacheKey.includes("0")) continue;
        const cachedData = this.productsCache[cacheKey].data;
        if (
          cachedData.some(
            (group: any) =>
              group.products &&
              group.products.some((prod: any) => prod.id === productId)
          )
        ) {
          // Extract store id from the cache key formatted as "storeId_ownerId"
          const storeId = Number(cacheKey.split("_")[0]);
          if (!foundStoreIds.includes(storeId)) {
            foundStoreIds.push(storeId);
          }
        }
      }
      return { inStore: foundStoreIds.length > 0, storeIds: foundStoreIds };
    },
    addProductToCache(newProduct: any) {
      // If the product has a category, try to find its group
      if (newProduct.category_id) {
        const existingGroup = this.products.find(
          (group: any) => group.id === newProduct.category_id
        );

        if (existingGroup) {
          // Add to existing category group
          existingGroup.products.unshift(newProduct);
        } else {
          // Create new category group
          this.products.unshift({
            id: newProduct.category_id,
            name: newProduct.category_name,
            products: [newProduct],
          });
        }
      } else {
        // If no grouping, just add to root level (assuming products is an array)
        if (!Array.isArray(this.products)) {
          this.products = [newProduct];
        } else {
          this.products.unshift(newProduct);
        }
      }

      // Update the products cache
      const authStore = useAuthStore();
      const effectiveOwnerId = this.ownerIdFromQuery ?? authStore.user?.id;
      const cacheKey = `${this.selectedStore?.id}_${effectiveOwnerId}`;
      if (this.productsCache[cacheKey]) {
        this.productsCache[cacheKey] = {
          data: this.products,
          fetchedAt: Date.now(),
        };
      }
    },
  },
});

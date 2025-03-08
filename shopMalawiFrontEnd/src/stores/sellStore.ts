// src/stores/productsStore.ts
import { defineStore } from "pinia";
import { useProducts } from "@/composables/useProducts";
import { useUserstoreStore } from "@/stores/userstoreStore";

interface NewProduct {
  id?: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  locationId: number; // Add locationId
  stockQuantity: number;
  images: File[];
}

export const useProductsStore = defineStore("productsStore", {
  state: () => ({
    product: {
      id: undefined,
      name: "",
      description: "",
      price: 0,
      categoryId: 0,
      locationId: 0,
      stockQuantity: 1,
      images: [] as File[],
    } as NewProduct,
    isSaving: false,
    error: null as string | null,
    successMessage: "",
  }),
  actions: {
    setName(name: string) {
      this.product.name = name;
    },
    setDescription(description: string) {
      this.product.description = description;
    },
    setPrice(price: number) {
      this.product.price = price;
    },
    setCategoryId(categoryId: number) {
      this.product.categoryId = categoryId;
    },
    setStockQuantity(quantity: number) {
      this.product.stockQuantity = quantity;
    },
    setImages(images: File[]) {
      this.product.images = images;
    },
    setLocationId(locationId: number) {
      this.product.locationId = locationId;
    },
    clearProduct() {
      this.product = {
        id: undefined,
        name: "",
        description: "",
        price: 0,
        categoryId: 0,
        locationId: 0,
        stockQuantity: 0,
        images: [],
      };
      this.error = null;
      this.successMessage = "";
    },
    async submitProduct() {
      // Basic validation
      if (
        !this.product.name ||
        !this.product.description ||
        this.product.price <= 0 ||
        !this.product.categoryId ||
        !this.product.locationId || // Add locationId check
        this.product.stockQuantity <= 0 ||
        this.product.images.length === 0
      ) {
        this.error =
          "Please fill all fields with valid data and upload images.";
        return;
      }

      this.isSaving = true;
      this.error = null;
      try {
        const { addNewProduct, editProduct } = useProducts();
        if (this.product.id) {
          // Edit mode: update the existing product using editProduct
          await editProduct({
            id: this.product.id,
            name: this.product.name,
            description: this.product.description,
            price: this.product.price,
            category_id: this.product.categoryId,
            location_id: this.product.locationId,
            stockQuantity: this.product.stockQuantity,
            images: this.product.images,
          });
          this.successMessage = "Item updated successfully!";
        } else {
          // Add new mode
          const response = await addNewProduct({
            name: this.product.name,
            description: this.product.description,
            price: this.product.price,
            category_id: this.product.categoryId,
            location_id: this.product.locationId,
            stockQuantity: this.product.stockQuantity,
            images: this.product.images,
          });

          if (response.product) {
            const userstore = useUserstoreStore();
            userstore.addProductToCache(response.product);
          }
          this.successMessage = "Item added successfully!";
        }
        this.clearProduct();
      } catch (error: any) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          this.error = error.response.data.message;
        } else {
          this.error = "Failed to add item. Please try again.";
        }
      } finally {
        this.isSaving = false;
      }
    },
    async deactivateProduct(id: number) {
      const { deactivateProduct } = useProducts();
      await deactivateProduct(id);
    },
    async activateProduct(id: number) {
      const { activateProduct } = useProducts();
      await activateProduct(id);
    },
  },
});

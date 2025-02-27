// src/stores/productsStore.ts
import { defineStore } from "pinia";
import { useProducts } from "@/composables/useProducts";
import { useUserstoreStore } from "@/stores/userstoreStore";

interface NewProduct {
  id?: number; // Optional: if present, we're editing
  name: string;
  description: string;
  price: number;
  categoryId: string;
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
      categoryId: "",
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
    setCategoryId(categoryId: string) {
      this.product.categoryId = categoryId;
    },
    setStockQuantity(quantity: number) {
      this.product.stockQuantity = quantity;
    },
    setImages(images: File[]) {
      this.product.images = images;
    },
    clearProduct() {
      this.product = {
        id: undefined,
        name: "",
        description: "",
        price: 0,
        categoryId: "",
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
            category_id: parseInt(this.product.categoryId, 10),
            stockQuantity: this.product.stockQuantity,
            images: this.product.images,
          });
          this.successMessage = "Item updated successfully!";
        } else {
          // Add new mode
          await addNewProduct({
            name: this.product.name,
            description: this.product.description,
            price: this.product.price,
            category_id: parseInt(this.product.categoryId, 10),
            stockQuantity: this.product.stockQuantity,
            images: this.product.images,
          });
          this.successMessage = "Item added successfully!";
        }
        const userstore = useUserstoreStore();
        await userstore.fetchUserProducts();
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

<template>
  <div class="app-body">
    <!-- Product Card Grid -->
    <ProductCardGrid
      heading="Newly Added"
      :products="newlyAddedItems"
      @navigateToProductPage="navigateToProductPage"
    />

    <!-- Category Section Placeholder -->
    <div class="category-section">
      <p>Category Section Placeholder</p>
    </div>

    <!-- Product List Section Placeholder -->
    <div class="product-list-section">
      <p>Product List Section Placeholder</p>
    </div>

    <!-- Promotional Section Placeholder -->
    <div class="promotional-section">
      <p>Promotional Section Placeholder</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import ProductCardGrid from "@/components/ProductCardGrid.vue";
import axios from "axios";
import { useRouter } from "vue-router"; // Import useRouter to access the router instance

export default defineComponent({
  name: "AppBody",
  components: { ProductCardGrid },
  setup() {
    const baseUrl = "http://localhost:1994";

    // Use Vue Router
    const router = useRouter();

    // Define the type for a product
    type Product = {
      id: number;
      name: string;
      description: string;
      price: string;
      mark_up_amount: string;
      category_id: number;
      category: string;
      stock_quantity: number;
      uploaded_by_userID: number;
      uploaded_by: string;
      images: Array<{
        image_path: string;
        alt_text: string | null;
        is_primary: number;
      }>;
    };

    const newlyAddedItems = ref<Product[]>([]);

    // Fetch newly added products
    const getOneWeekAgoDate = (): string => {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      return date.toISOString().split("T")[0];
    };

    const fetchNewlyAddedItems = async (): Promise<void> => {
      try {
        const oneWeekAgo = getOneWeekAgoDate();
        const response = await axios.get<Product[]>(
          `${baseUrl}/api/products/getAllProducts?startDate=${oneWeekAgo}`
        );

        // Map the response directly since products are in response.data
        newlyAddedItems.value = response.data.map((item: Product) => ({
          ...item,
          currentImageIndex: 0, // For slideshow compatibility if needed
        }));
      } catch (error) {
        console.error("Error fetching newly added items:", error);
      }
    };

    fetchNewlyAddedItems();

    const navigateToProductPage = (product: Product) => {
      sessionStorage.setItem("selectedProduct", JSON.stringify(product));
      router.push({ name: "ProductPage", params: { id: product.id } }); // Use router to navigate
    };

    return {
      newlyAddedItems,
      navigateToProductPage,
    };
  },
});
</script>

<style scoped>
.category-section {
  margin: 20px 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-list-section {
  padding: 10px;
  background-color: #fff;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.promotional-section {
  height: 150px;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

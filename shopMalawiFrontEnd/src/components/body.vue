<template>
  <div class="app-body">
    <ProductCardGrid
      heading="Newly Added"
      :products="newlyAddedItems"
      @productClicked="navigateToProductPage"
    />

    <div class="category-section">
      <p>Category Section Placeholder</p>
    </div>

    <div class="product-list-section">
      <p>Product List Section Placeholder</p>
    </div>

    <div class="promotional-section">
      <p>Promotional Section Placeholder</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import ProductCardGrid from "@/components/ProductCardGrid.vue";
import axios from "axios";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "AppBody",
  components: { ProductCardGrid },
  setup() {
    const baseUrl = "http://localhost:1994";
    const router = useRouter();

    type Product = {
      id: number;
      name: string;
      description: string;
      price: string;
      mark_up_amount?: number;
      subcategory_id?: number;
      subcategory_name?: string;
      maincategory_id?: number;
      maincategory_name?: string;
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

        newlyAddedItems.value = response.data.map((product: any) => ({
          ...product,
          mark_up_amount: product.mark_up_amount
            ? parseFloat(product.mark_up_amount)
            : undefined,
        }));
      } catch (error) {
        console.error("Error fetching newly added items:", error);
      }
    };

    fetchNewlyAddedItems();

    const navigateToProductPage = (product: Product) => {
      sessionStorage.setItem("selectedProduct", JSON.stringify(product));
      router.push({ name: "ProductPage", params: { id: product.id } });
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

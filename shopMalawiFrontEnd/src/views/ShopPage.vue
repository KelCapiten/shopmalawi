<template>
  <ion-page>
    <appHeader />
    <ion-content>
      <!-- Products for Subcategories -->
      <ProductCardGrid
        v-for="subcategory in subcategories"
        :key="subcategory.id"
        :heading="subcategory.name"
        :products="subcategory.products"
        @navigateToProductPage="navigateToProductPage"
      />

      <!-- No Products Found -->
      <div v-if="!hasProducts && !isLoading" class="no-products">
        <p>No products found for the selected category.</p>
      </div>

      <!-- Loading Spinner -->
      <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
    </ion-content>
    <appFooter />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import appHeader from "@/components/header.vue";
import appFooter from "@/components/footer.vue";
import ProductCardGrid from "@/components/ProductCardGrid.vue";

export default defineComponent({
  name: "ShopPage",
  components: { appHeader, appFooter, ProductCardGrid },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const subcategories = ref<any[]>([]); // Grouped response by subcategories
    const isLoading = ref(false);
    const hasProducts = ref(false);
    const selectedCategoryId = ref<number | null>(null);

    // Fetch products grouped by subcategories or as a single category
    const fetchProducts = async () => {
      try {
        isLoading.value = true;
        const apiUrl = selectedCategoryId.value
          ? `http://localhost:1994/api/products/getAllProducts?category_id=${selectedCategoryId.value}`
          : "http://localhost:1994/api/products/getAllProducts";

        const response = await axios.get(apiUrl);
        subcategories.value = response.data;

        // Check if there are any products
        hasProducts.value = subcategories.value.some(
          (subcategory) => subcategory.products.length > 0
        );
      } catch (error) {
        console.error("Error fetching products:", error);
        hasProducts.value = false;
      } finally {
        isLoading.value = false;
      }
    };

    // Navigate to a product page
    const navigateToProductPage = (product: any) => {
      sessionStorage.setItem("selectedProduct", JSON.stringify(product));
      router.push({ name: "ProductPage", params: { id: product.id } });
    };

    // Watch for route changes
    watch(
      () => route.query.categoryId,
      (newVal) => {
        selectedCategoryId.value = newVal ? Number(newVal) : null;
        fetchProducts();
      }
    );

    // Fetch products on component mount
    onMounted(() => {
      selectedCategoryId.value = route.query.categoryId
        ? Number(route.query.categoryId)
        : null;
      fetchProducts();
    });

    return {
      subcategories,
      isLoading,
      hasProducts,
      navigateToProductPage,
    };
  },
});
</script>

<style scoped>
ion-content {
  padding: 16px;
}
.no-products {
  text-align: center;
  margin-top: 20px;
  color: var(--ion-color-step-300);
}
</style>

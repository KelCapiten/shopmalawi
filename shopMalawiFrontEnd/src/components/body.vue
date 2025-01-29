<!-- src/components/AppBody.vue -->
<template>
  <div class="app-body">
    <ProductDisplay
      heading="Newly Added"
      :products="products"
      :isLoading="loading"
      :error="error"
      :enableCounter="false"
      :imageSize="'medium'"
      @productClicked="navigateToProductPage"
    />

    <div v-if="!hasProducts && !loading" class="no-products">
      <p>No products found for the selected category.</p>
    </div>

    <div v-if="loading" class="loading-spinner">
      <ion-spinner name="crescent"></ion-spinner>
    </div>

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
import { defineComponent, onMounted, ref, watch } from "vue";
import ProductDisplay from "@/components/productDisplay.vue";
import { useProducts } from "@/composables/useProducts";
import { getOneWeekAgoDate, navigateToProductPage } from "@/utils/utilities";

export default defineComponent({
  name: "AppBody",
  components: {
    ProductDisplay,
  },
  emits: ["searchedProductClicked"],
  setup() {
    const { products, loading, error, fetchProducts } = useProducts();
    const hasProducts = ref(false);

    onMounted(async () => {
      const oneWeekAgo = getOneWeekAgoDate();
      await fetchProducts("subcategory", undefined, oneWeekAgo);
      hasProducts.value = products.value.length > 0;
    });

    watch(products, (newProducts) => {
      hasProducts.value = newProducts.length > 0;
    });

    return {
      products,
      loading,
      error,
      hasProducts,
      navigateToProductPage,
    };
  },
});
</script>

<style scoped>
.app-body {
  padding: 16px;
}

.no-products {
  text-align: center;
  margin-top: 20px;
  color: #555;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.category-section,
.product-list-section,
.promotional-section {
  margin-top: 20px;
}

.category-section p,
.product-list-section p,
.promotional-section p {
  font-size: 1rem;
  color: #888;
}
</style>

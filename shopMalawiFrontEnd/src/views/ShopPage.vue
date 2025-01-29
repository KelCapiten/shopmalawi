<template>
  <ion-page>
    <appHeader />

    <ion-content>
      <ProductDisplay
        class="product-display-body"
        :products="products"
        :isLoading="loading"
        :error="error"
        :infoPosition="'bottom'"
        :enableCounter="false"
        :showCategoryName="true"
        @productClicked="navigateToProductPage"
      />

      <div v-if="!hasProducts && !loading" class="no-products">
        <p>No products found for the selected category.</p>
      </div>

      <ion-spinner v-if="loading" name="crescent"></ion-spinner>
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { IonPage, IonContent, IonSpinner } from "@ionic/vue";
import { useProducts } from "@/composables/useProducts";
import appHeader from "@/components/appHeader.vue";
import appFooter from "@/components/appFooter.vue";
import ProductDisplay from "@/components/productDisplay.vue";
import { navigateToProductPage } from "@/utils/utilities";

export default defineComponent({
  name: "ShopPage",
  components: {
    IonPage,
    IonContent,
    IonSpinner,
    appHeader,
    appFooter,
    ProductDisplay,
  },
  setup() {
    // Route for reading query parameters (categoryId).
    const route = useRoute();

    // Our product composable
    const { products, loading, error, fetchProducts } = useProducts();
    const hasProducts = ref(false);

    // Convert the route query param to a number or null, e.g. /shop?categoryId=3
    const categoryId = computed(() => {
      const queryVal = route.query.categoryId;
      return queryVal ? parseInt(queryVal as string, 10) : null;
    });

    watch(
      categoryId,
      async (newCatId) => {
        // Start loading
        loading.value = true;
        error.value = null;

        try {
          if (newCatId) {
            // Fetch products specific to this category
            await fetchProducts("subcategory", newCatId);
          } else {
            // No category param -> fetch all subcategory-grouped products
            await fetchProducts("subcategory");
          }
        } catch (err) {
          error.value = err as Error;
        } finally {
          hasProducts.value = products.value.length > 0;
          loading.value = false;
        }
      },
      { immediate: true }
    );

    // Also watch the products array to keep hasProducts in sync if needed
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
.product-display-body {
  padding: 16px;
}

ion-content {
  padding: 16px;
}

.no-products {
  text-align: center;
  margin-top: 20px;
  color: var(--ion-color-step-300);
}
</style>

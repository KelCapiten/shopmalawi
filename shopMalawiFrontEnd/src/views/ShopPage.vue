//src/views/ShopPage.vue
<template>
  <ion-page>
    <appHeader />

    <ion-content>
      <ProductDisplay
        class="product-display-body"
        :products="displayedProducts"
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
import { defineComponent, computed, onMounted, ref, watch } from "vue";
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
    const route = useRoute();
    const { products, loading, error, fetchProducts } = useProducts();
    const hasProducts = ref(false);

    // Always work with an array for display
    const displayedProducts = computed(() => products.value || []);

    // Compute categoryId from route query param
    const categoryId = computed(() => {
      const queryVal = route.query.categoryId;
      return queryVal ? parseInt(queryVal as string, 10) : null;
    });

    const fetchFilteredProducts = async () => {
      loading.value = true;
      error.value = null;
      try {
        if (categoryId.value) {
          await fetchProducts({
            groupBy: "subcategory",
            category_id: categoryId.value,
          });
        } else {
          await fetchProducts({ groupBy: "subcategory" });
        }
      } catch (err: any) {
        error.value = err instanceof Error ? err.message : String(err);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchFilteredProducts();
    });

    // Re-fetch products when the categoryId changes
    watch(categoryId, () => {
      fetchFilteredProducts();
    });

    // Keep hasProducts in sync with products
    watch(products, (newProducts) => {
      hasProducts.value = (newProducts && newProducts.length > 0) || false;
    });

    return {
      displayedProducts,
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

<template>
  <ion-page>
    <appHeader />

    <ion-content>
      <div v-if="currentCategory && currentCategoryProducts.length > 0">
        <ProductCardGrid
          :heading="`${currentCategory.name} Products`"
          :products="currentCategoryProducts"
        />
      </div>

      <ProductCardGrid
        v-for="subcategory in subcategories"
        :key="subcategory.id"
        :heading="subcategory.name"
        :products="subcategory.products"
      />

      <div v-if="!hasProducts && !isLoading" class="no-products">
        <p>No products found for the selected category.</p>
      </div>

      <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

import appHeader from "@/components/header.vue";
import appFooter from "@/components/footer.vue";
import ProductCardGrid from "@/components/ProductCardGrid.vue";

interface Category {
  id: number;
  name: string;
  parent_id?: number | null;
  subcategories?: Category[];
}

export default defineComponent({
  name: "ShopPage",
  components: {
    appHeader,
    appFooter,
    ProductCardGrid,
  },
  setup() {
    const route = useRoute();

    const categories = ref<Category[]>([]);
    const products = ref<any[]>([]);
    const isLoading = ref<boolean>(false);
    const hasProducts = ref<boolean>(false);
    const selectedCategoryId = ref<number | null>(null);

    const findCategoryById = (id: number): Category | null => {
      for (const category of categories.value) {
        if (category.id === id) return category;
        if (category.subcategories) {
          const subcategory = category.subcategories.find(
            (sub) => sub.id === id
          );
          if (subcategory) return subcategory;
        }
      }
      return null;
    };

    const currentCategory = computed<Category | null>(() => {
      if (!selectedCategoryId.value) return null;
      return findCategoryById(selectedCategoryId.value);
    });

    const currentCategoryProducts = computed(() => {
      if (!selectedCategoryId.value) return [];
      const category = findCategoryById(selectedCategoryId.value);
      if (!category) return [];
      return products.value.filter(
        (product) => Number(product.category_id) === Number(category.id)
      );
    });

    const subcategories = computed(() => {
      if (!selectedCategoryId.value) {
        return categories.value
          .flatMap((category) =>
            (category.subcategories || []).map((subcategory: Category) => ({
              id: subcategory.id,
              name: subcategory.name,
              products: products.value.filter(
                (product: any) =>
                  Number(product.category_id) === Number(subcategory.id)
              ),
            }))
          )
          .filter((subcategory) => subcategory.products.length > 0);
      } else {
        const category = findCategoryById(selectedCategoryId.value);
        if (!category) return [];

        if (category.subcategories && category.subcategories.length > 0) {
          return category.subcategories
            .map((subcategory: Category) => ({
              id: subcategory.id,
              name: subcategory.name,
              products: products.value.filter(
                (product: any) =>
                  Number(product.category_id) === Number(subcategory.id)
              ),
            }))
            .filter((subcategory) => subcategory.products.length > 0);
        } else {
          return [];
        }
      }
    });

    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/products/getCategories"
        );
        categories.value = response.data;
      } catch (error) {
        // handle error silently or show user-friendly message
      }
    };

    const fetchProducts = async () => {
      try {
        isLoading.value = true;
        let apiUrl = "http://localhost:1994/api/products/getAllProducts";
        if (selectedCategoryId.value) {
          apiUrl += `?categoryId=${selectedCategoryId.value}`;
        }
        const response = await axios.get(apiUrl);
        products.value = response.data;
        hasProducts.value = response.data.length > 0;
      } catch (error) {
        hasProducts.value = false;
      } finally {
        isLoading.value = false;
      }
    };

    watch(
      () => route.query.categoryId,
      (newVal) => {
        selectedCategoryId.value = newVal ? Number(newVal) : null;
        fetchProducts();
      }
    );

    onMounted(async () => {
      selectedCategoryId.value = route.query.categoryId
        ? Number(route.query.categoryId)
        : null;
      await fetchCategories();
      await fetchProducts();
    });

    return {
      categories,
      products,
      subcategories,
      selectedCategoryId,
      currentCategoryProducts,
      currentCategory,
      isLoading,
      hasProducts,
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

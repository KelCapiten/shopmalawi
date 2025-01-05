<template>
  <ion-page>
    <appHeader />
    <ion-content>
      <!-- Loop through subcategories and render ProductCardGrid for each -->
      <ProductCardGrid
        v-for="subcategory in subcategories"
        :key="subcategory.id"
        :heading="subcategory.name"
        :products="subcategory.products"
      />
    </ion-content>
    <appFooter />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import appHeader from "@/components/header.vue";
import appFooter from "@/components/footer.vue";
import ProductCardGrid from "@/components/ProductCardGrid.vue";
import axios from "axios";

export default defineComponent({
  components: {
    appHeader,
    appFooter,
    ProductCardGrid,
  },
  setup() {
    const categories = ref<any[]>([]);
    const products = ref<any[]>([]);

    // Fetch categories and subcategories from the API
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/products/getCategories"
        );
        categories.value = response.data; // Assign the hierarchical data
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    // Fetch all products from the API
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/products/getAllProducts"
        );
        products.value = response.data; // Assign the products data
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    // Combine categories and products, and filter out subcategories with no products
    const subcategories = computed(() => {
      return categories.value
        .flatMap((category) => {
          return (category.subcategories || []).map((subcategory: any) => ({
            id: subcategory.id,
            name: subcategory.name,
            products: products.value.filter(
              (product) => product.category_id === subcategory.id
            ), // Filter products by subcategory ID
          }));
        })
        .filter((subcategory) => subcategory.products.length > 0); // Filter out subcategories with no products
    });

    onMounted(() => {
      fetchCategories();
      fetchProducts();
    });

    return {
      categories,
      subcategories,
    };
  },
});
</script>

<style scoped>
ion-content {
  padding: 16px;
}
</style>

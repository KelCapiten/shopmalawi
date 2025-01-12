<template>
  <div class="product-card-grid">
    <label class="section-heading">{{ heading }}</label>
    <div class="horizontal-list">
      <div
        v-for="product in products"
        :key="product.id"
        class="item"
        @click="() => $emit('navigateToProductPage', product)"
      >
        <div class="image-container">
          <img
            :src="getPrimaryImage(product.images)"
            :alt="product.name"
            class="item-image"
          />
        </div>
        <div class="item-details">
          <h2 class="product-name">{{ product.name }}</h2>
          <p class="price">MWK {{ product.price }}</p>
          <p class="stock-info">{{ product.stock_quantity }} in stock</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "ProductCardGrid",
  props: {
    heading: { type: String, required: true },
    products: {
      type: Array as PropType<
        Array<{
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
        }>
      >,
      required: true,
    },
  },
  methods: {
    getPrimaryImage(
      images: Array<{
        image_path: string;
        alt_text: string | null;
        is_primary: number;
      }>
    ) {
      const primaryImage = images.find((image) => image.is_primary === 1);
      return primaryImage
        ? `http://localhost:1994${primaryImage.image_path}`
        : "https://via.placeholder.com/150";
    },
  },
});
</script>

<style scoped>
.product-card-grid {
  padding: 16px;
}
.section-heading {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
  font-size: 0.9rem;
  color: #222222;
}
.horizontal-list {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 16px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.horizontal-list::-webkit-scrollbar {
  display: none;
}
.item {
  flex: 0 0 auto;
  width: 150px;
  text-align: left;
}
.image-container {
  position: relative;
  width: 150px;
  height: 150px;
  overflow: hidden;
  border-radius: 8px;
}
.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.item-details {
  margin-top: 8px;
}
.product-name {
  font-size: 0.9rem;
  color: #4e4e4e;
  margin: 4px 0;
}
.price {
  font-size: 1rem;
  font-weight: bold;
  color: #000000;
  margin: 0;
}
.stock-info {
  font-size: 0.8rem;
  color: #888;
  margin: 0;
}
</style>

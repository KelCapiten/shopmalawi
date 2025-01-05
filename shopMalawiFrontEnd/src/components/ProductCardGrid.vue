<template>
  <div class="product-card-grid">
    <label class="section-heading">{{ heading }}</label>
    <div class="horizontal-list">
      <div v-for="product in products" :key="product.id" class="item">
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
    heading: {
      type: String,
      required: true,
    },
    products: {
      type: Array as PropType<
        Array<{
          id: number;
          name: string;
          price: number;
          category: string;
          stock_quantity: number;
          uploaded_by: string;
          images: Array<{
            image_path: string;
            alt_text: string;
            is_primary: boolean;
          }>;
        }>
      >,
      required: true,
    },
  },
  methods: {
    getPrimaryImage(
      images: Array<{ image_path: string; is_primary: boolean }>
    ) {
      const primaryImage = images.find((image) => image.is_primary);
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
  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */
}

.horizontal-list::-webkit-scrollbar {
  display: none; /* For Chrome, Safari, and Opera */
}

.item {
  flex: 0 0 auto;
  width: 150px;
  text-align: left; /* Align text to the left */
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

/* Swapped styles for name and price */
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

@media (max-width: 576px) {
  .item {
    width: 140px; /* Slightly smaller for mobile */
  }

  .image-container {
    width: 140px;
    height: 140px;
  }

  .product-name {
    font-size: 0.8rem;
  }

  .price {
    font-size: 0.9rem;
  }

  .stock-info {
    font-size: 0.75rem;
  }
}
</style>

<template>
  <div class="product-card-grid">
    <label class="section-heading">{{ heading }}</label>
    <div class="product-list">
      <div
        v-for="product in products"
        :key="product.id"
        class="item"
        :class="{ 'info-side': infoPosition === 'side' }"
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
          <h2 v-if="infoPosition !== 'side'" class="product-name">
            {{ product.name }}
          </h2>
          <p class="price">MWK {{ product.price }}</p>
          <p class="stock-info">{{ product.stock_quantity }} in stock</p>
          <p v-if="infoPosition === 'side'" class="description">
            {{ product.description }}
          </p>
        </div>
        <div v-if="infoPosition === 'side'" class="side-counter">
          <label>
            <span class="buy-text">I'd like to buy</span>
            <span class="count">{{ product.orderCount || 1 }}</span>
          </label>
          <div class="counter-controls">
            <button @click.stop="decrement(product)">-</button>
            <button @click.stop="increment(product)">+</button>
          </div>
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
          stock_quantity: number;
          images: Array<{
            image_path: string;
            is_primary: number;
          }>;
          orderCount?: number;
        }>
      >,
      required: true,
    },
    infoPosition: {
      type: String as PropType<"bottom" | "side">,
      default: "bottom",
    },
  },
  methods: {
    getPrimaryImage(images: Array<{ image_path: string; is_primary: number }>) {
      const primaryImage = images.find((image) => image.is_primary === 1);
      return primaryImage
        ? `http://localhost:1994${primaryImage.image_path}`
        : "https://via.placeholder.com/150";
    },
    increment(product: { orderCount?: number; stock_quantity: number }) {
      if (!product.orderCount) product.orderCount = 1;
      if (product.orderCount < product.stock_quantity) {
        product.orderCount++;
      }
    },
    decrement(product: { orderCount?: number }) {
      if (!product.orderCount || product.orderCount <= 1) {
        // Ensure orderCount does not go below 1
        product.orderCount = 1;
      } else {
        product.orderCount--;
      }
    },
  },
});
</script>

<style scoped>
.product-card-grid {
  padding: 16px;
  width: 100%;
}
.section-heading {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
  font-size: 0.9rem;
  color: #222222;
}
.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  width: 100%;
}
.item {
  text-align: left;
  display: flex;
  flex-direction: column;
}
.image-container {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}
.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-details {
  margin-top: 8px;
  flex: 1;
}
.product-name {
  font-size: 0.9rem;
  color: #4e4e4e;
  margin: 4px 0;
}
.price {
  font-size: 1rem;
  font-weight: bold;
  color: #000;
  margin: 0;
}
.stock-info {
  font-size: 0.8rem;
  color: #888;
  margin: 0;
}

/* Side mode styles */
.item.info-side {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 16px;
  width: 100%;
}
.item.info-side .image-container {
  width: 190px;
  height: 190px;
}
.item.info-side .item-details {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item.info-side .description {
  font-size: 0.8rem;
  color: #181818;
  margin-top: 4px;
}

/* Counter styles */
.side-counter {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
}
.side-counter label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.buy-text {
  font-weight: bold;
  color: #000;
  font-size: 0.8rem;
}
.count {
  color: #2196f3; /* Blue color */
  font-weight: bold;
  font-size: 0.9rem;
}
.counter-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.counter-controls button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.counter-controls button:hover {
  background-color: #e0e0e0;
}
</style>

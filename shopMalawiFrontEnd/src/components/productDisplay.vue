<template>
  <div>
    <label v-if="hasProducts" class="section-heading">{{ heading }}</label>

    <div v-if="isLoading" class="loading-indicator">Loading...</div>
    <div v-if="error" class="error-message">{{ formattedError }}</div>

    <div
      :class="[
        'product-list',
        { 'single-column': infoPosition === 'side' && !enableCounter },
      ]"
    >
      <div
        v-for="subcategory in products"
        :key="subcategory.subcategory"
        class="subcategory"
      >
        <label v-if="showCategoryName" class="section-heading">{{
          subcategory.name
        }}</label>
        <div class="products-grid">
          <div
            v-for="product in subcategory.products"
            :key="product.id"
            class="item"
            :class="itemClasses"
            @click="$emit('productClicked', product)"
          >
            <div class="image-container">
              <img
                :src="getPrimaryImage(product.images)"
                :alt="product.name"
                class="item-image"
              />
            </div>
            <div class="item-details">
              <div class="price-container">
                <p class="price">MWK {{ product.price }}</p>
                <ion-icon
                  v-if="
                    product.uploaded_by_userID === userId && showDeleteButton
                  "
                  name="trash"
                  class="delete-icon"
                  @click.stop="$emit('removeOfferedProduct', product.id)"
                ></ion-icon>
              </div>
              <label class="product-name">{{ product.name }}</label>
              <label class="stock-info">
                {{ product.stock_quantity }} in stock
              </label>
              <p v-if="imageSize !== 'small'" class="description">
                {{ product.description }}
              </p>
            </div>

            <div
              v-if="infoPosition === 'side' && enableCounter"
              class="side-counter"
            >
              <label class="counter-label">
                <span class="buy-text">I'd like to buy</span>
                <span class="count">{{ product.orderCount || 1 }}</span>
              </label>
              <div class="counter-controls">
                <button @click.stop="$emit('decrement', product)">-</button>
                <button @click.stop="$emit('increment', product)">+</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { Product } from "@/types";
import { getPrimaryImage } from "@/utils/utilities";
import { addIcons } from "ionicons";
import { trash } from "ionicons/icons";

addIcons({ trash });

export default defineComponent({
  name: "ProductDisplay",
  props: {
    products: {
      type: Array as PropType<Product[] | any[]>,
      required: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: [Object, String] as PropType<Error | string | null>,
      default: null,
    },
    heading: {
      type: String,
    },
    infoPosition: {
      type: String,
      default: "bottom",
    },
    enableCounter: {
      type: Boolean,
      default: false,
    },
    imageSize: {
      type: String,
      default: "medium",
    },
    showCategoryName: {
      type: Boolean,
      default: false,
    },
    showDeleteButton: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Number,
      default: 0,
    },
  },
  emits: ["productClicked", "decrement", "increment", "removeOfferedProduct"],
  data() {
    return {
      searchQuery: "",
    };
  },
  setup(props) {
    // Computed property to check if there are any products in all subcategories
    const hasProducts = computed(() =>
      props.products.some(
        (subcategory: any) =>
          subcategory.products && subcategory.products.length > 0
      )
    );

    return {
      trash,
      hasProducts,
    };
  },
  computed: {
    itemClasses() {
      return [
        { "info-side": this.infoPosition === "side" },
        {
          "small-image":
            this.infoPosition === "side" && this.imageSize === "small",
        },
        { "full-row": this.infoPosition === "side" && !this.enableCounter },
      ];
    },
    formattedError(): string {
      return typeof this.error === "string"
        ? this.error
        : this.error?.message || "An error occurred.";
    },
  },
  methods: {
    getPrimaryImage,
  },
});
</script>

<style scoped>
p {
  margin: 0;
  padding: 0;
}
.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 3px;
}

.single-column {
  grid-template-columns: 1fr;
}

.subcategory {
  display: flex;
  flex-direction: column;
}

.section-heading {
  font-weight: bold;
  font-size: 1rem;
  color: #222;
  margin-bottom: 10px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px;
}

.item {
  display: flex;
  flex-direction: column;
  text-align: left;
  background-color: #fff;
  padding: 5px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.image-container {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  transition: width 0.3s, height 0.3s;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
}

.product-name {
  font-size: 0.9rem;
  color: #333333;
  margin-right: 10px;
}

.price-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 1rem;
  font-weight: bold;
  color: #000;
  margin: 0;
}

.delete-icon {
  cursor: pointer;
  color: #8b1111;
  font-size: 1.3rem;
}

.stock-info {
  font-size: 0.8rem;
  color: #888;
  margin: 0;
}

.info-side {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 16px;
}

.small-image.info-side .image-container {
  width: 50px;
  height: 50px;
}

.description {
  font-size: 0.8rem;
  color: #181818;
  margin-top: 4px;
}

.side-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  grid-column: 1 / -1;
}

.counter-label {
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
  color: #2196f3;
  font-weight: bold;
  font-size: 0.9rem;
}

.counter-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.counter-controls button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.counter-controls button:hover {
  background-color: #e0e0e0;
}

.full-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: left;
}

.full-row .image-container {
  width: 150px;
  height: 150px;
  aspect-ratio: 1;
  flex-shrink: 0;
  margin-right: 24px;
}

.full-row .item-details {
  flex: 1;
}

.full-row .description {
  margin-top: 8px;
}

.loading-indicator,
.error-message {
  text-align: center;
  font-size: 1rem;
  margin: 16px 0;
}

.loading-indicator {
  color: #888;
}

.error-message {
  color: #ff0000;
}

.search-container {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

.search-input:focus {
  border-color: #2196f3;
}
</style>

//src/components/productDisplay.vue
<template>
  <div>
    <label v-if="hasProducts" class="section-heading">{{ heading }}</label>

    <div v-if="isLoading" class="loading-indicator">Loading...</div>
    <div v-if="error" class="error-message">{{ formattedError }}</div>

    <div
      v-if="emptyMessageEnabled && !hasProducts && !isLoading && !error"
      class="products-grid"
    >
      <div class="item" :class="itemClasses">
        <div class="item-details empty-message-container">
          <div>
            <label class="product-name">{{ emptyMessageText }}</label>
            <p class="description">{{ emptyMessageSubText }}</p>
          </div>
          <button
            v-if="emptyMessageButtonText"
            class="empty-message-button"
            @click="$emit('emptyMessageButtonClicked')"
          >
            {{ emptyMessageButtonText }}
          </button>
        </div>
      </div>
    </div>

    <!-- New "No Products" Message -->
    <div
      v-if="!emptyMessageEnabled && !hasProducts && !isLoading && !error"
      class="no-products-container"
    >
      <div class="no-products-card">
        <IonIcon :icon="archiveOutline" class="no-products-icon" />
        <!-- Update button click event -->
        <button class="sell-something-button" @click="navigateToSell">
          Sell Something 🤑
        </button>
        <label class="no-products-heading"> No Products Available </label>
        <p class="no-products-text">
          No products to display. Please check back later or explore other
          categories.
        </p>
        <button
          v-if="emptyMessageButtonText"
          class="no-products-button"
          @click="$emit('emptyMessageButtonClicked')"
        >
          {{ emptyMessageButtonText }}
        </button>
      </div>
    </div>

    <div
      v-if="hasProducts"
      :class="[
        'product-list',
        {
          'single-column': infoPosition === 'side' && !enableCounter,
          'default-mode': infoPosition !== 'side',
          'fixed-height': infoPosition === 'side' && imageSize === 'small',
        },
      ]"
    >
      <div
        v-for="subcategory in products"
        :key="subcategory.subcategory || subcategory.subcategory_name"
        class="subcategory"
      >
        <label v-if="showCategoryName" class="section-heading">
          {{ subcategory.name || subcategory.subcategory_name }}
        </label>
        <div class="products-grid">
          <div
            v-for="product in subcategory.products"
            :key="product.id"
            class="item"
            :class="itemClasses"
            @click="$emit('productClicked', product)"
          >
            <!-- Location tag that shows when infoPosition is 'bottom' -->
            <div
              v-if="infoPosition === 'bottom' && product.location_name"
              class="location-tag"
            >
              <IonIcon :icon="locationOutline" class="location-icon" />
              {{ product.location_name }}
            </div>

            <template v-if="infoPosition === 'bottom'">
              <div class="icons-container">
                <IonIcon
                  v-if="
                    product.uploaded_by_userID === userId &&
                    showDeleteButton &&
                    !userstore.isProductInStoreProductsCache(product.id) &&
                    userstore.showAddToStoreIcon
                  "
                  :icon="storefrontOutline"
                  class="action-icon storefront-icon"
                  @click.stop="$emit('addProductToStore', product)"
                />
                <IonIcon
                  v-else-if="
                    product.uploaded_by_userID === userId &&
                    showDeleteButton &&
                    userstore.isProductInStoreProductsCache(product.id) &&
                    userstore.showRemoveFromStoreIcon
                  "
                  :icon="removeCircleOutline"
                  class="action-icon remove-icon"
                  @click.stop="$emit('removeProductFromStore', product.id)"
                />
                <IonIcon
                  v-if="
                    product.uploaded_by_userID === userId && showDeleteButton
                  "
                  :icon="reorderFourOutline"
                  class="action-icon edit-icon"
                  @click.stop="$emit('editProduct', product.id)"
                />
                <IonIcon
                  v-if="
                    product.uploaded_by_userID === userId &&
                    showDeleteButton &&
                    product.is_active
                  "
                  :icon="trashOutline"
                  class="action-icon delete-icon"
                  @click.stop="$emit('deactivateProduct', product.id)"
                />
                <IonIcon
                  v-else-if="
                    product.uploaded_by_userID === userId &&
                    showDeleteButton &&
                    !product.is_active
                  "
                  :icon="refreshOutline"
                  class="action-icon refresh-icon"
                  @click.stop="$emit('activateProduct', product.id)"
                />
                <img
                  v-if="userstore.showRemoveFromStoreIcon && showDeleteButton"
                  :src="stylizedStarPath"
                  class="action-icon star-icon"
                  @click.stop="$emit('sellersPick', product.id)"
                />
              </div>
            </template>
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
                <template v-if="infoPosition !== 'bottom' && showDeleteButton">
                  <div class="owner-delete-container">
                    <span class="owner-label">by:</span>
                    <span
                      class="owner-text"
                      @click.stop="navigateToStore(product.uploaded_by_userID)"
                    >
                      {{
                        product.uploaded_by_userID === userId
                          ? "You"
                          : product.uploaded_by
                      }}
                    </span>
                    <IonIcon
                      v-if="product.uploaded_by_userID === userId"
                      :icon="trashOutline"
                      class="delete-icon"
                      @click.stop="$emit('removeOfferedProduct', product.id)"
                    />
                  </div>
                </template>
              </div>
              <label class="product-name">{{ product.name }}</label>
              <label class="stock-info">
                {{ product.stock_quantity }} in stock
              </label>
              <p
                v-if="imageSize !== 'small' && showDescription"
                class="description"
                v-html="product.description"
              ></p>
            </div>

            <div
              v-if="enableCounter"
              :class="
                infoPosition === 'side' ? 'side-counter' : 'default-counter'
              "
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
import { Product } from "@/types/types";
import { getPrimaryImage } from "@/utils/utilities";
import { IonIcon } from "@ionic/vue";
import {
  trashOutline,
  reorderFourOutline,
  refreshOutline,
  storefrontOutline,
  removeCircleOutline,
  archiveOutline,
  locationOutline,
} from "ionicons/icons";
import { useUserstoreStore } from "@/stores/userstoreStore";
import router from "@/router/pageRoutes";

export default defineComponent({
  name: "ProductDisplay",
  components: {
    IonIcon,
  },
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
    emptyMessageEnabled: {
      type: Boolean,
      default: false,
    },
    emptyMessageText: {
      type: String,
      default: "No products found unfortunately",
    },
    emptyMessageSubText: {
      type: String,
      default: "There are currently no products available.",
    },
    emptyMessageButtonText: {
      type: String,
      default: "",
    },
    showDescription: {
      type: Boolean,
      default: true,
    },
  },
  emits: [
    "productClicked",
    "decrement",
    "increment",
    "removeOfferedProduct",
    "editProduct",
    "emptyMessageButtonClicked",
    "deactivateProduct",
    "activateProduct",
    "storefrontClicked",
    "addProductToStore",
    "removeProductFromStore",
    "sellersPick",
    "sellSomething",
  ],
  data() {
    return {
      searchQuery: "",
      stylizedStarPath: "/assets/icons/stylizedStar.svg", // Path to the custom SVG
    };
  },
  setup(props) {
    const userstore = useUserstoreStore();
    const hasProducts = computed(() =>
      props.products.some(
        (subcategory: any) =>
          subcategory.products && subcategory.products.length > 0
      )
    );
    return {
      trashOutline,
      reorderFourOutline,
      refreshOutline,
      storefrontOutline,
      removeCircleOutline,
      archiveOutline,
      locationOutline,
      hasProducts,
      userstore,
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
        { "item-default-mode": this.infoPosition !== "side" },
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
    navigateToStore(uploaded_by_userID: number) {
      router.push({
        name: "Store",
        query: { ownerId: uploaded_by_userID },
      });
    },
    navigateToSell() {
      router.push({ name: "sell" });
    },
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
  font-size: 1.5rem;
  color: #222;
}

.products-grid {
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  justify-content: start;
}

.default-mode .products-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, auto));
  justify-content: start;
}

.item {
  position: relative;
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

.location-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.9rem;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 3px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-icon {
  font-size: 0.8rem;
}

.icons-container {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1;
}

.action-icon {
  border: 2px solid white;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.3rem;
  padding: 4px;
}

.storefront-icon {
  color: #000;
}

.remove-icon {
  color: #000;
}

.edit-icon {
  color: black;
}

.delete-icon,
.refresh-icon {
  color: #8b1111;
}

.star-icon {
  width: 23px;
  height: 23px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-sizing: content-box;
  transition: transform 0.2s;
}

.star-icon:hover {
  transform: scale(1.1);
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
  align-items: center;
  justify-content: space-between;
}

.price {
  font-size: 1rem;
  font-weight: bold;
  color: #000;
  margin: 0;
}

.owner-delete-container {
  display: flex;
  align-items: center;
  gap: 2px;
}

.owner-label {
  font-size: 0.8rem;
  color: #333;
}

.owner-text {
  background-color: #f3f3f3;
  border: 1px solid #00994d;
  color: #252525;
  padding: 2px 4px;
  font-size: 0.6rem;
  border-radius: 3px;
}

.delete-icon {
  cursor: pointer;
  color: black;
  font-size: 1.3rem;
  margin-left: 2px;
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
  height: 32px;
  overflow: hidden;
}

/* Add styling for rich text elements */
.description :deep(ul),
.description :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}

.description :deep(li) {
  margin: 2px 0;
}

.description :deep(b),
.description :deep(strong) {
  font-weight: bold;
}

.side-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
}

.default-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
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

.empty-message-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 5px;
}

.empty-message-button {
  background-color: #2196f3;
  color: #fff;
  border: none;
  padding: 10px;
  margin: 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.empty-message-button:hover {
  background-color: #1976d2;
}

.fixed-height {
  max-height: 230px;
  overflow-y: auto;
  scrollbar-width: none;
  border: 1px solid grey;
  border-radius: 8px;
}

.fixed-height::-webkit-scrollbar {
  display: none;
}

.no-products-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  min-height: 400px;
}

.no-products-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background-color: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 400px;
}

.no-products-icon {
  font-size: 3rem;
  color: #777;
  margin-bottom: 15px;
}

.no-products-heading {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.no-products-text {
  color: #555;
  font-size: 1rem;
  margin-bottom: 20px;
}

.no-products-button {
  background-color: #007bff; /* Example button color */
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.no-products-button:hover {
  background-color: #0056b3;
}

.sell-something-button {
  background-color: #28a745;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s;
  animation: levitate 2s infinite ease-in-out;
}

.sell-something-button:hover {
  background-color: #218838;
}

/* Add levitate keyframes */
@keyframes levitate {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>

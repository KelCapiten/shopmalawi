<template>
  <div class="product-card-grid">
    <label class="section-heading">{{ heading }}</label>
    <ion-grid>
      <ion-row>
        <ion-col
          size="6"
          size-md="4"
          v-for="product in products"
          :key="product.id"
        >
          <ion-card>
            <!-- Display the primary image if available -->
            <img
              :src="getPrimaryImage(product.images)"
              :alt="product.name"
              class="product-image"
            />
            <ion-card-header>
              <ion-card-subtitle>
                <!-- Display category name -->
                <span class="category">{{ product.category }}</span>
              </ion-card-subtitle>
              <ion-card-title>{{ product.name }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <!-- Display price -->
              <div class="price">MWK {{ product.price }}</div>
              <!-- Display stock quantity -->
              <div class="stock-info">
                {{ product.stock_quantity }} in stock
              </div>
              <!-- Display uploaded by -->
              <div class="uploaded-by">
                Uploaded by: {{ product.uploaded_by }}
              </div>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>
    </ion-grid>
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
    // Helper method to get the primary image URL
    getPrimaryImage(
      images: Array<{ image_path: string; is_primary: boolean }>
    ) {
      const primaryImage = images.find((image) => image.is_primary);
      return primaryImage
        ? `http://localhost:1994${primaryImage.image_path}`
        : "https://via.placeholder.com/150"; // Fallback image if no primary image is found
    },
  },
});
</script>

<style scoped>
.section-heading {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
  font-size: 1rem;
  color: #2c2c2c;
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px 8px 0 0;
}

.category {
  font-size: 0.9rem;
  color: #666;
}

.price {
  font-weight: bold;
  font-size: 1.2rem;
  margin-top: 8px;
}

.stock-info {
  font-size: 0.9rem;
  color: gray;
  margin-top: 4px;
}

.uploaded-by {
  font-size: 0.8rem;
  color: #888;
  margin-top: 4px;
}
</style>

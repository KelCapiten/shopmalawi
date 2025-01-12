<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>{{ product?.name || "Product Details" }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div v-if="product">
        <!-- Swiper Container -->
        <swiper
          :slides-per-view="1"
          :pagination="{ clickable: true }"
          :autoplay="{ delay: 3000 }"
        >
          <swiper-slide v-for="(image, index) in product.images" :key="index">
            <img
              :src="formatImagePath(image.image_path)"
              :alt="image.alt_text || 'Product Image'"
            />
          </swiper-slide>
        </swiper>

        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ product.name }}</ion-card-title>
            <ion-card-subtitle
              >MWK {{ parseFloat(product.price).toFixed(2) }}</ion-card-subtitle
            >
          </ion-card-header>
          <ion-card-content>
            <p>{{ product.description }}</p>
          </ion-card-content>
        </ion-card>
        <ion-item>
          <ion-label>Quantity</ion-label>
          <ion-input type="number" v-model="quantity" min="1"></ion-input>
        </ion-item>
        <ion-button expand="block" @click="addToCart">Add to Cart</ion-button>
        <ion-button expand="block" color="secondary" @click="buyNow"
          >Buy Now</ion-button
        >
      </div>
      <div v-else>
        <p>Loading product details...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useRouter } from "vue-router";

// Import Swiper and its styles
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/swiper-bundle.css"; // Swiper styles

export default defineComponent({
  name: "ProductPage",
  components: {
    Swiper,
    SwiperSlide,
  },
  setup() {
    const router = useRouter();
    const product = ref<any>(null);
    const quantity = ref(1);

    const loadProduct = () => {
      const storedProduct = sessionStorage.getItem("selectedProduct");
      if (storedProduct) {
        product.value = JSON.parse(storedProduct);
      } else {
        router.replace({ name: "shop" });
      }
    };

    const formatImagePath = (path: string) => `http://localhost:1994${path}`;

    const addToCart = () => {
      console.log(
        "Product added to cart:",
        product.value,
        "Quantity:",
        quantity.value
      );
    };

    const buyNow = () => {
      console.log(
        "Proceeding to buy:",
        product.value,
        "Quantity:",
        quantity.value
      );
    };

    onMounted(() => {
      loadProduct();
    });

    return { product, quantity, addToCart, buyNow, formatImagePath };
  },
});
</script>

<style scoped>
/* Add custom styles for Swiper if needed */
.swiper {
  width: 100%;
  height: 300px; /* Adjust height as needed */
}

.swiper-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

// src/views/productPage.vue
<template>
  <ion-page>
    <ShareToolbar :enableShareToolbar="true" class="fixed-toolbar" />

    <ion-content @ionScroll="handleScroll" :scrollEvents="true">
      <div v-if="product">
        <div
          class="swiper-container"
          :style="{ transform: `scale(${zoomFactor})` }"
        >
          <swiper
            ref="swiperRef"
            @swiper="onSwiperInit"
            @slideChange="onSlideChange"
            :slides-per-view="1"
            :pagination="{ clickable: true }"
          >
            <swiper-slide v-for="(image, index) in product.images" :key="index">
              <img
                :src="getImageUrl(image.image_path)"
                :alt="image.alt_text || 'Product Image'"
              />
            </swiper-slide>
          </swiper>
        </div>

        <div class="scrollable-content">
          <ProductImagesRow
            class="transparent-row"
            v-model="selectedImageIndex"
            :images="product.images"
          />

          <div class="white-content">
            <!-- Price Display -->
            <PriceDisplay
              :price="product.price"
              :stock="product.stock_quantity"
            />

            <!-- Product Description -->
            <div class="product-description">
              <h3>Description</h3>
              <p>{{ product.description }}</p>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <p>Loading product details...</p>
      </div>
    </ion-content>

    <div class="buy-segment-wrapper">
      <BuySegment />
    </div>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/swiper-bundle.css";
import PriceDisplay from "@/components/PriceDisplay.vue";
import BuySegment from "@/components/BuySegment.vue";
import ShareToolbar from "@/components/ShareToolbar.vue";
import ProductImagesRow from "@/components/ProductImagesRow.vue";
import { loadProductFromSessionStorage, getImageUrl } from "@/utils/utilities";

export default defineComponent({
  name: "ProductPage",
  components: {
    Swiper,
    SwiperSlide,
    PriceDisplay,
    BuySegment,
    ShareToolbar,
    ProductImagesRow,
  },
  setup() {
    const product = ref<any>(null);
    const zoomFactor = ref(1);
    const selectedImageIndex = ref(0);
    const swiperRef = ref<any>(null);

    function onSwiperInit(swiperInstance: any) {
      swiperRef.value = swiperInstance;
    }

    function onSlideChange() {
      if (swiperRef.value) {
        selectedImageIndex.value = swiperRef.value.activeIndex;
      }
    }

    watch(selectedImageIndex, (newIndex) => {
      if (swiperRef.value) {
        swiperRef.value.slideTo(newIndex);
      }
    });

    onMounted(() => {
      const loadedProduct = loadProductFromSessionStorage<any>();
      if (loadedProduct) {
        product.value = loadedProduct;
      }
    });

    function handleScroll(event: CustomEvent) {
      const factor = 0.0005;
      zoomFactor.value = 1 + event.detail.scrollTop * factor;
    }

    return {
      product,
      zoomFactor,
      selectedImageIndex,
      swiperRef,
      onSwiperInit,
      onSlideChange,
      getImageUrl,
      handleScroll,
    };
  },
});
</script>

<style scoped>
.fixed-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.swiper-container {
  height: 50vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  overflow: hidden;
  transition: transform 0.5s ease-out;
}

.scrollable-content {
  position: relative;
  z-index: 2;
  margin-top: 42vh;
  background: transparent !important;
}

.white-content {
  background-color: #fff;
}

.product-description {
  padding: 0px 15px;
  font-size: 1rem;
  line-height: 1.5;
  color: #333;
}

.product-description h3 {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.buy-segment-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

ion-content::part(scroll) {
  scrollbar-width: none;
}

ion-content::part(scroll)::-webkit-scrollbar {
  display: none;
}
</style>

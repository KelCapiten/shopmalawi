<template>
  <ion-page>
    <ShareToolbar class="fixed-toolbar" />

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
                :src="formatImagePath(image.image_path)"
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
            <PriceDisplay
              :price="product.price"
              :stock="product.stock_quantity"
              :countdownEnd="new Date(Date.now() + 86400000)"
            />

            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ product.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>{{ product.description }}</p>
              </ion-card-content>
            </ion-card>
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ product.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>{{ product.description }}</p>
              </ion-card-content>
            </ion-card>
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ product.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>{{ product.description }}</p>
              </ion-card-content>
            </ion-card>
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ product.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>{{ product.description }}</p>
              </ion-card-content>
            </ion-card>
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ product.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>{{ product.description }}</p>
              </ion-card-content>
            </ion-card>
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
import { useRouter } from "vue-router";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/swiper-bundle.css";
import PriceDisplay from "@/components/PriceDisplay.vue";
import BuySegment from "@/components/BuySegment.vue";
import ShareToolbar from "@/components/ShareToolbar.vue";
import ProductImagesRow from "@/components/ProductImagesRow.vue";

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
    const router = useRouter();
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

    function loadProduct() {
      const stored = sessionStorage.getItem("selectedProduct");
      if (stored) {
        product.value = JSON.parse(stored);
      } else {
        router.replace({ name: "shop" });
      }
    }

    function formatImagePath(path: string) {
      return `http://localhost:1994${path}`;
    }

    function handleScroll(event: CustomEvent) {
      const factor = 0.0005;
      zoomFactor.value = 1 + event.detail.scrollTop * factor;
    }

    onMounted(loadProduct);

    return {
      product,
      zoomFactor,
      selectedImageIndex,
      swiperRef,
      onSwiperInit,
      onSlideChange,
      formatImagePath,
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

.buy-segment-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}
</style>

<style>
ion-content::part(scroll) {
  /* Hide scrollbars for Firefox */
  scrollbar-width: none;
}

/* Hide scrollbars for Chrome, Safari, Edge */
ion-content::part(scroll)::-webkit-scrollbar {
  display: none;
}
</style>

// src/components/StorePage.vue
<template>
  <IonPage>
    <IonContent>
      <HeroSection />

      <!-- Brand Story Card -->
      <IonCard class="brand-story-card">
        <IonCardHeader>
          <IonCardTitle>About Our Store</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>
            {{
              userstore.store?.description ||
              "Tell your customers what you sell, and what makes your brand special."
            }}
          </p>
        </IonCardContent>
        <IonButton
          fill="clear"
          class="edit-brand-story"
          @click="editBrandStory"
        >
          edit
        </IonButton>
      </IonCard>

      <!-- Segment -->
      <IonSegment v-model="selectedSegment" class="store-segment">
        <IonSegmentButton value="featured">
          <IonLabel>TOP Picks</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="all">
          <IonLabel>All Products</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      <!-- ProductDisplay for each segment -->
      <div class="ProductDisplay">
        <div v-if="selectedSegment === 'featured'">
          <ProductDisplay :products="featuredProducts" heading="TOP Picks" />
        </div>
        <div v-else-if="selectedSegment === 'all'">
          <ProductDisplay :products="allProducts" heading="All Products" />
        </div>
      </div>
    </IonContent>

    <div class="floating-share-toolbar">
      <ShareToolbar
        :enableNavigationToolbar="true"
        :enableShareToolbar="false"
      />
    </div>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import ShareToolbar from "./ShareToolbar.vue";
import HeroSection from "./HeroSection.vue";
import ProductDisplay from "@/components/productDisplay.vue";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { trashOutline } from "ionicons/icons";

export default defineComponent({
  name: "StorePage",
  components: {
    ShareToolbar,
    HeroSection,
    ProductDisplay,
  },
  setup() {
    const userstore = useUserstoreStore();
    const selectedSegment = ref("featured");

    // Fetch user products on mount
    onMounted(() => {
      userstore.fetchUserProducts();
    });

    // Featured products are a filtered subset (for demo purposes, those with odd IDs)
    const featuredProducts = computed(() =>
      userstore.products.filter((p) => p.id % 2)
    );
    // All products come from the store's fetched products
    const allProducts = computed(() => userstore.products);

    const editBrandStory = () => {
      console.log("Edit brand story clicked");
      // Add your logic to enable editing of the brand story here
    };

    return {
      userstore,
      selectedSegment,
      featuredProducts,
      allProducts,
      editBrandStory,
      trashIcon: trashOutline,
    };
  },
});
</script>

<style scoped>
.brand-story-card {
  margin: 1rem;
  display: flex;
  flex-direction: column;
}
.edit-brand-story {
  margin-top: auto;
  align-self: flex-end;
  font-size: 0.8rem;
  color: rgb(6, 141, 231);
}
.store-segment {
  margin: 1rem;
}
.ProductDisplay {
  padding: 0px 15px;
}
.floating-share-toolbar {
  background-color: none;
  position: fixed;
  bottom: 16px;
  right: 0px;
  z-index: 1000;
}
</style>

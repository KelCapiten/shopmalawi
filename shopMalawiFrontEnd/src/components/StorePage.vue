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

      <!-- Filters Bar for "all" segment -->
      <div v-if="selectedSegment === 'all'" class="filter-bar">
        <button
          v-for="filter in filters"
          :key="filter.value"
          :class="{
            'filter-button': true,
            active: userstore.productFilter === filter.value,
          }"
          @click="userstore.setProductFilter(filter.value)"
        >
          <ion-icon :icon="filter.icon" class="filter-icon"></ion-icon>
          <span>{{ filter.label }}</span>
        </button>
      </div>

      <!-- ProductDisplay for each segment -->
      <div class="ProductDisplay">
        <div v-if="selectedSegment === 'featured'">
          <ProductDisplay
            heading="TOP Picks"
            :showDeleteButton="true"
            :products="featuredProducts"
            :userId="authStore.user?.id || 0"
            @deactivateProduct="handleDeactivateProduct"
            @activateProduct="handleActivateProduct"
          />
        </div>
        <div v-else-if="selectedSegment === 'all'">
          <ProductDisplay
            heading="All Products"
            :showDeleteButton="true"
            :products="userstore.filteredProducts"
            :userId="authStore.user?.id || 0"
            @deactivateProduct="handleDeactivateProduct"
            @activateProduct="handleActivateProduct"
          />
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
import { useAuthStore } from "@/stores/authStore";
import { useProductsStore } from "@/stores/productsStore";
import {
  trashOutline,
  appsOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";

export default defineComponent({
  name: "StorePage",
  components: {
    ShareToolbar,
    HeroSection,
    ProductDisplay,
  },
  setup() {
    const userstore = useUserstoreStore();
    const authStore = useAuthStore();
    const productsStore = useProductsStore();
    const selectedSegment = ref("featured");

    onMounted(() => {
      userstore.fetchUserProducts();
    });

    const featuredProducts = computed(() =>
      userstore.products.filter((p) => p.id % 2)
    );

    const filters = [
      { label: "All", value: "all", icon: appsOutline },
      {
        label: "Active Products",
        value: "active",
        icon: checkmarkCircleOutline,
      },
      {
        label: "Inactive Products",
        value: "inactive",
        icon: closeCircleOutline,
      },
    ];

    const editBrandStory = () => {
      console.log("Edit brand story clicked");
    };

    async function handleDeactivateProduct(productId: number) {
      try {
        await productsStore.deactivateProduct(productId);
        await userstore.fetchUserProducts();
      } catch (error) {
        console.error("Failed to deactivate product", error);
      }
    }

    async function handleActivateProduct(productId: number) {
      try {
        await productsStore.activateProduct(productId);
        await userstore.fetchUserProducts();
      } catch (error) {
        console.error("Failed to activate product", error);
      }
    }

    return {
      userstore,
      authStore,
      selectedSegment,
      featuredProducts,
      filters,
      editBrandStory,
      handleDeactivateProduct,
      handleActivateProduct,
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

/* Filters Bar styles */
.filter-bar {
  display: flex;
  gap: 0.5rem;
  justify-content: space-evenly;
  background: #f7f7f7;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 1rem 0;
  overflow-x: auto;
  white-space: nowrap;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar {
  display: none;
}
.filter-button {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  transition: background 0.3s, color 0.3s;
  outline: none;
}
.filter-button.active {
  background: #007aff;
  color: #fff;
  border-radius: 4px;
}
.filter-icon {
  font-size: 1.1rem;
}
</style>

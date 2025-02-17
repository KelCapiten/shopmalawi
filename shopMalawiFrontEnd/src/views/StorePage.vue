//src/views/StorePage.vue
<template>
  <IonPage>
    <IonContent>
      <!-- Hero Section -->
      <HeroSection />

      <!-- If there are multiple stores, allow the user to select the active store -->
      <div v-if="userstore.stores.length > 1" class="store-selector">
        <select v-model="selectedStoreId" @change="onStoreChange">
          <option
            v-for="store in userstore.stores"
            :key="store.id"
            :value="store.id"
          >
            {{ store.brand_name }}
          </option>
        </select>
      </div>

      <!-- Brand Story Card -->
      <IonCard class="brand-story-card" v-if="enableStoryCard || enableEdit">
        <IonCardHeader>
          <IonCardTitle v-if="enableStoryCard">
            Showcase Your Brand
          </IonCardTitle>
          <IonCardTitle v-if="enableEdit">About Our Store</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <!-- Display mode for description only -->
          <div class="display-mode">
            <p>
              {{
                userstore.selectedStore?.description ||
                "Your store deserves to be seen! Register your store now and grow your business, showcase your unique brand to thousands of customers, connect with your loyal shoppers, and stand out in the marketplace."
              }}
            </p>
          </div>
        </IonCardContent>
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
          <IonIcon :icon="filter.icon" class="filter-icon" />
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
            @editProduct="handleEditProduct"
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
            @editProduct="handleEditProduct"
          />
        </div>
      </div>
    </IonContent>

    <!-- Floating Share Toolbar (hidden when overlay is visible) -->
    <div class="floating-share-toolbar" v-if="!showSellDashboard">
      <ShareToolbar
        :enableNavigationToolbar="true"
        :enableShareToolbar="false"
      />
    </div>

    <!-- Sell Product Form Overlay (close button removed) -->
    <transition name="slide-fade">
      <div
        v-if="showSellDashboard"
        ref="sellDashboardContainer"
        class="sell-dashboard-container"
      >
        <sellProductForm
          submitButtonText="Save Changes"
          headingLabel="Update Your Products Info"
          @product-saved="closeSellDashboard"
          @close-form="closeSellDashboard"
        />
      </div>
    </transition>
  </IonPage>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  nextTick,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import ShareToolbar from "@/components/ShareToolbar.vue";
import HeroSection from "@/components/HeroSection.vue";
import ProductDisplay from "@/components/productDisplay.vue";
import sellProductForm from "@/components/sellProductForm.vue";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { useAuthStore } from "@/stores/authStore";
import { useProductsStore } from "@/stores/productsStore";
import {
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
    sellProductForm,
  },
  setup() {
    const userstore = useUserstoreStore();
    const authStore = useAuthStore();
    const productsStore = useProductsStore();
    const selectedSegment = ref("featured");
    const route = useRoute();

    const ownerIdFromQuery = route.query.ownerId
      ? Number(route.query.ownerId)
      : undefined;

    const enableEdit = computed(() => {
      return (
        userstore.selectedStore?.owner_id === authStore.user?.id &&
        userstore.selectedStore?.id !== 0
      );
    });
    const enableStoryCard = computed(() => {
      return (
        userstore.selectedStore?.owner_id === authStore.user?.id &&
        userstore.selectedStore?.id === 0
      );
    });

    onMounted(() => {
      userstore.fetchStore({ owner_id: ownerIdFromQuery });
      userstore.fetchUserProducts({ ownerId: ownerIdFromQuery });
    });

    const featuredProducts = computed(() =>
      userstore.products.filter((group: any) => group.id % 2)
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

    function handleEditProduct(productId: number) {
      userstore.prefillProductForEdit(productId);
      showSellDashboard.value = true;
      nextTick(() => {
        sellDashboardContainer.value?.scrollIntoView({ behavior: "smooth" });
      });
    }

    const showSellDashboard = ref(false);
    const sellDashboardContainer = ref<HTMLElement | null>(null);

    function closeSellDashboard() {
      showSellDashboard.value = false;
      productsStore.clearProduct();
    }

    // For multiple store selection:
    const selectedStoreId = ref<number | null>(
      userstore.selectedStore ? userstore.selectedStore.id : null
    );
    const onStoreChange = () => {
      const store = userstore.stores.find(
        (s) => s.id === selectedStoreId.value
      );
      if (store) {
        userstore.selectedStore = store;
      }
    };

    watch(
      () => userstore.selectedStore,
      (newStore) => {
        selectedStoreId.value = newStore ? newStore.id : null;
      },
      { immediate: true }
    );

    return {
      userstore,
      authStore,
      selectedSegment,
      featuredProducts,
      filters,
      enableEdit,
      enableStoryCard,
      showSellDashboard,
      sellDashboardContainer,
      handleDeactivateProduct,
      handleActivateProduct,
      handleEditProduct,
      closeSellDashboard,
      selectedStoreId,
      onStoreChange,
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
.display-mode p {
  margin: 0;
  font-size: 1rem;
}
.store-segment {
  margin: 1rem;
}
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
.ProductDisplay {
  padding: 0 15px;
}
.floating-share-toolbar {
  position: fixed;
  bottom: 16px;
  right: 0px;
  z-index: 10;
}
.sell-dashboard-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  overflow-y: auto;
  bottom: 0;
  z-index: 12;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.store-selector {
  margin: 1rem 16px;
}
.store-selector select {
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
::v-deep ion-button,
::v-deep ion-icon {
  padding: 0 !important;
  margin: 0 !important;
}
</style>

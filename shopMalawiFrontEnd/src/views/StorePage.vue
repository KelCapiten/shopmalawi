//src/views/StorePage.vue
<template>
  <IonPage>
    <IonContent>
      <!-- Hero Section -->
      <HeroSection
        :ownerIdFromQuery="userstore.ownerIdFromQuery"
        @infoClicked="toggleBrandStory"
        @openPaymentMethods="openPaymentMethods"
      />

      <!-- Brand Story Card with Expand/Collapse -->
      <transition name="expand">
        <IonCard class="brand-story-card" v-if="showBrandStory">
          <IonCardHeader>
            <IonCardTitle v-if="enableStoryCard">
              Showcase Your Brand
            </IonCardTitle>
            <IonCardTitle v-if="enableEdit">About Our Store</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
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
      </transition>

      <!-- Store Selector -->
      <StoreSelector
        v-if="userstore.stores.length > 0"
        :stores="userstore.stores"
        :selectedStoreId="selectedStoreId"
        @storeSelected="handleStoreSelected"
      />

      <!-- Account Details Popup -->
      <transition name="fade">
        <div
          v-if="showAccountDetails"
          class="account-details-overlay"
          @click.self="closeAccountDetails"
        >
          <div class="account-details-popup">
            <AccountDetailsManager
              :userId="selectedUserId"
              @close="closeAccountDetails"
            />
          </div>
        </div>
      </transition>

      <!-- Segment Buttons -->
      <IonSegment v-model="selectedSegment" class="store-segment">
        <IonSegmentButton value="all">
          <IonLabel>All Products</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="orders">
          <IonLabel>Your Orders</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      <!-- Filters Bar -->
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

      <!-- Product Display -->
      <div class="ProductDisplay" v-if="selectedSegment === 'all'">
        <!-- Featured Products with Collapse/Expand Animation -->
        <transition name="collapse-expand">
          <div v-if="sellersPicks.length">
            <ProductDisplay
              heading="Recommended By This Seller"
              :showDeleteButton="true"
              :products="sellersPicks"
              :userId="authStore.user?.id || 0"
              @deactivateProduct="handleDeactivateProduct"
              @activateProduct="handleActivateProduct"
              @editProduct="handleEditProduct"
              @storefrontClicked="handleStorefrontClicked"
              @sellersPick="handleSellerPick"
            />
          </div>
        </transition>
        <!-- All Products Display -->
        <div>
          <ProductDisplay
            heading="All Products"
            :showDeleteButton="true"
            :products="userstore.filteredProducts"
            :userId="authStore.user?.id || 0"
            @deactivateProduct="handleDeactivateProduct"
            @activateProduct="handleActivateProduct"
            @editProduct="handleEditProduct"
            @addProductToStore="handleStorefrontClicked"
            @removeProductFromStore="handleRemoveProductFromStore"
            @sellersPick="handleSellerPick"
          />
        </div>
      </div>
      <div class="ProductDisplay" v-else-if="selectedSegment === 'orders'">
        <OrdersList :userId="authStore.user?.id || 0" />
      </div>
    </IonContent>

    <!-- Floating Share Toolbar -->
    <div class="floating-share-toolbar" v-if="!showSellDashboard">
      <ShareToolbar
        :enableNavigationToolbar="true"
        :enableShareToolbar="false"
      />
    </div>

    <!-- Sell Product Form Overlay -->
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

    <!-- Add Product Popup Modal -->
    <div
      class="popup-modal"
      v-if="showAddProductPopup"
      @click.self="closeAddProductPopup"
    >
      <div class="modal-content">
        <AddProductToStore
          :product="selectedProduct"
          @close="closeAddProductPopup"
        />
      </div>
    </div>

    <!-- Confirmation Popup -->
    <div v-if="showConfirmationPopup" class="confirmation-popup-overlay">
      <div class="confirmation-popup">
        <h5>Deactivate Product (Not Delete)</h5>
        <p>
          Are you sure you want to deactivate this product? It will no longer be
          visible to customers.
        </p>
        <div class="confirmation-buttons">
          <button class="cancel-button" @click="showConfirmationPopup = false">
            Cancel
          </button>
          <button class="confirm-button" @click="confirmDeactivateProduct">
            Deactivate
          </button>
        </div>
      </div>
    </div>
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
import StoreSelector from "@/components/storeSelector.vue";
import AddProductToStore from "@/components/AddProductToStore.vue";
import OrdersList from "@/components/OrdersList.vue";
import AccountDetailsManager from "@/components/AccountDetailsManager.vue";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { useAuthStore } from "@/stores/authStore";
import { useProductsStore } from "@/stores/sellStore";
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
    StoreSelector,
    AddProductToStore,
    OrdersList,
    AccountDetailsManager,
  },
  setup() {
    const userstore = useUserstoreStore();
    const authStore = useAuthStore();
    const productsStore = useProductsStore();
    const selectedSegment = ref("all");
    const route = useRoute();

    const queryOwnerId = route.query.ownerId
      ? Number(route.query.ownerId)
      : undefined;
    userstore.setOwnerIdFromQuery(queryOwnerId);

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

    const showBrandStory = ref(false);
    function toggleBrandStory() {
      showBrandStory.value = !showBrandStory.value;
    }

    onMounted(async () => {
      await userstore.fetchStore();
      await userstore.getAllStoreProducts();
      await userstore.selectStore(0);
      await userstore.fetchSelectedStoreProducts();
    });

    const sellersPicks = computed(() => {
      return userstore.products.filter(
        (group: any) =>
          group.products &&
          group.products.some((product: any) => product.isSellerPick)
      );
    });

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

    const showConfirmationPopup = ref(false);
    const productToDeactivate = ref<number | null>(null);

    async function handleDeactivateProduct(productId: number) {
      productToDeactivate.value = productId;
      showConfirmationPopup.value = true;
    }

    async function confirmDeactivateProduct() {
      try {
        if (productToDeactivate.value) {
          await productsStore.deactivateProduct(productToDeactivate.value);
          userstore.updateProductInCache(productToDeactivate.value, {
            is_active: false,
          });
          await userstore.fetchSelectedStoreProducts();
        }
      } catch (error) {
        console.error("Failed to deactivate product", error);
      } finally {
        showConfirmationPopup.value = false;
        productToDeactivate.value = null;
      }
    }

    async function handleActivateProduct(productId: number) {
      try {
        await productsStore.activateProduct(productId);
        userstore.updateProductInCache(productId, { is_active: true });
        await userstore.fetchSelectedStoreProducts();
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

    // When a storefront image is clicked, open the AddProductToStore popup.
    const selectedProduct = ref<any>(null);
    const showAddProductPopup = ref(false);
    function handleStorefrontClicked(product: any) {
      selectedProduct.value = product;
      showAddProductPopup.value = true;
    }
    function closeAddProductPopup() {
      showAddProductPopup.value = false;
      selectedProduct.value = null;
    }

    const showSellDashboard = ref(false);
    const sellDashboardContainer = ref<HTMLElement | null>(null);
    function closeSellDashboard() {
      showSellDashboard.value = false;
      productsStore.clearProduct();
    }

    const selectedStoreId = ref<number | null>(
      userstore.selectedStore ? userstore.selectedStore.id : null
    );
    async function handleStoreSelected(storeId: number) {
      await userstore.selectStore(storeId);
      selectedStoreId.value = userstore.selectedStore
        ? userstore.selectedStore.id
        : null;
      await userstore.fetchSelectedStoreProducts();
    }

    async function handleRemoveProductFromStore(productId: number) {
      try {
        await userstore.removeThisProductFromStore(productId);
      } catch (error) {
        console.error("Failed to remove product from store", error);
      }
    }

    const handleSellerPick = async (productId: number) => {
      await userstore.toggleSellerPick(productId);
    };

    const showAccountDetails = ref(false);
    const selectedUserId = ref<number>(0);

    const openPaymentMethods = (userId: number) => {
      selectedUserId.value = userId;
      showAccountDetails.value = true;
    };

    const closeAccountDetails = () => {
      showAccountDetails.value = false;
      selectedUserId.value = 0;
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
      sellersPicks,
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
      handleStoreSelected,
      toggleBrandStory,
      showBrandStory,
      handleStorefrontClicked,
      selectedProduct,
      showAddProductPopup,
      closeAddProductPopup,
      handleRemoveProductFromStore,
      handleSellerPick,
      showConfirmationPopup,
      confirmDeactivateProduct,
      showAccountDetails,
      selectedUserId,
      openPaymentMethods,
      closeAccountDetails,
    };
  },
});
</script>

<style scoped>
.brand-story-card {
  margin: 1rem;
  overflow: hidden;
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
  font-size: 1.1rem;
}
.ProductDisplay {
  padding: 0 15px;
}
.floating-share-toolbar {
  position: fixed;
  bottom: 16px;
  right: 0;
  z-index: 10;
}
.sell-dashboard-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
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
.collapse-expand-enter-active,
.collapse-expand-leave-active {
  transition: max-height 0.5s ease, opacity 0.5s ease;
}
.collapse-expand-enter-from,
.collapse-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.collapse-expand-enter-to,
.collapse-expand-leave-from {
  max-height: 300px;
  opacity: 1;
}
.orders-placeholder {
  text-align: center;
  padding: 2rem;
  color: grey;
  font-size: 1.1rem;
}
/* Popup Modal Styles */
.popup-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.modal-content {
  position: relative;
  width: 100%;
  height: 80%;
  border-radius: 4px;
}

.confirmation-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirmation-popup {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.confirmation-popup h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.confirmation-popup p {
  margin: 0 0 1.5rem 0;
  color: #666;
  line-height: 1.4;
}

.confirmation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button,
.confirm-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.cancel-button {
  background: #f0f0f0;
  color: #666;
}

.confirm-button {
  background: #dc3545;
  color: white;
}

.cancel-button:hover {
  background: #e4e4e4;
}

.confirm-button:hover {
  background: #c82333;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.account-details-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.account-details-popup {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}
</style>

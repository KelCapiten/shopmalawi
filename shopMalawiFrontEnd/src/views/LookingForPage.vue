//src/views/LookingForPage.vue
<template>
  <ion-page>
    <appHeader class="appHeader" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <!-- InquiriesList is displayed when neither form is open -->
      <InquiriesList
        v-if="!showForm && !showSellProductForm"
        :inquiries="inquiries"
        :searchedProducts="results"
        :offeredProducts="products"
        :userId="userId"
        @makeAnOffer="fetchProducOffers"
        @searchQueryUpdated="handleSearchUpdated"
        @searchedProductClicked="handleSearchedProductClicked"
        @offeredProductClicked="navigateToProductPage"
        @removeOfferedProduct="handleRemoveOfferedProduct"
        @editInquiry="handleEditInquiry"
        @deleteInquiry="handleDeleteInquiry"
        @addProduct="toggleSellProductForm"
      />

      <!-- InputForm Overlay (existing) -->
      <transition name="slideForm">
        <div v-if="showForm" ref="formRef">
          <InputForm
            :inquiryToEdit="inquiryToEdit"
            @submit="handleFormSubmit"
          />
        </div>
      </transition>

      <!-- sellProductForm Overlay (new and independent) -->
      <transition name="slideForm">
        <div v-if="showSellProductForm" ref="sellFormRef">
          <x
            submitButtonText="Add Product"
            headingLabel="Add New Product"
            @product-saved="handleSellProductFormSubmit"
            @close-form="toggleSellProductForm"
          />
        </div>
      </transition>

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        :color="toastColor"
      />

      <SavingOverlay :isSaving="isSending || loading" />

      <ion-fab
        vertical="bottom"
        horizontal="end"
        slot="fixed"
        v-if="!showSellProductForm"
      >
        <ion-fab-button @click="toggleForm" color="light" class="large-fab">
          <ion-icon :icon="showForm ? closeCircle : addCircle" />
        </ion-fab-button>
      </ion-fab>

      <ion-loading
        v-if="loading"
        message="Loading inquiries..."
        :is-open="loading"
      />
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, nextTick } from "vue";
import { debounce, navigateToProductPage } from "@/utils/utilities";
import { useAuthStore } from "@/stores/authStore";
import { useInquiries } from "@/composables/useInquiry";
import { useSearch } from "@/composables/useSearch";
import { addCircle, closeCircle } from "ionicons/icons";
import appHeader from "@/components/appHeader.vue";
import appFooter from "@/components/appFooter.vue";
import InquiriesList from "@/components/InquiriesList.vue";
import InputForm from "@/components/InputForm.vue";
import sellProductForm from "@/components/sellProductForm.vue";
import SavingOverlay from "@/components/SavingOverlay.vue";

export default defineComponent({
  name: "LookingForPage",
  components: {
    appHeader,
    appFooter,
    InquiriesList,
    InputForm,
    sellProductForm,
    SavingOverlay,
  },
  setup() {
    const authStore = useAuthStore();
    const userId = ref<number>(authStore.user?.id || 0);

    const {
      inquiries,
      products,
      loading,
      error,
      fetchInquiries,
      deleteInquiry,
      linkProductToInquiry,
      unlinkProductFromInquiry,
      getProductsLinkedToInquiryAndUser,
    } = useInquiries();

    const { results, searchForProductsExcludingOffered } = useSearch();

    // Controls for the two independent overlays
    const showForm = ref<boolean>(false);
    const showSellProductForm = ref<boolean>(false);
    const showToast = ref<boolean>(false);
    const toastMessage = ref<string>("");
    const toastColor = ref<string>("success");
    const isSending = ref<boolean>(false);
    const formRef = ref<HTMLElement | null>(null);
    const sellFormRef = ref<HTMLElement | null>(null);
    const inquiryToEdit = ref<any>(null);

    // Toggle the InputForm overlay
    const toggleForm = (): void => {
      if (showForm.value) {
        inquiryToEdit.value = null;
      }
      showForm.value = !showForm.value;
    };

    // Toggle the sellProductForm overlay
    const toggleSellProductForm = (): void => {
      showSellProductForm.value = !showSellProductForm.value;
    };

    const handleFormSubmit = async (): Promise<void> => {
      inquiryToEdit.value = null;
      showForm.value = false;
      toastMessage.value = "Inquiry saved successfully";
      toastColor.value = "success";
      showToast.value = true;
      await fetchInquiries();
    };

    const handleSellProductFormSubmit = async (): Promise<void> => {
      // Add your custom logic for handling the sellProductForm submission here.
      showSellProductForm.value = false;
      toastMessage.value = "Product added successfully";
      toastColor.value = "success";
      showToast.value = true;
      // Optionally, refresh inquiries or products if needed.
    };

    const fetchProducOffers = async ({
      inquiryId,
    }: {
      inquiryId: number | null;
    }): Promise<void> => {
      if (inquiryId !== null) {
        await getProductsLinkedToInquiryAndUser(inquiryId);
        await searchForProductsExcludingOffered({
          inquiries_id: inquiryId,
          uploaded_by: userId.value,
        });
        lastSearchInquiryId.value = inquiryId;
      }
    };

    const handleSearch = async (payload: {
      inquiries_id: number;
      query: string;
    }): Promise<void> => {
      const { inquiries_id, query } = payload;
      lastSearchInquiryId.value = inquiries_id;
      lastSearchQuery.value = query;
      await searchForProductsExcludingOffered({
        inquiries_id,
        query,
        uploaded_by: userId.value,
      });
    };

    const debouncedSearch = debounce(handleSearch, 1000);

    const handleSearchUpdated = async (payload: {
      inquiries_id: number;
      query: string;
    }) => {
      await debouncedSearch(payload);
    };

    const handleSearchedProductClicked = async ({
      product,
      inquiryId,
    }: {
      product: any;
      inquiryId: number | null;
    }) => {
      if (inquiryId) {
        await linkProductToInquiry(inquiryId, product.id);
        toastMessage.value = "Offer added successfully";
        toastColor.value = "success";
        showToast.value = true;
        if (lastSearchInquiryId.value === inquiryId) {
          await handleSearch({
            inquiries_id: lastSearchInquiryId.value,
            query: lastSearchQuery.value,
          });
        }
        await getProductsLinkedToInquiryAndUser(inquiryId);
      }
    };

    const handleRemoveOfferedProduct = async (payload: {
      inquiryId: number;
      productId: number;
    }) => {
      const { inquiryId, productId } = payload;
      try {
        await unlinkProductFromInquiry(inquiryId, productId);
        toastMessage.value = "Offer removed successfully";
        toastColor.value = "success";
        showToast.value = true;
        await getProductsLinkedToInquiryAndUser(inquiryId);
        if (lastSearchInquiryId.value === inquiryId) {
          await handleSearch({
            inquiries_id: lastSearchInquiryId.value,
            query: lastSearchQuery.value,
          });
        }
      } catch (err) {
        toastMessage.value = "Failed to remove offer";
        toastColor.value = "danger";
        showToast.value = true;
      }
    };

    const handleEditInquiry = (inquiryId: number) => {
      const inquiryItem = inquiries.value.find(
        (inquiry: any) => inquiry.id === inquiryId
      );
      if (inquiryItem) {
        inquiryToEdit.value = { ...inquiryItem };
        showForm.value = true;
      }
    };

    const handleDeleteInquiry = async (inquiryId: number) => {
      try {
        await deleteInquiry(inquiryId);
        toastMessage.value = "Inquiry deleted successfully";
        toastColor.value = "success";
        showToast.value = true;
        await fetchInquiries();
      } catch (err) {
        toastMessage.value = "Failed to delete inquiry";
        toastColor.value = "danger";
        showToast.value = true;
      }
    };

    const lastSearchQuery = ref<string>("");
    const lastSearchInquiryId = ref<number | null>(null);

    watch(showForm, async (value: boolean) => {
      if (value) {
        await nextTick();
        formRef.value?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    watch(error, (err: string | null) => {
      if (err) {
        toastMessage.value = err;
        toastColor.value = "danger";
        showToast.value = true;
      }
    });

    onMounted(() => {
      fetchInquiries();
    });

    return {
      userId,
      inquiries,
      results,
      products,
      showForm,
      showSellProductForm,
      formRef,
      sellFormRef,
      addCircle,
      closeCircle,
      loading,
      error,
      showToast,
      toastMessage,
      toastColor,
      isSending,
      toggleForm,
      toggleSellProductForm,
      fetchProducOffers,
      debouncedSearch,
      handleSearchedProductClicked,
      handleRemoveOfferedProduct,
      handleSearchUpdated,
      navigateToProductPage,
      handleEditInquiry,
      handleDeleteInquiry,
      inquiryToEdit,
      handleFormSubmit,
      handleSellProductFormSubmit,
    };
  },
});
</script>

<style scoped>
.slideForm-enter-active,
.slideForm-leave-active {
  transition: all 0.3s ease;
}
.slideForm-enter-from,
.slideForm-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.slideForm-enter-to,
.slideForm-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.large-fab {
  --ion-icon-size: 2.5rem !important; /* Increased to 2.5rem (40px) and added !important */
}

.large-fab ion-icon {
  font-size: 2.5rem !important; /* Adding direct icon sizing as backup */
  width: 2.5rem !important;
  height: 2.5rem !important;
}
</style>

<template>
  <ion-page>
    <appHeader :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <InquiriesList
        v-if="!showForm"
        :inquiries="inquiries"
        :searchedProducts="results"
        :offeredProducts="products"
        :userId="userId"
        @makeAnOffer="fetchProducOffers"
        @searchQueryUpdated="handleSearchUpdated"
        @searchedProductClicked="handleSearchedProductClicked"
        @offeredProductClicked="navigateToProductPage"
        @removeOfferedProduct="handleRemoveOfferedProduct"
      />

      <transition name="slideForm">
        <div v-if="showForm" ref="formRef" class="form-container">
          <InputForm @submit="handleAddInquiry" />
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

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="toggleForm" color="light">
          <ion-icon :icon="showForm ? close : search" />
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
import { close, search } from "ionicons/icons";
import appHeader from "@/components/appHeader.vue";
import appFooter from "@/components/appFooter.vue";
import InquiriesList from "@/components/InquiriesList.vue";
import InputForm from "@/components/InputForm.vue";
import SavingOverlay from "@/components/SavingOverlay.vue";

export default defineComponent({
  name: "LookingForPage",
  components: {
    appHeader,
    appFooter,
    InquiriesList,
    InputForm,
    SavingOverlay,
  },
  setup() {
    const authStore = useAuthStore();
    const userId = ref<number>(authStore.user?.id || 0);

    const {
      inquiries,
      fetchInquiries,
      addInquiry,
      loading,
      error,
      products,
      linkProductToInquiry,
      unlinkProductFromInquiry,
      getProductsLinkedToInquiryAndUser,
    } = useInquiries();

    const { results, searchForProductsExcludingOffered } = useSearch();

    const showForm = ref<boolean>(false);
    const showToast = ref<boolean>(false);
    const toastMessage = ref<string>("");
    const toastColor = ref<string>("success");
    const isSending = ref<boolean>(false);
    const formRef = ref<HTMLElement | null>(null);

    // Reactive references to store the last search query and inquiry ID
    const lastSearchQuery = ref<string>("");
    const lastSearchInquiryId = ref<number | null>(null);

    const toggleForm = (): void => {
      showForm.value = !showForm.value;
    };

    const handleAddInquiry = async (payload: any): Promise<void> => {
      isSending.value = true;
      try {
        await addInquiry(payload);
        toastMessage.value = "Inquiry added successfully";
        toastColor.value = "success";
        showToast.value = true;
        showForm.value = false;
      } catch (err) {
        toastMessage.value = "Failed to add inquiry";
        toastColor.value = "danger";
        showToast.value = true;
      } finally {
        isSending.value = false;
      }
    };

    const fetchProducOffers = async ({
      inquiryId,
    }: {
      inquiryId: number | null;
    }): Promise<void> => {
      if (inquiryId !== null) {
        await getProductsLinkedToInquiryAndUser(inquiryId, userId.value);
        await searchForProductsExcludingOffered({
          inquiries_id: inquiryId,
          uploaded_by: userId.value,
        });
        // Store the current inquiry ID for search refresh
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

        // After linking, refresh the search results
        if (lastSearchInquiryId.value === inquiryId) {
          await handleSearch({
            inquiries_id: lastSearchInquiryId.value,
            query: lastSearchQuery.value,
          });
        }

        // Refresh the offered products for the specific inquiry
        await getProductsLinkedToInquiryAndUser(inquiryId, userId.value);
      }
    };

    const handleRemoveOfferedProduct = async ({
      inquiryId,
      productId,
    }: {
      inquiryId: number;
      productId: number;
    }) => {
      try {
        await unlinkProductFromInquiry(inquiryId, productId);
        toastMessage.value = "Offer removed successfully";
        toastColor.value = "success";
        showToast.value = true;

        // Refresh the offered products for the specific inquiry
        await getProductsLinkedToInquiryAndUser(inquiryId, userId.value);

        // After linking, refresh the search results
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
      formRef,
      close,
      search,
      loading,
      error,
      showToast,
      toastMessage,
      toastColor,
      isSending,
      toggleForm,
      handleAddInquiry,
      fetchProducOffers,
      debouncedSearch,
      handleSearchedProductClicked,
      handleRemoveOfferedProduct,
      handleSearchUpdated,
      navigateToProductPage,
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
.form-container {
  margin-top: 1rem;
}
</style>

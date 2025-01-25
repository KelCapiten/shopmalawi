<template>
  <ion-page>
    <AppHeader :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <InquiriesList :inquiries="inquiries" />

      <div ref="formSection">
        <InputForm
          v-if="showForm"
          :subcategories="subcategories"
          @inquiry-sent="handleInquirySent"
        />
      </div>

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        :color="toastColor"
      ></ion-toast>

      <SavingOverlay :isSaving="isSending" />

      <!-- Floating button to toggle the form view -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="toggleForm" color="light">
          <ion-icon :icon="showForm ? close : search"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>

    <AppFooter />
  </ion-page>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import AppFooter from "@/components/footer.vue";
import AppHeader from "@/components/header.vue";
import SavingOverlay from "@/components/SavingOverlay.vue";
import InputForm from "@/components/InputForm.vue";
import InquiriesList from "@/components/InquiriesList.vue";
import { search, close } from "ionicons/icons";

interface Inquiry {
  id: number;
  name: string;
  description: string;
  category_name: string;
  stock_quantity: number;
  status: string;
  images: {
    image_path: string;
    is_primary: boolean;
  }[];
}

interface Category {
  id: number;
  name: string;
  subcategories?: Category[];
}

export default defineComponent({
  name: "LookingForPage",
  components: {
    AppFooter,
    AppHeader,
    SavingOverlay,
    InputForm,
    InquiriesList, // Register the new component
  },
  setup() {
    const categories = ref<Category[]>([]);
    const subcategories = ref<Category[]>([]);
    const inquiries = ref<Inquiry[]>([]);
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const isSending = ref(false);
    const showForm = ref(false);
    const formSection = ref<HTMLElement | null>(null);

    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/categories/getCategories"
        );
        categories.value = response.data;
        subcategories.value = categories.value
          .flatMap((category) =>
            category.subcategories?.length ? category.subcategories : [category]
          )
          .sort((a, b) => a.name.localeCompare(b.name));
      } catch (error) {
        console.error("Error fetching categories:", error);
        toastMessage.value = "Failed to fetch categories.";
        toastColor.value = "danger";
        showToast.value = true;
      }
    };

    const fetchInquiries = async () => {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;
        const response = await axios.get(
          "http://localhost:1994/api/inquiries/getInquiries",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        inquiries.value = response.data;
      } catch (error) {
        console.error("Error fetching inquiries:", error);
        toastMessage.value = "Failed to fetch inquiries.";
        toastColor.value = "danger";
        showToast.value = true;
      }
    };

    const handleInquirySent = (result: { message: string; color: string }) => {
      toastMessage.value = result.message;
      toastColor.value = result.color;
      showToast.value = true;
      if (result.color === "success") {
        fetchInquiries();
      }
    };

    const toggleForm = () => {
      showForm.value = !showForm.value; // Toggle form visibility
      if (showForm.value) {
        setTimeout(() => {
          formSection.value?.scrollIntoView({ behavior: "smooth" }); // Scroll to the form
        }, 100);
      }
    };

    onMounted(() => {
      fetchCategories();
      fetchInquiries();
    });

    return {
      inquiries,
      subcategories,
      showToast,
      toastMessage,
      toastColor,
      isSending,
      handleInquirySent,
      showForm,
      formSection,
      toggleForm,
      search, // Add the search icon
      close, // Add the close icon
    };
  },
});
</script>

<style scoped>
/* Add styles specific to the page here */
</style>

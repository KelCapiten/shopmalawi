<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <!-- Display all inquiries -->
      <div class="inquiries-container">
        <h5>Do you have any of these for sale?</h5>
        <div v-if="inquiries.length > 0" class="inquiries-list">
          <div
            class="inquiry-card"
            v-for="inquiry in inquiries"
            :key="inquiry.id"
          >
            <!-- Name with quantity needed in parentheses -->
            <h3>{{ inquiry.name }} ({{ inquiry.stock_quantity }} needed)</h3>

            <!-- Display images -->
            <div class="inquiry-images">
              <div class="image-grid">
                <div
                  v-for="(image, index) in inquiry.images"
                  :key="index"
                  class="image-item"
                >
                  <img
                    :src="`http://localhost:1994${image.image_path}`"
                    :alt="`Image ${index + 1}`"
                    class="inquiry-image"
                  />
                </div>
              </div>
            </div>

            <!-- Description -->
            <p>
              <strong>I'm looking for,</strong> {{ inquiry.name }}.
              {{ inquiry.description }}
            </p>
          </div>
        </div>
        <p v-else>No inquiries found.</p>
      </div>

      <!-- Use the InputForm component -->
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
import AppFooter from "../components/footer.vue";
import AppHeader from "../components/header.vue";
import SavingOverlay from "../components/SavingOverlay.vue";
import InputForm from "@/components/InputForm.vue";
import { search, close } from "ionicons/icons"; // Import icons

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
  },
  setup() {
    const categories = ref<Category[]>([]);
    const subcategories = ref<Category[]>([]);
    const inquiries = ref<Inquiry[]>([]);
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const isSending = ref(false);
    const showForm = ref(false); // Control form visibility
    const formSection = ref<HTMLElement | null>(null); // Reference to the form section

    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/products/getCategories"
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
          "http://localhost:1994/api/products/getInquiries",
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
.inquiries-container {
  margin-bottom: 20px;
}

.inquiries-container h2 {
  margin-bottom: 10px;
}

.inquiries-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inquiry-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  background-color: #f9f9f9;
}

.inquiry-card h3 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.inquiry-images {
  margin-top: 10px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inquiry-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}
</style>

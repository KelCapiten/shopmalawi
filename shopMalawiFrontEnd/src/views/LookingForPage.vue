<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <!-- Display all inquiries -->
      <div class="inquiries-container">
        <h2>All Inquiries</h2>
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
                  <span v-if="image.is_primary" class="primary-badge"
                    >Primary</span
                  >
                </div>
              </div>
            </div>

            <!-- Description -->
            <p><strong>Description:</strong> {{ inquiry.description }}</p>
          </div>
        </div>
        <p v-else>No inquiries found.</p>
      </div>

      <!-- Use the InputForm component -->
      <InputForm
        :subcategories="subcategories"
        @inquiry-sent="handleInquirySent"
      />

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        :color="toastColor"
      ></ion-toast>

      <SavingOverlay :isSaving="isSending" />
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
import InputForm from "@/components/InputForm.vue"; // Import the new component

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
    InputForm, // Register the new component
  },
  setup() {
    const categories = ref<Category[]>([]);
    const subcategories = ref<Category[]>([]);
    const inquiries = ref<Inquiry[]>([]);
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const isSending = ref(false);

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
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}
.image-item {
  position: relative;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
}
.inquiry-image {
  width: 100%;
  height: auto;
  display: block;
}
.primary-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(0, 123, 255, 0.8);
  color: white;
  font-size: 0.75rem;
  padding: 2px 5px;
  border-radius: 3px;
}
</style>

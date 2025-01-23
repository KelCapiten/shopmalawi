<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <div class="form-container">
        <label class="form-label">What item are you looking for?</label>

        <!-- Image Uploader -->
        <ImageUploader @files-selected="handleFilesSelected" />

        <!-- Item Name -->
        <div class="form-group">
          <label class="form-label">Item Name</label>
          <ion-input
            class="form-input"
            v-model="inquiry.name"
            placeholder="Enter the name of the item you're looking for"
            required
          ></ion-input>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">Description</label>
          <ion-textarea
            class="form-input textarea"
            v-model="inquiry.description"
            placeholder="Provide details about the item (e.g., size, color, brand)"
            :rows="5"
            required
          ></ion-textarea>
        </div>

        <!-- Submit Button -->
        <ion-button
          expand="block"
          class="submit-button"
          color="primary"
          @click="sendInquiry"
          :disabled="isSending"
        >
          Send Inquiry
        </ion-button>
      </div>

      <!-- Toast -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        :color="toastColor"
      ></ion-toast>

      <!-- Saving Overlay -->
      <SavingOverlay :isSaving="isSending" />
    </ion-content>

    <!-- Footer -->
    <AppFooter />
  </ion-page>
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/stores/authStore";
import AppFooter from "../components/footer.vue";
import AppHeader from "../components/header.vue";
import SavingOverlay from "../components/SavingOverlay.vue";
import ImageUploader from "@/components/ImageUploader.vue";

interface Inquiry {
  name: string;
  description: string;
}

export default defineComponent({
  name: "LookingForPage",
  components: {
    AppFooter,
    AppHeader,
    SavingOverlay,
    ImageUploader,
  },
  setup() {
    const inquiry = ref<Inquiry>({
      name: "",
      description: "",
    });

    const files = ref<File[]>([]); // Store uploaded files
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const isSending = ref(false);

    const handleFilesSelected = (selectedFiles: File[]) => {
      files.value = selectedFiles;
    };

    const sendInquiry = async () => {
      const authStore = useAuthStore();

      if (!inquiry.value.name || !inquiry.value.description) {
        toastMessage.value = "Please fill all fields with valid data.";
        toastColor.value = "danger";
        showToast.value = true;
        return;
      }

      if (files.value.length === 0) {
        toastMessage.value = "Please upload at least one image.";
        toastColor.value = "danger";
        showToast.value = true;
        return;
      }

      const formData = new FormData();
      formData.append("name", inquiry.value.name);
      formData.append("description", inquiry.value.description);

      files.value.forEach((file) => {
        formData.append("images", file);
      });

      isSending.value = true;

      try {
        const token = authStore.token;
        if (!token) {
          toastMessage.value =
            "Authentication token is missing. Please log in.";
          toastColor.value = "danger";
          showToast.value = true;
          return;
        }

        await axios.post(
          "http://localhost:1994/api/inquiries/sendInquiry",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toastMessage.value = "Inquiry sent successfully!";
        toastColor.value = "success";
        showToast.value = true;

        // Reset form
        inquiry.value = {
          name: "",
          description: "",
        };
        files.value = [];
      } catch (error) {
        console.error("Error sending inquiry:", error);

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          console.error("Server response:", axiosError.response?.data);
        }

        toastMessage.value = "Failed to send inquiry. Please try again.";
        toastColor.value = "danger";
        showToast.value = true;
      } finally {
        isSending.value = false;
      }
    };

    return {
      inquiry,
      files,
      showToast,
      toastMessage,
      toastColor,
      isSending,
      handleFilesSelected,
      sendInquiry,
    };
  },
});
</script>

<style scoped>
.form-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
  font-size: 0.9rem;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
  font-size: 0.9rem;
}

.textarea {
  resize: none;
  padding-top: 5px;
  text-align: start;
}

.submit-button {
  margin-top: 10px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
}
</style>

<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <div class="form-container">
        <label class="form-label">What would you like to sell?</label>

        <!-- Reference to ImageUploader so we can call clearImages() -->
        <ImageUploader
          ref="imageUploaderRef"
          @files-selected="handleFilesSelected"
        />

        <!-- Item Name -->
        <div class="form-group">
          <label class="form-label">Item Name</label>
          <ion-input
            class="form-input"
            v-model="item.name"
            placeholder="Enter item name"
            required
          ></ion-input>
        </div>

        <!-- Price -->
        <div class="form-group">
          <label class="form-label">Price</label>
          <ion-input
            class="form-input"
            :value="priceInput"
            type="number"
            placeholder="Enter price"
            required
            @ionInput="handlePriceInput"
          ></ion-input>
        </div>

        <!-- Category -->
        <div class="form-group">
          <label class="form-label">Category</label>
          <ion-select
            class="form-input"
            v-model="item.category"
            placeholder="Select category"
            required
          >
            <ion-select-option
              v-for="subcategory in subcategories"
              :key="subcategory.id"
              :value="subcategory.id"
            >
              {{ subcategory.name }}
            </ion-select-option>
          </ion-select>
        </div>

        <!-- Stock Quantity -->
        <div class="form-group">
          <label class="form-label">How many do you have for sale?</label>
          <ion-input
            class="form-input"
            type="number"
            v-model="item.stockQuantity"
            placeholder="Enter stock quantity"
            required
          ></ion-input>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">Description</label>
          <ion-textarea
            class="form-input textarea"
            v-model="item.description"
            placeholder="Enter a brief description"
            :rows="5"
            required
          ></ion-textarea>
        </div>

        <!-- Submit Button -->
        <ion-button
          expand="block"
          class="submit-button"
          color="primary"
          @click="submitItem"
          :disabled="isSaving"
        >
          Sell Item
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
      <SavingOverlay :isSaving="isSaving" />
    </ion-content>

    <!-- Footer -->
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
import ImageUploader from "@/components/ImageUploader.vue";

interface Item {
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
}

interface Category {
  id: string;
  name: string;
  subcategories: Category[];
}

export default defineComponent({
  name: "SellDashboard",
  components: {
    AppFooter,
    AppHeader,
    SavingOverlay,
    ImageUploader,
  },
  setup() {
    // Main item state
    const item = ref<Item>({
      name: "",
      description: "",
      price: 0,
      category: "",
      stockQuantity: 0,
    });

    // Files selected in the ImageUploader
    const files = ref<File[]>([]);

    // UI states
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const priceInput = ref<string>("");
    const isSaving = ref(false);

    // Categories -> subcategories
    const categories = ref<Category[]>([]);
    const subcategories = ref<Category[]>([]);

    // Reference to ImageUploader to clear images after submission
    const imageUploaderRef = ref<InstanceType<typeof ImageUploader> | null>(
      null
    );

    // Fetch categories on mount
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

    onMounted(() => {
      fetchCategories();
    });

    /**
     * Called when ImageUploader emits `files-selected`.
     * We overwrite the local file array.
     */
    const handleFilesSelected = (selectedFiles: File[]) => {
      files.value = selectedFiles;
    };

    /**
     * Called when user inputs a price.
     * We parse it as a float for `item.value.price`.
     */
    const handlePriceInput = (event: CustomEvent) => {
      const value = event.detail.value;
      priceInput.value = value;
      const parsedValue = parseFloat(value);
      item.value.price = isNaN(parsedValue) ? 0 : parsedValue;
    };

    /**
     * Submits the product (item) to the server.
     */
    const submitItem = async () => {
      // Basic validation
      if (
        !item.value.name ||
        !item.value.description ||
        item.value.price <= 0 ||
        !item.value.category
      ) {
        showErrorToast("Please fill all fields with valid data.");
        return;
      }

      if (files.value.length === 0) {
        showErrorToast("Please upload at least one image.");
        return;
      }

      isSaving.value = true;

      try {
        // Make sure we have a token
        const authStore = useAuthStore();
        const token = authStore.token;
        if (!token) {
          showErrorToast("Authentication token is missing. Please log in.");
          return;
        }

        // Build FormData
        const formData = new FormData();
        formData.append("name", item.value.name);
        formData.append("description", item.value.description);
        formData.append("price", item.value.price.toString());
        formData.append("category_id", item.value.category);
        formData.append("stockQuantity", item.value.stockQuantity.toString());

        // Append images
        files.value.forEach((file) => {
          formData.append("images", file);
        });

        // Send the request
        await axios.post(
          "http://localhost:1994/api/products/addProduct",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // On success
        showSuccessToast("Item added successfully!");

        // Reset the form
        item.value = {
          name: "",
          description: "",
          price: 0,
          category: "",
          stockQuantity: 0,
        };
        priceInput.value = "";
        files.value = [];

        // Also clear images in the ImageUploader
        imageUploaderRef.value?.clearImages();
      } catch (error) {
        console.error("Error adding item:", error);
        if (axios.isAxiosError(error)) {
          console.error("Server response:", error.response?.data);
        }
        showErrorToast("Failed to add item. Please try again.");
      } finally {
        isSaving.value = false;
      }
    };

    /**
     * Helper to show an error toast
     */
    const showErrorToast = (message: string) => {
      toastMessage.value = message;
      toastColor.value = "danger";
      showToast.value = true;
    };

    /**
     * Helper to show a success toast
     */
    const showSuccessToast = (message: string) => {
      toastMessage.value = message;
      toastColor.value = "success";
      showToast.value = true;
    };

    return {
      // Reactive states
      item,
      files,
      showToast,
      toastMessage,
      toastColor,
      priceInput,
      isSaving,
      categories,
      subcategories,

      // Refs
      imageUploaderRef,

      // Methods
      handleFilesSelected,
      handlePriceInput,
      submitItem,
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

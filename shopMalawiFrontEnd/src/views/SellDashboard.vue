<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <div class="form-container">
        <h2 class="form-title">Sell Your Item</h2>

        <!-- Image Uploader -->
        <ImageUploader @files-selected="handleFilesSelected" />

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
import axios, { AxiosError } from "axios";
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
    ImageUploader, // Register the new component
  },
  setup() {
    const item = ref<Item>({
      name: "",
      description: "",
      price: 0,
      category: "",
      stockQuantity: 0,
    });

    const files = ref<File[]>([]); // Store uploaded files
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const priceInput = ref<string>("");
    const isSaving = ref(false);
    const categories = ref<Category[]>([]);
    const subcategories = ref<Category[]>([]);

    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/products/getCategories"
        );
        categories.value = response.data;

        // Extract all subcategories
        subcategories.value = categories.value.flatMap(
          (category) => category.subcategories || []
        );
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

    const handleFilesSelected = (selectedFiles: File[]) => {
      files.value = selectedFiles;
    };

    const handlePriceInput = (event: CustomEvent) => {
      const value = event.detail.value;
      priceInput.value = value;
      const parsedValue = parseFloat(value);
      item.value.price = isNaN(parsedValue) ? 0 : parsedValue;
    };

    const submitItem = async () => {
      const authStore = useAuthStore();

      if (
        !item.value.name ||
        !item.value.description ||
        item.value.price <= 0 ||
        !item.value.category
      ) {
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
      formData.append("name", item.value.name);
      formData.append("description", item.value.description);
      formData.append("price", item.value.price.toString());
      formData.append("categoryId", item.value.category);
      formData.append("stockQuantity", item.value.stockQuantity.toString());

      files.value.forEach((file) => {
        formData.append("images", file);
      });

      isSaving.value = true;

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
          "http://localhost:1994/api/products/addProducts",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        toastMessage.value = "Item added successfully!";
        toastColor.value = "success";
        showToast.value = true;

        // Reset form
        item.value = {
          name: "",
          description: "",
          price: 0,
          category: "",
          stockQuantity: 0,
        };
        priceInput.value = "";
        files.value = [];
      } catch (error) {
        console.error("Error adding item:", error);

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          console.error("Server response:", axiosError.response?.data);
        }

        toastMessage.value = "Failed to add item. Please try again.";
        toastColor.value = "danger";
        showToast.value = true;
      } finally {
        isSaving.value = false;
      }
    };

    return {
      item,
      files,
      showToast,
      toastMessage,
      toastColor,
      priceInput,
      isSaving,
      subcategories,
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

//src/views/SellDashboard.vue
<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <div class="form-container">
        <label class="form-label">What would you like to sell?</label>

        <ImageUploader
          ref="imageUploaderRef"
          @uploaded-images="handleFilesSelected"
        />

        <!-- Item Name -->
        <div class="form-group">
          <label class="form-label">Item Name</label>
          <ion-input
            class="form-input"
            v-model="productStore.product.name"
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
            v-model="productStore.product.categoryId"
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
          <!-- Display categories loading and error messages -->
          <div v-if="categoriesLoading" class="loading-message">
            Loading categories...
          </div>
          <div v-if="categoriesError" class="error-message">
            {{ categoriesError }}
          </div>
        </div>

        <!-- Stock Quantity -->
        <div class="form-group">
          <label class="form-label">How many do you have for sale?</label>
          <ion-input
            class="form-input"
            type="number"
            v-model.number="productStore.product.stockQuantity"
            placeholder="Enter stock quantity"
            required
          ></ion-input>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">Description</label>
          <ion-textarea
            class="form-input textarea"
            v-model="productStore.product.description"
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
          :disabled="productStore.isSaving"
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
      <SavingOverlay :isSaving="productStore.isSaving" />
    </ion-content>

    <!-- Footer -->
    <AppFooter />
  </ion-page>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted, computed } from "vue";
import { useProductsStore } from "@/stores/productsStore";
import AppFooter from "../components/appFooter.vue";
import AppHeader from "../components/appHeader.vue";
import SavingOverlay from "../components/SavingOverlay.vue";
import ImageUploader from "@/components/ImageUploader.vue";
import { useCategories } from "@/composables/useCategories";
import { computeSubcategories } from "@/utils/utilities";

export default defineComponent({
  name: "SellDashboard",
  components: {
    AppFooter,
    AppHeader,
    SavingOverlay,
    ImageUploader,
  },
  setup() {
    const productStore = useProductsStore();

    // Files selected in the ImageUploader
    const files = ref<File[]>([]);

    // UI states for toast
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const priceInput = ref("");

    // Use the useCategories composable and alias its loading and error properties
    const {
      categories,
      isLoading: categoriesLoading,
      error: categoriesError,
      fetchCategories,
    } = useCategories();

    // Compute subcategories using the utility function
    const subcategories = computed(() =>
      computeSubcategories(categories.value)
    );

    // Fetch categories on mount
    onMounted(() => {
      fetchCategories();
    });

    // Reference to ImageUploader
    const imageUploaderRef = ref<InstanceType<typeof ImageUploader> | null>(
      null
    );

    const handleFilesSelected = (selectedFiles: File[]) => {
      files.value = selectedFiles;
    };

    const handlePriceInput = (event: CustomEvent) => {
      const value = event.detail.value;
      priceInput.value = value;
      const parsedValue = parseFloat(value);
      productStore.product.price = isNaN(parsedValue) ? 0 : parsedValue;
    };

    const submitItem = async () => {
      // Basic validation
      if (
        !productStore.product.name ||
        !productStore.product.description ||
        productStore.product.price <= 0 ||
        !productStore.product.categoryId
      ) {
        showErrorToast("Please fill all fields with valid data.");
        return;
      }

      if (files.value.length === 0) {
        showErrorToast("Please upload at least one image.");
        return;
      }

      // Update product images in the store
      productStore.setImages(files.value);

      try {
        await productStore.submitProduct();
        showSuccessToast(productStore.successMessage);
        // Reset local file state and clear images in the uploader
        files.value = [];
        imageUploaderRef.value?.clearImages();
      } catch (error) {
        console.error("Error adding item:", error);
        showErrorToast(
          productStore.error || "Failed to add item. Please try again."
        );
      }
    };

    const showErrorToast = (message: string) => {
      toastMessage.value = message;
      toastColor.value = "danger";
      showToast.value = true;
    };

    const showSuccessToast = (message: string) => {
      toastMessage.value = message;
      toastColor.value = "success";
      showToast.value = true;
    };

    return {
      productStore,
      showToast,
      toastMessage,
      toastColor,
      priceInput,
      files,
      subcategories,
      imageUploaderRef,
      categoriesLoading,
      categoriesError,
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

.loading-message {
  margin-top: 5px;
  color: #888;
  font-size: 0.8rem;
}

.error-message {
  margin-top: 5px;
  color: red;
  font-size: 0.8rem;
}
</style>

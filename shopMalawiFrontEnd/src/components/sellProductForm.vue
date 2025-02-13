//src/components/sellProductForm.vue
<template>
  <div class="form-container">
    <div class="form-header">
      <label class="form-label">{{ headingLabel }}</label>
      <ion-button class="close-button" fill="clear" @click="closeForm">
        <ion-icon :icon="closeCircle" class="close-icon" />
      </ion-button>
    </div>

    <ImageUploader
      ref="imageUploaderRef"
      :initialImages="initialImages"
      @uploaded-images="handleFilesSelected"
    />

    <div class="form-group">
      <label class="form-label">Item Name</label>
      <ion-input
        class="form-input"
        v-model="productStore.product.name"
        placeholder="Enter item name"
        required
      ></ion-input>
    </div>

    <div class="form-group">
      <label class="form-label">Price</label>
      <ion-input
        class="form-input"
        v-model="priceInput"
        type="number"
        placeholder="Enter price"
        required
      ></ion-input>
    </div>

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
      <div v-if="categoriesLoading" class="loading-message">
        Loading categories...
      </div>
      <div v-if="categoriesError" class="error-message">
        {{ categoriesError }}
      </div>
    </div>

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

    <ion-button
      expand="block"
      class="submit-button"
      color="primary"
      @click="submitItem"
      :disabled="productStore.isSaving"
    >
      {{ submitButtonText }}
    </ion-button>
  </div>

  <ion-toast
    :is-open="showToast"
    :message="toastMessage"
    :duration="2000"
    @didDismiss="showToast = false"
    :color="toastColor"
  ></ion-toast>

  <SavingOverlay :isSaving="productStore.isSaving" />
</template>

<script lang="ts">
import { ref, defineComponent, onMounted, computed } from "vue";
import { useProductsStore } from "@/stores/productsStore";
import ImageUploader from "@/components/ImageUploader.vue";
import SavingOverlay from "@/components/SavingOverlay.vue";
import { useCategories } from "@/composables/useCategories";
import { computeSubcategories, getImageUrl } from "@/utils/utilities";
import { closeCircle } from "ionicons/icons";

export default defineComponent({
  name: "SellItemForm",
  props: {
    headingLabel: {
      type: String,
      default: "What would you like to sell?",
    },
    submitButtonText: {
      type: String,
      default: "Sell Item",
    },
  },
  components: {
    ImageUploader,
    SavingOverlay,
  },
  emits: ["product-saved", "close-form"],
  setup(_, { emit }) {
    const productStore = useProductsStore();
    const files = ref<File[]>([]);
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");

    const {
      categories,
      isLoading: categoriesLoading,
      error: categoriesError,
      fetchCategories,
    } = useCategories();

    const subcategories = computed(() =>
      computeSubcategories(categories.value)
    );

    onMounted(() => {
      fetchCategories();
    });

    const initialImages = computed(() => {
      if (
        productStore.product.images &&
        productStore.product.images.length > 0
      ) {
        return productStore.product.images.map((img: any) => ({
          url: getImageUrl(img.image_path),
        }));
      }
      return [];
    });

    const imageUploaderRef = ref<InstanceType<typeof ImageUploader> | null>(
      null
    );
    const handleFilesSelected = (selectedFiles: File[]) => {
      files.value = selectedFiles;
    };

    const priceInput = computed({
      get() {
        return productStore.product.price
          ? productStore.product.price.toString()
          : "";
      },
      set(value: string) {
        const parsedValue = parseFloat(value);
        productStore.product.price = isNaN(parsedValue) ? 0 : parsedValue;
      },
    });

    const submitItem = async () => {
      if (
        !productStore.product.name ||
        !productStore.product.description ||
        productStore.product.price <= 0 ||
        !productStore.product.categoryId
      ) {
        showErrorToast("Please fill all fields with valid data.");
        return;
      }
      if (!productStore.product.id && files.value.length === 0) {
        showErrorToast("Please upload at least one image.");
        return;
      }
      if (files.value.length > 0) {
        productStore.setImages(files.value);
      }
      try {
        await productStore.submitProduct();
        showSuccessToast(productStore.successMessage);
        files.value = [];
        imageUploaderRef.value?.clearImages();
        emit("product-saved");
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

    const closeForm = () => {
      emit("close-form");
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
      submitItem,
      initialImages,
      closeForm,
      closeCircle,
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
.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.close-button {
  --padding-start: 0;
  --padding-end: 0;
}
.close-icon {
  color: red;
  font-size: 24px;
}
</style>

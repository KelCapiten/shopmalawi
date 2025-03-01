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
      <!-- Rich Text Editor Toolbar -->
      <div class="rich-text-toolbar">
        <ion-button
          fill="clear"
          size="small"
          class="format-btn"
          @click="applyFormatting('bold')"
        >
          <span class="bold-text">B</span>
        </ion-button>
        <ion-button
          fill="clear"
          size="small"
          class="format-btn"
          @click="applyFormatting('bullet')"
        >
          <ion-icon :icon="list" />
        </ion-button>
        <ion-button
          fill="clear"
          size="small"
          class="format-btn"
          @click="applyFormatting('number')"
        >
          <ion-icon :icon="reorderFour" />
        </ion-button>
        <div class="emoji-picker-toggle">
          <ion-button
            fill="clear"
            size="small"
            class="format-btn"
            @click="toggleEmojiPicker"
          >
            <ion-icon :icon="happy" />
          </ion-button>
          <div v-if="showEmojiPicker" class="emoji-picker">
            <div class="emoji-grid">
              <button
                v-for="emoji in commonEmojis"
                :key="emoji"
                @click="insertEmoji(emoji)"
                class="emoji-btn"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rich Text Editor -->
      <div
        class="rich-text-editor"
        contenteditable="true"
        ref="descriptionEditor"
        @input="updateDescription"
        @blur="handleEditorBlur"
        @focus="handleEditorFocus"
        :placeholder="
          !editorFocused && !hasContent ? 'Enter a brief description' : ''
        "
      ></div>
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
import { ref, defineComponent, onMounted, computed, watch } from "vue";
import { useProductsStore } from "@/stores/sellStore";
import ImageUploader from "@/components/ImageUploader.vue";
import SavingOverlay from "@/components/SavingOverlay.vue";
import { useCategories } from "@/composables/useCategories";
import { computeSubcategories, updateImageUrl } from "@/utils/utilities";
import { closeCircle, list, reorderFour, happy } from "ionicons/icons";

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
    const descriptionEditor = ref<HTMLElement | null>(null);
    const showEmojiPicker = ref(false);
    const editorFocused = ref(false);
    const hasContent = ref(false);

    // Common emojis for the picker
    const commonEmojis = [
      "😀",
      "😊",
      "👍",
      "🎉",
      "✨",
      "⭐",
      "🔥",
      "❤️",
      "👀",
      "🙌",
      "💯",
      "✅",
      "⚠️",
      "🛍️",
      "🎁",
      "💰",
    ];

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
      // Initialize editor with any existing description content
      if (productStore.product.description && descriptionEditor.value) {
        descriptionEditor.value.innerHTML = productStore.product.description;
        hasContent.value = true;
      }
    });

    // Watch for changes in the product description
    watch(
      () => productStore.product.description,
      (newVal) => {
        if (
          newVal &&
          descriptionEditor.value &&
          descriptionEditor.value.innerHTML !== newVal
        ) {
          descriptionEditor.value.innerHTML = newVal;
          hasContent.value = !!newVal;
        }
      }
    );

    const initialImages = computed(() => {
      if (
        productStore.product.images &&
        productStore.product.images.length > 0
      ) {
        return productStore.product.images.map((img: any) => ({
          url: updateImageUrl(img.image_path),
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

    // Rich text editor functions
    const applyFormatting = (format: string) => {
      if (!document) return;

      switch (format) {
        case "bold":
          document.execCommand("bold", false);
          break;
        case "bullet":
          document.execCommand("insertUnorderedList", false);
          break;
        case "number":
          document.execCommand("insertOrderedList", false);
          break;
      }
      // Focus back on the editor after applying formatting
      if (descriptionEditor.value) {
        descriptionEditor.value.focus();
      }
    };

    const toggleEmojiPicker = () => {
      showEmojiPicker.value = !showEmojiPicker.value;
    };

    const insertEmoji = (emoji: string) => {
      if (document && descriptionEditor.value) {
        document.execCommand("insertText", false, emoji);
        showEmojiPicker.value = false;
        descriptionEditor.value.focus();
      }
    };

    const updateDescription = () => {
      if (descriptionEditor.value) {
        productStore.product.description = descriptionEditor.value.innerHTML;
        hasContent.value = !!descriptionEditor.value.textContent?.trim();
      }
    };

    const handleEditorFocus = () => {
      editorFocused.value = true;
    };

    const handleEditorBlur = () => {
      editorFocused.value = false;
    };

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
        if (descriptionEditor.value) {
          descriptionEditor.value.innerHTML = "";
          hasContent.value = false;
        }
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
      // Rich text editor
      descriptionEditor,
      applyFormatting,
      updateDescription,
      showEmojiPicker,
      toggleEmojiPicker,
      insertEmoji,
      commonEmojis,
      list,
      reorderFour,
      happy,
      editorFocused,
      hasContent,
      handleEditorFocus,
      handleEditorBlur,
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

/* Rich Text Editor Styles */
.rich-text-toolbar {
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
  padding: 5px;
  border: 1px solid #ccc;
  border-bottom: none;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  background-color: #f5f5f5;
}
.format-btn {
  height: 30px;
  font-size: 14px;
  --padding-start: 8px;
  --padding-end: 8px;
  --color: #333;
}
.rich-text-editor {
  width: 100%;
  min-height: 120px;
  max-height: 300px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 0 0 5px 5px;
  background-color: #f9f9f9;
  font-size: 0.9rem;
  overflow-y: auto;
  line-height: 1.5;
}
.rich-text-editor:focus {
  outline: none;
  border-color: var(--ion-color-primary);
}
.rich-text-editor[placeholder]:empty:before {
  content: attr(placeholder);
  color: #999;
}
.emoji-picker-toggle {
  position: relative;
}
.emoji-picker {
  position: absolute;
  top: 40px;
  left: 0;
  z-index: 100;
  padding: 10px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 200px;
}
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}
.emoji-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 3px;
}
.emoji-btn:hover {
  background-color: #f0f0f0;
}
.bold-text {
  font-weight: bold;
  font-size: 16px;
}
</style>

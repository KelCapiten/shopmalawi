//src/components/InputForm.vue
<template>
  <div class="form-container">
    <label class="form-label">
      Let the community help you find the item you are looking for.
    </label>

    <ImageUploader
      ref="imageUploaderRef"
      label="What are you looking for?"
      @uploaded-images="handleFilesSelected"
    />

    <div class="form-group">
      <label class="form-label">Item Name</label>
      <div class="autofill-container">
        <ion-input
          class="form-input"
          v-model="inquiry.name"
          placeholder="Enter the name of the item you're looking for"
          required
          aria-label="Item Name"
          @ionInput="handleNameInput"
          @ionFocus="showSuggestions = true"
        ></ion-input>
        <div
          v-if="showSuggestions && suggestions.length > 0"
          class="suggestions-list"
        >
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.id"
            class="suggestion-item"
            @click="selectSuggestion(suggestion)"
          >
            <span>{{ suggestion.name }}</span>
            <small>{{ suggestion.category_name }}</small>
          </div>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">What product category is it?</label>
      <ion-select
        class="form-input"
        v-model="inquiry.category_id"
        placeholder="Select a subcategory"
        required
        aria-label="Subcategory"
      >
        <ion-select-option
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </ion-select-option>
      </ion-select>
    </div>

    <div class="form-group">
      <label class="form-label">Select a Location</label>
      <ion-select
        class="form-input"
        v-model="inquiry.location_id"
        placeholder="Select a location"
        required
        aria-label="Location"
      >
        <ion-select-option
          v-for="location in locations"
          :key="location.id"
          :value="location.id"
        >
          {{ location.name }}
        </ion-select-option>
      </ion-select>
    </div>

    <div class="form-group">
      <label class="form-label">How many do you need?</label>
      <ion-input
        class="form-input"
        v-model="inquiry.stock_quantity"
        type="number"
        placeholder="Enter the quantity you need"
        required
        aria-label="Quantity Needed"
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
          !editorFocused && !hasContent
            ? 'Provide details about the item (e.g., size, color, brand)'
            : ''
        "
      ></div>
    </div>

    <ion-button
      expand="block"
      class="submit-button"
      color="primary"
      @click="sendInquiry"
      :disabled="isSending"
    >
      {{ inquiryToEdit ? "Update Inquiry" : "Send Inquiry" }}
    </ion-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from "vue";
import ImageUploader from "@/components/ImageUploader.vue";
import { useCategories } from "@/composables/useCategories";
import useLocations from "@/composables/useLocations";
import { useInquiries } from "@/composables/useInquiry";
import { computeSubcategories } from "@/utils/utilities";
import { closeCircle, list, reorderFour, happy } from "ionicons/icons"; // Add this import at the top
import { debounce } from "lodash";

// Extend the inquiry form type with an optional id property.
interface InquiryForm {
  id?: number;
  name: string;
  description: string;
  category_id: number | null;
  location_id: number | null;
  stock_quantity: number | null;
}

export default defineComponent({
  name: "InputForm",
  components: { ImageUploader },
  props: {
    inquiryToEdit: {
      type: Object as () => Partial<InquiryForm>,
      default: null,
    },
  },
  emits: ["submit"],
  setup(props, { emit }) {
    const inquiry = ref<InquiryForm>({
      name: "",
      description: "",
      category_id: null,
      location_id: null,
      stock_quantity: null,
    });
    const files = ref<File[]>([]);
    const isSending = ref(false);
    const imageUploaderRef = ref<InstanceType<typeof ImageUploader> | null>(
      null
    );

    const { categories, fetchCategories } = useCategories();
    const { locations, fetchLocations } = useLocations();
    const { addInquiry, updateInquiry } = useInquiries();

    const descriptionEditor = ref<HTMLElement | null>(null);
    const showEmojiPicker = ref(false);
    const editorFocused = ref(false);
    const hasContent = ref(false);

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

    const suggestions = ref<any[]>([]);
    const showSuggestions = ref(false);

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
        inquiry.value.description = descriptionEditor.value.innerHTML;
        hasContent.value = !!descriptionEditor.value.textContent?.trim();
      }
    };

    const handleEditorFocus = () => {
      editorFocused.value = true;
    };

    const handleEditorBlur = () => {
      editorFocused.value = false;
    };

    const fetchSuggestions = async (searchTerm: string) => {
      try {
        const response = await fetch(
          `/api/inquiries/suggestions?term=${encodeURIComponent(searchTerm)}`
        );
        const data = await response.json();
        suggestions.value = data;
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };

    const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

    const handleNameInput = (event: CustomEvent) => {
      const searchTerm = event.detail.value;
      if (searchTerm && searchTerm.length >= 2) {
        debouncedFetchSuggestions(searchTerm);
      } else {
        suggestions.value = [];
      }
    };

    const selectSuggestion = (suggestion: any) => {
      inquiry.value.name = suggestion.name;
      inquiry.value.category_id = suggestion.category_id;
      showSuggestions.value = false;
      suggestions.value = [];
    };

    onMounted(async () => {
      await fetchCategories();
      await fetchLocations();
      if (props.inquiryToEdit) {
        inquiry.value = {
          name: props.inquiryToEdit.name || "",
          description: props.inquiryToEdit.description || "",
          category_id: props.inquiryToEdit.category_id || null,
          location_id: props.inquiryToEdit.location_id || null,
          stock_quantity: props.inquiryToEdit.stock_quantity || null,
          id: props.inquiryToEdit.id,
        };
      }
      if (inquiry.value.description && descriptionEditor.value) {
        descriptionEditor.value.innerHTML = inquiry.value.description;
        hasContent.value = true;
      }

      document.addEventListener("click", (event: Event) => {
        const target = event.target as HTMLElement;
        if (!target.closest(".autofill-container")) {
          showSuggestions.value = false;
        }
      });
    });

    watch(
      () => props.inquiryToEdit,
      (newVal) => {
        if (newVal) {
          inquiry.value = {
            name: newVal.name || "",
            description: newVal.description || "",
            category_id: newVal.category_id || null,
            location_id: newVal.location_id || null,
            stock_quantity: newVal.stock_quantity || null,
            id: newVal.id,
          };
          if (descriptionEditor.value && inquiry.value.description) {
            descriptionEditor.value.innerHTML = inquiry.value.description;
            hasContent.value = true;
          }
        }
      },
      { immediate: true }
    );

    const handleFilesSelected = (selectedFiles: File[]) => {
      files.value = selectedFiles;
    };

    const sendInquiry = async () => {
      // Basic validation
      if (
        !inquiry.value.name ||
        !inquiry.value.description ||
        !inquiry.value.category_id ||
        !inquiry.value.location_id ||
        inquiry.value.stock_quantity === null ||
        files.value.length === 0
      ) {
        return;
      }

      const formData = new FormData();
      formData.append("name", inquiry.value.name);
      formData.append("description", inquiry.value.description);
      formData.append("category_id", inquiry.value.category_id.toString());
      formData.append("location_id", inquiry.value.location_id.toString());
      formData.append(
        "stock_quantity",
        inquiry.value.stock_quantity.toString()
      );
      files.value.forEach((file) => {
        formData.append("images", file);
      });

      isSending.value = true;
      try {
        if (inquiry.value.id) {
          await updateInquiry(inquiry.value.id, formData);
        } else {
          await addInquiry(formData);
        }
        emit("submit");
        // Reset form
        inquiry.value = {
          name: "",
          description: "",
          category_id: null,
          location_id: null,
          stock_quantity: null,
        };
        files.value = [];
        imageUploaderRef.value?.clearImages();
      } catch (error) {
        console.error("Error sending inquiry:", error);
      } finally {
        isSending.value = false;
      }
    };

    const subcategories = computed(() =>
      computeSubcategories(categories.value)
    );

    return {
      inquiry,
      files,
      locations,
      // Use computed subcategories in place of categories.
      categories: subcategories,
      isSending,
      imageUploaderRef,
      handleFilesSelected,
      sendInquiry,
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
      suggestions,
      showSuggestions,
      handleNameInput,
      selectSuggestion,
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

.autofill-container {
  position: relative;
  width: 100%;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}

.suggestion-item small {
  color: #666;
  font-size: 0.8em;
}
</style>

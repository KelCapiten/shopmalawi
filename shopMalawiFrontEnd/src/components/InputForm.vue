//\src\components\InputForm.vue
<template>
  <div class="form-container">
    <label class="form-label">
      Let the community help you find the item you are looking for.
    </label>

    <ImageUploader
      ref="imageUploaderRef"
      label="What are you looking for?"
      @files-selected="handleFilesSelected"
    />

    <div class="form-group">
      <label class="form-label">Item Name</label>
      <ion-input
        class="form-input"
        v-model="inquiry.name"
        placeholder="Enter the name of the item you're looking for"
        required
        aria-label="Item Name"
      ></ion-input>
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
      <ion-textarea
        class="form-input textarea"
        v-model="inquiry.description"
        placeholder="Provide details about the item (e.g., size, color, brand)"
        :rows="5"
        required
        aria-label="Description"
      ></ion-textarea>
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
import { defineComponent, ref, onMounted, watch } from "vue";
import ImageUploader from "@/components/ImageUploader.vue";
import { useCategories } from "@/composables/useCategories";
import useLocations from "@/composables/useLocations";
import { useInquiries } from "@/composables/useInquiry";

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
          id: props.inquiryToEdit.id, // now available as an optional property
        };
      }
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

    return {
      inquiry,
      files,
      locations,
      categories,
      isSending,
      imageUploaderRef,
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

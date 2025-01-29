<template>
  <div class="form-container">
    <label class="form-label">
      Let the community help you find the item you are looking for.
    </label>

    <!-- Reference the uploader so we can call clearImages() later -->
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
        v-model="inquiry.subcategory_id"
        placeholder="Select a subcategory"
        required
        aria-label="Subcategory"
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
      Send Inquiry
    </ion-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import ImageUploader from "@/components/ImageUploader.vue";

interface InquiryForm {
  name: string;
  description: string;
  subcategory_id: number | null;
  location_id: number | null;
  stock_quantity: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

export default defineComponent({
  name: "InputForm",
  components: {
    ImageUploader,
  },
  props: {
    subcategories: {
      type: Array as () => Category[],
    },
  },
  emits: ["inquiry-sent"],
  setup(props, { emit }) {
    // Main form state
    const inquiry = ref<InquiryForm>({
      name: "",
      description: "",
      subcategory_id: null,
      location_id: null,
      stock_quantity: null,
    });

    // Files from ImageUploader
    const files = ref<File[]>([]);

    // Flag to indicate if we are sending the request
    const isSending = ref(false);

    // Reference to the ImageUploader child component
    const imageUploaderRef = ref<InstanceType<typeof ImageUploader> | null>(
      null
    );

    // Locations for the location selector
    const locations = ref<Location[]>([]);

    // Fetch locations when the component is mounted
    onMounted(async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:1994/api/locations/getLocations"
        );
        locations.value = data;
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      }
    });

    // Called whenever the child emits "files-selected"
    const handleFilesSelected = (selectedFiles: File[]) => {
      files.value = selectedFiles; // Overwrite any old files
    };

    // Perform the inquiry submission
    const sendInquiry = async () => {
      const authStore = useAuthStore();

      // Basic validation
      if (
        !inquiry.value.name ||
        !inquiry.value.description ||
        !inquiry.value.subcategory_id ||
        !inquiry.value.location_id ||
        inquiry.value.stock_quantity === null
      ) {
        emit("inquiry-sent", {
          message: "Please fill all fields with valid data.",
          color: "danger",
        });
        return;
      }

      if (files.value.length === 0) {
        emit("inquiry-sent", {
          message: "Please upload at least one image.",
          color: "danger",
        });
        return;
      }

      const formData = new FormData();
      formData.append("name", inquiry.value.name);
      formData.append("description", inquiry.value.description);
      formData.append("category_id", inquiry.value.subcategory_id.toString());
      formData.append("location_id", inquiry.value.location_id.toString());
      formData.append(
        "stock_quantity",
        inquiry.value.stock_quantity.toString()
      );

      // Append images from the parent array
      files.value.forEach((file) => {
        formData.append("images", file);
      });

      isSending.value = true;
      try {
        const token = authStore.token;
        if (!token) {
          emit("inquiry-sent", {
            message: "Authentication token is missing. Please log in.",
            color: "danger",
          });
          return;
        }

        // Send the request
        await axios.post(
          "http://localhost:1994/api/inquiries/addInquiry",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // On success
        emit("inquiry-sent", {
          message: "Inquiry sent successfully!",
          color: "success",
        });

        // Reset the form data
        inquiry.value = {
          name: "",
          description: "",
          subcategory_id: null,
          location_id: null,
          stock_quantity: null,
        };

        // Clear our local files array
        files.value = [];

        // Clear child’s previews + file input
        imageUploaderRef.value?.clearImages();
      } catch (error) {
        console.error("Error sending inquiry:", error);
        emit("inquiry-sent", {
          message: "Failed to send inquiry. Please try again.",
          color: "danger",
        });
      } finally {
        isSending.value = false;
      }
    };

    return {
      inquiry,
      files,
      locations,
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

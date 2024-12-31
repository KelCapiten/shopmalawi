<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <div class="form-container">
        <h2 class="form-title">Sell Your Item</h2>

        <!-- Upload Images Section -->
        <div class="form-group">
          <label class="form-label">Upload Images</label>
          <div class="upload-area" @click="triggerFileInput">
            <input
              type="file"
              accept="image/*"
              multiple
              ref="fileInput"
              @change="handleImageUpload"
              style="display: none"
            />
            <div v-if="images.length === 0" class="upload-placeholder">
              <ion-icon
                :icon="cloudUploadOutline"
                class="upload-icon"
              ></ion-icon>
              <p>Upload up to 4 images</p>
            </div>
            <div v-else class="image-preview">
              <swiper :pagination="paginationOptions" :modules="[Pagination]">
                <swiper-slide v-for="(image, index) in images" :key="index">
                  <img
                    :src="image.url"
                    alt="Uploaded Image"
                    class="uploaded-image"
                  />
                </swiper-slide>
              </swiper>
            </div>
          </div>
        </div>

        <!-- Item Name Input -->
        <div class="form-group">
          <label class="form-label">Item Name</label>
          <ion-input
            class="form-input"
            v-model="item.name"
            placeholder="Enter item name"
            required
          ></ion-input>
        </div>

        <!-- Price Input -->
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

        <!-- Category Selection -->
        <div class="form-group">
          <label class="form-label">Category</label>
          <ion-select
            class="form-input"
            v-model="item.category"
            placeholder="Select category"
            required
          >
            <ion-select-option value="electronics"
              >Electronics</ion-select-option
            >
            <ion-select-option value="clothing">Clothing</ion-select-option>
            <ion-select-option value="home">Home</ion-select-option>
            <ion-select-option value="sports">Sports</ion-select-option>
            <ion-select-option value="books">Books</ion-select-option>
          </ion-select>
        </div>

        <!-- Description Input -->
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
        >
          Sell Item
        </ion-button>
      </div>

      <!-- Toast Notification -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        :color="toastColor"
      ></ion-toast>
    </ion-content>

    <AppFooter />
  </ion-page>
</template>

<script lang="ts">
import {
  IonPage,
  IonContent,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonToast,
  IonIcon,
} from "@ionic/vue";
import { ref, computed, defineComponent } from "vue";
import { cloudUploadOutline } from "ionicons/icons";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import AppFooter from "../components/footer.vue";
import AppHeader from "../components/header.vue";
import axios from "axios"; // Import axios

interface Item {
  name: string;
  description: string;
  price: number;
  category: string;
}

interface Image {
  url: string;
  file: File;
}

export default defineComponent({
  name: "SellDashboard",
  components: {
    IonPage,
    IonContent,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonToast,
    IonIcon,
    Swiper,
    SwiperSlide,
    AppFooter,
    AppHeader,
  },
  setup() {
    // Reactive state for the item being sold
    const item = ref<Item>({
      name: "",
      description: "",
      price: 0,
      category: "",
    });

    // Reactive state for uploaded images
    const images = ref<Image[]>([]);

    // Toast notification states
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");

    // Reference to the hidden file input element
    const fileInput = ref<HTMLInputElement | null>(null);

    // Separate reactive state for price input as string
    const priceInput = ref<string>("");

    // Swiper pagination options
    const paginationOptions = computed(() => ({
      clickable: true,
      dynamicBullets: true,
    }));

    // Function to trigger the hidden file input
    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    // Function to handle image uploads
    const handleImageUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const files = Array.from(target.files).slice(0, 4);
        images.value = files.map((file) => ({
          url: URL.createObjectURL(file),
          file,
        }));
      }
    };

    const handlePriceInput = (event: CustomEvent) => {
      const value = event.detail.value;
      priceInput.value = value;
      const parsedValue = parseFloat(value);
      item.value.price = isNaN(parsedValue) ? 0 : parsedValue;
      console.log("Price:", item.value.price, typeof item.value.price);
    };

    const submitItem = async () => {
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

      if (images.value.length === 0) {
        toastMessage.value = "Please upload at least one image.";
        toastColor.value = "danger";
        showToast.value = true;
        return;
      }

      // Add the current timestamp to the item
      const now = new Date();
      const created_at = now.toISOString().slice(0, 19).replace("T", " ");

      // Create FormData to send the item and images
      const formData = new FormData();
      formData.append("name", item.value.name);
      formData.append("description", item.value.description);
      formData.append("price", item.value.price.toString());
      formData.append("category", item.value.category);
      formData.append("created_at", created_at);

      // Append all images to FormData
      images.value.forEach((image) => {
        formData.append("images", image.file);
      });

      try {
        // Send the data to the backend
        await axios.post("http://localhost:1994/api/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Show success toast
        toastMessage.value = "Item added successfully!";
        toastColor.value = "success";
        showToast.value = true;

        // Reset the form
        item.value = {
          name: "",
          description: "",
          price: 0,
          category: "",
        };
        priceInput.value = "";
        images.value = [];
      } catch (error) {
        console.error("Error adding item:", error);
        toastMessage.value = "Failed to add item. Please try again.";
        toastColor.value = "danger";
        showToast.value = true;
      }
    };

    return {
      item,
      images,
      showToast,
      toastMessage,
      toastColor,
      fileInput,
      cloudUploadOutline,
      triggerFileInput,
      handleImageUpload,
      handlePriceInput,
      submitItem,
      priceInput,
      paginationOptions,
      Pagination,
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

.upload-area {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed #ccc;
  border-radius: 8px;
  height: 150px;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
}

.upload-placeholder {
  color: #777;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.image-preview {
  border-radius: 8px;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.submit-button {
  margin-top: 10px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 8px;
}
</style>

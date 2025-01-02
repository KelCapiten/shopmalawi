<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <div class="form-container">
        <h2 class="form-title">Sell Your Item</h2>

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

        <div class="form-group">
          <label class="form-label">Item Name</label>
          <ion-input
            class="form-input"
            v-model="item.name"
            placeholder="Enter item name"
            required
          ></ion-input>
        </div>

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

        <div class="form-group">
          <label class="form-label">Category</label>
          <ion-select
            class="form-input"
            v-model="item.category"
            placeholder="Select category"
            required
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
          <label class="form-label">How many do you have for sale?</label>
          <ion-input
            class="form-input"
            type="number"
            v-model="item.stockQuantity"
            placeholder="Enter stock quantity"
            required
          ></ion-input>
        </div>

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

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        :color="toastColor"
      ></ion-toast>

      <SavingOverlay :isSaving="isSaving" />
    </ion-content>

    <AppFooter />
  </ion-page>
</template>

<script lang="ts">
import { ref, computed, defineComponent, onMounted } from "vue";
import { cloudUploadOutline } from "ionicons/icons";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import AppFooter from "../components/footer.vue";
import AppHeader from "../components/header.vue";
import axios from "axios";
import SavingOverlay from "../components/SavingOverlay.vue";
import { useAuthStore } from "@/stores/authStore";

interface Item {
  name: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
}

interface Image {
  url: string;
  file: File;
}

interface Category {
  id: string;
  name: string;
}

export default defineComponent({
  name: "SellDashboard",
  components: {
    Swiper,
    SwiperSlide,
    AppFooter,
    AppHeader,
    SavingOverlay,
  },
  setup() {
    const item = ref<Item>({
      name: "",
      description: "",
      price: 0,
      category: "",
      stockQuantity: 0,
    });

    const images = ref<Image[]>([]);
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const fileInput = ref<HTMLInputElement | null>(null);
    const priceInput = ref<string>("");
    const isSaving = ref(false);
    const categories = ref<Category[]>([]); // Store categories

    const paginationOptions = computed(() => ({
      clickable: true,
      dynamicBullets: true,
    }));

    // Fetch categories from the backend
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/products/getCategories"
        );
        categories.value = response.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
        toastMessage.value = "Failed to fetch categories.";
        toastColor.value = "danger";
        showToast.value = true;
      }
    };

    // Fetch categories when the component is mounted
    onMounted(() => {
      fetchCategories();
    });

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

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
    };

    const submitItem = async () => {
      const authStore = useAuthStore(); // Access the auth store

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

      const formData = new FormData();
      formData.append("name", item.value.name);
      formData.append("description", item.value.description);
      formData.append("price", item.value.price.toString());
      formData.append("categoryId", item.value.category);
      formData.append("stockQuantity", item.value.stockQuantity.toString()); // Include stockQuantity

      images.value.forEach((image) => {
        formData.append("images", image.file);
      });

      isSaving.value = true;

      try {
        const token = authStore.token; // Get token from the auth store
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
              Authorization: `Bearer ${token}`, // Add token for authentication
            },
          }
        );

        toastMessage.value = "Item added successfully!";
        toastColor.value = "success";
        showToast.value = true;

        // Reset form data
        item.value = {
          name: "",
          description: "",
          price: 0,
          category: "",
          stockQuantity: 0,
        };
        priceInput.value = "";
        images.value = [];
      } catch (error) {
        console.error("Error adding item:", error);
        toastMessage.value = "Failed to add item. Please try again.";
        toastColor.value = "danger";
        showToast.value = true;
      } finally {
        isSaving.value = false;
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
      isSaving,
      categories,
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

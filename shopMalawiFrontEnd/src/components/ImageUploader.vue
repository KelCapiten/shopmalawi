<template>
  <div class="form-group">
    <label class="form-label">{{ label }}</label>

    <div class="upload-area" @click="triggerFileInput">
      <!-- Hidden input for file selection -->
      <input
        type="file"
        accept="image/jpeg, image/png, image/gif"
        multiple
        ref="fileInput"
        @change="handleImageUpload"
        style="display: none"
      />

      <!-- Display a placeholder if no images are selected -->
      <div v-if="previewImages.length === 0" class="upload-placeholder">
        <ion-icon :icon="cloudUploadOutline" class="upload-icon"></ion-icon>
        <p>{{ placeholderMessage }}</p>
      </div>

      <!-- Swiper carousel for previews, if images exist -->
      <div v-else class="image-preview">
        <swiper :pagination="paginationOptions" :modules="[Pagination]">
          <swiper-slide v-for="(image, index) in previewImages" :key="index">
            <img :src="image.url" alt="Uploaded Image" class="uploaded-image" />
          </swiper-slide>
        </swiper>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from "vue";
import { cloudUploadOutline } from "ionicons/icons";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface PreviewImage {
  url: string;
  file: File;
}

export default defineComponent({
  name: "ImageUploader",
  components: {
    Swiper,
    SwiperSlide,
  },
  props: {
    label: {
      type: String,
      default: "Product Images",
    },
    placeholderMessage: {
      type: String,
      default: "Upload up to 4 images",
    },
  },
  emits: ["files-selected"],
  setup(_, { emit }) {
    const fileInput = ref<HTMLInputElement | null>(null);
    const previewImages = ref<PreviewImage[]>([]);

    // Pagination options for Swiper
    const paginationOptions = computed(() => ({
      clickable: true,
      dynamicBullets: true,
    }));

    /**
     * Programmatically open the file picker
     */
    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    /**
     * Handle the native file input change event
     */
    const handleImageUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) {
        // No files selected or user canceled
        return;
      }

      // Limit the selection to 4 images if desired
      const selectedFiles = Array.from(target.files).slice(0, 4);

      // Overwrite any old previews
      previewImages.value = selectedFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));

      // Emit the files so the parent can handle them
      emit("files-selected", selectedFiles);

      // Reset the input value so the user can select the same file again if needed
      target.value = "";
    };

    /**
     * Clears the preview images and resets the file input.
     * The parent can call this via template ref to reset.
     */
    const clearImages = () => {
      previewImages.value = [];
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    };

    return {
      fileInput,
      previewImages,
      cloudUploadOutline,
      paginationOptions,
      Pagination,
      triggerFileInput,
      handleImageUpload,
      clearImages,
    };
  },
});
</script>

<style scoped>
.form-label {
  font-size: small;
}

.upload-area {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px dashed #ccc;
  border-radius: 8px;
  height: 250px;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
  position: relative;
  overflow: hidden;
}

.upload-placeholder {
  color: #777;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.image-preview {
  height: 250px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.swiper {
  height: 100%;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.uploaded-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.swiper-pagination-bullet {
  background-color: #000;
  opacity: 0.5;
  width: 8px;
  height: 8px;
}

.swiper-pagination-bullet-active {
  background-color: #007aff;
  opacity: 1;
}
</style>

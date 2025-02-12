//src/components/ImageUploader.vue
<template>
  <div class="form-group">
    <label class="form-label">{{ label }}</label>
    <div class="upload-area" @click="triggerFileInput">
      <input
        type="file"
        accept="image/jpeg, image/png, image/gif"
        multiple
        ref="fileInput"
        @change="handleImageUpload"
        style="display: none"
      />
      <div v-if="previewImages.length === 0" class="upload-placeholder">
        <ion-icon :icon="cloudUploadOutline" class="upload-icon"></ion-icon>
        <p>{{ placeholderMessage }}</p>
      </div>
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
import { ref, computed, defineComponent, watch, onMounted } from "vue";
import { cloudUploadOutline } from "ionicons/icons";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface PreviewImage {
  url: string;
  file?: File; // Optional if preexisting images don't have a File object
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
    // New prop: an array of image URLs (or objects) that are already available (edit mode)
    initialImages: {
      type: Array as () => Array<{ url: string }>,
      default: () => [],
    },
  },
  emits: ["uploaded-images"],
  setup(props, { emit }) {
    const fileInput = ref<HTMLInputElement | null>(null);
    const previewImages = ref<PreviewImage[]>([]);

    const paginationOptions = computed(() => ({
      clickable: true,
      dynamicBullets: true,
    }));

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const handleImageUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) {
        return;
      }
      const selectedFiles = Array.from(target.files).slice(0, 4);
      previewImages.value = selectedFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
      emit("uploaded-images", selectedFiles);
      target.value = "";
    };

    const clearImages = () => {
      previewImages.value = [];
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    };

    // When the component is mounted or the initialImages prop changes, populate previewImages
    onMounted(() => {
      if (props.initialImages.length > 0) {
        previewImages.value = props.initialImages.map((img) => ({
          url: img.url,
        }));
      }
    });
    watch(
      () => props.initialImages,
      (newVal) => {
        previewImages.value = newVal.map((img) => ({ url: img.url }));
      },
      { immediate: true }
    );

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
/* (Styles remain the same as your original code) */
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

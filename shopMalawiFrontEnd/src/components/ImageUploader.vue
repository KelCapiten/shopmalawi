//src/components/ImageUploader.vue
<template>
  <div class="form-group">
    <label v-if="showLabel" class="form-label">{{ label }}</label>

    <div class="upload-area" :class="{ circular: circular, shaded: shaded }">
      <!-- File input for gallery uploads -->
      <input
        type="file"
        accept="image/jpeg, image/png, image/gif"
        multiple
        ref="fileInput"
        @change="handleImageUpload"
        style="display: none"
      />

      <div v-if="previewImages.length === 0" class="upload-placeholder">
        <div class="upload-actions">
          <button
            class="action-button"
            :class="{ 'shaded-button': shaded }"
            @click="openGallery"
          >
            <ion-icon :icon="cloudUploadOutline" class="action-icon"></ion-icon>
            <span>Gallery</span>
          </button>

          <button
            v-if="hasCameraSupport"
            class="action-button"
            :class="{ 'shaded-button': shaded }"
            @click="openCamera"
          >
            <ion-icon :icon="cameraOutline" class="action-icon"></ion-icon>
            <span>Camera</span>
          </button>
        </div>
        <p>{{ placeholderMessage }}</p>
      </div>

      <div v-else class="image-preview" :class="{ circular: circular }">
        <div v-if="showControls" class="preview-controls">
          <button class="control-button" @click="clearImages">
            <ion-icon :icon="trashOutline" class="control-icon"></ion-icon>
          </button>
          <button class="control-button" @click="openGallery">
            <ion-icon :icon="addOutline" class="control-icon"></ion-icon>
          </button>
          <button
            v-if="hasCameraSupport"
            class="control-button"
            @click="openCamera"
          >
            <ion-icon :icon="cameraOutline" class="control-icon"></ion-icon>
          </button>
        </div>

        <swiper :pagination="paginationOptions" :modules="[Pagination]">
          <swiper-slide v-for="(image, index) in previewImages" :key="index">
            <img
              :src="image.url"
              alt="Uploaded Image"
              class="uploaded-image"
              :class="{ circular: circular }"
            />
          </swiper-slide>
        </swiper>
      </div>
    </div>

    <!-- Teleport Camera Modal to the body -->
    <teleport to="body">
      <div v-if="showCameraModal" class="camera-modal">
        <div class="camera-container">
          <video
            ref="videoElement"
            autoplay
            playsinline
            class="camera-video"
          ></video>
          <canvas ref="canvasElement" style="display: none"></canvas>

          <!-- Live Camera Preview Row -->
          <div class="camera-preview-row">
            <div class="camera-previews">
              <div
                v-for="(preview, index) in cameraPreviews"
                :key="index"
                class="camera-preview-thumbnail"
              >
                <img :src="preview.url" alt="Preview" />
              </div>
            </div>
            <button
              v-if="cameraPreviews.length > 0"
              @click="finishCameraCapture"
              class="camera-done-button"
            >
              Done
            </button>
          </div>

          <div class="camera-controls">
            <button @click="switchCamera" class="camera-button">
              <ion-icon :icon="syncOutline"></ion-icon>
            </button>
            <button @click="capturePhoto" class="capture-button">
              <div class="capture-button-inner"></div>
            </button>
            <button @click="closeCameraModal" class="camera-button">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts">
import {
  ref,
  computed,
  defineComponent,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import {
  cloudUploadOutline,
  cameraOutline,
  trashOutline,
  addOutline,
  closeOutline,
  syncOutline,
} from "ionicons/icons";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface PreviewImage {
  url: string;
  file?: File;
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
    showLabel: {
      type: Boolean,
      default: true,
    },
    placeholderMessage: {
      type: String,
      default: "Upload up to 4 images",
    },
    initialImages: {
      type: Array as () => Array<{ url: string }>,
      default: () => [],
    },
    circular: {
      type: Boolean,
      default: false,
    },
    maxImages: {
      type: Number,
      default: 4,
    },
    maxFileSizeMB: {
      type: Number,
      default: 1,
    },
    quality: {
      type: Number,
      default: 0.7,
    },
    maxWidth: {
      type: Number,
      default: 1600,
    },
    maxHeight: {
      type: Number,
      default: 1600,
    },
    showControls: {
      type: Boolean,
      default: true,
    },
    shaded: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["uploaded-images"],
  setup(props, { emit }) {
    const fileInput = ref<HTMLInputElement | null>(null);
    const previewImages = ref<PreviewImage[]>([]);
    const cameraPreviews = ref<PreviewImage[]>([]);
    const hasCameraSupport = ref(false);
    const processingImages = ref(false);

    // Camera-related refs
    const showCameraModal = ref(false);
    const videoElement = ref<HTMLVideoElement | null>(null);
    const canvasElement = ref<HTMLCanvasElement | null>(null);
    const stream = ref<MediaStream | null>(null);
    const usingFrontCamera = ref(true);

    const paginationOptions = computed(() => ({
      clickable: true,
      dynamicBullets: true,
    }));

    const openGallery = () => {
      if (fileInput.value) {
        fileInput.value.click();
      }
    };

    const openCamera = async () => {
      showCameraModal.value = true;
      cameraPreviews.value = [];
      try {
        await startCamera();
        await switchCamera();
        await switchCamera();
      } catch (error) {
        console.error("Error accessing camera:", error);
        showCameraModal.value = false;
        fileInput.value?.setAttribute("capture", "environment");
        fileInput.value?.click();
        fileInput.value?.removeAttribute("capture");
      }
    };

    const startCamera = async () => {
      if (!videoElement.value) return;
      stopCamera();
      try {
        const facingMode = usingFrontCamera.value ? "user" : "environment";
        stream.value = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (videoElement.value) {
          videoElement.value.srcObject = stream.value;
        }
      } catch (error) {
        console.error("Error starting camera:", error);
        throw error;
      }
    };

    const stopCamera = () => {
      if (stream.value) {
        stream.value.getTracks().forEach((track) => track.stop());
        if (videoElement.value) {
          videoElement.value.srcObject = null;
        }
        stream.value = null;
      }
    };

    const switchCamera = async () => {
      usingFrontCamera.value = !usingFrontCamera.value;
      await startCamera();
    };

    const capturePhoto = () => {
      if (!videoElement.value || !canvasElement.value) return;
      const video = videoElement.value;
      const canvas = canvasElement.value;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      if (usingFrontCamera.value) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            const imageUrl = URL.createObjectURL(file);
            cameraPreviews.value.push({
              url: imageUrl,
              file: file,
            });
            const remainingSlots =
              props.maxImages -
              previewImages.value.length -
              cameraPreviews.value.length;
            if (remainingSlots <= 0) {
              finishCameraCapture();
            }
          }
        },
        "image/jpeg",
        0.85
      );
    };

    const finishCameraCapture = () => {
      const filesToAdd = [...cameraPreviews.value];
      closeCameraModal();
      processAndAddImages(
        filesToAdd.map((preview) => preview.file).filter(Boolean) as File[]
      );
    };

    const closeCameraModal = () => {
      stopCamera();
      showCameraModal.value = false;
      cameraPreviews.value.forEach((preview) => {
        if (preview.url.startsWith("blob:")) {
          URL.revokeObjectURL(preview.url);
        }
      });
      cameraPreviews.value = [];
    };

    const handleImageUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) {
        return;
      }
      const remainingSlots = props.maxImages - previewImages.value.length;
      if (remainingSlots <= 0) {
        previewImages.value.forEach((image) => {
          if (image.url.startsWith("blob:")) {
            URL.revokeObjectURL(image.url);
          }
        });
        previewImages.value = [];
      }
      const selectedFiles = Array.from(target.files).slice(
        0,
        remainingSlots || props.maxImages
      );
      processAndAddImages(selectedFiles);
      target.value = "";
    };

    const compressImage = (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        // Check if file needs compression
        const fileSizeInMB = file.size / (1024 * 1024);
        if (fileSizeInMB <= props.maxFileSizeMB) {
          return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let width = img.width;
            let height = img.height;

            if (width > props.maxWidth || height > props.maxHeight) {
              const ratio = Math.min(
                props.maxWidth / width,
                props.maxHeight / height
              );
              width = Math.floor(width * ratio);
              height = Math.floor(height * ratio);
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Could not get canvas context"));

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Calculate quality based on file size
            let quality = props.quality;
            if (fileSizeInMB > 2) {
              quality = Math.min(quality, 0.6);
            } else if (fileSizeInMB > 5) {
              quality = Math.min(quality, 0.5);
            }

            canvas.toBlob(
              (blob) => {
                if (!blob) return reject(new Error("Blob creation failed"));
                const newFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(newFile);
              },
              "image/jpeg",
              quality
            );
          };
          img.onerror = () => {
            reject(new Error("Image loading error"));
          };
        };
        reader.onerror = () => {
          reject(new Error("File reading error"));
        };
      });
    };

    const processAndAddImages = async (files: File[]) => {
      processingImages.value = true;
      try {
        const processedFiles: File[] = [];

        for (const file of files) {
          try {
            const processedFile = await compressImage(file);
            processedFiles.push(processedFile);
            addImageFile(processedFile);
          } catch (error) {
            console.error("Error processing image:", error);
            // If compression fails, try to use the original file
            addImageFile(file);
          }
        }

        const allFiles = previewImages.value
          .filter((img) => img.file)
          .map((img) => img.file) as File[];
        emit("uploaded-images", allFiles);
      } finally {
        processingImages.value = false;
      }
    };

    const addImageFile = (file: File) => {
      if (previewImages.value.length >= props.maxImages) {
        if (previewImages.value[0].url.startsWith("blob:")) {
          URL.revokeObjectURL(previewImages.value[0].url);
        }
        previewImages.value.shift();
      }
      const imageUrl = URL.createObjectURL(file);
      previewImages.value.push({
        url: imageUrl,
        file: file,
      });
    };

    const clearImages = () => {
      previewImages.value.forEach((image) => {
        if (image.url.startsWith("blob:")) {
          URL.revokeObjectURL(image.url);
        }
      });
      previewImages.value = [];
      if (fileInput.value) {
        fileInput.value.value = "";
      }
      emit("uploaded-images", []);
    };

    onMounted(() => {
      hasCameraSupport.value =
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;
      if (props.initialImages.length > 0) {
        previewImages.value = props.initialImages.map((img) => ({
          url: img.url,
        }));
      }
    });

    onBeforeUnmount(() => {
      stopCamera();
      previewImages.value.forEach((image) => {
        if (image.url.startsWith("blob:")) {
          URL.revokeObjectURL(image.url);
        }
      });
      cameraPreviews.value.forEach((image) => {
        if (image.url.startsWith("blob:")) {
          URL.revokeObjectURL(image.url);
        }
      });
    });

    watch(
      () => props.initialImages,
      (newVal) => {
        if (newVal.length === 0 && previewImages.value.length > 0) {
          clearImages();
        } else if (newVal.length > 0) {
          previewImages.value = newVal.map((img) => ({ url: img.url }));
        }
      }
    );

    return {
      fileInput,
      previewImages,
      cameraPreviews,
      processingImages,
      cloudUploadOutline,
      cameraOutline,
      trashOutline,
      addOutline,
      closeOutline,
      syncOutline,
      paginationOptions,
      Pagination,
      openGallery,
      openCamera,
      handleImageUpload,
      clearImages,
      hasCameraSupport,
      showCameraModal,
      videoElement,
      canvasElement,
      switchCamera,
      capturePhoto,
      closeCameraModal,
      finishCameraCapture,
    };
  },
});
</script>

<style scoped>
.form-label {
  font-size: 1rem;
  font-weight: bold;
  color: #3d3d3d;
}
.upload-area {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  border: 2px dashed #ccc;
  border-radius: 8px;
  text-align: center;
  background-color: white;
  position: relative;
  overflow: hidden;
}
.upload-area.circular {
  border-radius: 50%;
  width: 110px;
  height: 110px;
}
.upload-area.shaded {
  background-color: rgb(241, 241, 241);
}
.upload-placeholder {
  color: #777;
  width: 100%;
}
.upload-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 15px;
}
.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button.shaded-button {
  border-color: rgb(192, 192, 192);
  background-color: white;
}
.action-button:hover {
  background-color: #f0f0f0;
}
.action-icon {
  font-size: 2rem;
  margin-bottom: 5px;
}
.image-preview {
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.preview-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 10px;
}
.control-button {
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.control-button:hover {
  background-color: rgba(255, 255, 255, 1);
}
.control-icon {
  font-size: 1.2rem;
}
.swiper {
  height: 100%;
  width: 100%;
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
  object-fit: cover;
  border-radius: 8px;
}
.uploaded-image.circular {
  height: 110px;
  width: 110px;
  object-fit: cover;
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

.camera-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.camera-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.camera-video {
  flex: 1;
  object-fit: cover;
  background-color: #000;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.camera-preview-row {
  position: absolute;
  bottom: 100px;
  left: 0;
  width: 100%;
  display: flex;
  padding: 10px;
  z-index: 10;
}
.camera-previews {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  flex: 1;
}
.camera-preview-thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #fff;
  flex-shrink: 0;
}
.camera-preview-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-done-button {
  background-color: rgba(0, 122, 255, 0.8);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 5px;
  margin-left: 10px;
  cursor: pointer;
}
.camera-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
  z-index: 10;
}
.camera-button {
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.capture-button {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.capture-button-inner {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background-color: white;
}
</style>

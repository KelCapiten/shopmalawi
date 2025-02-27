//src/components/StoreRegistrationForm.vue
<template>
  <div class="modal-overlay" @click.self="close">
    <div ref="formContainerRef" class="modal-content">
      <h2 v-if="showUploaders === false">
        {{
          userstore.selectedStore && userstore.selectedStore.id !== 0
            ? "Edit Your Store"
            : "Register Your Store"
        }}
      </h2>

      <!-- Image Uploaders arranged with square and overlapping circle -->
      <div v-if="showUploaders" class="image-uploaders-container">
        <div>
          <ImageUploader
            class="square-uploader"
            placeholderMessage="Update banner image."
            :showLabel="false"
            :circular="false"
            @uploaded-images="handleBannerImages"
          />
        </div>
        <div class="circle-uploader">
          <ImageUploader
            placeholderMessage="Update store profile image."
            :showLabel="false"
            :circular="true"
            @uploaded-images="handleProfileImages"
          />
        </div>
      </div>

      <form class="form" @submit.prevent="submitForm">
        <div v-if="showFormFields">
          <div class="form-group">
            <label>Brand Name</label>
            <input
              type="text"
              v-model="newStoreForm.brand_name"
              required
              placeholder="Enter your brand name"
            />
          </div>
          <div class="form-group">
            <label>Tagline</label>
            <input
              type="text"
              v-model="newStoreForm.tagline"
              required
              placeholder="Enter your store tagline"
            />
          </div>
          <div class="form-group">
            <label class="description">Description</label>
            <div class="textarea-container">
              <textarea
                v-model="newStoreForm.description"
                required
                placeholder="Enter a brief description of your store"
                ref="descriptionTextarea"
                @input="adjustHeight"
                maxlength="200"
                style="overflow: hidden; resize: none"
              ></textarea>
              <span class="char-counter">
                {{ newStoreForm.description.length }}/200
              </span>
            </div>
          </div>

          <!-- Custom Selector for Category -->
          <div class="form-group custom-selector">
            <label>Store Category (optional)</label>
            <div
              class="selector-display"
              tabindex="0"
              @click="toggleCategoryDropdown"
            >
              <span>{{ selectedCategoryLabel }}</span>
              <svg
                class="selector-icon"
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                width="24"
                viewBox="0 0 24 24"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
            <div v-if="showCategoryList" class="selector-dropdown">
              <div
                class="selector-option"
                v-for="cat in categories"
                :key="cat.id"
                @click="selectCategory(cat)"
              >
                {{ cat.name }}
              </div>
            </div>
          </div>
        </div>

        <div class="button-group">
          <button type="submit">Submit</button>
          <button type="button" @click="close">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  computed,
  nextTick,
} from "vue";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { useCategories } from "@/composables/useCategories";
import ImageUploader from "@/components/ImageUploader.vue";

export default defineComponent({
  name: "StoreRegistrationForm",
  components: {
    ImageUploader,
  },
  props: {
    showUploaders: {
      type: Boolean,
      default: false,
    },
    showFormFields: {
      type: Boolean,
      default: true,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const userstore = useUserstoreStore();
    const { categories, fetchCategories } = useCategories();
    const formContainerRef = ref<HTMLElement | null>(null);
    const showCategoryList = ref(false);
    const descriptionTextarea = ref<HTMLTextAreaElement | null>(null);

    const handleBannerImages = (selectedFiles: File[]) => {
      userstore.uploadedBannerImages = selectedFiles;
    };

    const handleProfileImages = (selectedFiles: File[]) => {
      userstore.uploadedProfileImages = selectedFiles;
    };

    const adjustHeight = () => {
      if (descriptionTextarea.value) {
        descriptionTextarea.value.style.height = "auto";
        descriptionTextarea.value.style.height =
          descriptionTextarea.value.scrollHeight + "px";
      }
    };

    onMounted(() => {
      fetchCategories();
      if (
        props.isEditing &&
        userstore.selectedStore &&
        userstore.selectedStore.id !== 0
      ) {
        userstore.newStoreForm.brand_name = userstore.selectedStore.brand_name;
        userstore.newStoreForm.tagline = userstore.selectedStore.tagline || "";
        userstore.newStoreForm.description =
          userstore.selectedStore.description || "";
        userstore.newStoreForm.category_id =
          userstore.selectedStore.category_id;
      }
      nextTick(() => {
        adjustHeight();
      });
      window.addEventListener("click", handleClickOutside);
    });
    onUnmounted(() => {
      window.removeEventListener("click", handleClickOutside);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".custom-selector")) {
        showCategoryList.value = false;
      }
    };

    const selectedCategoryLabel = computed(() => {
      if (!userstore.newStoreForm.category_id) return "Select a category";
      const cat = categories.value.find(
        (c) => c.id === userstore.newStoreForm.category_id
      );
      return cat ? cat.name : "Select a category";
    });

    const toggleCategoryDropdown = () => {
      showCategoryList.value = !showCategoryList.value;
    };

    const selectCategory = (cat: { id: number; name: string }) => {
      userstore.newStoreForm.category_id = cat.id;
      showCategoryList.value = false;
    };

    const submitForm = async () => {
      try {
        if (props.isEditing) {
          await userstore.updateStoreRecord({ ...userstore.newStoreForm });
        } else {
          await userstore.registerStore();
        }
        close();
      } catch (error) {
        console.error("Error submitting store form:", error);
      }
    };

    const close = () => {
      emit("close");
    };

    return {
      formContainerRef,
      showCategoryList,
      categories,
      selectedCategoryLabel,
      toggleCategoryDropdown,
      selectCategory,
      submitForm,
      close,
      newStoreForm: userstore.newStoreForm,
      userstore,
      descriptionTextarea,
      adjustHeight,
      handleBannerImages,
      handleProfileImages,
    };
  },
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}
.image-uploaders-container {
  position: relative;
  margin-bottom: 60px;
}
.square-uploader {
  width: 100%;
  height: 110px;
}
.circle-uploader {
  position: absolute;
  top: 100%;
  left: 30px;
  z-index: 2;
  transform: translateY(-50%);
}

.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.form-group input:focus,
.form-group textarea:focus {
  border-color: orange !important;
  box-shadow: 0 0 5px rgba(255, 165, 0, 0.5) !important;
  outline: none;
}
.textarea-container {
  position: relative;
}
.char-counter {
  position: absolute;
  bottom: 5px;
  right: 8px;
  font-size: 0.8rem;
  color: #aaa;
}
.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
.button-group button {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
}
.button-group button:active {
  transform: scale(0.98);
}
button[type="submit"] {
  background-color: #498115;
  color: #fff;
}
button[type="submit"]:hover {
  background-color: #3a6611;
}
button[type="button"] {
  background-color: #ccc;
  color: #333;
}
button[type="button"]:hover {
  background-color: #bbb;
}
.custom-selector {
  position: relative;
}
.selector-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  padding: 8px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.selector-display:focus {
  border-color: orange;
  box-shadow: 0 0 5px rgba(255, 165, 0, 0.5);
  outline: none;
}
.selector-display span {
  color: #555;
}
.selector-icon {
  fill: #555;
  width: 16px;
  height: 16px;
}
.selector-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 1001;
}
.selector-option {
  padding: 8px;
  cursor: pointer;
}
.selector-option:hover {
  background: #f0f0f0;
}
</style>

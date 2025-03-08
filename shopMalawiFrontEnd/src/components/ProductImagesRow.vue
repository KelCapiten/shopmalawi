//src/components/ProductImagesRow.vue
<template>
  <div class="images-container">
    <div class="images-row">
      <div v-for="(img, idx) in images" :key="idx" class="image-wrapper">
        <div
          class="image-item"
          :class="{ selected: idx === modelValue }"
          @click="onSelect(idx)"
        >
          <img
            :src="formatImagePath(img.image_path)"
            :alt="img.alt_text || 'Product Image'"
          />
        </div>
        <div v-if="idx < images.length - 1" class="vertical-divider"></div>
      </div>
    </div>
    <div class="button-container">
      <Button :sellerId="sellerId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, PropType } from "vue";
import Button from "../components/buttons/Button.vue";

defineProps({
  images: {
    type: Array as PropType<{ image_path: string; alt_text?: string }[]>,
    default: () => [],
  },
  modelValue: {
    type: Number,
    default: 0,
  },
  sellerId: {
    type: Number,
    required: true,
  },
});

const emits = defineEmits(["update:modelValue"]);

function onSelect(idx: number) {
  emits("update:modelValue", idx);
}

function formatImagePath(path: string) {
  return `http://localhost:1994${path}`;
}
</script>

<style scoped>
.images-container {
  display: flex;
  align-items: center;
  position: relative;
  background-color: rgba(255, 255, 255, 0.281);
}

.images-row {
  display: flex;
  align-items: center;
  overflow-x: auto;
  padding: 5px 0;
  flex-grow: 1;
  max-width: calc(100% - 50px);
}

.button-container {
  position: sticky;
  display: flex;
  align-items: center;
  padding: 15px;
  padding-right: 8px;
  margin: 0px 10px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1;
}

.image-wrapper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.image-item {
  display: inline-block;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 8px;
  border: 2px solid #ddd;
  box-sizing: border-box;
  cursor: pointer;
}

.image-item.selected {
  border: 2px solid #000;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vertical-divider {
  margin: 0;
  padding: 0;
  height: 60px;
}
</style>

//src/components/storeSelector.vue
<template>
  <div class="store-selector-tiles">
    <!-- New "All Products" Card -->
    <div
      class="store-tile all-products"
      :class="{ selected: selectedStoreId === null || selectedStoreId === 0 }"
      @click="$emit('storeSelected', 0)"
    >
      <div class="tile-info">
        <h3>All Products</h3>
      </div>
    </div>
    <!-- Existing Store Cards -->
    <div
      v-for="store in stores"
      :key="store.id"
      :class="['store-tile', { selected: store.id === selectedStoreId }]"
      @click="$emit('storeSelected', store.id)"
    >
      <img
        :src="store.profile_picture_url"
        class="tile-img"
        :alt="store.brand_name"
      />
      <div class="tile-info">
        <h3>{{ store.brand_name }}</h3>
        <p>{{ store.tagline }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "StoreSelector",
  props: {
    stores: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    selectedStoreId: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },
  emits: ["storeSelected"],
});
</script>

<style scoped>
.store-selector-tiles {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 2rem;
  margin: 0;
}

.store-tile {
  position: relative;
  min-width: 140px;
  width: 140px;
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  background: #2e2e2e;
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.store-tile:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Glowing subtle orange highlight */
.store-tile.selected {
  border: 2px solid #ffa500;
  box-shadow: 0 0 4px rgba(255, 165, 0, 0.5);
}

/* Special styling for the All Products card */
.store-tile.all-products {
  background: url("/assets/background.jpg") no-repeat center center;
  background-size: cover;
  color: #333;
}

.store-tile.all-products .tile-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.tile-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.tile-info {
  padding: 0.5rem;
  text-align: center;
}

.tile-info h3 {
  font-size: 0.95rem;
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile-info p {
  font-size: 0.8rem;
  margin: 0;
  color: #ccc;
}
</style>

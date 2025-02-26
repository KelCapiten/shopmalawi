//src/components/AddProductToStore.vue
<template>
  <label class="section-heading">{{ product.name }}</label>
  <div class="add-to-store">
    <button class="close-btn" @click="handleClose">&times;</button>
    <div class="image-grid">
      <div class="image-item" v-for="index in 4" :key="index">
        <template v-if="product.images[index - 1]">
          <img
            :src="updateImageUrl(product.images[index - 1].image_path)"
            :alt="product.images[index - 1].alt_text || 'Product Image'"
          />
        </template>
        <template v-else>
          <div class="placeholder"></div>
        </template>
      </div>
    </div>
  </div>

  <div class="store-selector">
    <label class="heading">Add This Product To </label>
    <StoreSelector
      :stores="stores"
      :showAllProductsCard="false"
      :selectedProductId="product.id"
      :selectedStoreId="selectedStoreId"
      @storeSelected="handleStoreSelected"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { updateImageUrl } from "@/utils/utilities";
import StoreSelector from "@/components/storeSelector.vue";
import { useUserstoreStore } from "@/stores/userstoreStore";

export default defineComponent({
  name: "AddProductToStore",
  components: { StoreSelector },
  props: {
    product: {
      type: Object,
      required: true,
    },
  },
  setup(props, { emit }) {
    const userstore = useUserstoreStore();
    const stores = computed(() => userstore.stores);
    const selectedStoreId = computed(() =>
      userstore.selectedStore ? userstore.selectedStore.id : null
    );

    async function handleStoreSelected(storeId: number) {
      try {
        await userstore.addThisProductToStore(storeId, props.product.id);
        handleClose();
      } catch (error) {
        console.error("Failed to add product to store:", error);
      }
    }

    function handleClose() {
      emit("close");
    }

    return {
      updateImageUrl,
      stores,
      selectedStoreId,
      handleStoreSelected,
      handleClose,
    };
  },
});
</script>

<style scoped>
.heading {
  display: inline-block;
  padding: 0rem 1rem;
  padding-top: 0.5rem;
  font-size: 1.3rem;
  font-weight: 500;
}
.section-heading {
  background-color: white;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 0.3rem 1rem;
  margin-left: 4rem;
  border-radius: 100px;
}
.add-to-store {
  padding: 1rem 4rem;
  position: relative;
  max-width: 500px;
}
.close-btn {
  position: absolute;
  top: 0rem;
  right: 3rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  background-color: white;
  padding: 0.5rem;
  border-radius: 8px;
}
.image-item {
  position: relative;
  width: 100%;
  padding-top: 100%;
}
.image-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  border-radius: 4px;
}
.store-selector {
  background-color: white;
}
</style>

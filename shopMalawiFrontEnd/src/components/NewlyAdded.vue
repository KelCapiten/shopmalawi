<template>
  <div v-if="newlyAddedItems.length > 0" class="newly-added-section">
    <h2>Newly Added</h2>
    <div class="scroll-container" ref="scrollContainer" @scroll="handleScroll">
      <div class="item-list">
        <div v-for="item in newlyAddedItems" :key="item.id" class="item">
          <img
            :src="item.primary_image"
            alt="Product Image"
            class="item-image"
          />
          <p class="item-name">{{ item.name }}</p>
          <p class="item-price">MKW {{ item.price }}</p>
        </div>
        <div v-if="loading" class="loading">Loading more items...</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import axios from "axios";

export default {
  name: "NewlyAdded",
  setup() {
    const newlyAddedItems = ref([]);
    const loading = ref(false);
    const scrollContainer = ref(null);
    const baseUrl = "http://localhost:1994";

    const fetchNewlyAddedItems = async () => {
      if (loading.value) return;
      loading.value = true;

      try {
        const response = await axios.get(
          `${baseUrl}/api/products/getProductsAddedToday`
        );
        newlyAddedItems.value = response.data.map((item) => ({
          ...item,
          primary_image: `${baseUrl}${item.primary_image}`,
        }));
      } catch (error) {
        console.error("Error fetching newly added items:", error);
      } finally {
        loading.value = false;
      }
    };

    const handleScroll = () => {
      const container = scrollContainer.value;
      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 50
      ) {
        fetchNewlyAddedItems();
      }
    };

    onMounted(() => {
      fetchNewlyAddedItems();
    });

    return {
      newlyAddedItems,
      loading,
      scrollContainer,
      handleScroll,
    };
  },
};
</script>

<style scoped>
.newly-added-section h2 {
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.scroll-container {
  overflow-x: auto;
  white-space: nowrap;
  scroll-behavior: smooth;
}

.item-list {
  display: inline-flex;
  gap: 15px;
  padding-bottom: 10px;
}

.item {
  width: 150px;
  text-align: center;
  flex-shrink: 0;
}

.item-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.item-name {
  font-size: 1rem;
  margin: 5px 0;
  white-space: normal;
}

.item-price {
  font-size: 0.9rem;
  color: #666;
}

.loading,
.no-more-items {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  font-size: 0.9rem;
  color: #666;
  flex-shrink: 0;
}
</style>

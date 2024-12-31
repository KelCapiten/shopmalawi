<template>
  <div class="newly-added-section">
    <h2>Newly Added</h2>
    <div class="scroll-container" ref="scrollContainer" @scroll="handleScroll">
      <div class="item-list">
        <div v-for="item in newlyAddedItems" :key="item.id" class="item">
          <img :src="item.image" :alt="item.name" class="item-image" />
          <p class="item-name">{{ item.name }}</p>
          <p class="item-price">${{ item.price }}</p>
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
    const newlyAddedItems = ref([]); // Stores the fetched items
    const loading = ref(false); // Tracks loading state
    const offset = ref(0); // Tracks the offset for pagination
    const scrollContainer = ref(null); // Reference to the scroll container

    // Fetch newly added items
    const fetchNewlyAddedItems = async () => {
      if (loading.value) return; // Prevent multiple simultaneous fetches
      loading.value = true;

      try {
        const response = await axios.get("/api/products/newly-added", {
          params: {
            limit: 5, // Fetch 5 items at a time
            offset: offset.value,
          },
        });

        // Append new items to the list
        newlyAddedItems.value = [...newlyAddedItems.value, ...response.data];
        offset.value += response.data.length; // Update the offset
      } catch (error) {
        console.error("Error fetching newly added items:", error);
      } finally {
        loading.value = false;
      }
    };

    // Handle scroll event to load more items
    const handleScroll = () => {
      const container = scrollContainer.value;
      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 50
      ) {
        fetchNewlyAddedItems(); // Fetch more items when the user reaches the end
      }
    };

    // Fetch initial items when the component is mounted
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
}

.scroll-container {
  overflow-x: auto;
  white-space: nowrap;
  scroll-behavior: smooth;
}

.item-list {
  display: inline-flex;
  gap: 15px;
}

.item {
  width: 150px;
  text-align: center;
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
}

.item-price {
  font-size: 0.9rem;
  color: #666;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  font-size: 0.9rem;
  color: #666;
}
</style>

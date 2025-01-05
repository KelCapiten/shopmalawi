<template>
  <div v-if="newlyAddedItems.length > 0" class="newly-added-section">
    <h2>Newly Added</h2>
    <div class="horizontal-list">
      <div
        v-for="item in newlyAddedItems"
        :key="item.id"
        class="item"
        @mouseenter="pauseSlideshow(item)"
        @mouseleave="resumeSlideshow(item)"
      >
        <div class="image-container">
          <img
            v-for="(image, index) in item.images"
            :key="index"
            :src="`${baseUrl}${image.image_path}`"
            alt="Product Image"
            class="item-image"
            :class="{ active: item.currentImageIndex === index }"
          />
        </div>
        <div class="item-details">
          <h2>{{ item.name }}</h2>
          <p>MKW {{ item.price }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const baseUrl = "http://localhost:1994";
const newlyAddedItems = ref([]);
const slideshowIntervals = ref({});

// Calculate the date one week ago
const getOneWeekAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
};

// Fetch all products added within the last week
const fetchNewlyAddedItems = async () => {
  try {
    const oneWeekAgo = getOneWeekAgoDate();
    const response = await axios.get(
      `${baseUrl}/api/products/getAllProducts?startDate=${oneWeekAgo}`
    );

    // Add a currentImageIndex property to each item for slideshow
    newlyAddedItems.value = response.data.map((item) => ({
      ...item,
      currentImageIndex: 0, // Start with the first image
    }));

    // Start slideshow for items with multiple images
    newlyAddedItems.value.forEach((item, index) => {
      if (item.images.length > 1) {
        startSlideshow(index);
      }
    });
  } catch (error) {
    console.error("Error fetching newly added items:", error);
  }
};

// Start a slideshow for a specific item
const startSlideshow = (index) => {
  if (slideshowIntervals.value[index]) {
    clearInterval(slideshowIntervals.value[index]); // Clear existing interval if any
  }

  slideshowIntervals.value[index] = setInterval(() => {
    newlyAddedItems.value[index].currentImageIndex =
      (newlyAddedItems.value[index].currentImageIndex + 1) %
      newlyAddedItems.value[index].images.length;
  }, 5000); // Change image every 5 seconds
};

// Pause slideshow on hover
const pauseSlideshow = (item) => {
  const index = newlyAddedItems.value.indexOf(item);
  if (slideshowIntervals.value[index]) {
    clearInterval(slideshowIntervals.value[index]);
  }
};

// Resume slideshow on hover out
const resumeSlideshow = (item) => {
  const index = newlyAddedItems.value.indexOf(item);
  if (item.images.length > 1) {
    startSlideshow(index);
  }
};

// Fetch all items when the component is mounted
onMounted(() => {
  fetchNewlyAddedItems();
});
</script>

<style scoped>
.newly-added-section h2 {
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.horizontal-list {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 16px;
  scrollbar-width: none; /* For Firefox */
  -ms-overflow-style: none; /* For Internet Explorer and Edge */
}

.horizontal-list::-webkit-scrollbar {
  display: none; /* For Chrome, Safari, and Opera */
}

.item {
  flex: 0 0 auto;
  width: 150px;
  text-align: center;
}

.image-container {
  position: relative;
  width: 150px;
  height: 150px;
  overflow: hidden;
  border-radius: 8px;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.item-image.active {
  opacity: 1;
}

.item-details {
  margin-top: 8px;
}

.item-details h2 {
  font-size: 1rem;
  font-weight: bold;
  margin: 0;
}

.item-details p {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}
</style>

<template>
  <div class="app-body">
    <!-- Newly Added Section -->
    <NewlyAdded />

    <!-- Category Section Placeholder -->
    <div class="category-section">
      <p>Category Section Placeholder</p>
    </div>

    <!-- Product List Section Placeholder -->
    <div class="product-list-section">
      <p>Product List Section Placeholder</p>
    </div>

    <!-- Promotional Section Placeholder -->
    <div class="promotional-section">
      <p>Promotional Section Placeholder</p>
    </div>

    <!-- Promotional Section Placeholder -->
    <div class="promotional-section">
      <p>Promotional Section Placeholder</p>
    </div>
    <!-- Promotional Section Placeholder -->
    <div class="promotional-section">
      <p>Promotional Section Placeholder</p>
    </div>
    <!-- Promotional Section Placeholder -->
    <div class="promotional-section">
      <p>Promotional Section Placeholder</p>
    </div>
  </div>
</template>

<script>
import NewlyAdded from "@/components/NewlyAdded.vue"; // Import the NewlyAdded component

export default {
  name: "AppBody",
  components: {
    NewlyAdded, // Register the NewlyAdded component
  },
};
</script>

<style scoped>
.app-body {
  padding: 0px 20px;
}

.category-section {
  margin: 20px 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.product-list-section {
  padding: 10px;
  background-color: #fff;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.promotional-section {
  height: 150px;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

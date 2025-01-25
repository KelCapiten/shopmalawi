<template>
  <div class="inquiries-container">
    <h5>Do you have any of these for sale?</h5>
    <div v-if="inquiries.length > 0" class="inquiries-list">
      <div class="inquiry-card" v-for="inquiry in inquiries" :key="inquiry.id">
        <!-- Name with quantity needed in parentheses -->
        <h3>{{ inquiry.name }} ({{ inquiry.stock_quantity }} needed)</h3>

        <!-- Display images -->
        <div class="inquiry-images">
          <div class="image-grid">
            <div
              class="image-item"
              v-for="(image, index) in inquiry.images"
              :key="index"
            >
              <img
                :src="`http://localhost:1994${image.image_path}`"
                :alt="`Image ${index + 1}`"
                class="inquiry-image"
              />
            </div>
          </div>
        </div>

        <!-- Description -->
        <p>
          <strong>I'm looking for,</strong> {{ inquiry.name }}.
          {{ inquiry.description }}
        </p>

        <!-- Inquiry Date -->
        <div class="inquiry-date" v-if="inquiry.created_at">
          {{ formatDate(inquiry.created_at) }}
        </div>

        <!-- Location Badge and Sell Button -->
        <div class="location-and-button">
          <div class="location-badge" v-if="inquiry.location_name">
            {{ inquiry.location_name }}
          </div>
          <button class="sell-button" @click="handleSell(inquiry)">
            Make an offer
          </button>
        </div>
      </div>
    </div>
    <p v-else>No inquiries found.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

interface Inquiry {
  id: number;
  name: string;
  description: string;
  category_name: string;
  stock_quantity: number;
  status: string;
  images: {
    image_path: string;
    is_primary: boolean;
  }[];
  location_name?: string;
  created_at?: string;
}

export default defineComponent({
  name: "InquiriesList",
  props: {
    inquiries: {
      type: Array as PropType<Inquiry[]>,
      required: true,
    },
  },
  methods: {
    formatDate(date: string): string {
      const options: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric",
      };
      return new Date(date).toLocaleDateString("en-GB", options);
    },
    handleSell(inquiry: Inquiry) {
      // Handle the "Sell" button click
      console.log("Sell inquiry:", inquiry);
      // Add your logic here, e.g., open a modal or navigate to a sell page
    },
  },
});
</script>

<style scoped>
.inquiries-container {
  margin-bottom: 20px;
}

.inquiries-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inquiry-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  background-color: #f9f9f9;
}

.inquiry-card h3 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

/* Flexbox layout for images */
.inquiry-images .image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.image-item {
  width: 90px;
  height: 90px;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
  flex: 0 0 auto;
}

.inquiry-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.inquiry-date {
  margin: 5px;
  color: #555;
  font-size: 0.65rem;
}

/* Location and Sell Button Container */
.location-and-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0px;
}

.location-badge {
  display: inline-block;
  margin: 0px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: green;
  color: #fff;
  font-size: 0.65rem;
}

.sell-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: #007bff; /* Blue color for the button */
  color: #fff;
  font-size: 0.65rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.sell-button:hover {
  background-color: #0056b3; /* Darker blue on hover */
}
</style>

<template>
  <div class="inquiries-container">
    <h5>Do you have any of these for sale?</h5>
    <div v-if="inquiries.length > 0" class="inquiries-list">
      <div class="inquiry-card" v-for="inquiry in inquiries" :key="inquiry.id">
        <h3>{{ inquiry.name }} ({{ inquiry.stock_quantity }} needed)</h3>
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
        <p>
          <strong>I'm looking for,</strong> {{ inquiry.name }}.
          {{ inquiry.description }}
        </p>
        <div class="inquiry-date" v-if="inquiry.created_at">
          {{ formatDate(inquiry.created_at) }}
        </div>
        <div class="location-and-button">
          <div class="location-badge" v-if="inquiry.location_name">
            {{ inquiry.location_name }}
          </div>
          <button
            class="sell-button"
            @click="toggleProductCardGrid(inquiry.id)"
          >
            {{
              visibleProductCardGridId === inquiry.id
                ? "Cancel"
                : "Make an offer"
            }}
          </button>
        </div>
        <ProductCardGrid
          v-if="visibleProductCardGridId === inquiry.id"
          :heading="`Search and offer your products to this buyer`"
          infoPosition="side"
          imageSize="small"
          :enableCounter="false"
          :enableSearch="true"
          :inquiries_id="inquiry.id"
          @associateInquiryToProduct="associateInquiryToProduct"
          @productClicked="navigateToProductPage"
        />
      </div>
    </div>
    <p v-else>No inquiries found.</p>
  </div>
</template>

<script lang="ts">
import axios from "axios";
import { defineComponent, PropType, ref } from "vue";
import { useRouter } from "vue-router"; // Import useRouter
import { useAuthStore } from "@/stores/authStore";
import ProductCardGrid from "@/components/ProductCardGrid.vue";

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
  components: {
    ProductCardGrid,
  },
  props: {
    inquiries: {
      type: Array as PropType<Inquiry[]>,
      required: true,
    },
  },
  setup() {
    const visibleProductCardGridId = ref<number | null>(null);
    const router = useRouter(); // Initialize the router instance

    const toggleProductCardGrid = (inquiryId: number) => {
      visibleProductCardGridId.value =
        visibleProductCardGridId.value === inquiryId ? null : inquiryId;
    };

    const navigateToProductPage = (product: any) => {
      sessionStorage.setItem("selectedProduct", JSON.stringify(product));
      router.push({ name: "ProductPage", params: { id: product.id } });
    };

    return {
      visibleProductCardGridId,
      toggleProductCardGrid,
      navigateToProductPage,
    };
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
    async associateInquiryToProduct(product: any) {
      const { inquiries_id, id: product_id } = product;

      if (!inquiries_id) {
        console.error("No inquiries_id associated with the product");
        return;
      }

      try {
        const authStore = useAuthStore();
        const token = authStore.token;

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:1994";

        const response = await axios.post(
          `${API_BASE_URL}/api/inquiries/associateInquiryToProduct`,
          { inquiries_id, product_id },
          { headers }
        );

        console.log(
          "Successfully associated inquiry with product:",
          response.data
        );
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.error(
            "Error associating inquiry:",
            err.response?.data || err.message
          );
        } else {
          console.error("Unexpected error:", err);
        }
      }
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

.inquiry-images .image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.image-item {
  background-color: #fff;
  padding: 5px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: 90px;
  height: 90px;
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
  background-color: #007bff;
  color: #fff;
  font-size: 0.65rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.sell-button:hover {
  background-color: #0056b3;
}
</style>

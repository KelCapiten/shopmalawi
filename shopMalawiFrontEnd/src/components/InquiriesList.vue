//\src\components\InquiriesList.vue
<template>
  <div class="inquiries-container">
    <h5>Do you have any of these for sale?</h5>

    <div v-if="inquiries.length > 0" class="inquiries-list">
      <div class="inquiry-card" v-for="inquiry in inquiries" :key="inquiry.id">
        <div class="inquiry-header">
          <!-- Edit icon on the far left (visible only if the logged in user uploaded the inquiry) -->
          <ion-icon
            v-if="inquiry.uploaded_by_user_id === userId"
            :icon="createOutline"
            class="edit-icon"
            @click.stop="$emit('editInquiry', inquiry.id)"
          ></ion-icon>

          <!-- Inquiry title left-aligned -->
          <h3>{{ inquiry.name }} ({{ inquiry.stock_quantity }} needed)</h3>

          <!-- Trash icon on the far right (visible only if the logged in user uploaded the inquiry) -->
          <ion-icon
            v-if="inquiry.uploaded_by_user_id === userId"
            :icon="trash"
            class="delete-icon"
            @click.stop="$emit('deleteInquiry', inquiry.id)"
          ></ion-icon>
        </div>

        <div class="inquiry-images">
          <div class="image-grid">
            <div
              class="image-item"
              v-for="(image, index) in inquiry.images"
              :key="index"
            >
              <img
                :src="getImageUrl(image.image_path)"
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
            :class="{ cancel: visibleProductCardGridId === inquiry.id }"
            @click="makeAnOffer(inquiry.id)"
          >
            {{
              visibleProductCardGridId === inquiry.id
                ? "Cancel"
                : "Make an offer"
            }}
          </button>
        </div>

        <div
          v-if="visibleProductCardGridId === inquiry.id"
          class="search-container"
        >
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="search-input"
          />
        </div>

        <productDisplay
          v-if="visibleProductCardGridId === inquiry.id"
          class="searchResultsDisplay"
          heading="Offer your products"
          :products="searchedProducts"
          :emptyMessageEnabled="true"
          emptyMessageButtonText="ADD NEW PRODUCT"
          emptyMessageSubText="You don't have this product in your account, would you like to add it?"
          @productClicked="searchedProductClicked"
          :showCategoryName="false"
          infoPosition="side"
          imageSize="small"
        />

        <productDisplay
          v-if="visibleProductCardGridId === inquiry.id"
          :products="offeredProducts"
          :emptyMessageEnabled="true"
          emptyMessageText="No offers made to this request yet."
          emptyMessageSubText="BE THE FIRST TO MAKE AN OFFER TO THIS BUYER!"
          @productClicked="offeredProductClicked"
          @removeOfferedProduct="removeOfferedProduct"
          heading="(Click to view) Offers made to this request"
          :showCategoryName="false"
          infoPosition="side"
          imageSize="small"
          :userId="userId"
          :showDeleteButton="true"
        />
      </div>
    </div>

    <p v-else>No inquiries found.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import productDisplay from "@/components/productDisplay.vue";
import { getImageUrl, formatDate } from "@/utils/utilities";
import { createOutline, trash } from "ionicons/icons";

export default defineComponent({
  name: "InquiriesList",
  components: {
    productDisplay,
  },
  props: {
    inquiries: {
      type: Array as PropType<Array<any>>,
      required: true,
    },
    searchedProducts: {
      type: Array as PropType<Array<any>>,
      default: () => [],
    },
    offeredProducts: {
      type: Array as PropType<Array<any>>,
      default: () => [],
    },
    searchPlaceholder: {
      type: String,
      default: "Search for your products here...",
    },
    userId: {
      type: Number,
      default: 0,
    },
  },
  emits: [
    "makeAnOffer",
    "searchQueryUpdated",
    "searchedProductClicked",
    "offeredProductClicked",
    "removeOfferedProduct",
    "editInquiry",
    "deleteInquiry",
  ],
  data() {
    return {
      searchQuery: "",
      visibleProductCardGridId: null as number | null,
      createOutline, // imported icon from ionicons/icons
      trash, // imported icon from ionicons/icons
    };
  },
  methods: {
    getImageUrl,
    formatDate,
    makeAnOffer(inquiryId: number) {
      this.visibleProductCardGridId =
        this.visibleProductCardGridId === inquiryId ? null : inquiryId;
      this.$emit("makeAnOffer", { inquiryId: this.visibleProductCardGridId });
    },
    searchedProductClicked(product: any) {
      this.$emit("searchedProductClicked", {
        product,
        inquiryId: this.visibleProductCardGridId,
      });
    },
    offeredProductClicked(product: any) {
      this.$emit("offeredProductClicked", product);
    },
    removeOfferedProduct(productId: number) {
      this.$emit("removeOfferedProduct", {
        productId,
        inquiryId: this.visibleProductCardGridId,
      });
    },
  },
  watch: {
    searchQuery(newVal: string) {
      if (this.visibleProductCardGridId) {
        this.$emit("searchQueryUpdated", {
          query: newVal,
          inquiries_id: this.visibleProductCardGridId,
        });
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

.search-container {
  margin: 10px 0;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 2px solid #ccc;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #2196f3;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.4);
}

.search-input::placeholder {
  color: #999;
  font-style: italic;
}

.search-container::before {
  content: "\f002";
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-input {
  padding-left: 40px;
}

.searchResultsDisplay {
  margin-bottom: 20px;
}

.inquiry-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  background-color: #f9f9f9;
}

.inquiry-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.inquiry-header h3 {
  margin: 0;
  flex-grow: 1;
  text-align: left;
  font-size: 1.2rem;
}

.header-icons {
  display: flex;
  align-items: center;
}

.edit-icon {
  cursor: pointer;
  font-size: 1.2rem;
  margin-right: 10px;
  color: #007bff;
}

.delete-icon {
  cursor: pointer;
  font-size: 1.2rem;
  margin-left: 10px;
  color: #e74c3c;
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
  margin: 0;
}

.location-badge {
  display: inline-block;
  margin: 0;
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

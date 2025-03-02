//src/components/InquiriesList.vue
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
            :icon="trashOutline"
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
              <imageDisplay
                :imageUrl="updateImageUrl(image.image_path)"
                :alt="`Image ${index + 1}`"
              />
            </div>
          </div>
        </div>

        <p>
          <strong>I'm looking for,</strong> {{ inquiry.name }}.
          <div v-html="inquiry.description" class="inquiry-description"></div>
        </p>

        <div class="inquiry-date" v-if="inquiry.created_at">
          {{ formatDate(inquiry.created_at) }}
        </div>

        <div class="location-and-button">
          <div class="location-badge" v-if="inquiry.location_name">
            <ion-icon :icon="locationOutline" class="location-icon"></ion-icon>
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
          heading="Offer your products to this request"
          class="searchResultsDisplay"
          :products="searchedProducts"
          :emptyMessageEnabled="true"
          :showCategoryName="false"
          emptyMessageButtonText="ADD NEW PRODUCT"
          emptyMessageSubText="You don't have this product in your account, would you like to add it?"
          infoPosition="side"
          imageSize="small"
          @productClicked="searchedProductClicked"
          @emptyMessageButtonClicked="addProduct"
        />

        <productDisplay
          v-if="visibleProductCardGridId === inquiry.id"
          heading="(Click to view) Offers made to this request"
          :products="offeredProducts"
          :emptyMessageEnabled="true"
          :userId="userId"
          :showDeleteButton="true"
          :showCategoryName="false"
          emptyMessageText="No offers made to this request yet."
          emptyMessageSubText="BE THE FIRST TO MAKE AN OFFER TO THIS BUYER!"
          infoPosition="side"
          imageSize="small"
          @productClicked="offeredProductClicked"
          @removeOfferedProduct="removeOfferedProduct"
        />
      </div>
    </div>

    <p v-else>No inquiries found.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import productDisplay from "@/components/productDisplay.vue";
import imageDisplay from "@/components/imageDisplay.vue";
import { updateImageUrl, formatDate } from "@/utils/utilities";
import { createOutline, trashOutline, locationOutline } from "ionicons/icons";

export default defineComponent({
  name: "InquiriesList",
  components: {
    productDisplay,
    imageDisplay,
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
    "addProduct",
  ],
  data() {
    return {
      searchQuery: "",
      visibleProductCardGridId: null as number | null,
      createOutline,
      trashOutline,
      locationOutline,
    };
  },
  methods: {
    updateImageUrl,
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
    // This method will be triggered when the productDisplay emits emptyMessageButtonClicked.
    addProduct() {
      this.$emit("addProduct");
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
  margin: 15px 0;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 45px;
  font-size: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  background-color: #ffffff;
}

.search-input:focus {
  border-color: #2196f3;
  box-shadow: 0 4px 10px rgba(33, 150, 243, 0.15);
}

.search-input::placeholder {
  color: #9e9e9e;
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
  color: #757575;
  z-index: 1;
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
  color: #424242;
  transition: color 0.2s ease;
}

.delete-icon:hover {
  color: #da3030;
}

.inquiry-images .image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.image-item {
  background-color: #fff;
  padding: 2px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  width: 90px;
  height: 90px;
  overflow: hidden;
  flex: 0 0 auto;
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
  margin: 5px 0;
}

.location-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.75rem;
  border-radius: 4px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-icon {
  font-size: 0.9rem;
}

.sell-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #007bff;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.sell-button:hover {
  background-color: #0056b3;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.sell-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sell-button.cancel {
  background-color: #f44336;
}

.sell-button.cancel:hover {
  background-color: #d32f2f;
}

/* Add styles for rich text content */
:deep(.inquiry-description) {
  p {
    margin: 0.5em 0;
  }
  
  ul, ol {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  
  a {
    color: #007bff;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  blockquote {
    border-left: 3px solid #ccc;
    margin: 0.5em 0;
    padding-left: 1em;
    color: #666;
  }
}
</style>
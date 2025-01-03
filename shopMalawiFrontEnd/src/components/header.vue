<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <img :src="logo" alt="ShopMalawi Logo" class="header-logo" />
      </ion-buttons>
      <ion-buttons slot="end">
        <ion-button aria-label="Cart">
          <ion-icon :icon="cartOutline" slot="icon-only"></ion-icon>
        </ion-button>
        <ion-button @click="theme.toggleTheme" aria-label="Toggle Theme">
          <ion-icon :icon="theme.themeIcon" slot="icon-only"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <!-- Search Bar -->
    <ion-toolbar class="search-bar" v-if="showSearchBar">
      <ion-searchbar
        placeholder="Search products..."
        :debounce="500"
        show-cancel-button="focus"
        class="custom-searchbar"
        @ionInput="handleSearch"
      ></ion-searchbar>
    </ion-toolbar>

    <!-- Category Segment -->
    <ion-toolbar v-if="showCategorySegment">
      <ion-segment scrollable class="category-segment">
        <ion-segment-button
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
          @click="toggleSubcategories(category.id)"
        >
          {{ category.name }}
        </ion-segment-button>
      </ion-segment>
    </ion-toolbar>

    <!-- Subcategories Section -->
    <div v-if="visibleCategoryId !== null" class="subcategory-container">
      <ion-segment scrollable>
        <ion-segment-button
          v-for="sub in categories.find((cat) => cat.id === visibleCategoryId)
            ?.subcategories"
          :key="sub.id"
          :value="sub.id"
        >
          {{ sub.name }}
        </ion-segment-button>
      </ion-segment>
    </div>
  </ion-header>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useThemeStore } from "@/stores/themeStore";
import axios from "axios";
import { cartOutline } from "ionicons/icons";

type Category = {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  subcategories?: Category[];
};

export default defineComponent({
  name: "ShopMalawiHeader",
  props: {
    logo: {
      type: String,
      default: "/assets/logo.png",
    },
    showSearchBar: {
      type: Boolean,
      default: true,
    },
    showCategorySegment: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    const theme = useThemeStore();
    const categories = ref<Category[]>([]);
    const visibleCategoryId = ref<number | null>(null);
    const toastMessage = ref("");
    const toastColor = ref("");
    const showToast = ref(false);

    // Fetch categories from the database
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/products/getCategories"
        );
        categories.value = response.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
        toastMessage.value = "Failed to fetch categories.";
        toastColor.value = "danger";
        showToast.value = true;
      }
    };

    // Toggle visibility of subcategories
    const toggleSubcategories = (categoryId: number) => {
      visibleCategoryId.value =
        visibleCategoryId.value === categoryId ? null : categoryId;
    };

    const handleSearch = (event: CustomEvent) => {
      const query = event.detail.value?.trim() || "";
      console.log("Search query:", query);
      // Add your search logic here
    };

    onMounted(() => {
      fetchCategories();
    });

    return {
      theme,
      categories,
      visibleCategoryId,
      toggleSubcategories,
      handleSearch,
      cartOutline,
      toastMessage,
      toastColor,
      showToast,
    };
  },
});
</script>

<style scoped>
.header-logo {
  height: 30px;
  object-fit: contain;
}

.search-bar {
  padding: 0 20px;
}

ion-searchbar.custom-searchbar {
  --background: var(--ion-background-color);
  --placeholder-color: var(--ion-text-color);
  --color: var(--ion-text-color);
  --icon-color: var(--ion-text-color);
  --border-radius: 50px;
  border-radius: 50px;
  --box-shadow: none;
  border: 2px solid var(--ion-text-color);
}

ion-header,
ion-toolbar {
  --background: var(--ion-background-color);
  background: var(--ion-background-color);
  box-shadow: none;
  border: none;
}

.category-segment {
  --background: var(--ion-background-color);
}

.subcategory-container {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--ion-background-color);
  padding: 10px 0;
  border-bottom: 1px solid var(--ion-color-step-100);
}

.subcategory-container ion-segment {
  --background: var(--ion-background-color);
}

.subcategory-container ion-segment-button {
  --color: var(--ion-color-step-300);
}

.subcategory-container ion-segment-button:hover {
  --color: var(--ion-color-primary);
}
</style>

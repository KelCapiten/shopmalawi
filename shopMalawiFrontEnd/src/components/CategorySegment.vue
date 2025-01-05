<template>
  <ion-toolbar>
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
  <div v-if="visibleCategoryId !== null" class="subcategory-container">
    <ion-segment scrollable>
      <ion-segment-button
        v-for="sub in subcategories"
        :key="sub.id"
        :value="sub.id"
      >
        {{ sub.name }}
      </ion-segment-button>
    </ion-segment>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import axios from "axios";

type Category = {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  subcategories?: Category[];
};

export default defineComponent({
  name: "CategorySegment",
  setup() {
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

    const subcategories = computed(
      () =>
        categories.value.find((cat) => cat.id === visibleCategoryId.value)
          ?.subcategories || []
    );

    onMounted(() => {
      fetchCategories();
    });

    return {
      categories,
      visibleCategoryId,
      toggleSubcategories,
      subcategories,
      toastMessage,
      toastColor,
      showToast,
    };
  },
});
</script>

<style scoped>
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

<template>
  <!-- Top-level categories -->
  <ion-toolbar>
    <ion-segment scrollable class="category-segment">
      <ion-segment-button
        v-for="category in categories"
        :key="category.id"
        :value="category.id"
        @click="toggleCategory(category.id)"
      >
        {{ category.name }}
      </ion-segment-button>
    </ion-segment>
  </ion-toolbar>

  <!-- Subcategories (only visible for the expanded top-level category) -->
  <div v-if="visibleCategoryId !== null" class="subcategory-container">
    <ion-segment scrollable>
      <ion-segment-button
        v-for="sub in subcategories"
        :key="sub.id"
        :value="sub.id"
        @click="selectSubcategory(sub.id)"
      >
        {{ sub.name }}
      </ion-segment-button>
    </ion-segment>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from "vue";
import axios from "axios";

/** Type for your category objects */
type Category = {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  subcategories?: Category[];
};

export default defineComponent({
  name: "CategorySegment",

  /**
   * Declare that this component can emit "categorySelected".
   */
  emits: ["categorySelected"],

  setup(_, { emit }) {
    const categories = ref<Category[]>([]);
    const visibleCategoryId = ref<number | null>(null);

    /**
     * Fetch categories from the DB on mount
     */
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/products/getCategories"
        );
        categories.value = response.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    /**
     * When a top-level category is clicked:
     * 1) Toggle subcategories for that category.
     * 2) Emit "categorySelected" so the parent knows to filter or navigate.
     */
    const toggleCategory = (categoryId: number) => {
      visibleCategoryId.value =
        visibleCategoryId.value === categoryId ? null : categoryId;
      emit("categorySelected", categoryId);
    };

    /**
     * When a subcategory is clicked, just emit
     * "categorySelected" for the parent to handle.
     */
    const selectSubcategory = (subcategoryId: number) => {
      emit("categorySelected", subcategoryId);
    };

    /**
     * A computed property that returns the subcategories
     * of whichever top-level category is currently visible.
     */
    const subcategories = computed(() => {
      return (
        categories.value.find((cat) => cat.id === visibleCategoryId.value)
          ?.subcategories || []
      );
    });

    onMounted(() => {
      fetchCategories();
    });

    return {
      categories,
      visibleCategoryId,
      subcategories,
      toggleCategory,
      selectSubcategory,
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

<template>
  <!-- Top-level categories -->
  <ion-toolbar>
    <ion-segment scrollable class="category-segment">
      <ion-segment-button
        v-for="category in categories"
        :key="category.id"
        :value="category.id"
        @click="selectCategory(category.id)"
      >
        {{ category.name }}
      </ion-segment-button>
    </ion-segment>
  </ion-toolbar>

  <!-- Subcategories (visible for the expanded top-level category) -->
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

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useCategories } from "@/composables/useCategories";

// Composable for categories
const { categories, fetchCategories } = useCategories();

// Track which top-level category is expanded
const visibleCategoryId = ref<number | null>(null);

// When component mounts, fetch all categories
onMounted(() => {
  fetchCategories();
});

// A computed list of subcategories for the expanded category
const subcategories = computed(() => {
  if (visibleCategoryId.value !== null) {
    const selectedCategory = categories.value.find(
      (cat) => cat.id === visibleCategoryId.value
    );
    return selectedCategory?.subcategories || [];
  }
  return [];
});

// Toggle top-level category expansion
function toggleCategory(categoryId: number) {
  visibleCategoryId.value =
    visibleCategoryId.value === categoryId ? null : categoryId;
}

// Router instance for navigation
const router = useRouter();

function selectCategory(categoryId: number) {
  toggleCategory(categoryId);

  router.push({
    name: "shop",
    query: { categoryId },
  });
}

function selectSubcategory(subcategoryId: number) {
  router.push({
    name: "shop",
    query: { categoryId: subcategoryId },
  });
}
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

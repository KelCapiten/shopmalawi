// src/composables/useCategories.ts
import { ref, computed } from "vue";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categoryService";
import type { Category } from "@/types/types";

export function useCategories() {
  const categories = ref<Category[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all categories
  const fetchCategories = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await getCategories();
      categories.value = data;
    } catch (err: any) {
      error.value = err?.response?.data?.message || "Error fetching categories";
    } finally {
      isLoading.value = false;
    }
  };

  // Add a new category
  const createCategory = async (payload: {
    name: string;
    description?: string;
    parent_id?: number | null;
  }) => {
    isLoading.value = true;
    error.value = null;
    try {
      await addCategory(payload);
      // Refresh categories after successful addition
      await fetchCategories();
    } catch (err: any) {
      error.value = err?.response?.data?.message || "Error adding category";
    } finally {
      isLoading.value = false;
    }
  };

  // Update an existing category
  const editCategory = async (
    id: number,
    payload: {
      name: string;
      description?: string;
      parent_id?: number | null;
    }
  ) => {
    isLoading.value = true;
    error.value = null;
    try {
      await updateCategory(id, payload);
      // Refresh categories after successful update
      await fetchCategories();
    } catch (err: any) {
      error.value = err?.response?.data?.message || "Error updating category";
    } finally {
      isLoading.value = false;
    }
  };

  // Delete a category
  const removeCategory = async (id: number) => {
    isLoading.value = true;
    error.value = null;
    try {
      await deleteCategory(id);
      // Refresh categories after successful deletion
      await fetchCategories();
    } catch (err: any) {
      error.value = err?.response?.data?.message || "Error deleting category";
    } finally {
      isLoading.value = false;
    }
  };

  // Optional: A flattened list of categories if needed
  const flatCategories = computed(() => {
    const flatten = (cats: Category[]): Category[] => {
      return cats.reduce((acc: Category[], cat: Category) => {
        acc.push(cat);
        if (cat.subcategories && cat.subcategories.length > 0) {
          acc.push(...flatten(cat.subcategories));
        }
        return acc;
      }, []);
    };
    return flatten(categories.value);
  });

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    editCategory,
    removeCategory,
    flatCategories,
  };
}

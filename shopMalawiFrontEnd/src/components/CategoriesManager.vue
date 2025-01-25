<template>
  <div class="categories-container">
    <!-- Toggle Header for entire settings -->
    <div @click="toggleSettings" class="settings-header">
      <h3>Manage Categories</h3>
      <span>{{ showSettings ? "▲" : "▼" }}</span>
    </div>

    <!-- Main Settings Content -->
    <transition name="expand">
      <div v-if="showSettings" class="settings-content">
        <!-- Existing Categories -->
        <div class="category-list">
          <h4>Existing Categories</h4>
          <ul class="cat-ul">
            <li v-for="category in categories" :key="category.id">
              <!-- Category Row -->
              <div class="category-row" @click="toggleCategory(category.id)">
                <div class="cat-primary">
                  <strong>{{ category.name }}</strong>
                  <span class="desc">{{ category.description }}</span>
                </div>
                <!-- Chevron if subcategories exist -->
                <div class="action-chevron">
                  <span
                    v-if="
                      category.subcategories && category.subcategories.length
                    "
                  >
                    {{ expandedRows.includes(category.id) ? "▲" : "▼" }}
                  </span>
                </div>
              </div>

              <!-- Category Actions: only visible if selected -->
              <div
                v-if="selectedId === category.id"
                class="btn-group cat-btns"
                @click.stop
              >
                <button class="edit-btn" @click="editCategory(category)">
                  Edit
                </button>
                <button class="del-btn" @click="deleteCategory(category.id)">
                  Delete
                </button>
              </div>

              <!-- Subcategories -->
              <transition-group
                name="expand"
                tag="ul"
                v-if="expandedRows.includes(category.id)"
                class="sub-ul"
              >
                <li
                  v-for="subcat in category.subcategories"
                  :key="subcat.id"
                  class="subcategory-row"
                  @click="toggleCategory(subcat.id)"
                >
                  <div class="sub-primary">
                    <strong>{{ subcat.name }}</strong>
                    <span class="desc">{{ subcat.description }}</span>
                  </div>
                  <!-- Subcategory Edit/Delete if selected -->
                  <div
                    v-if="selectedId === subcat.id"
                    class="btn-group sub-btns"
                    @click.stop
                  >
                    <button class="edit-btn" @click="editCategory(subcat)">
                      Edit
                    </button>
                    <button class="del-btn" @click="deleteCategory(subcat.id)">
                      Delete
                    </button>
                  </div>
                </li>
              </transition-group>
            </li>
          </ul>
        </div>

        <!-- Original Add/Edit Category Form -->
        <div class="category-form">
          <h4>{{ isEditing ? "Edit Category" : "Add Category" }}</h4>
          <form @submit.prevent="submitCategory">
            <input
              v-model="form.name"
              type="text"
              placeholder="Category Name"
              required
            />
            <textarea
              v-model="form.description"
              placeholder="Category Description"
            ></textarea>
            <select v-model="form.parent_id">
              <option :value="null">None</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <button type="submit">
              {{ isEditing ? "Update" : "Add" }}
            </button>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

export default {
  name: "CategoriesManager",
  data() {
    return {
      categories: [],
      showSettings: false,
      form: {
        id: null,
        name: "",
        description: "",
        parent_id: null,
      },
      isEditing: false,
      expandedRows: [],
      selectedId: null,
    };
  },
  methods: {
    async fetchCategories() {
      try {
        const response = await axios.get(
          "http://localhost:1994/api/categories/getCategories"
        );
        this.categories = response.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    },
    toggleSettings() {
      this.showSettings = !this.showSettings;
    },
    toggleCategory(id) {
      if (this.expandedRows.includes(id)) {
        this.expandedRows = this.expandedRows.filter((rowId) => rowId !== id);
      } else {
        this.expandedRows.push(id);
      }
      this.selectedId = this.selectedId === id ? null : id;
    },
    editCategory(category) {
      this.form = { ...category };
      this.isEditing = true;
      this.showSettings = true;
    },
    async deleteCategory(id) {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;

        await axios.delete(
          `http://localhost:1994/api/categories/deleteCategory/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        this.fetchCategories();
      } catch (error) {
        console.error(
          "Error deleting category:",
          error.response?.data || error
        );
      }
    },
    async submitCategory() {
      try {
        const authStore = useAuthStore();
        const token = authStore.token;
        const headers = { Authorization: `Bearer ${token}` };

        if (this.isEditing) {
          await axios.put(
            `http://localhost:1994/api/categories/updateCategory/${this.form.id}`,
            this.form,
            { headers }
          );
        } else {
          await axios.post(
            "http://localhost:1994/api/categories/addCategory",
            {
              name: this.form.name,
              description: this.form.description || null,
              parent_id: this.form.parent_id || null,
            },
            { headers }
          );
        }

        this.resetForm();
        this.fetchCategories();
      } catch (error) {
        console.error("Error submitting category:", error);
      }
    },
    resetForm() {
      this.form = {
        id: null,
        name: "",
        description: "",
        parent_id: null,
      };
      this.isEditing = false;
    },
  },
  mounted() {
    this.fetchCategories();
  },
};
</script>

<style scoped>
.categories-container {
  margin: 1rem 0;
  font-family: Arial, sans-serif;
}

/* Header to toggle entire settings */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f2f2f2;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 6px;
  user-select: none;
}

.settings-header h3 {
  margin: 0;
  font-size: 1rem;
}

/* Content container */
.settings-content {
  margin-top: 0.5rem;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1rem;
}

/* Category List */
.category-list {
  margin-bottom: 1rem;
}
.category-list h4 {
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.25rem;
}

/* Outer category list */
.cat-ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Category row */
.category-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  cursor: pointer;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}
.category-row:hover {
  background: #eee;
}
.cat-primary {
  display: flex;
  flex-direction: column;
}
.desc {
  font-size: 0.85rem;
  color: #666;
}
.action-chevron {
  align-self: center;
  font-size: 0.85rem;
  color: #666;
}

/* Subcategory list */
.sub-ul {
  list-style: none;
  padding-left: 1.25rem;
  margin: 0.5rem 0;
}
.subcategory-row {
  background: #fdfdfd;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  padding: 0.5rem;
  cursor: pointer;
}
.subcategory-row:hover {
  background: #eee;
}
.sub-primary {
  display: flex;
  flex-direction: column;
}

/* Buttons shown on click */
.btn-group {
  display: flex;
  gap: 0.5rem;
  margin: 0.25rem 0 0.5rem 0;
}
.cat-btns,
.sub-btns {
  margin-left: 0.5rem;
}

.edit-btn,
.del-btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.edit-btn {
  background-color: #167ef9;
  color: #fff;
}
.del-btn {
  background-color: #e74c3c;
  color: #fff;
}

/* Original Form for Add/Edit */
.category-form {
  margin-top: 1rem;
}
.category-form h4 {
  margin-bottom: 0.75rem;
  font-weight: 600;
}
.category-form form {
  display: flex;
  flex-direction: column;
}
.category-form form input,
.category-form form textarea,
.category-form form select {
  display: block;
  width: 100%;
  margin: 0.5rem 0;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.category-form form button {
  align-self: start;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background-color: #28b62c;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}
.expand-enter,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>

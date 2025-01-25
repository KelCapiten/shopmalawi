import db from "../config/db.js";

// endpoint to add a category
export const addCategory = async (req, res) => {
  const { name, description, parent_id } = req.body;

  try {
    // Validate request body
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if parent_id exists (if provided)
    if (parent_id) {
      const [parentCheck] = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [parent_id]
      );
      if (parentCheck.length === 0) {
        return res
          .status(400)
          .json({ message: "Parent category does not exist" });
      }
    }

    // Insert the new category
    const [result] = await db.query(
      "INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)",
      [name, description || null, parent_id || null]
    );

    res.status(201).json({
      message: "Category added successfully",
      category: {
        id: result.insertId,
        name,
        description,
        parent_id,
      },
    });
  } catch (error) {
    console.error("Error adding category:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Category name already exists" });
    }

    res.status(500).json({ message: "Failed to add category" });
  }
};

// endpoint to update a category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, parent_id } = req.body;

  try {
    if (!id || !name) {
      return res
        .status(400)
        .json({ message: "Category ID and name are required" });
    }

    if (parent_id) {
      const [parentCheck] = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [parent_id]
      );
      if (parentCheck.length === 0) {
        return res
          .status(400)
          .json({ message: "Parent category does not exist" });
      }
    }

    const [result] = await db.query(
      "UPDATE categories SET name = ?, description = ?, parent_id = ? WHERE id = ?",
      [name, description || null, parent_id || null, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Category not found or no changes made" });
    }

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Category name already exists" });
    }

    res.status(500).json({ message: "Failed to update category" });
  }
};

// endpoint to delete a category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid Category ID" });
    }

    console.log("Received ID:", categoryId);

    const [result] = await db.query("DELETE FROM categories WHERE id = ?", [
      categoryId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
};

// endpoint to get categories
export const getCategories = async (req, res) => {
  try {
    // Fetch all categories with their parent_id
    const [categories] = await db.query(
      "SELECT id, name, description, parent_id FROM categories"
    );

    // Organize categories into a hierarchical structure
    const categoryMap = new Map();
    const rootCategories = [];

    // Create a map of categories
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, subcategories: [] });
    });

    // Build the hierarchy
    categories.forEach((category) => {
      if (category.parent_id) {
        const parentCategory = categoryMap.get(category.parent_id);
        if (parentCategory) {
          parentCategory.subcategories.push(categoryMap.get(category.id));
        }
      } else {
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    // Sort categories and subcategories A-Z by name
    const sortCategories = (categories) => {
      categories.sort((a, b) => a.name.localeCompare(b.name));
      categories.forEach((category) => {
        if (category.subcategories.length > 0) {
          sortCategories(category.subcategories);
        }
      });
    };

    // Sort the root categories
    sortCategories(rootCategories);

    res.status(200).json(rootCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

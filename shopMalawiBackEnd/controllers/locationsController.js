//\controllers\locationsController.js
import db from "../config/db.js";

// Get all locations
export const getLocations = async (req, res) => {
  try {
    const [locations] = await db.query(
      "SELECT id, name FROM locations ORDER BY name ASC"
    );
    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};

// Add a new location
export const addLocation = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Location name is required" });
  }
  try {
    const [result] = await db.query("INSERT INTO locations (name) VALUES (?)", [
      name,
    ]);
    res
      .status(201)
      .json({ message: "Location added successfully", id: result.insertId });
  } catch (error) {
    console.error("Error adding location:", error);
    res.status(500).json({ message: "Failed to add location" });
  }
};

// Update an existing location
export const updateLocation = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Location name is required" });
  }
  try {
    const [result] = await db.query(
      "UPDATE locations SET name = ? WHERE id = ?",
      [name, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Failed to update location" });
  }
};

// Delete a location
export const deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM locations WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.status(200).json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ message: "Failed to delete location" });
  }
};

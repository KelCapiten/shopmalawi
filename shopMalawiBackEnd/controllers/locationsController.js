import db from "../config/db.js";

// endpoint to get locations
export const getLocations = async (req, res) => {
  try {
    // Fetch all locations ordered alphabetically by name
    const [locations] = await db.query(
      "SELECT id, name FROM locations ORDER BY name ASC"
    );

    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};

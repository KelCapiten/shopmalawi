//\src\composables\useLocations.ts
import { ref } from "vue";
import type { Location } from "@/types";
import {
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
} from "@/services/locationsService";

export default function useLocations() {
  const locations = ref<Location[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchLocations = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await getLocations();
      locations.value = data;
    } catch (err: any) {
      error.value = err.message || "Error fetching locations";
    } finally {
      loading.value = false;
    }
  };

  const createLocation = async (name: string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await addLocation({ name });
      locations.value.push({ id: data.id, name });
      return data;
    } catch (err: any) {
      error.value = err.message || "Error adding location";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const modifyLocation = async (id: number, name: string) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await updateLocation(id, { name });
      locations.value = locations.value.map((loc) =>
        loc.id === id ? { ...loc, name } : loc
      );
      return data;
    } catch (err: any) {
      error.value = err.message || "Error updating location";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeLocation = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await deleteLocation(id);
      locations.value = locations.value.filter((loc) => loc.id !== id);
      return data;
    } catch (err: any) {
      error.value = err.message || "Error deleting location";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    locations,
    loading,
    error,
    fetchLocations,
    createLocation,
    modifyLocation,
    removeLocation,
  };
}

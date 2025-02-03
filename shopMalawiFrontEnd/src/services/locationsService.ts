import apiClient from "./apiClient";

export const getLocations = async () => {
  const response = await apiClient.get("/api/locations/getLocations");
  return response.data;
};

export const addLocation = async (payload: { name: string }) => {
  const response = await apiClient.post("/api/locations/addLocation", payload);
  return response.data;
};

export const updateLocation = async (id: number, payload: { name: string }) => {
  const response = await apiClient.put(
    `/api/locations/updateLocation/${id}`,
    payload
  );
  return response.data;
};

export const deleteLocation = async (id: number) => {
  const response = await apiClient.delete(
    `/api/locations/deleteLocation/${id}`
  );
  return response.data;
};

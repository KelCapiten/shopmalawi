// src/services/userService.ts
import apiClient from "./apiClient";

export interface RegisterUserPayload {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  locationId?: number | null;
}

export interface LoginUserPayload {
  username: string;
  password: string;
}

export const updateUserInfoService = async (
  payload: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    locationId: number | null;
  }>
) => {
  const response = await apiClient.put("/api/users/updateUserInfo", payload);
  return response.data;
};

export const registerUserService = async (payload: RegisterUserPayload) => {
  const response = await apiClient.post("/api/users/register", payload);
  return response.data;
};

export const loginUserService = async (payload: LoginUserPayload) => {
  const response = await apiClient.post("/api/users/login", payload);
  return response.data;
};

// Accept optional query parameters (e.g. { id: ownerIdFromQuery })
export const getUserInfoService = async (params?: { id?: number }) => {
  const response = await apiClient.get("/api/users/getUserInfo", { params });
  return response.data;
};

export const getUsersService = async () => {
  const response = await apiClient.get("/api/users/getUsers");
  return response.data;
};

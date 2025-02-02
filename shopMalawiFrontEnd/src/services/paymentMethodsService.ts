// src/services/paymentMethodsService.ts
import apiClient from "./apiClient";
import type { PaymentMethod } from "@/types";

// Get all or user-specific payment methods
export async function getPaymentMethods(
  userId: number | null = null
): Promise<PaymentMethod[]> {
  const endpoint = userId
    ? `/api/payment-methods/getPaymentMethods?user_id=${userId}`
    : "/api/payment-methods/getPaymentMethods";
  const { data } = await apiClient.get<PaymentMethod[]>(endpoint);
  return data;
}

// Add a new payment method
export async function addPaymentMethod(
  method: Omit<PaymentMethod, "id">
): Promise<PaymentMethod> {
  const { data } = await apiClient.post<PaymentMethod>(
    "/api/payment-methods/addPaymentMethod",
    method
  );
  return data;
}

// Update an existing payment method
export async function updatePaymentMethod(
  id: number,
  updatedMethod: Partial<PaymentMethod>
): Promise<void> {
  await apiClient.put(
    `/api/payment-methods/updatePaymentMethod/${id}`,
    updatedMethod
  );
}

// Delete a payment method
export async function deletePaymentMethod(id: number): Promise<void> {
  await apiClient.delete(`/api/payment-methods/deletePaymentMethod/${id}`);
}

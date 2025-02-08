// src/services/orderPaymentService.ts
import apiClient from "./apiClient";

export async function createOrderAndPayment(
  orderData: {
    user_id: number;
    shipping_address: string;
    shipping_town: string;
    total_amount: number;
    payment_method_id: number;
    payment_amount: number;
    order_items: { product_id: number; quantity: number; price: number }[];
  },
  paymentScreenshot: File
) {
  const formData = new FormData();
  formData.append("user_id", orderData.user_id.toString());
  formData.append("shipping_address", orderData.shipping_address);
  formData.append("shipping_town", orderData.shipping_town);
  formData.append("total_amount", orderData.total_amount.toString());
  formData.append("payment_method_id", orderData.payment_method_id.toString());
  formData.append("payment_amount", orderData.payment_amount.toString());
  formData.append("order_items", JSON.stringify(orderData.order_items));
  formData.append("paymentScreenshot", paymentScreenshot);

  return await apiClient.post(
    "/api/order-pay/createOrderAndPayment",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
}

export async function getBuyOrders(userId?: number) {
  let url = "/api/order-pay/getBuyOrders";
  if (userId) {
    url += `?user_id=${userId}`;
  }
  return await apiClient.get(url);
}

export async function getSellOrders(userId?: number) {
  let url = "/api/order-pay/getSellOrders";
  if (userId) {
    url += `?user_id=${userId}`;
  }
  return await apiClient.get(url);
}

export async function updatePaymentStatus(paymentId: number, status: string) {
  return await apiClient.put(
    `/api/order-pay/updatePaymentStatus/${paymentId}`,
    { status }
  );
}

export async function updateExpiredPaymentStatuses() {
  return await apiClient.put(`/api/order-pay/updateExpiredPayments`);
}

export async function recordRefund(
  refundData: { order_id: number; reason?: string },
  refundScreenshot: File
) {
  const formData = new FormData();
  formData.append("order_id", refundData.order_id.toString());
  if (refundData.reason) {
    formData.append("reason", refundData.reason);
  }
  formData.append("paymentScreenshot", refundScreenshot);

  return await apiClient.post("/api/order-pay/recordRefund", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

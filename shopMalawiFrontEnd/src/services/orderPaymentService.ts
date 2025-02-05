//src/services/orderPaymentService.ts
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

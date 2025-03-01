// src/stores/ordersStore.ts
import { defineStore } from "pinia";
import { useAuthStore } from "@/stores/authStore";

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
}

interface OrderPayload {
  user_id: number;
  shipping_address: string;
  shipping_town: string;
  total_amount: number;
  payment_method_id: number;
  payment_amount: number;
  transaction_id?: string;
  order_items: OrderItem[];
  paymentScreenshot?: File | null;
}

export const useOrdersStore = defineStore("orders", {
  state: (): { payload: OrderPayload } => ({
    payload: {
      user_id: 0,
      shipping_address: "",
      shipping_town: "",
      total_amount: 0,
      payment_method_id: 0,
      payment_amount: 0,
      transaction_id: "",
      order_items: [],
      paymentScreenshot: null,
    },
  }),
  actions: {
    initUserId() {
      const authStore = useAuthStore();
      this.payload.user_id = authStore.user?.id || 0;
    },
    setShippingAddress(address: string) {
      this.payload.shipping_address = address;
    },
    setShippingTown(town: string) {
      this.payload.shipping_town = town;
    },
    setTotalAmount(amount: number) {
      this.payload.total_amount = amount;
    },
    setPaymentMethodId(methodId: number) {
      this.payload.payment_method_id = methodId;
    },
    setPaymentAmount(amount: number) {
      this.payload.payment_amount = amount;
    },
    setTransactionId(id: string) {
      this.payload.transaction_id = id;
    },
    setOrderItems(items: OrderItem[]) {
      this.payload.order_items = items;
    },
    addOrderItem(item: OrderItem) {
      this.payload.order_items.push(item);
    },
    setPaymentScreenshot(file: File) {
      this.payload.paymentScreenshot = file;
    },
    resetPayload() {
      this.payload = {
        user_id: 0,
        shipping_address: "",
        shipping_town: "",
        total_amount: 0,
        payment_method_id: 0,
        payment_amount: 0,
        transaction_id: "",
        order_items: [],
        paymentScreenshot: null,
      };
      this.initUserId();
    },
  },
});

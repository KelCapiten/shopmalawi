import { defineStore } from "pinia";
import { ref, computed } from "vue";
import useOrderPayment from "@/composables/useOrderPayment";
import router from "@/router/pageRoutes";
import { loadProductFromSessionStorage } from "@/utils/utilities";
import { OrderData } from "@/types/types";
import { useAuthStore } from "./authStore"; // Add this import

export const useBuyAndPayStore = defineStore("buyAndPayStore", () => {
  const authStore = useAuthStore(); // Add this

  // State
  const product = ref<any>(null);
  const showSuccessPopup = ref(false);
  const popupMessage = ref("");
  const paymentMethodRef = ref<any>(null);
  const productOwnerID = ref(0);

  // Initialize order payload with user_id
  const orderPayload = ref({
    user_id: authStore.user?.id || 0,
    shipping_address: "",
    shipping_town: "",
    total_amount: 0,
    payment_method_id: 0,
    payment_amount: 0,
    transaction_id: "",
    order_items: [] as {
      product_id: number;
      quantity: number;
      price: number;
    }[],
    paymentScreenshot: null as File | null,
  });

  // Composables
  const { submitOrderAndPayment, loading, error, orderResponse } =
    useOrderPayment();

  // Computed
  const productDisplayData = computed(() => {
    return product.value
      ? [{ subcategory_name: "Selected Product", products: [product.value] }]
      : [];
  });

  const costPerItem = computed(() =>
    product.value ? parseFloat(product.value.price) : 0
  );

  const subtotal = computed(
    () => costPerItem.value * (product.value?.orderCount || 1)
  );

  const total = computed(() => subtotal.value);

  // Actions
  function initializeProduct() {
    const loadedProduct = loadProductFromSessionStorage<any>();
    if (loadedProduct) {
      product.value = loadedProduct;
      productOwnerID.value = loadedProduct.uploaded_by_userID;
      // Update user_id when initializing
      orderPayload.value.user_id = authStore.user?.id || 0;
    } else {
      router.replace({ name: "shop" });
    }
  }

  function handleIncrement(item: any) {
    if (product.value && product.value.id === item.id) {
      const currentCount = product.value.orderCount || 1;
      if (currentCount < product.value.stock_quantity) {
        product.value.orderCount = currentCount + 1;
      }
    }
  }

  function handleDecrement(item: any) {
    if (product.value && product.value.id === item.id) {
      product.value.orderCount = Math.max(
        (product.value.orderCount || 1) - 1,
        1
      );
    }
  }

  // Order-related actions
  function setShippingAddress(address: string) {
    orderPayload.value.shipping_address = address;
  }

  function setShippingTown(town: string) {
    orderPayload.value.shipping_town = town;
  }

  function setPaymentMethodId(methodId: number) {
    orderPayload.value.payment_method_id = methodId;
  }

  function setPaymentScreenshot(file: File) {
    orderPayload.value.paymentScreenshot = file;
  }

  function setPaymentMethodRef(ref: any) {
    paymentMethodRef.value = ref;
  }

  async function placeOrder() {
    if (!paymentMethodRef.value?.value?.validate()) {
      return;
    }

    // Ensure paymentScreenshot is a File before proceeding
    if (!(orderPayload.value.paymentScreenshot instanceof File)) {
      throw new Error(
        "Payment screenshot is required and must be a valid file"
      );
    }

    const orderData: OrderData = {
      ...orderPayload.value,
      total_amount: total.value,
      payment_amount: total.value,
      order_items: [
        {
          product_id: Number(product.value.id),
          quantity: Number(product.value.orderCount || 1),
          price: costPerItem.value,
        },
      ],
    };

    await submitOrderAndPayment(
      orderData,
      orderPayload.value.paymentScreenshot
    );

    if (orderResponse.value) {
      showSuccessMessage(
        `${orderResponse.value.message}. Order ID: ${orderResponse.value.order_id}.`
      );
    }
  }

  function resetPayload() {
    orderPayload.value = {
      user_id: authStore.user?.id || 0,
      shipping_address: "",
      shipping_town: "",
      total_amount: 0,
      payment_method_id: 0,
      payment_amount: 0,
      transaction_id: "",
      order_items: [],
      paymentScreenshot: null,
    };
  }

  function showSuccessMessage(message: string) {
    popupMessage.value = message;
    showSuccessPopup.value = true;
    setTimeout(() => {
      showSuccessPopup.value = false;
      router.push({ name: "Profile", query: { activateOrders: "true" } });
    }, 10000);
  }

  function cancelOrder() {
    router.back();
  }

  return {
    // State
    product,
    showSuccessPopup,
    popupMessage,
    paymentMethodRef,
    loading,
    error,
    orderPayload,
    productOwnerID,

    // Computed
    productDisplayData,
    costPerItem,
    subtotal,
    total,

    // Actions
    initializeProduct,
    handleIncrement,
    handleDecrement,
    placeOrder,
    cancelOrder,
    showSuccessMessage,
    setShippingAddress,
    setShippingTown,
    setPaymentMethodId,
    setPaymentScreenshot,
    setPaymentMethodRef,
    resetPayload,
  };
});

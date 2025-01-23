<template>
  <IonCard>
    <IonCardHeader>
      <IonCardSubtitle>Payment method</IonCardSubtitle>
    </IonCardHeader>
    <IonCardContent class="payment-method">
      <!-- Loading State -->
      <div v-if="loading" class="loading-message">
        Loading payment methods...
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-message">
        Failed to load payment methods. Please try again.
      </div>

      <!-- Display Payment Methods as an Ionic Dropdown -->
      <div v-if="!loading && !error">
        <IonSelect
          v-model="selectedPaymentMethod"
          placeholder="Select a payment method"
          interface="action-sheet"
          class="custom-select"
        >
          <IonSelectOption
            v-for="method in paymentMethods"
            :key="method.id"
            :value="method.id"
          >
            {{ method.name }}
          </IonSelectOption>
        </IonSelect>
      </div>
    </IonCardContent>
  </IonCard>
</template>

<script>
import { ref, onMounted } from "vue";

export default {
  name: "PaymentMethod",
  setup() {
    const paymentMethods = ref([]); // Store payment methods
    const selectedPaymentMethod = ref(""); // Store selected payment method
    const loading = ref(true); // Loading state
    const error = ref(false); // Error state

    // Fetch payment methods from the API
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch(
          "http://localhost:1994/api/payment-methods/payment-methods"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch payment methods");
        }
        const data = await response.json();
        paymentMethods.value = data; // Update payment methods
      } catch (err) {
        console.error("Error fetching payment methods:", err);
        error.value = true; // Set error state
      } finally {
        loading.value = false; // Set loading to false
      }
    };

    // Fetch payment methods when the component is mounted
    onMounted(() => {
      fetchPaymentMethods();
    });

    return {
      paymentMethods,
      selectedPaymentMethod,
      loading,
      error,
    };
  },
};
</script>

<style scoped>
.payment-method {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-message,
.error-message {
  text-align: center;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.error-message {
  color: var(--ion-color-danger);
}

/* Custom styles for IonSelect */
.custom-select {
  --padding-end: 32px; /* Add padding to the right for the chevron */
  position: relative;
}

.custom-select::part(icon) {
  position: absolute;
  right: 8px; /* Position the chevron on the far right */
  top: 50%;
  transform: translateY(-50%);
  color: var(--ion-color-medium); /* Match the chevron color to the theme */
  transition: transform 0.2s ease-in-out; /* Ensure animation works */
}
</style>

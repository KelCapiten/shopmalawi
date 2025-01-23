<template>
  <IonCard>
    <IonCardHeader>
      <IonCardSubtitle>Payment method</IonCardSubtitle>
    </IonCardHeader>
    <IonCardContent class="payment-method">
      <div v-if="loading" class="loading-message">
        Loading payment methods...
      </div>

      <div v-if="error" class="error-message">
        Failed to load payment methods. Please try again.
      </div>

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

      <ImageUploader
        v-if="selectedPaymentMethod"
        label="Proof of Payment"
        placeholderMessage="Upload the transaction screenshots here"
        @files-selected="handleFilesSelected"
      />
    </IonCardContent>
  </IonCard>
</template>

<script>
import { ref, onMounted } from "vue";
import ImageUploader from "@/components/ImageUploader.vue";

export default {
  name: "PaymentMethod",
  components: {
    ImageUploader,
  },
  setup() {
    const paymentMethods = ref([]);
    const selectedPaymentMethod = ref("");
    const loading = ref(true);
    const error = ref(false);

    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch(
          "http://localhost:1994/api/payment-methods/payment-methods"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch payment methods");
        }
        const data = await response.json();
        paymentMethods.value = data;
      } catch (err) {
        console.error("Error fetching payment methods:", err);
        error.value = true;
      } finally {
        loading.value = false;
      }
    };

    const handleFilesSelected = (files) => {
      console.log("Files selected:", files);
    };

    onMounted(() => {
      fetchPaymentMethods();
    });

    return {
      paymentMethods,
      selectedPaymentMethod,
      loading,
      error,
      handleFilesSelected,
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

.custom-select {
  --padding-end: 32px;
  position: relative;
}

.custom-select::part(icon) {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ion-color-medium);
  transition: transform 0.2s ease-in-out;
}
</style>

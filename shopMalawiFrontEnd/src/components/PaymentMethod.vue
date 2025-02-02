<template>
  <IonCard class="payment-card">
    <IonCardHeader>
      <IonCardSubtitle>Payment Method</IonCardSubtitle>
    </IonCardHeader>
    <div v-if="loading" class="loading-message">Loading payment methods...</div>
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    <div v-if="!loading && !error" class="payment-method">
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
  </IonCard>
  <!-- Send selected payment_method_id to AccountDetailsManager -->
  <AccountDetailsManager
    v-if="selectedPaymentMethod"
    :userId="userId"
    :payment_method_id="selectedPaymentMethod"
    :bankName="selectedBankName"
    :enableForm="false"
    :disableActions="true"
  />
  <IonCard class="uploader">
    <ImageUploader
      v-if="selectedPaymentMethod"
      label="Proof of Payment"
      placeholderMessage="Upload the transaction screenshots here"
      @files-selected="handleFilesSelected"
    />
  </IonCard>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import ImageUploader from "@/components/ImageUploader.vue";
import AccountDetailsManager from "@/components/AccountDetailsManager.vue";
import usePaymentMethods from "@/composables/usePaymentMethods";

export default {
  name: "PaymentMethod",
  components: {
    ImageUploader,
    AccountDetailsManager,
  },
  setup() {
    const { paymentMethods, loading, error, fetchPaymentMethods } =
      usePaymentMethods();
    const selectedPaymentMethod = ref("");

    const handleFilesSelected = (files) => {
      console.log("Files selected:", files);
    };

    onMounted(() => {
      fetchPaymentMethods();
    });

    // Assume we have a userId. Replace with actual logic as needed.
    const userId = 1;

    const selectedBankName = computed(() => {
      const method = paymentMethods.value.find(
        (m) => m.id === selectedPaymentMethod.value
      );
      return method ? method.name : "";
    });

    return {
      paymentMethods,
      selectedPaymentMethod,
      loading,
      error,
      handleFilesSelected,
      userId,
      selectedBankName,
    };
  },
};
</script>

<style scoped>
.payment-card {
  margin: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.payment-card ion-card-subtitle {
  font-weight: bold;
  color: #222;
}

.payment-method {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.loading-message,
.error-message {
  text-align: center;
  font-size: 0.9rem;
  padding: 0.5rem;
}

.loading-message {
  color: var(--ion-color-medium);
}

.error-message {
  color: var(--ion-color-danger);
}

.uploader {
  padding: 0.5rem;
}

.custom-select {
  --padding-end: 32px;
  position: relative;
  font-size: 1rem;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.2s ease-in-out;
}
</style>

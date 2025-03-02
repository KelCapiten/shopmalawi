//src/components/PaymentMethod.vue
<template>
  <!-- Location Card -->
  <IonCard class="payment-card">
    <IonCardSubtitle>Where are you located</IonCardSubtitle>
    <div v-if="loadingLocations" class="loading-message">
      Loading locations...
    </div>
    <div v-else-if="errorLocations" class="error-message">
      {{ errorLocations }}
    </div>
    <div v-else class="location-selector">
      <CustomDropdownSelector
        v-model="selectedLocation"
        :options="locations"
        placeholder="Select a location"
        :class="{ 'highlight-green': validationErrors.location }"
      />
    </div>
  </IonCard>

  <!-- Payment Method Card -->
  <IonCard class="payment-card">
    <IonCardSubtitle>Select Your Payment Method</IonCardSubtitle>
    <div v-if="loadingPaymentMethods" class="loading-message">
      Loading payment methods...
    </div>
    <div v-else-if="errorPaymentMethods" class="error-message">
      {{ errorPaymentMethods }}
    </div>
    <div v-else class="payment-method">
      <CustomDropdownSelector
        v-model="selectedPaymentMethod"
        :options="paymentMethods"
        placeholder="Select a payment method"
        :class="{ 'highlight-green': validationErrors.paymentMethod }"
      />
    </div>
  </IonCard>

  <!-- Additional Components -->
  <AccountDetailsManager
    v-if="selectedPaymentMethod"
    heading2="Send Your Payment To:"
    :heading="false"
    :userId="buyAndPayStore.productOwnerID"
    :payment_method_id="selectedPaymentMethod"
    :bankName="selectedBankName"
    :enableForm="false"
    :disableActions="true"
  />
  <IonCard
    v-if="selectedPaymentMethod"
    class="uploader"
    :class="{ 'highlight-green': validationErrors.screenshot }"
  >
    <ImageUploader
      label="Proof of Payment"
      placeholderMessage="Upload the transaction screenshots here"
      @uploaded-images="handleUploadedImages"
    />
  </IonCard>
</template>

<script>
import { ref, onMounted, computed, reactive, watch } from "vue";
import ImageUploader from "@/components/ImageUploader.vue";
import AccountDetailsManager from "@/components/AccountDetailsManager.vue";
import CustomDropdownSelector from "@/components/CustomDropdownSelector.vue";
import usePaymentMethods from "@/composables/usePaymentMethods";
import useLocations from "@/composables/useLocations";
import { useBuyAndPayStore } from "@/stores/buyAndPayStore";

export default {
  name: "PaymentMethod",
  components: {
    ImageUploader,
    AccountDetailsManager,
    CustomDropdownSelector,
  },
  setup() {
    const buyAndPayStore = useBuyAndPayStore();

    const {
      paymentMethods,
      loading: loadingPaymentMethods,
      error: errorPaymentMethods,
      fetchPaymentMethods,
    } = usePaymentMethods();

    const {
      locations,
      loading: loadingLocations,
      error: errorLocations,
      fetchLocations,
    } = useLocations();

    const selectedPaymentMethod = ref(null);
    const selectedLocation = ref(null);

    const validationErrors = reactive({
      location: false,
      paymentMethod: false,
      screenshot: false,
    });

    const handleUploadedImages = (files) => {
      if (files && files.length > 0) {
        const file = files[0];
        if (file instanceof File) {
          buyAndPayStore.setPaymentScreenshot(file);
        } else {
          console.error("Invalid file type received");
        }
      }
    };

    onMounted(() => {
      fetchLocations();
      fetchPaymentMethods();
      buyAndPayStore.initializeProduct();
    });

    const selectedBankName = computed(() => {
      const method = paymentMethods.value.find(
        (m) => m.id === selectedPaymentMethod.value
      );
      return method ? method.name : "";
    });

    watch(selectedLocation, (newVal) => {
      const locObj = locations.value.find((loc) => loc.id === newVal);
      if (locObj) {
        buyAndPayStore.setShippingTown(locObj.name);
        buyAndPayStore.setShippingAddress(locObj.name);
      }
      if (newVal) validationErrors.location = false;
    });

    watch(selectedPaymentMethod, (newVal) => {
      buyAndPayStore.setPaymentMethodId(Number(newVal));
      if (newVal) validationErrors.paymentMethod = false;
    });

    watch(
      () => buyAndPayStore.orderPayload.paymentScreenshot,
      (newVal) => {
        if (newVal) validationErrors.screenshot = false;
      }
    );

    const validate = () => {
      let valid = true;

      // Check location
      if (!selectedLocation.value) {
        validationErrors.location = true;
        valid = false;
      }

      // Check payment method
      if (!selectedPaymentMethod.value) {
        validationErrors.paymentMethod = true;
        valid = false;
      }

      // Check screenshot
      if (!buyAndPayStore.orderPayload.paymentScreenshot) {
        validationErrors.screenshot = true;
        valid = false;
      }

      return valid;
    };

    return {
      buyAndPayStore,
      paymentMethods,
      loadingPaymentMethods,
      errorPaymentMethods,
      locations,
      loadingLocations,
      errorLocations,
      selectedPaymentMethod,
      selectedLocation,
      validationErrors,
      handleUploadedImages,
      selectedBankName,
      validate,
    };
  },
};
</script>

<style scoped>
.payment-card {
  margin: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background-color: #fff;
}
.payment-card ion-card-subtitle {
  font-weight: bold;
  color: #333;
}
.loading-message,
.error-message {
  text-align: center;
  font-size: 0.9rem;
  padding: 0.5rem;
}
.loading-message {
  color: #888;
}
.error-message {
  color: #e74c3c;
}
.uploader {
  padding: 0.5rem;
}

/* Custom selector styling */
.selector-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  padding: 8px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.selector-display:focus {
  border-color: orange;
  box-shadow: 0 0 5px rgba(255, 165, 0, 0.5);
  outline: none;
}
.selector-display span {
  color: #555;
}
.selector-icon {
  fill: #555;
  width: 16px;
  height: 16px;
}

/* Highlight for validation errors (red) */
.highlight-green {
  border: 2px solid #69ff44;
}

/* Button group styling */
.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
.button-group button {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
}
.button-group button:active {
  transform: scale(0.98);
}
button[type="submit"] {
  background-color: #498115;
  color: #fff;
}
button[type="submit"]:hover {
  background-color: #3a6611;
}
button[type="button"] {
  background-color: #ccc;
  color: #333;
}
button[type="button"]:hover {
  background-color: #bbb;
}
</style>

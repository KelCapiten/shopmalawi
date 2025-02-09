//\src\components\PaymentMethod.vue
<template>
  <IonCard class="payment-card">
    <IonCardSubtitle>Where are you located</IonCardSubtitle>
    <div v-if="loadingLocations" class="loading-message">
      Loading locations...
    </div>
    <div v-if="errorLocations" class="error-message">
      {{ errorLocations }}
    </div>
    <div v-if="!loadingLocations && !errorLocations" class="location-selector">
      <select
        v-model="selectedLocation"
        class="custom-select"
        :class="{ 'highlight-green': validationErrors.location }"
      >
        <option value="" disabled>Select a location</option>
        <option
          v-for="location in locations"
          :key="location.id"
          :value="location.id"
        >
          {{ location.name }}
        </option>
      </select>
    </div>
  </IonCard>
  <IonCard class="payment-card">
    <IonCardSubtitle>Select Your Payment Method</IonCardSubtitle>
    <div v-if="loadingPaymentMethods" class="loading-message">
      Loading payment methods...
    </div>
    <div v-if="errorPaymentMethods" class="error-message">
      {{ errorPaymentMethods }}
    </div>
    <div
      v-if="!loadingPaymentMethods && !errorPaymentMethods"
      class="payment-method"
    >
      <select
        v-model="selectedPaymentMethod"
        class="custom-select"
        :class="{ 'highlight-green': validationErrors.paymentMethod }"
      >
        <option value="" disabled>Select a payment method</option>
        <option
          v-for="method in paymentMethods"
          :key="method.id"
          :value="method.id"
        >
          {{ method.name }}
        </option>
      </select>
    </div>
  </IonCard>
  <AccountDetailsManager
    v-if="selectedPaymentMethod"
    :userId="userId"
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
import { ref, onMounted, computed, watch, reactive } from "vue";
import ImageUploader from "@/components/ImageUploader.vue";
import AccountDetailsManager from "@/components/AccountDetailsManager.vue";
import usePaymentMethods from "@/composables/usePaymentMethods";
import useLocations from "@/composables/useLocations";
import { useOrdersStore } from "@/stores/ordersStore";

export default {
  name: "PaymentMethod",
  components: {
    ImageUploader,
    AccountDetailsManager,
  },
  setup() {
    const ordersStore = useOrdersStore();

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
    const selectedPaymentMethod = ref("");
    const selectedLocation = ref("");

    const validationErrors = reactive({
      location: false,
      paymentMethod: false,
      screenshot: false,
    });

    const handleUploadedImages = (files) => {
      if (files && files.length > 0) {
        let file = files[0];
        // If file is not an instance of File, construct a new File.
        if (!(file instanceof File)) {
          file = new File([file], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          });
        }
        ordersStore.setPaymentScreenshot(file);
      }
    };

    onMounted(() => {
      fetchLocations();
      fetchPaymentMethods();
    });

    const userId = 1;

    const selectedBankName = computed(() => {
      const method = paymentMethods.value.find(
        (m) => m.id === selectedPaymentMethod.value
      );
      return method ? method.name : "";
    });

    watch(selectedLocation, (newLocationId) => {
      const locationObj = locations.value.find(
        (loc) => loc.id === newLocationId
      );
      if (locationObj) {
        ordersStore.setShippingTown(locationObj.name);
        ordersStore.setShippingAddress(locationObj.name);
      }
      if (newLocationId) {
        validationErrors.location = false;
      }
    });

    watch(selectedPaymentMethod, (newMethod) => {
      ordersStore.setPaymentMethodId(Number(newMethod));
      if (newMethod) {
        validationErrors.paymentMethod = false;
      }
    });

    watch(
      () => ordersStore.payload.paymentScreenshot,
      (newVal) => {
        if (newVal) {
          validationErrors.screenshot = false;
        }
      }
    );

    const validate = () => {
      let valid = true;
      if (!selectedLocation.value) {
        validationErrors.location = true;
        valid = false;
      } else {
        validationErrors.location = false;
      }
      if (!selectedPaymentMethod.value) {
        validationErrors.paymentMethod = true;
        valid = false;
      } else {
        validationErrors.paymentMethod = false;
      }
      if (!ordersStore.payload.paymentScreenshot) {
        validationErrors.screenshot = true;
        valid = false;
      } else {
        validationErrors.screenshot = false;
      }
      return valid;
    };

    return {
      paymentMethods,
      loadingPaymentMethods,
      errorPaymentMethods,
      locations,
      loadingLocations,
      errorLocations,
      selectedPaymentMethod,
      selectedLocation,
      handleUploadedImages,
      userId,
      selectedBankName,
      validationErrors,
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

.payment-method,
.location-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #fafafa;
  border-radius: 8px;
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

.custom-select {
  width: 100%;
  padding: 0.6rem 1rem;
  font-size: 1rem;
  color: #333;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  appearance: none;
  outline: none;
  transition: border-color 0.2s ease-in-out;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D'10'%20height%3D'7'%20viewBox%3D'0%200%2010%207'%20fill%3D'none'%20xmlns%3D'http://www.w3.org/2000/svg'%3E%3Cpath%20d%3D'M1%201L5%205L9%201'%20stroke%3D'%23333'%20stroke-width%3D'1.5'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 10px 7px;
}

.custom-select:focus {
  border-color: #3498db;
}

select::-ms-expand {
  display: none;
}

.highlight-green {
  border: 2px solid green;
}
</style>

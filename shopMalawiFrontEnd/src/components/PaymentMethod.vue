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
      <div
        ref="locationTrigger"
        class="selector-display"
        tabindex="0"
        :class="{ 'highlight-green': validationErrors.location }"
        @click.stop="toggleLocationDropdown"
      >
        <span>{{ selectedLocationLabel }}</span>
        <svg
          class="selector-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>
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
      <div
        ref="paymentTrigger"
        class="selector-display"
        tabindex="0"
        :class="{ 'highlight-green': validationErrors.paymentMethod }"
        @click.stop="togglePaymentDropdown"
      >
        <span>{{ selectedPaymentMethodLabel }}</span>
        <svg
          class="selector-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>
    </div>
  </IonCard>

  <!-- Teleport for Location Dropdown -->
  <teleport to="body" v-if="showLocationDropdown">
    <div class="dropdown-overlay" @click="closeLocationDropdown">
      <div class="dropdown" :style="locationDropdownStyle" @click.stop>
        <div
          class="dropdown-option"
          v-for="loc in locations"
          :key="loc.id"
          @click="selectLocation(loc)"
        >
          {{ loc.name }}
        </div>
      </div>
    </div>
  </teleport>

  <!-- Teleport for Payment Method Dropdown -->
  <teleport to="body" v-if="showPaymentDropdown">
    <div class="dropdown-overlay" @click="closePaymentDropdown">
      <div class="dropdown" :style="paymentDropdownStyle" @click.stop>
        <div
          class="dropdown-option"
          v-for="method in paymentMethods"
          :key="method.id"
          @click="selectPaymentMethod(method)"
        >
          {{ method.name }}
        </div>
      </div>
    </div>
  </teleport>

  <!-- Additional Components -->
  <AccountDetailsManager
    v-if="selectedPaymentMethod"
    heading="Send Your Payment To:"
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
import { ref, onMounted, onUnmounted, computed, reactive, watch } from "vue";
import ImageUploader from "@/components/ImageUploader.vue";
import AccountDetailsManager from "@/components/AccountDetailsManager.vue";
import usePaymentMethods from "@/composables/usePaymentMethods";
import useLocations from "@/composables/useLocations";
import { useOrdersStore } from "@/stores/buyStore";

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

    const showLocationDropdown = ref(false);
    const locationDropdownStyle = ref({});
    const showPaymentDropdown = ref(false);
    const paymentDropdownStyle = ref({});

    const locationTrigger = ref(null);
    const paymentTrigger = ref(null);

    const toggleLocationDropdown = () => {
      if (!locationTrigger.value) return;
      const rect = locationTrigger.value.getBoundingClientRect();
      locationDropdownStyle.value = {
        position: "fixed",
        top: `${rect.bottom + 2}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      };
      showLocationDropdown.value = !showLocationDropdown.value;
      if (showLocationDropdown.value) showPaymentDropdown.value = false;
    };

    const togglePaymentDropdown = () => {
      if (!paymentTrigger.value) return;
      const rect = paymentTrigger.value.getBoundingClientRect();
      paymentDropdownStyle.value = {
        position: "fixed",
        top: `${rect.bottom + 2}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      };
      showPaymentDropdown.value = !showPaymentDropdown.value;
      if (showPaymentDropdown.value) showLocationDropdown.value = false;
    };

    const closeLocationDropdown = () => {
      showLocationDropdown.value = false;
    };
    const closePaymentDropdown = () => {
      showPaymentDropdown.value = false;
    };

    const selectLocation = (loc) => {
      selectedLocation.value = loc.id;
      closeLocationDropdown();
    };
    const selectPaymentMethod = (method) => {
      selectedPaymentMethod.value = method.id;
      closePaymentDropdown();
    };

    const selectedLocationLabel = computed(() => {
      if (!selectedLocation.value) return "Select a location";
      const loc = locations.value.find((l) => l.id === selectedLocation.value);
      return loc ? loc.name : "Select a location";
    });
    const selectedPaymentMethodLabel = computed(() => {
      if (!selectedPaymentMethod.value) return "Select a payment method";
      const method = paymentMethods.value.find(
        (m) => m.id === selectedPaymentMethod.value
      );
      return method ? method.name : "Select a payment method";
    });

    const validationErrors = reactive({
      location: false,
      paymentMethod: false,
      screenshot: false,
    });

    const handleUploadedImages = (files) => {
      if (files && files.length > 0) {
        let file = files[0];
        if (!(file instanceof File)) {
          file = new File([file], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          });
        }
        ordersStore.setPaymentScreenshot(file);
      }
    };

    const userId = 1;
    const selectedBankName = computed(() => {
      const method = paymentMethods.value.find(
        (m) => m.id === selectedPaymentMethod.value
      );
      return method ? method.name : "";
    });

    watch(selectedLocation, (newVal) => {
      const locObj = locations.value.find((loc) => loc.id === newVal);
      if (locObj) {
        ordersStore.setShippingTown(locObj.name);
        ordersStore.setShippingAddress(locObj.name);
      }
      if (newVal) validationErrors.location = false;
    });

    watch(selectedPaymentMethod, (newVal) => {
      ordersStore.setPaymentMethodId(Number(newVal));
      if (newVal) validationErrors.paymentMethod = false;
    });

    watch(
      () => ordersStore.payload.paymentScreenshot,
      (newVal) => {
        if (newVal) validationErrors.screenshot = false;
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

    const onResize = () => {
      showLocationDropdown.value = false;
      showPaymentDropdown.value = false;
    };
    onMounted(() => {
      fetchLocations();
      fetchPaymentMethods();
      window.addEventListener("resize", onResize);
    });
    onUnmounted(() => {
      window.removeEventListener("resize", onResize);
    });

    return {
      paymentMethods,
      loadingPaymentMethods,
      errorPaymentMethods,
      locations,
      loadingLocations,
      errorLocations,
      selectedPaymentMethod,
      selectedLocation,
      showLocationDropdown,
      locationDropdownStyle,
      showPaymentDropdown,
      paymentDropdownStyle,
      toggleLocationDropdown,
      togglePaymentDropdown,
      closeLocationDropdown,
      closePaymentDropdown,
      selectLocation,
      selectPaymentMethod,
      selectedLocationLabel,
      selectedPaymentMethodLabel,
      locationTrigger,
      paymentTrigger,
      validationErrors,
      handleUploadedImages,
      userId,
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

/* Highlight for validation errors (light green) */
.highlight-green {
  border-color: #90ee90 !important;
  box-shadow: 0 0 5px rgba(144, 238, 144, 0.7) !important;
}

/* Teleport dropdown overlay */
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}
.dropdown {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.dropdown-option {
  padding: 8px;
  cursor: pointer;
}
.dropdown-option:hover {
  background: #f0f0f0;
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

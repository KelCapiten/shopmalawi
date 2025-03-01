//src/components/AccountDetailsManager.vue
<template>
  <div class="account-details-container">
    <div class="settings-content">
      <h4 class="settings-title">Manage Your Payment Methods</h4>
      <div v-if="loading" class="loading-message">
        Loading account details...
      </div>
      <div v-if="heading" class="loading-message">
        {{ heading }}
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="!loading && bankDetails.length > 0" class="account-list">
        <div
          v-for="record in bankDetails"
          :key="record.id"
          class="account-display"
          :style="getBackgroundStyle(record.payment_method_name)"
        >
          <p>
            Bank Name:
            {{ record.payment_method_name }}
          </p>
          <p>
            Account Number:
            <strong>{{ record.account_number }}</strong>
          </p>
          <p>
            Account Holder:
            {{ record.account_holder_name }}
          </p>
          <p v-if="record.branch_code">
            Branch Code:
            <strong>{{ record.branch_code }}</strong>
          </p>
          <div class="action-buttons">
            <button
              class="edit-btn"
              v-if="!disableActions"
              @click="startEditing(record)"
            >
              Edit
            </button>
            <button
              class="del-btn"
              v-if="!disableActions"
              @click="handleDelete(record.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      <form
        v-if="enableForm"
        @submit.prevent="submitDetails"
        class="account-form"
        :class="{ cleared: formCleared }"
      >
        <h4>Add A Payment Method</h4>

        <div class="form-group custom-selector">
          <label>Payment Method</label>
          <div class="selector-display" tabindex="0">
            <IonSelect
              v-model="form.payment_method_id"
              placeholder="Select Payment Method"
              required
              :class="{ invalid: validationErrors.payment_method_id }"
            >
              <IonSelectOption
                v-for="bank in banks"
                :key="bank.id"
                :value="bank.id"
              >
                {{ bank.name }}
              </IonSelectOption>
            </IonSelect>
          </div>
          <span v-if="validationErrors.payment_method_id" class="error-text">
            {{ validationErrors.payment_method_id }}
          </span>
        </div>

        <div class="form-group">
          <label>Account Number</label>
          <input
            v-model="form.account_number"
            type="text"
            placeholder="Enter account number"
            required
            :class="{ invalid: validationErrors.account_number }"
          />
          <span v-if="validationErrors.account_number" class="error-text">
            {{ validationErrors.account_number }}
          </span>
        </div>

        <div class="form-group">
          <label>Account Holder Name</label>
          <input
            v-model="form.account_holder_name"
            type="text"
            placeholder="Enter account holder name"
            required
            :class="{ invalid: validationErrors.account_holder_name }"
          />
          <span v-if="validationErrors.account_holder_name" class="error-text">
            {{ validationErrors.account_holder_name }}
          </span>
        </div>

        <div class="form-group">
          <label>Branch Code</label>
          <input
            v-model="form.branch_code"
            type="text"
            placeholder="Enter branch code (optional)"
          />
        </div>

        <div class="button-group">
          <button type="submit">
            {{ editingRecord ? "Update" : "Add" }} Account
          </button>
          <button type="button" class="cancel-btn" @click="cancelEditing">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div v-if="showDeleteConfirmation" class="confirmation-popup-overlay">
      <div class="confirmation-popup">
        <h5>Delete Payment Method</h5>
        <p>Are you sure you want to delete this payment method?</p>
        <div class="confirmation-buttons">
          <button class="cancel-button" @click="cancelDelete">Cancel</button>
          <button class="confirm-button" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from "vue";
import { IonSelect, IonSelectOption } from "@ionic/vue";
import useBankDetails, {
  AddBankDetailsPayload,
  UpdateBankDetailsPayload,
} from "@/composables/useBankDetails";
import fetchPaymentMethods from "@/composables/usePaymentMethods";

export default defineComponent({
  name: "AccountDetailsManager",
  props: {
    userId: {
      type: Number,
      required: true,
    },
    enableForm: {
      type: Boolean,
      default: true,
    },
    disableActions: {
      type: Boolean,
      default: false,
    },
    payment_method_id: {
      type: [Number, String],
      default: null,
    },
    heading: {
      type: [String],
      default: null,
    },
  },
  components: {
    IonSelect,
    IonSelectOption,
  },
  emits: ["close"],
  setup(props, { emit }) {
    const editingRecord = ref<any>(null);
    const {
      bankDetails,
      loading,
      error,
      fetchBankDetails,
      createBankDetails,
      modifyBankDetails,
      removeBankDetails,
    } = useBankDetails();

    const form = ref({
      user_id: props.userId,
      payment_method_id: props.payment_method_id || null,
      account_number: "",
      account_holder_name: "",
      branch_code: "",
    });

    const validationErrors = ref({
      payment_method_id: "",
      account_number: "",
      account_holder_name: "",
    });

    const { paymentMethods: banks, fetchPaymentMethods: fetchBanks } =
      fetchPaymentMethods();
    const formCleared = ref(false);

    const loadBankDetails = async () => {
      await fetchBankDetails(props.userId, props.payment_method_id);
    };

    onMounted(async () => {
      await loadBankDetails();
      await fetchBanks();
    });

    watch(
      () => props.payment_method_id,
      (newVal) => {
        form.value.payment_method_id = newVal;
        loadBankDetails();
      }
    );

    const getBackgroundStyle = (paymentMethodName: string) => {
      let filename = "";
      switch (paymentMethodName.toLowerCase()) {
        case "national bank":
          filename = "national bank.png";
          break;
        case "standard bank":
          filename = "standard bank.png";
          break;
        case "airtel money":
          filename = "airtel money.png";
          break;
        case "mpamba":
          filename = "mpamba.png";
          break;
        case "visa":
          filename = "visa bank.png";
          break;
        default:
          filename = "";
      }
      if (filename) {
        const encodedFilename = encodeURIComponent(filename);
        const textColor =
          paymentMethodName.toLowerCase() === "national bank" ||
          paymentMethodName.toLowerCase() === "visa" ||
          paymentMethodName.toLowerCase() === "standard bank"
            ? "#fff"
            : "#333";
        return {
          backgroundImage: `url(/assets/${encodedFilename})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: textColor,
        };
      }
      return {};
    };

    const startEditing = (record: any) => {
      editingRecord.value = record;
      const selectedBank = banks.value.find(
        (bank: any) =>
          bank.name.toLowerCase() === record.payment_method_name.toLowerCase()
      );
      form.value = {
        user_id: record.user_id || props.userId,
        payment_method_id: selectedBank ? selectedBank.id : null,
        account_number: record.account_number,
        account_holder_name: record.account_holder_name,
        branch_code: record.branch_code || "",
      };
      clearValidation();
    };

    const cancelEditing = () => {
      editingRecord.value = null;
      resetForm();
      clearValidation();
      formCleared.value = true;
      setTimeout(() => {
        formCleared.value = false;
      }, 1000);
      emit("close");
    };

    const resetForm = () => {
      form.value = {
        user_id: props.userId,
        payment_method_id: props.payment_method_id || null,
        account_number: "",
        account_holder_name: "",
        branch_code: "",
      };
    };

    const clearValidation = () => {
      validationErrors.value.payment_method_id = "";
      validationErrors.value.account_number = "";
      validationErrors.value.account_holder_name = "";
    };

    const validateForm = () => {
      let valid = true;
      if (!form.value.payment_method_id) {
        validationErrors.value.payment_method_id = "Bank selection is required";
        valid = false;
      } else {
        validationErrors.value.payment_method_id = "";
      }
      if (!form.value.account_number) {
        validationErrors.value.account_number = "Account number is required";
        valid = false;
      } else {
        validationErrors.value.account_number = "";
      }
      if (!form.value.account_holder_name) {
        validationErrors.value.account_holder_name =
          "Account holder name is required";
        valid = false;
      } else {
        validationErrors.value.account_holder_name = "";
      }
      return valid;
    };

    const submitDetails = async () => {
      if (!validateForm()) return;
      try {
        if (editingRecord.value) {
          await modifyBankDetails(
            editingRecord.value.id,
            form.value as UpdateBankDetailsPayload
          );
          await loadBankDetails();
          editingRecord.value = null;
        } else {
          await createBankDetails(form.value as AddBankDetailsPayload);
          await loadBankDetails();
        }
        resetForm();
        clearValidation();
      } catch (err) {
        console.error("Error submitting account details:", err);
      }
    };

    const showDeleteConfirmation = ref(false);
    const deleteId = ref<number | null>(null);

    const handleDelete = (id: number) => {
      deleteId.value = id;
      showDeleteConfirmation.value = true;
    };

    const cancelDelete = () => {
      showDeleteConfirmation.value = false;
      deleteId.value = null;
    };

    const confirmDelete = async () => {
      if (deleteId.value) {
        try {
          await removeBankDetails(deleteId.value);
          await loadBankDetails();
          if (
            editingRecord.value &&
            editingRecord.value.id === deleteId.value
          ) {
            editingRecord.value = null;
            resetForm();
          }
        } catch (err) {
          console.error("Error deleting account details:", err);
        }
      }
      showDeleteConfirmation.value = false;
      deleteId.value = null;
    };

    return {
      loading,
      error,
      bankDetails,
      form,
      banks,
      editingRecord,
      startEditing,
      cancelEditing,
      submitDetails,
      handleDelete,
      validationErrors,
      formCleared,
      getBackgroundStyle,
      showDeleteConfirmation,
      cancelDelete,
      confirmDelete,
    };
  },
});
</script>

<style scoped>
.account-details-container {
  margin: 1rem 0;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.settings-content {
  margin-top: 0.5rem;
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.settings-title {
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input,
.selector-display {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus,
.selector-display:focus {
  border-color: orange;
  box-shadow: 0 0 5px rgba(255, 165, 0, 0.5);
  outline: none;
}

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

.button-group button[type="submit"] {
  background-color: #498115;
  color: #fff;
}

.button-group button[type="submit"]:hover {
  background-color: #3a6611;
}

.cancel-btn {
  background-color: #ccc;
  color: #333;
}

.cancel-btn:hover {
  background-color: #bbb;
}

.error-text {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
}

.account-list {
  margin-bottom: 1rem;
}
.account-display {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.5rem;
  min-height: 8rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: right;
}
.account-display p {
  margin: 0.5rem 0;
  font-size: 0.8rem;
}
.account-display p strong {
  font-weight: bold;
  font-size: 0.9rem;
}
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.75rem;
}
.edit-btn {
  padding: 0.4rem 0.8rem;
  background-color: #167ef9;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.del-btn {
  padding: 0.4rem 0.8rem;
  background-color: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.account-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.account-form.cleared {
  border-color: red;
  background-color: #ffe6e6;
}
.account-form input,
.account-form select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.account-form button {
  padding: 0.5rem;
  background-color: #28b62c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.form-actions {
  display: flex;
  gap: 1rem;
}
.invalid {
  border-color: red !important;
}
.error-text {
  color: red;
  font-size: 0.8rem;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}
ion-select {
  width: 100%;
  --padding-start: 8px;
  --padding-end: 8px;
  --placeholder-color: #666;
  --placeholder-opacity: 1;
}

.confirmation-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirmation-popup {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.confirmation-popup h5 {
  margin: 0 0 1rem 0;
  color: #333;
}

.confirmation-popup p {
  margin: 0 0 1.5rem 0;
  color: #666;
  line-height: 1.4;
}

.confirmation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button,
.confirm-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.cancel-button {
  background: #f0f0f0;
  color: #666;
}

.confirm-button {
  background: #dc3545;
  color: white;
}

.cancel-button:hover {
  background: #e4e4e4;
}

.confirm-button:hover {
  background: #c82333;
}
</style>

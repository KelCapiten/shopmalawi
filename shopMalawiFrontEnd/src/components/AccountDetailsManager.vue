<template>
  <div class="account-details-container">
    <div class="settings-content">
      <div v-if="loading" class="loading-message">
        Loading account details...
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
        <IonSelect
          v-model="form.payment_method_id"
          placeholder="Select Bank"
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
        <span v-if="validationErrors.payment_method_id" class="error-text">
          {{ validationErrors.payment_method_id }}
        </span>
        <input
          v-model="form.account_number"
          type="text"
          placeholder="Account Number"
          required
          :class="{ invalid: validationErrors.account_number }"
        />
        <span v-if="validationErrors.account_number" class="error-text">
          {{ validationErrors.account_number }}
        </span>
        <input
          v-model="form.account_holder_name"
          type="text"
          placeholder="Account Holder Name"
          required
          :class="{ invalid: validationErrors.account_holder_name }"
        />
        <span v-if="validationErrors.account_holder_name" class="error-text">
          {{ validationErrors.account_holder_name }}
        </span>
        <input
          v-model="form.branch_code"
          type="text"
          placeholder="Branch Code (optional)"
        />
        <div class="form-actions">
          <button type="submit">
            {{ editingRecord ? "Update" : "Add" }} Account Details
          </button>
          <button type="button" @click="cancelEditing">Cancel</button>
        </div>
      </form>
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
  },
  components: {
    IonSelect,
    IonSelectOption,
  },
  setup(props) {
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

    const handleDelete = async (id: number) => {
      try {
        await removeBankDetails(id);
        await loadBankDetails();
        if (editingRecord.value && editingRecord.value.id === id) {
          editingRecord.value = null;
          resetForm();
        }
      } catch (err) {
        console.error("Error deleting account details:", err);
      }
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
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1rem;
}
.loading-message,
.error-message {
  text-align: center;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.account-list {
  margin-bottom: 1rem;
}
.account-display {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  min-height: 9rem;
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
</style>

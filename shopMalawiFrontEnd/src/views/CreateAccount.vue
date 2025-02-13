<template>
  <ion-page>
    <ion-content>
      <div class="form-container">
        <div class="header">
          <img src="/assets/refflogo.png" alt="ShopMalawi Logo" class="logo" />
          <p>Sign up to access the best deals and products.</p>
        </div>
        <ion-card class="form-card">
          <ion-card-content>
            <!-- Input Fields -->
            <div class="input-group">
              <label>First Name</label>
              <ion-input
                v-model="form.firstName"
                placeholder="Enter your first name"
                type="text"
                class="custom-input"
                required
              ></ion-input>
            </div>
            <div class="input-group">
              <label>Last Name</label>
              <ion-input
                v-model="form.lastName"
                placeholder="Enter your last name"
                type="text"
                class="custom-input"
                required
              ></ion-input>
            </div>
            <div class="input-group">
              <label>Username</label>
              <ion-input
                v-model="form.username"
                placeholder="Enter your username"
                type="text"
                class="custom-input"
                required
              ></ion-input>
            </div>
            <div class="input-group">
              <label>Phone Number</label>
              <ion-input
                v-model="form.phoneNumber"
                placeholder="Enter your phone number"
                type="tel"
                class="custom-input"
              ></ion-input>
            </div>
            <div class="input-group">
              <label>Password</label>
              <ion-input
                v-model="form.password"
                placeholder="Enter your password"
                type="password"
                class="custom-input"
                required
              ></ion-input>
            </div>
            <div class="input-group">
              <label>Confirm Password</label>
              <ion-input
                v-model="form.confirmPassword"
                placeholder="Re-enter your password"
                type="password"
                class="custom-input"
                required
              ></ion-input>
            </div>

            <!-- Submit Button -->
            <ion-button
              expand="block"
              color="success"
              class="form-button"
              @click="submitForm"
              :disabled="isSaving"
            >
              {{ isSaving ? "Creating Account..." : "Create Account" }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Optional Link -->
        <ion-text color="medium">
          <p class="form-footer">
            Already have an account? <a href="/login">Sign In</a>
          </p>
        </ion-text>
      </div>

      <!-- Toast Notification -->
      <ion-toast
        :is-open="toast.isOpen"
        :message="toast.message"
        :color="toast.color"
        :duration="toast.duration"
        @didDismiss="toast.isOpen = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from "vue";
import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import { useRouter } from "vue-router";

interface RegistrationResponse {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  token: string;
}

interface Form {
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

interface Toast {
  isOpen: boolean;
  message: string;
  color: string;
  duration: number;
}

export default defineComponent({
  name: "CreateAccount",
  setup() {
    const form = reactive<Form>({
      firstName: "",
      lastName: "",
      username: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    });

    const toast = reactive<Toast>({
      isOpen: false,
      message: "",
      color: "",
      duration: 2000,
    });

    const isSaving = ref(false);

    const authStore = useAuthStore();
    const router = useRouter();

    const showToast = (message: string, color: string = "primary"): void => {
      toast.message = message;
      toast.color = color;
      toast.isOpen = true;
    };

    const submitForm = async (): Promise<void> => {
      if (
        !form.firstName ||
        !form.lastName ||
        !form.username ||
        !form.password ||
        form.password !== form.confirmPassword
      ) {
        showToast(
          "Please fill all required fields and ensure passwords match.",
          "danger"
        );
        return;
      }

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        phoneNumber: form.phoneNumber,
        password: form.password,
      };

      isSaving.value = true;

      try {
        const response = await axios.post<RegistrationResponse>(
          "http://localhost:1994/api/users/register",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Store the token and user data in the Pinia store
        authStore.setAuth(response.data.token, {
          id: response.data.id,
          username: response.data.username,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          role: response.data.role,
        });

        // Redirect the user to the dashboard
        router.push("/shop");

        showToast("Account created successfully!", "success");

        // Reset the form
        form.firstName = "";
        form.lastName = "";
        form.username = "";
        form.phoneNumber = "";
        form.password = "";
        form.confirmPassword = "";
      } catch (error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        const errorMessage =
          axiosError.response?.data?.error || "Failed to create account.";
        showToast(errorMessage, "danger");
      } finally {
        isSaving.value = false;
      }
    };

    return { form, toast, isSaving, submitForm };
  },
});
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 10px; /* Reduced spacing to bring the form closer */
}

.header .logo {
  width: 150px;
  margin-bottom: 5px;
}

.header p {
  font-size: 1rem;
  color: #6c757d;
  margin-top: 0;
}

.form-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 0; /* Removed additional spacing */
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: block;
}

.custom-input {
  --padding-start: 12px;
  --padding-end: 12px;
  --background: white;
  --border-radius: 5px;
  --box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: 1px solid #dcdcdc;
}

.custom-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 4px #4caf50;
}

.form-button {
  margin-top: 20px;
}

.form-footer {
  text-align: center;
  margin-top: 15px;
}
</style>

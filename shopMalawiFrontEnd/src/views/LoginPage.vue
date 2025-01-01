<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-container">
        <div
          class="logo-container"
          :class="{ 'logo-center': !logoFocused, 'logo-top': logoFocused }"
        >
          <img src="/assets/theLogo2.jpg" alt="ShopMalawi Logo" class="logo" />
        </div>
        <div class="form-container" :class="{ visible: inputsVisible }">
          <div class="input-group">
            <label class="input-label">Phone Number or Username</label>
            <ion-input
              class="custom-input"
              type="text"
              v-model="username"
              placeholder="Enter your phone number or username"
            ></ion-input>
          </div>
          <div class="input-group">
            <label class="input-label">Password</label>
            <ion-input
              class="custom-input"
              type="password"
              v-model="password"
              placeholder="Enter your password"
            ></ion-input>
          </div>
          <ion-button expand="block" class="submit-button" @click="handleLogin">
            Log In
          </ion-button>
          <ion-button
            expand="block"
            fill="outline"
            class="create-account-button"
            @click="navigateToCreateAccount"
          >
            Create Account
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "LoginPage",
  setup() {
    const router = useRouter();
    const navigateToCreateAccount = () => {
      router.push("/create-account");
    };

    return {
      navigateToCreateAccount,
    };
  },
  data() {
    return {
      username: "",
      password: "",
      logoFocused: false,
      inputsVisible: false,
    };
  },
  mounted() {
    setTimeout(() => {
      this.logoFocused = true;
      setTimeout(() => {
        this.inputsVisible = true;
      }, 500);
    }, 2000);
  },
  methods: {
    async handleLogin() {
      if (!this.username || !this.password) {
        alert("Please enter both your phone number/username and password.");
        return;
      }
      console.log("Attempting login with:", {
        username: this.username,
        password: this.password,
      });
      alert("Login successful!");
    },
  },
});
</script>

<style scoped>
.logo-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: top 0.5s ease-in-out, transform 0.5s ease-in-out, opacity 0.8s;
}

.logo {
  max-width: 150px;
  height: auto;
  filter: blur(20px);
  opacity: 0;
  animation: focusIn 2s forwards;
}

@keyframes focusIn {
  0% {
    filter: blur(20px);
    opacity: 0;
  }
  100% {
    filter: blur(0);
    opacity: 1;
  }
}

@keyframes blurFadeOut {
  0% {
    filter: blur(0);
    opacity: 1;
  }
  100% {
    filter: blur(20px);
    opacity: 0;
  }
}

@keyframes blurFadeIn {
  0% {
    filter: blur(20px);
    opacity: 0;
  }
  100% {
    filter: blur(0);
    opacity: 1;
  }
}

@media (max-height: 639px) {
  .logo-container {
    animation: blurFadeOut 0.8s forwards;
  }
}

@media (min-height: 640px) {
  .logo-container {
    animation: blurFadeIn 0.8s forwards;
  }
}

.logo-center {
  top: 50%;
  transform: translate(-50%, -50%);
}

.logo-top {
  top: 18%;
  transform: translateX(-50%);
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  position: relative;
}

.form-container {
  background-color: white;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  width: 100%;
  max-width: 400px;
  opacity: 0;
  transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out,
    margin-top 0.5s ease-in-out;
  transform: translateY(20px);
}

.form-container.visible {
  opacity: 1;
  transform: translateY(0);
  margin-top: 5px;
}

.input-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.input-label {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 5px;
  font-weight: bold;
}

.custom-input {
  --padding-start: 12px;
  --padding-end: 12px;
  --background: white;
  --border-radius: 5px;
  --box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  width: 100%;
  font-size: 1rem;
  border: 1px solid #dcdcdc;
  padding-left: 12px; /* Add indentation for input text */
  padding-right: 12px; /* Ensure uniform padding */
  background: var(--background);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.custom-input:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 4px #4caf50;
}

.submit-button {
  margin-top: 10px;
}

.create-account-button {
  margin-top: 10px;
  color: var(--ion-color-primary);
  --border-color: var(--ion-color-primary);
  --border-width: 2px;
}

@media (min-width: 1024px) {
  .form-container.visible {
    margin-top: 5px;
  }
}

@media (min-height: 640px) {
  .form-container.visible {
    margin-top: 150px;
  }
}
</style>

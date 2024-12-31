<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-container">
        <!-- Logo Section -->
        <div
          class="logo-container"
          :class="{ 'logo-center': !logoFocused, 'logo-top': logoFocused }"
        >
          <img src="/assets/theLogo2.jpg" alt="ShopMalawi Logo" class="logo" />
        </div>

        <!-- Login Form Section -->
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
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "LoginPage",
  data() {
    return {
      username: "",
      password: "",
      logoFocused: false, // Track if the logo animation is completed
      inputsVisible: false, // Control when inputs are shown
    };
  },
  mounted() {
    // Start animation for logo and reveal form after it's done
    setTimeout(() => {
      this.logoFocused = true;

      // Show the input section after the logo finishes moving
      setTimeout(() => {
        this.inputsVisible = true;
      }, 500); // Matches the logo movement transition duration
    }, 2000); // Matches the logo focus animation duration
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
/* Logo Styling */
.logo-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transition: top 0.5s ease-in-out, transform 0.5s ease-in-out;
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

/* Center the logo at the start and keep it in the same position after focus */
.logo-center {
  top: 50%;
  transform: translate(-50%, -50%);
}

/* Move the logo to the top smoothly */
.logo-top {
  top: 15%; /* Default for smaller screens */
  transform: translateX(-50%);
}

/* Login Container */
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
  width: 100%;
  max-width: 400px;
  opacity: 0;
  transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
  transform: translateY(20px);
}

.form-container.visible {
  opacity: 1;
  transform: translateY(0);
  margin-top: 5px; /* Default spacing for smaller screens */
}

/* Input Styling */
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
  width: 100%;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.custom-input::placeholder {
  color: #aaa;
}

/* Button Styling */
.submit-button {
  margin-top: 10px;
}

/* Responsive Adjustments */
@media (min-width: 768px) {
  .logo-top {
    top: 15%; /* Closer to inputs for medium screens */
  }

  .form-container.visible {
    margin-top: 5px; /* Adjust spacing for medium screens */
  }
}

@media (min-width: 1024px) {
  .logo-top {
    top: 10%; /* Closer for larger screens */
  }

  .form-container.visible {
    margin-top: 5px; /* Reduced spacing for larger screens */
  }
}
</style>

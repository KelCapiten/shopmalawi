<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Sell Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="sell-form">
        <ion-item>
          <ion-label position="floating">Item Name</ion-label>
          <ion-input v-model="item.name" required></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Description</ion-label>
          <ion-textarea
            v-model="item.description"
            :rows="4"
            required
          ></ion-textarea>
        </ion-item>

        <ion-item>
          <ion-label position="floating">Price</ion-label>
          <ion-input v-model="item.price" type="number" required></ion-input>
        </ion-item>

        <ion-item>
          <ion-label>Category</ion-label>
          <ion-select
            v-model="item.category"
            placeholder="Select Category"
            required
          >
            <ion-select-option value="electronics"
              >Electronics</ion-select-option
            >
            <ion-select-option value="clothing">Clothing</ion-select-option>
            <ion-select-option value="home">Home</ion-select-option>
            <ion-select-option value="sports">Sports</ion-select-option>
            <ion-select-option value="books">Books</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label>Upload Image</ion-label>
          <input type="file" accept="image/*" @change="handleImageUpload" />
        </ion-item>

        <ion-button
          expand="full"
          color="primary"
          @click="submitItem"
          class="submit-button"
        >
          Sell Item
        </ion-button>
      </div>

      <!-- Success/Error Toast -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        :color="toastColor"
      ></ion-toast>
    </ion-content>

    <!-- Add the Footer Component -->
    <AppFooter />
  </ion-page>
</template>

<script lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonToast,
} from "@ionic/vue";
import { ref } from "vue";
import AppFooter from "@/components/footer.vue"; // Import the Footer component

export default {
  name: "SellDashboard",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonToast,
    AppFooter, // Register the Footer component
  },
  setup() {
    const item = ref({
      name: "",
      description: "",
      price: "",
      category: "",
      image: null as File | null,
    });

    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");

    const handleImageUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        item.value.image = target.files[0];
      }
    };

    const submitItem = () => {
      if (
        !item.value.name ||
        !item.value.description ||
        !item.value.price ||
        !item.value.category
      ) {
        toastMessage.value = "Please fill all fields.";
        toastColor.value = "danger";
        showToast.value = true;
        return;
      }

      // Simulate successful submission
      toastMessage.value = "Item added successfully!";
      toastColor.value = "success";
      showToast.value = true;

      // Reset form
      item.value = {
        name: "",
        description: "",
        price: "",
        category: "",
        image: null,
      };
    };

    return {
      item,
      showToast,
      toastMessage,
      toastColor,
      handleImageUpload,
      submitItem,
    };
  },
};
</script>

<style scoped>
.sell-form {
  max-width: 600px;
  margin: 0 auto;
}

ion-item {
  margin-bottom: 20px;
}

.submit-button {
  margin-top: 30px;
}

ion-toast {
  --background: var(--ion-color-primary);
  --color: white;
}
</style>

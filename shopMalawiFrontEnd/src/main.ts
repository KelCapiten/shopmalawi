// src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { IonicVue } from "@ionic/vue";
import { addIcons } from "ionicons";
import { trashOutline } from "ionicons/icons";
import IonicComponents from "./ionic-components";
import { useAuthStore } from "@/stores/authStore"; // Import the store
import { initializeApiClient } from "@/services/apiClient"; // Import the initialize function

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";
import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

/* Theme variables */
import "./theme/variables.css";

// Register Ionicons
addIcons({
  "trash-outline": trashOutline,
});

const app = createApp(App);
const pinia = createPinia();

app.use(IonicVue);
app.use(IonicComponents);
app.use(pinia);
app.use(router);

// Initialize Pinia stores before accessing them
app.mixin({
  setup() {
    // Ensure Pinia is initialized
  },
});

// After Pinia is set up, access the authStore and initialize the API client
const authStore = useAuthStore();
initializeApiClient(authStore);

router.isReady().then(() => {
  app.mount("#app");
});

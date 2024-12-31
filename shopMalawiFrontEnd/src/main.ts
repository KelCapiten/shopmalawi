import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { IonicVue } from "@ionic/vue";
import IonicComponents from "./ionic-components"; // Import the plugin

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

const app = createApp(App);

app.use(IonicVue); // Use IonicVue
app.use(IonicComponents); // Use the custom plugin
app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  app.mount("#app");
});

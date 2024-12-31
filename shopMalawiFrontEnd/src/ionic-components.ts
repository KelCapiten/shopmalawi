// src/ionic-components.ts
import { App } from "vue";
import * as Ionic from "@ionic/vue";

export default {
  install(app: App) {
    for (const key in Ionic) {
      if (key.startsWith("Ion")) {
        // Register only Ionic components
        app.component(key, (Ionic as any)[key]);
      }
    }
  },
};

<template>
  <ion-app>
    <router-view />
  </ion-app>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { IonApp } from "@ionic/vue";

export default defineComponent({
  name: "App",
  components: {
    IonApp,
  },
});
</script>

<style>
/* Global styles */
</style>

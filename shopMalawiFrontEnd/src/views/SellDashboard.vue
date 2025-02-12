//src/views/SellDashboard.vue
<template>
  <ion-page>
    <AppHeader :showSearchBar="false" :showCategorySegment="false" />
    <ion-content class="ion-padding">
      <sellProductForm />
    </ion-content>
    <AppFooter />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import AppHeader from "../components/appHeader.vue";
import AppFooter from "../components/appFooter.vue";
import sellProductForm from "@/components/sellProductForm.vue";

export default defineComponent({
  name: "SellDashboard",
  components: {
    AppHeader,
    AppFooter,
    sellProductForm,
  },
});
</script>

<style scoped>
/* You can add any page-level styles here if needed */
</style>

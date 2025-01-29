<template>
  <div class="home-page">
    <AppHeader class="header" />
    <AppBody class="body-container" />
    <AppFooter class="footer" />
  </div>
</template>

<script>
import AppHeader from "@/components/appHeader.vue";
import AppBody from "@/components/body.vue";
import AppFooter from "@/components/appFooter.vue";

export default {
  name: "HomePage",
  components: {
    AppHeader,
    AppBody,
    AppFooter,
  },
};
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  flex-shrink: 0;
}

.body-container {
  flex-grow: 1;
  overflow-y: auto;
}

.footer {
  flex-shrink: 0;
}
</style>

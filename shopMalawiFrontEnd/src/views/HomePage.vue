<template>
  <div class="home-page">
    <!-- Fixed Header -->
    <AppHeader class="fixed-header" />

    <!-- Scrollable Body -->
    <AppBody class="scrollable-body" />

    <!-- Fixed Footer -->
    <AppFooter class="fixed-footer" />
  </div>
</template>

<script>
import AppHeader from "@/components/header.vue";
import AppBody from "@/components/body.vue";
import AppFooter from "@/components/footer.vue";

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
/* Root container for the home page */
.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Fixed Header */
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

/* Scrollable Body */
.scrollable-body {
  flex: 1;
  overflow-y: auto;
  padding-top: 60px;
  padding-bottom: 60px;
}

/* Fixed Footer */
.fixed-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
</style>

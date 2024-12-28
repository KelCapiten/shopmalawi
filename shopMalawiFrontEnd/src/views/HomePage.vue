<template>
  <div class="home-page">
    <AppHeader />
    <AppBody />
    <AppFooter />
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
  min-height: 100vh; /* Ensure the page takes up at least the full viewport height */
  padding-left: 16px; /* Small space to the left */
  padding-right: 16px; /* Small space to the right */
}

/* Ensure the body takes up the remaining space between the header and footer */
.home-page > :nth-child(2) {
  flex: 1;
}

/* Optional: Add some spacing between components */
.home-page > * {
  margin-bottom: 20px;
}

/* Remove margin from the last component (footer) */
.home-page > :last-child {
  margin-bottom: 0;
}
</style>

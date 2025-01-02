<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-card>
        <ion-card-header>
          <ion-card-title>User Profile</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <ion-avatar class="profile-avatar">
            <img src="https://via.placeholder.com/150" alt="User Avatar" />
          </ion-avatar>

          <ion-list>
            <ion-item>
              <ion-label>Name:</ion-label>
              <ion-text>{{ user.name }}</ion-text>
            </ion-item>

            <ion-item>
              <ion-label>Email:</ion-label>
              <ion-text>{{ user.email }}</ion-text>
            </ion-item>

            <ion-item>
              <ion-label>Phone:</ion-label>
              <ion-text>{{ user.phone }}</ion-text>
            </ion-item>
          </ion-list>

          <ion-button expand="block" color="danger" @click="signOut">
            Sign Out
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script>
import { useAuthStore } from "@/stores/authStore";
import appFooter from "@/components/footer.vue";

export default {
  name: "ProfilePage",
  components: {
    appFooter,
  },
  setup() {
    const authStore = useAuthStore();

    const user = {
      name: authStore.user?.firstName + " " + authStore.user?.lastName || "N/A",
      email: authStore.user?.username || "N/A",
      phone: "N/A", // Add phone or other user details if available
    };

    const signOut = () => {
      authStore.clearAuth(); // Clear authentication and redirect to login
    };

    return {
      user,
      signOut,
    };
  },
};
</script>

<style scoped>
.profile-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

ion-avatar img {
  border-radius: 50%;
  width: 100px;
  height: 100px;
}
</style>

<template>
  <IonPage>
    <!-- Header -->
    <IonHeader>
      <IonToolbar>
        <div class="header-left">
          <div class="header-avatar">
            <span class="avatar-initial">{{ userInitial }}</span>
          </div>
          <span class="header-username">{{ user.name }}</span>
        </div>
        <IonButtons slot="end">
          <IonButton @click="openSettings">
            <IonIcon :icon="settingsIcon" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>

    <!-- Popover for dropdown menu -->
    <IonPopover
      :is-open="showSettings"
      :event="popoverEvent"
      translucent
      @didDismiss="closeSettings"
    >
      <IonList>
        <IonItem button color="danger" @click="signOut">Sign Out</IonItem>
      </IonList>
    </IonPopover>

    <!-- Profile Card -->
    <IonCard class="profile-card">
      <IonCardContent>
        <IonList lines="none">
          <IonItem>
            <IonLabel>Username</IonLabel>
            <IonText>{{ user.username }}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel>Phone Number</IonLabel>
            <IonText>{{ user.phone }}</IonText>
          </IonItem>
        </IonList>
      </IonCardContent>
    </IonCard>

    <!-- Page Content -->
    <IonContent>
      <!-- Square Tiles -->
      <IonGrid class="action-tiles">
        <IonRow>
          <IonCol size="6" @click="goToOrders">
            <div class="tile">
              <IonIcon :icon="ordersIcon" class="tile-icon" />
              <p class="tile-label">Orders</p>
            </div>
          </IonCol>
          <IonCol size="6" @click="goToWishlist">
            <div class="tile">
              <IonIcon :icon="wishlistIcon" class="tile-icon" />
              <p class="tile-label">Wishlist</p>
            </div>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6" @click="goToCoupons">
            <div class="tile">
              <IonIcon :icon="couponsIcon" class="tile-icon" />
              <p class="tile-label">Coupons</p>
            </div>
          </IonCol>
          <IonCol size="6" @click="goToHistory">
            <div class="tile">
              <IonIcon :icon="historyIcon" class="tile-icon" />
              <p class="tile-label">History</p>
            </div>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6" @click="toggleCategoryManager">
            <div class="tile">
              <IonIcon :icon="settingsIcon" class="tile-icon" />
              <p class="tile-label">Settings</p>
            </div>
          </IonCol>
          <IonCol size="6" @click="toggleAccountDetailsManager">
            <div class="tile">
              <IonIcon :icon="accountIcon" class="tile-icon" />
              <p class="tile-label">Payment Methods</p>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>

      <!-- Settings Sections -->
      <CategoriesManager v-if="showCategoryManager" />

      <div v-if="showAccountDetailsManager" class="settings-header">
        <h3>Manage Your Payment Methods</h3>
      </div>
      <AccountDetailsManager
        v-if="showAccountDetailsManager"
        :userId="userId"
        :enableForm="true"
      />
    </IonContent>

    <appFooter />
  </IonPage>
</template>

<script>
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import appFooter from "@/components/appFooter.vue";
import CategoriesManager from "@/components/CategoriesManager.vue";
import AccountDetailsManager from "@/components/AccountDetailsManager.vue";
import {
  settingsOutline,
  bagHandleOutline,
  heartOutline,
  ticketOutline,
  timeOutline,
  personCircleOutline,
} from "ionicons/icons";

export default {
  name: "ProfilePage",
  components: {
    appFooter,
    CategoriesManager,
    AccountDetailsManager,
  },
  setup() {
    const authStore = useAuthStore();

    const user = computed(() => ({
      name:
        (authStore.user?.firstName || "") +
        " " +
        (authStore.user?.lastName || ""),
      username: authStore.user?.username || "N/A",
      phone: authStore.user?.phone || "N/A",
    }));

    const userInitial = computed(() => {
      const names = user.value.name.split(" ");
      const initials = names
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      return initials.charAt(0);
    });

    const userId = computed(() => authStore.user?.id);

    const settingsIcon = settingsOutline;
    const ordersIcon = bagHandleOutline;
    const wishlistIcon = heartOutline;
    const couponsIcon = ticketOutline;
    const historyIcon = timeOutline;
    const accountIcon = personCircleOutline;

    const showSettings = ref(false);
    const showCategoryManager = ref(false);
    const showAccountDetailsManager = ref(false);
    const popoverEvent = ref(null);

    const openSettings = (event) => {
      popoverEvent.value = event;
      showSettings.value = true;
    };
    const closeSettings = () => {
      showSettings.value = false;
      popoverEvent.value = null;
    };

    const toggleCategoryManager = () => {
      if (!showCategoryManager.value) {
        showCategoryManager.value = true;
        showAccountDetailsManager.value = false;
      } else {
        showCategoryManager.value = false;
      }
    };

    const toggleAccountDetailsManager = () => {
      if (!showAccountDetailsManager.value) {
        showAccountDetailsManager.value = true;
        showCategoryManager.value = false;
      } else {
        showAccountDetailsManager.value = false;
      }
    };

    const signOut = () => {
      authStore.clearAuth();
      closeSettings();
    };
    const goToOrders = () => {};
    const goToWishlist = () => {};
    const goToCoupons = () => {};
    const goToHistory = () => {};

    return {
      user,
      userInitial,
      userId,
      showSettings,
      showCategoryManager,
      showAccountDetailsManager,
      popoverEvent,
      openSettings,
      closeSettings,
      toggleCategoryManager,
      toggleAccountDetailsManager,
      signOut,
      settingsIcon,
      ordersIcon,
      wishlistIcon,
      couponsIcon,
      historyIcon,
      accountIcon,
      goToOrders,
      goToWishlist,
      goToCoupons,
      goToHistory,
    };
  },
};
</script>

<style scoped>
.header-left {
  display: flex;
  align-items: center;
  padding-left: 8px;
}
.header-avatar {
  width: 32px;
  height: 32px;
  background-color: var(--ion-color-primary);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  color: white;
  margin-right: 8px;
}
.avatar-initial {
  font-weight: bold;
  text-transform: uppercase;
}
.header-username {
  font-size: 1rem;
  font-weight: 600;
}
.profile-card {
  margin: 0.5rem;
  border-radius: 8px;
}
.action-tiles {
  margin: 0.5rem;
}
.tile {
  background: var(--ion-color-light, #f8f8f8);
  border-radius: 8px;
  height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.tile-icon {
  font-size: 24px;
  margin-bottom: 2px;
  color: var(--ion-color-primary);
}
.tile-label {
  font-size: 0.9rem;
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f2f2f2;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 6px;
  user-select: none;
}

.settings-header h3 {
  margin: 0;
  font-size: 1rem;
}
</style>

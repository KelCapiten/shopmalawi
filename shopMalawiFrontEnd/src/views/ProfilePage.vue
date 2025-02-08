//\src\views\ProfilePage.vue
<template>
  <IonPage>
    <!-- Fixed Header -->
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

    <IonContent>
      <!-- Profile Card -->
      <IonCard class="profile-card">
        <IonCardContent>
          <div class="profile-card-content">
            <div class="profile-item">
              <label>Username</label>
              <IonText>{{ user.username }}</IonText>
            </div>
            <div class="profile-item">
              <label>Phone Number</label>
              <IonText>{{ user.phone }}</IonText>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      <!-- Action Tiles -->
      <IonGrid class="action-tiles">
        <IonRow>
          <IonCol size="6" @click="toggleOrdersList">
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

      <!-- Orders List (scrolls into view when visible) -->
      <ordersList :userId="userId" ref="ordersListRef" v-if="showOrdersList" />

      <!-- Settings Sections -->
      <CategoriesManager
        ref="categoriesManagerRef"
        v-if="showCategoryManager"
      />

      <div
        v-if="showAccountDetailsManager"
        class="settings-header"
        ref="accountDetailsManagerRef"
      >
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
import { computed, ref, nextTick } from "vue";
import { useAuthStore } from "@/stores/authStore";
import appFooter from "@/components/appFooter.vue";
import CategoriesManager from "@/components/CategoriesManager.vue";
import AccountDetailsManager from "@/components/AccountDetailsManager.vue";
import ordersList from "@/components/OrdersList.vue";
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
    ordersList,
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
      return (
        names
          .map((n) => n.charAt(0))
          .join("")
          .toUpperCase() || "U"
      );
    });

    const userId = computed(() => authStore.user?.id);

    const settingsIcon = settingsOutline;
    const ordersIcon = bagHandleOutline;
    const wishlistIcon = heartOutline;
    const couponsIcon = ticketOutline;
    const historyIcon = timeOutline;
    const accountIcon = personCircleOutline;

    const showSettings = ref(false);
    const popoverEvent = ref(null);
    const openSettings = (event) => {
      popoverEvent.value = event;
      showSettings.value = true;
    };
    const closeSettings = () => {
      showSettings.value = false;
      popoverEvent.value = null;
    };

    const showCategoryManager = ref(false);
    const showAccountDetailsManager = ref(false);
    const showOrdersList = ref(false);

    const ordersListRef = ref(null);
    const categoriesManagerRef = ref(null);
    const accountDetailsManagerRef = ref(null);

    // Helper function to scroll to a section smoothly.
    const scrollToSection = async (refEl) => {
      await nextTick();
      if (refEl.value?.$el) {
        refEl.value.$el.scrollIntoView({ behavior: "smooth" });
      } else if (refEl.value) {
        refEl.value.scrollIntoView({ behavior: "smooth" });
      }
    };

    // Toggle Orders List and scroll to it when shown.
    const toggleOrdersList = async () => {
      showOrdersList.value = !showOrdersList.value;
      if (showOrdersList.value) {
        await scrollToSection(ordersListRef);
      }
    };

    const toggleCategoryManager = async () => {
      showCategoryManager.value = !showCategoryManager.value;
      if (showCategoryManager.value) {
        showAccountDetailsManager.value = false;
        showOrdersList.value = false;
        await scrollToSection(categoriesManagerRef);
      }
    };

    const toggleAccountDetailsManager = async () => {
      showAccountDetailsManager.value = !showAccountDetailsManager.value;
      if (showAccountDetailsManager.value) {
        showCategoryManager.value = false;
        showOrdersList.value = false;
        await scrollToSection(accountDetailsManagerRef);
      }
    };

    const signOut = () => {
      authStore.clearAuth();
      closeSettings();
    };

    const goToWishlist = () => {};
    const goToCoupons = () => {};
    const goToHistory = () => {};

    return {
      user,
      userInitial,
      userId,
      showSettings,
      popoverEvent,
      openSettings,
      closeSettings,
      showCategoryManager,
      showAccountDetailsManager,
      showOrdersList,
      toggleCategoryManager,
      toggleAccountDetailsManager,
      toggleOrdersList,
      signOut,
      settingsIcon,
      ordersIcon,
      wishlistIcon,
      couponsIcon,
      historyIcon,
      accountIcon,
      goToWishlist,
      goToCoupons,
      goToHistory,
      ordersListRef,
      categoriesManagerRef,
      accountDetailsManagerRef,
    };
  },
};
</script>

<style scoped>
/* Header styles remain unchanged */
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
.profile-card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.profile-item {
  display: flex;
  justify-content: space-between;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  align-items: center;
  font-size: 0.9rem;
  background: #fff;
}
.profile-item label {
  font-weight: bold;
  margin-right: 1rem;
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

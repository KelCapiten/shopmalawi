//src/components/ProfileMenu.vue
<template>
  <div class="profile-menu-container">
    <div class="profile-icon-container" @click="toggleDropdown">
      <IonIcon :icon="menu" class="menu-icon" />
      <IonIcon :icon="personCircleOutline" class="user-icon" />
    </div>
    <div v-if="showDropdown" class="dropdown-menu">
      <div
        v-if="userstore.selectedStore && userstore.selectedStore.id !== 0"
        class="dropdown-item"
        @click="addStore"
      >
        Add Another Store
      </div>
      <div class="dropdown-item" @click="goToSell">Add Product</div>
      <div class="dropdown-item" @click="openPaymentMethods">
        Your Payment Details
      </div>
      <div class="dropdown-item" @click="goToOrders">Your Orders</div>
      <div class="dropdown-item" @click="goToProfile">Profile</div>
      <div class="dropdown-item" @click="logout">Logout</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { IonIcon } from "@ionic/vue";
import { menu, personCircleOutline } from "ionicons/icons";
import { useAuthStore } from "@/stores/authStore";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { useRouter } from "vue-router";

const emit = defineEmits<{
  (e: "addStore"): void;
  (e: "openPaymentMethods", userId: number): void;
}>();

const authStore = useAuthStore();
const userstore = useUserstoreStore();
const showDropdown = ref(false);
const router = useRouter();

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event: MouseEvent) => {
  const menuContainer = document.querySelector(".profile-menu-container");
  if (menuContainer && !menuContainer.contains(event.target as Node)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside);
});

const addStore = () => {
  emit("addStore");
};

const goToSell = () => {
  router.push("/sell");
  showDropdown.value = false;
};

const goToOrders = () => {
  console.log("Go to Orders");
};

const openPaymentMethods = () => {
  if (authStore.user?.id) {
    emit("openPaymentMethods", authStore.user.id);
  }
  showDropdown.value = false;
};

const goToProfile = () => {
  console.log("Go to Profile");
};

const logout = () => {
  authStore.clearAuth();
};
</script>

<style scoped>
.profile-menu-container {
  position: relative;
  display: inline-block;
  font-family: "Roboto", sans-serif;
}

.profile-icon-container {
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 30px;
  padding: 5px 8px;
  padding-left: 15px;
  border: 1px solid #d3d3d3;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-icon {
  font-size: 20px;
  color: orange;
}

.user-icon {
  font-size: 35px;
  color: #484848;
}

.dropdown-menu {
  position: absolute;
  min-width: 220px;
  top: 120%;
  right: 0;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  z-index: 1001;
}

.dropdown-item {
  padding: 10px;
  cursor: pointer;
  font-weight: 450;
  color: rgb(59, 59, 59);
  font-size: larger;
}

.dropdown-item:last-child {
  color: orange;
  padding-bottom: 20px;
}

.dropdown-item:first-child {
  padding-top: 20px;
}

.dropdown-item:hover {
  background: #f0f0f0;
}
</style>

//src/components/HeroSection.vue
<template>
  <teleport to="body">
    <StoreRegistrationForm
      v-if="showRegistrationForm"
      :showUploaders="storeFormProps.showUploaders"
      :showFormFields="storeFormProps.showFormFields"
      :isEditing="isEditing"
      @close="showRegistrationForm = false"
    />
  </teleport>

  <!-- Delete Confirmation Popup -->
  <IonAlert
    v-model:isOpen="showDeleteAlert"
    header="Delete Store"
    message="Are you sure you want to delete your store? This action cannot be undone."
    :buttons="alertButtons"
    @didDismiss="onAlertDismiss"
  />

  <div class="banner-container" v-if="userstore.selectedStore">
    <section class="banner-section">
      <img
        :src="userstore.selectedStore.banner_url"
        alt="Store Banner"
        class="banner-image"
      />
      <div
        v-if="userstore.enableEdit"
        class="edit-banner-button"
        @click="editBannerPicture"
      >
        <IonIcon :icon="cameraOutline" class="banner-camera-icon" />
      </div>
      <div class="profile-wrapper">
        <div class="profile-picture">
          <img
            :src="userstore.selectedStore.profile_picture_url"
            alt="Profile Picture"
          />
        </div>
        <div
          v-if="userstore.enableEdit"
          class="edit-profile-button"
          @click="editProfilePicture"
        >
          <IonIcon :icon="cameraOutline" class="camera-icon" />
        </div>
      </div>
    </section>

    <!-- Registration/Edit Controls -->
    <div
      class="register-store"
      v-if="userstore.selectedStore.owner_id === authStore.user?.id"
    >
      <!-- Show delete icon and register/edit button if either no store exists OR a store is registered (id !== 0) -->
      <template
        v-if="userstore.stores.length === 0 || userstore.selectedStore.id !== 0"
      >
        <div
          v-if="userstore.selectedStore.id !== 0"
          class="delete-store"
          :class="{ animate: startDeleteAnimation }"
          @click="confirmDelete"
        >
          <span class="delete-text">delete</span>
          <IonIcon :icon="removeCircle" class="remove-circle-icon" />
        </div>
        <button class="register-button" @click="registerEditStore">
          {{ userstore.registrationLabel }}
        </button>
      </template>
      <!-- ProfileMenu always displayed for the owner -->
      <ProfileMenu
        @addStore="registerStore"
        @openPaymentMethods="handleOpenPaymentMethods"
      />
    </div>
  </div>

  <div class="store-info" v-if="userstore.selectedStore">
    <div class="store-brand-field">
      <div class="display-mode store-brand-wrapper">
        <div class="store-brand">
          {{ userstore.selectedStore.brand_name }}
        </div>
        <IonIcon
          :icon="informationCircleOutline"
          class="info-icon"
          @click="infoIconClicked"
        />
      </div>
    </div>

    <div class="store-tagline-field">
      <div class="display-mode">
        <div class="store-tagline">
          {{ userstore.selectedStore.tagline }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted } from "vue";
import { IonIcon, IonAlert } from "@ionic/vue";
import {
  cameraOutline,
  removeCircle,
  informationCircleOutline,
} from "ionicons/icons";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { useAuthStore } from "@/stores/authStore";
import StoreRegistrationForm from "@/components/StoreRegistrationForm.vue";
import ProfileMenu from "@/components/ProfileMenu.vue";

export default defineComponent({
  name: "HeroSection",
  props: {
    ownerIdFromQuery: {
      type: Number,
      default: undefined,
    },
  },
  emits: ["infoClicked", "openPaymentMethods"],
  components: {
    IonIcon,
    IonAlert,
    StoreRegistrationForm,
    ProfileMenu,
  },
  setup(props, { emit }) {
    const userstore = useUserstoreStore();
    const authStore = useAuthStore();
    const showRegistrationForm = ref(false);
    const isEditing = ref(false);
    const startDeleteAnimation = ref(false);
    const showDeleteAlert = ref(false);
    const storeFormProps = reactive({
      showUploaders: false,
      showFormFields: false,
    });

    const registerStore = () => {
      storeFormProps.showUploaders = false;
      storeFormProps.showFormFields = true;
      isEditing.value = false;
      showRegistrationForm.value = true;
    };

    const editStore = () => {
      storeFormProps.showUploaders = false;
      storeFormProps.showFormFields = true;
      isEditing.value = true;
      showRegistrationForm.value = true;
    };

    const registerEditStore = () => {
      if (!userstore.selectedStore) return "";
      if (userstore.selectedStore.id === 0) {
        registerStore();
      } else {
        editStore();
      }
    };

    const editProfilePicture = () => {
      storeFormProps.showUploaders = true;
      storeFormProps.showFormFields = false;
      isEditing.value = true;
      showRegistrationForm.value = true;
    };

    const editBannerPicture = () => {
      storeFormProps.showUploaders = true;
      storeFormProps.showFormFields = false;
      isEditing.value = true;
      showRegistrationForm.value = true;
    };

    const handleDeleteStore = async () => {
      try {
        await userstore.removeStore();
      } catch (error) {
        console.error("Error deleting store", error);
      }
    };

    const confirmDelete = () => {
      showDeleteAlert.value = true;
    };

    const onAlertDismiss = () => {
      showDeleteAlert.value = false;
    };

    const alertButtons = [
      { text: "Cancel", role: "cancel", cssClass: "secondary" },
      { text: "Delete", handler: () => handleDeleteStore() },
    ];

    const infoIconClicked = () => {
      emit("infoClicked");
    };

    const handleOpenPaymentMethods = (userId: number) => {
      emit("openPaymentMethods", userId);
    };

    onMounted(() => {
      setTimeout(() => {
        startDeleteAnimation.value = true;
      }, 3000);
    });

    return {
      userstore,
      authStore,
      isEditing,
      showRegistrationForm,
      cameraOutline,
      removeCircle,
      informationCircleOutline,
      storeFormProps,
      registerStore,
      editProfilePicture,
      editBannerPicture,
      registerEditStore,
      confirmDelete,
      handleDeleteStore,
      startDeleteAnimation,
      showDeleteAlert,
      alertButtons,
      onAlertDismiss,
      infoIconClicked,
      handleOpenPaymentMethods,
    };
  },
});
</script>

<style scoped>
.banner-container {
  position: relative;
}
.banner-section {
  width: 100%;
  height: 180px;
  margin-bottom: 70px;
  overflow: visible;
  position: relative;
}
.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.edit-banner-button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: 50%;
  border: 2px solid orange;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.banner-camera-icon {
  color: orange;
}
.profile-wrapper {
  position: absolute;
  bottom: -65px;
  left: 16px;
  width: 130px;
  height: 130px;
  z-index: 1;
}
.profile-picture {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #d8d8d8;
}
.profile-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.edit-profile-button {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  bottom: 22px;
  right: 22px;
  width: 30px;
  height: 30px;
  background: #ffffff;
  border-radius: 50%;
  border: 2px solid orange;
  transform: translate(50%, 50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.camera-icon {
  color: orange;
}
.register-store {
  position: absolute;
  top: 190px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.delete-store {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #d9534f;
  gap: 4px;
}
.delete-text {
  font-size: 1rem;
  color: #d9534f;
  white-space: nowrap;
  transition: transform 1s ease, opacity 1s ease;
}
.remove-circle-icon {
  font-size: 1.2rem;
  color: #d9534f;
  transition: transform 1s ease;
}
.delete-store.animate .delete-text {
  animation: slideOutText 1s forwards;
}
@keyframes slideOutText {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(30px);
    opacity: 0;
  }
}
.delete-store.animate .remove-circle-icon {
  animation: growIcon 1s forwards;
}
@keyframes growIcon {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.6);
  }
}
.register-button {
  color: rgb(6, 141, 231);
  font-size: 1rem;
  font-weight: 500;
  background-color: aliceblue;
  border-radius: 20px;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.store-info {
  padding: 0 27px;
  display: flex;
  flex-direction: column;
}
.display-mode {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.store-brand-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.store-brand {
  color: rgb(73, 73, 73);
  font-size: xx-large;
  font-weight: bold;
}
.info-icon {
  font-size: 1.5rem;
  color: #007aff;
  cursor: pointer;
}
.store-tagline {
  color: grey;
  font-size: large;
  font-weight: 100;
}
::v-deep ion-icon {
  padding: 0 !important;
  margin: 0 !important;
}
</style>

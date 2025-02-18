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
    <div
      class="register-store"
      v-if="userstore.selectedStore.owner_id === authStore.user?.id"
    >
      <button class="register-button" @click="registerEditStore">
        {{ userstore.registrationLabel }}
      </button>
      <ProfileMenu @addStore="registerStore" />
    </div>
  </div>

  <div class="store-info" v-if="userstore.selectedStore">
    <div class="store-brand-field">
      <div class="display-mode">
        <div class="store-brand">
          {{ userstore.selectedStore.brand_name }}
        </div>
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
import { defineComponent, ref, reactive } from "vue";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { useAuthStore } from "@/stores/authStore";
import { IonIcon } from "@ionic/vue";
import { cameraOutline } from "ionicons/icons";
import StoreRegistrationForm from "@/components/StoreRegistrationForm.vue";
import ProfileMenu from "@/components/ProfileMenu.vue";

export default defineComponent({
  name: "HeroSection",
  components: {
    IonIcon,
    StoreRegistrationForm,
    ProfileMenu,
  },
  setup() {
    const userstore = useUserstoreStore();
    const authStore = useAuthStore();
    const showRegistrationForm = ref(false);
    const isEditing = ref(false);
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

    return {
      userstore,
      authStore,
      isEditing,
      showRegistrationForm,
      cameraOutline,
      storeFormProps,
      registerStore,
      editProfilePicture,
      editBannerPicture,
      registerEditStore,
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
.register-button {
  color: rgb(6, 141, 231);
  font-size: 1rem;
  font-weight: 500;
  background-color: aliceblue;
  border-radius: 20px;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
}
.store-info {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
}
.display-mode {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.store-brand {
  color: rgb(73, 73, 73);
  font-size: xx-large;
  font-weight: bold;
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

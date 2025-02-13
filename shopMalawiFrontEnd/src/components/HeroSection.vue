//src/components/HeroSection.vue
<template>
  <div class="banner-container" v-if="userstore.store">
    <section class="banner-section">
      <img
        :src="userstore.store.banner_url"
        alt="Store Banner"
        class="banner-image"
      />
      <div
        v-if="isOwner"
        class="edit-banner-button"
        fill="clear"
        @click="editBannerPicture"
      >
        <IonIcon :icon="cameraOutline" class="banner-camera-icon" />
      </div>
      <div class="profile-wrapper">
        <div class="profile-picture">
          <img
            :src="userstore.store.profile_picture_url"
            alt="Profile Picture"
          />
        </div>
        <div
          v-if="isOwner"
          class="edit-profile-button"
          fill="clear"
          @click="editProfilePicture"
        >
          <IonIcon :icon="cameraOutline" class="camera-icon" />
        </div>
      </div>
    </section>
    <div class="register-store" v-if="shouldShowRegisterButton">
      <IonButton class="register-button" fill="clear" @click="registerStore">
        Register Your Store
      </IonButton>
    </div>
  </div>

  <div class="store-info" v-if="userstore.store">
    <div class="store-brand-field">
      <div v-if="editingBrandName" class="edit-mode">
        <input
          v-model="newBrandName"
          type="text"
          placeholder="Enter brand name"
          class="brand-input"
        />
        <IonButton fill="clear" @click="saveBrandName">
          <IonIcon :icon="checkmarkOutline" color="dark" />
        </IonButton>
        <IonButton fill="clear" @click="cancelEditBrandName">
          <IonIcon :icon="closeOutline" color="dark" />
        </IonButton>
      </div>
      <div v-else class="display-mode">
        <div class="store-brand">
          {{ userstore.store.brand_name }}
        </div>
        <IonButton
          v-if="isOwner"
          class="edit-button"
          fill="clear"
          @click="toggleEditBrandName"
        >
          edit
        </IonButton>
      </div>
    </div>

    <div class="store-tagline-field">
      <div v-if="editingTagline" class="edit-mode">
        <input
          v-model="newTagline"
          type="text"
          placeholder="Enter tagline"
          class="tagline-input"
        />
        <IonButton fill="clear" @click="saveTagline">
          <IonIcon :icon="checkmarkOutline" color="dark" />
        </IonButton>
        <IonButton fill="clear" @click="cancelEditTagline">
          <IonIcon :icon="closeOutline" color="dark" />
        </IonButton>
      </div>
      <div v-else class="display-mode">
        <div class="store-tagline">
          {{ userstore.store.tagline }}
        </div>
        <IonButton
          v-if="isOwner"
          class="edit-button"
          fill="clear"
          @click="toggleEditTagline"
        >
          edit
        </IonButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { useAuthStore } from "@/stores/authStore";
import { IonButton, IonIcon } from "@ionic/vue";
import { checkmarkOutline, closeOutline, cameraOutline } from "ionicons/icons";

export default defineComponent({
  name: "HeroSection",
  components: {
    IonButton,
    IonIcon,
  },
  setup() {
    const userstore = useUserstoreStore();
    const authStore = useAuthStore();

    const isOwner = computed(() => {
      return userstore.store?.owner_id === authStore.user?.id;
    });

    const shouldShowRegisterButton = computed(() => {
      if (!userstore.store) return false;
      return userstore.store.id === 0;
    });

    const editingBrandName = ref(false);
    const editingTagline = ref(false);
    const newBrandName = ref("");
    const newTagline = ref("");

    const toggleEditBrandName = () => {
      editingBrandName.value = true;
      newBrandName.value = userstore.store?.brand_name || "";
    };
    const saveBrandName = async () => {
      if (userstore.store && newBrandName.value.trim() !== "") {
        await userstore.updateStoreRecord({ brand_name: newBrandName.value });
      }
      editingBrandName.value = false;
    };
    const cancelEditBrandName = () => {
      editingBrandName.value = false;
      newBrandName.value = userstore.store?.brand_name || "";
    };

    const toggleEditTagline = () => {
      editingTagline.value = true;
      newTagline.value = userstore.store?.tagline || "";
    };
    const saveTagline = async () => {
      if (userstore.store) {
        await userstore.updateStoreRecord({ tagline: newTagline.value });
      }
      editingTagline.value = false;
    };
    const cancelEditTagline = () => {
      editingTagline.value = false;
      newTagline.value = userstore.store?.tagline || "";
    };

    const editProfilePicture = () => {
      console.log("Edit profile picture clicked");
    };
    const editBannerPicture = () => {
      console.log("Edit banner picture clicked");
    };
    const registerStore = () => {
      console.log("Register Store clicked");
    };

    return {
      userstore,
      authStore,
      isOwner,
      shouldShowRegisterButton,
      editingBrandName,
      editingTagline,
      newBrandName,
      newTagline,
      toggleEditBrandName,
      saveBrandName,
      cancelEditBrandName,
      toggleEditTagline,
      saveTagline,
      cancelEditTagline,
      editProfilePicture,
      editBannerPicture,
      registerStore,
      checkmarkOutline,
      closeOutline,
      cameraOutline,
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
  border: 2px solid #498115;
  --ion-color-base: transparent;
}
.banner-camera-icon {
  color: #498115;
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
  border: 2px solid #498115;
  --ion-color-base: transparent;
  transform: translate(50%, 50%);
}
.camera-icon {
  color: #498115;
}
.register-store {
  position: absolute;
  top: calc(180px + 15px);
  right: 16px;
}
.register-button {
  color: rgb(6, 141, 231);
  font-size: 14px;
  font-weight: bold;
  background-color: aliceblue;
  border-radius: 20px;
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
.edit-mode {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}
.edit-mode input {
  flex: 1 1 auto;
  min-width: 0;
  border-radius: 4px;
  border: 2px solid grey;
  background: transparent;
}
.edit-mode ion-button {
  flex-shrink: 0;
}
.edit-button {
  color: rgb(6, 141, 231);
  font-size: 12px;
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
.brand-input {
  color: grey;
  font-size: xx-large;
  font-weight: bold;
}
.tagline-input {
  color: grey;
  font-size: large;
}
::v-deep ion-button,
::v-deep ion-icon {
  padding: 0 !important;
  margin: 0 !important;
}
</style>

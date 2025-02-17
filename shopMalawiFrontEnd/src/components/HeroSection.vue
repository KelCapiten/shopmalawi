//src/components/HeroSection.vue
<template>
  <teleport to="body">
    <StoreRegistrationForm
      v-if="showRegistrationForm"
      :showUploaders="storeFormProps.showUploaders"
      :showFormFields="storeFormProps.showFormFields"
      @close="showRegistrationForm = false"
    />
  </teleport>

  <!-- If user has multiple stores, show a simple selector to change the active store -->
  <div v-if="userstore.stores.length > 1" class="store-selector">
    <select v-model="selectedStoreId" @change="onStoreChange">
      <option
        v-for="store in userstore.stores"
        :key="store.id"
        :value="store.id"
      >
        {{ store.brand_name }}
      </option>
    </select>
  </div>

  <div class="banner-container" v-if="userstore.selectedStore">
    <section class="banner-section">
      <img
        :src="userstore.selectedStore.banner_url"
        alt="Store Banner"
        class="banner-image"
      />
      <div
        v-if="enableEdit"
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
          v-if="enableEdit"
          class="edit-profile-button"
          @click="editProfilePicture"
        >
          <IonIcon :icon="cameraOutline" class="camera-icon" />
        </div>
      </div>
    </section>
    <div class="register-store" v-if="userstore.selectedStore">
      <button class="register-button" @click="registerStore">
        {{ registrationLabel }}
      </button>
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
import { defineComponent, ref, reactive, computed, watch } from "vue";
import { useUserstoreStore } from "@/stores/userstoreStore";
import { useAuthStore } from "@/stores/authStore";
import { IonIcon } from "@ionic/vue";
import { cameraOutline } from "ionicons/icons";
import StoreRegistrationForm from "@/components/StoreRegistrationForm.vue";

export default defineComponent({
  name: "HeroSection",
  components: {
    IonIcon,
    StoreRegistrationForm,
  },
  setup() {
    const userstore = useUserstoreStore();
    const authStore = useAuthStore();
    const showRegistrationForm = ref(false);

    // Reactive object to control StoreRegistrationForm props
    const storeFormProps = reactive({
      showUploaders: false,
      showFormFields: false,
    });

    // When there are multiple stores, allow selection.
    const selectedStoreId = ref<number | null>(
      userstore.selectedStore ? userstore.selectedStore.id : null
    );

    // Update selected store if the user changes the selection.
    const onStoreChange = () => {
      const store = userstore.stores.find(
        (s) => s.id === selectedStoreId.value
      );
      if (store) {
        userstore.selectedStore = store;
      }
    };

    // Enable editing if the current store belongs to the logged-in user.
    const enableEdit = computed(() => {
      return (
        userstore.selectedStore?.owner_id === authStore.user?.id &&
        userstore.selectedStore?.id !== 0
      );
    });

    // Compute button label based on whether the store is registered.
    const registrationLabel = computed(() => {
      if (!userstore.selectedStore) return "";
      return userstore.selectedStore.id === 0
        ? "Register Your Store"
        : "Edit Store";
    });

    // When registering a new store, we want the form fields only.
    const registerStore = () => {
      storeFormProps.showUploaders = false;
      storeFormProps.showFormFields = true;
      showRegistrationForm.value = true;
    };

    // When editing banner or profile picture, we want the uploader only.
    const editProfilePicture = () => {
      storeFormProps.showUploaders = true;
      storeFormProps.showFormFields = false;
      showRegistrationForm.value = true;
    };
    const editBannerPicture = () => {
      storeFormProps.showUploaders = true;
      storeFormProps.showFormFields = false;
      showRegistrationForm.value = true;
    };

    // Watch for changes in selectedStore to update the store selector value.
    watch(
      () => userstore.selectedStore,
      (newStore) => {
        selectedStoreId.value = newStore ? newStore.id : null;
      },
      { immediate: true }
    );

    return {
      userstore,
      authStore,
      showRegistrationForm,
      selectedStoreId,
      onStoreChange,
      enableEdit,
      registrationLabel,
      editProfilePicture,
      editBannerPicture,
      registerStore,
      cameraOutline,
      storeFormProps,
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
  border: none;
  padding: 4px 8px;
  cursor: pointer;
}
.store-selector {
  margin: 1rem 16px;
}
.store-selector select {
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
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

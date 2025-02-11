// src/components/ShareToolbar.vue
<template>
  <IonHeader no-border no-shadow v-if="enableShareToolbar">
    <IonToolbar class="share-toolbar">
      <IonButtons slot="start">
        <IonButton class="circle-button" fill="clear" @click="router.back()">
          <IonIcon :icon="arrowBack" />
        </IonButton>
      </IonButtons>
      <IonButtons slot="end">
        <IonButton class="circle-button" fill="clear" @click="onSearchClick">
          <IonIcon :icon="searchOutline" />
        </IonButton>
        <IonButton class="circle-button" fill="clear" @click="onShareClick">
          <IonIcon :icon="shareSocialOutline" />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
  <IonHeader v-if="enableNavigationToolbar">
    <IonToolbar class="navigation-toolbar">
      <IonButton class="nav-icon-button" fill="clear" @click="goHome">
        <IonIcon :icon="homeOutline" />
      </IonButton>
      <IonButton class="nav-icon-button" fill="clear" @click="goMessage">
        <IonIcon :icon="chatbubbleOutline" />
      </IonButton>
      <IonButton class="nav-icon-button" fill="clear" @click="goBack">
        <IonIcon :icon="chevronBackOutline" />
        <IonLabel class="back-label">Back</IonLabel>
      </IonButton>
    </IonToolbar>
  </IonHeader>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonLabel,
} from "@ionic/vue";
import {
  arrowBack,
  searchOutline,
  shareSocialOutline,
  homeOutline,
  chatbubbleOutline,
  chevronBackOutline,
} from "ionicons/icons";
import { useRouter } from "vue-router";

const { enableShareToolbar, enableNavigationToolbar } = defineProps({
  enableShareToolbar: { type: Boolean, default: false },
  enableNavigationToolbar: { type: Boolean, default: false },
});

const router = useRouter();

function onSearchClick() {
  console.log("Search button clicked");
}

function onShareClick() {
  console.log("Share button clicked");
}

function goHome() {
  router.push("/shop");
}

function goMessage() {
  router.push("");
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.share-toolbar {
  --ion-toolbar-background: transparent;
  --ion-toolbar-border-color: transparent;
}
ion-header,
ion-toolbar {
  --ion-toolbar-border-color: transparent;
  --ion-toolbar-shadow: none;
  box-shadow: none !important;
}
.circle-button {
  width: 32px;
  height: 20px;
  border-radius: 45%;
  background-color: rgb(255, 255, 255);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 5px;
}
.circle-button ion-icon {
  font-size: 17px;
  color: #000;
}
.navigation-toolbar {
  background-color: transparent;
  --ion-toolbar-background: rgba(206, 206, 206, 0.8);
  border: 1px solid rgb(230, 104, 55);
  color: #000;
  box-shadow: none !important;
}
.nav-icon-button {
  background-color: transparent;
  border-radius: 50%;
  padding: 8px;
  margin: 0 4px;
}
.nav-icon-button ion-icon {
  font-size: 20px;
  color: #000;
}
.back-label {
  font-size: 16px;
  color: #000;
  margin-left: 4px;
}

/* Remove all padding and margin in navigation toolbar elements */
.navigation-toolbar ion-button,
.navigation-toolbar ion-icon,
.navigation-toolbar ion-label {
  padding: 0 !important;
  margin: 0 !important;
}
</style>

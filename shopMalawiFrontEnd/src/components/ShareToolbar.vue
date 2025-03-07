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
          <IonIcon :icon="search" />
        </IonButton>
        <IonButton class="circle-button" fill="clear" @click="onShareClick">
          <IonIcon :icon="shareSocial" />
        </IonButton>
      </IonButtons>
    </IonToolbar>
  </IonHeader>
  <IonHeader v-if="enableNavigationToolbar">
    <IonToolbar class="navigation-toolbar">
      <div class="nav-buttons-container">
        <IonButton class="nav-icon-button" fill="clear" @click="goHome">
          <IonIcon :icon="home" />
        </IonButton>
        <Button :seller-id="sellerId" class="nav-icon-button" />
        <IonButton
          class="nav-icon-button chevron-back-button"
          fill="clear"
          @click="goBack"
        >
          <IonIcon :icon="chevronBack" />
          <IonLabel class="back-label">Back</IonLabel>
        </IonButton>
      </div>
    </IonToolbar>
  </IonHeader>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import Button from "@/components/buttons/Button.vue";
import {
  arrowBack,
  search,
  shareSocial,
  home,
  chevronBack,
} from "ionicons/icons";
import { useRouter } from "vue-router";

const props = defineProps({
  enableShareToolbar: { type: Boolean, default: false },
  enableNavigationToolbar: { type: Boolean, default: false },
  sellerId: { type: Number },
});

const { enableShareToolbar, enableNavigationToolbar, sellerId } = props;

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
  --ion-toolbar-background: rgba(255, 255, 255, 0.9);
  --padding-top: 8px;
  --padding-bottom: 8px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid rgba(230, 104, 55, 0.5);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
  border-top-left-radius: 15px;
  border-bottom-left-radius: 15px;
}

.nav-buttons-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  width: 100%;
}

.nav-icon-button {
  --background: transparent;
  margin: 0px 5px;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.nav-icon-button:hover {
  --background: rgba(230, 104, 55, 0.1);
}

.nav-icon-button ion-icon {
  font-size: 20px;
  color: #333;
}

.chevron-back-button ion-icon {
  font-size: 25px;
  color: #333;
}

.back-label {
  font-size: 14px;
  font-weight: bolder;
  color: #333;
  margin-left: 4px;
}
.nav-icon-button.chat-button {
  --background: transparent;
  --border-radius: 8px;
  height: auto;
  width: auto;
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-icon-button.chat-button:hover {
  --background: rgba(230, 104, 55, 0.1);
}

.nav-icon-button.chat-button ion-icon {
  font-size: 20px;
  color: #333;
}

.nav-icon-button.chat-button span {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-left: 4px;
}
</style>

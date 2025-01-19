<template>
  <!-- Using no-border & no-shadow on ion-header (Ionic attribute props) -->
  <IonHeader no-border no-shadow>
    <IonToolbar class="transparent-toolbar">
      <!-- Left icon button (Back) -->
      <IonButtons slot="start">
        <IonButton class="circle-button" fill="clear" @click="onBackClick">
          <IonIcon :icon="arrowBack" />
        </IonButton>
      </IonButtons>

      <!-- Right icon buttons (Search, Share) -->
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
</template>

<script setup lang="ts">
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
} from "@ionic/vue";
import { arrowBack, searchOutline, shareSocialOutline } from "ionicons/icons";
import { useRouter } from "vue-router"; // Import useRouter

const router = useRouter(); // Initialize the router instance

function onBackClick() {
  router.back(); // Navigate to the previous page
}

function onSearchClick() {
  console.log("Search button clicked");
}

function onShareClick() {
  console.log("Share button clicked");
}
</script>

<style scoped>
/* 1) Make the toolbar fully transparent (and remove any shadow) */
.transparent-toolbar {
  --ion-toolbar-background: transparent;
  --ion-toolbar-border-color: transparent;
}
ion-header,
ion-toolbar {
  /* Remove any border or shadow */
  --ion-toolbar-border-color: transparent;
  --ion-toolbar-shadow: none;
  box-shadow: none !important;
}
/*
  2) Force circular buttons with a fixed size.
     No need for shape="round", since we do it in CSS.
*/
.circle-button {
  /* Fixed size for the circle */
  width: 32px;
  height: 20px;
  border-radius: 45%;

  /* White, semi-transparent background */
  background-color: rgb(255, 255, 255);

  /* Center the icon */
  display: flex;
  align-items: center;
  justify-content: center;

  /* No extra space, no shadow */
  padding: 0;
  margin: 5px;
}

/* 3) Make the icon bigger */
.circle-button ion-icon {
  font-size: 17px;
  color: #000; /* Black icon color */
}
</style>

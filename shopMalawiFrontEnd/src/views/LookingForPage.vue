<template>
  <ion-page>
    <appHeader :showCategorySegment="false" />

    <ion-content class="ion-padding">
      <InquiriesList
        v-if="!showForm"
        :inquiries="inquiries"
        @toggleProductCard="handleToggleProductCard"
      />

      <transition name="slideForm">
        <div v-if="showForm" ref="formRef" class="form-container">
          <InputForm @submit="handleAddInquiry" />
        </div>
      </transition>

      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :duration="2000"
        @didDismiss="showToast = false"
        :color="toastColor"
      />

      <SavingOverlay :isSaving="isSending || loading" />

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="toggleForm" color="light">
          <ion-icon :icon="showForm ? close : search" />
        </ion-fab-button>
      </ion-fab>

      <ion-loading
        v-if="loading"
        message="Loading inquiries..."
        :is-open="loading"
      />
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, nextTick } from "vue";
import { useInquiries } from "@/composables/useInquiry";
import { close, search } from "ionicons/icons";
import appHeader from "@/components/appHeader.vue";
import appFooter from "@/components/appFooter.vue";
import InquiriesList from "@/components/InquiriesList.vue";
import InputForm from "@/components/InputForm.vue";
import SavingOverlay from "@/components/SavingOverlay.vue";

export default defineComponent({
  name: "LookingForPage",
  components: {
    appHeader,
    appFooter,
    InquiriesList,
    InputForm,
    SavingOverlay,
  },
  setup() {
    const { inquiries, fetchInquiries, addInquiry, loading, error } =
      useInquiries();
    const showForm = ref(false);
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastColor = ref("success");
    const isSending = ref(false);
    const formRef = ref<HTMLElement | null>(null);

    const toggleForm = () => {
      showForm.value = !showForm.value;
    };

    watch(showForm, async (value) => {
      if (value) {
        await nextTick();
        formRef.value?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    const handleAddInquiry = async (payload: any) => {
      isSending.value = true;
      try {
        await addInquiry(payload);
        toastMessage.value = "Inquiry added successfully";
        toastColor.value = "success";
        showToast.value = true;
        showForm.value = false;
      } catch {
        toastMessage.value = "Failed to add inquiry";
        toastColor.value = "danger";
        showToast.value = true;
      } finally {
        isSending.value = false;
      }
    };

    const handleToggleProductCard = (id: number) => {
      console.log("Toggle product card for inquiry ID:", id);
    };

    watch(error, (err) => {
      if (err) {
        toastMessage.value = err;
        toastColor.value = "danger";
        showToast.value = true;
      }
    });

    onMounted(() => {
      fetchInquiries();
    });

    return {
      inquiries,
      showForm,
      toggleForm,
      showToast,
      toastMessage,
      toastColor,
      isSending,
      handleAddInquiry,
      handleToggleProductCard,
      formRef,
      close,
      search,
      loading,
      error,
    };
  },
});
</script>

<style scoped>
.slideForm-enter-active,
.slideForm-leave-active {
  transition: all 0.3s ease;
}
.slideForm-enter-from,
.slideForm-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.slideForm-enter-to,
.slideForm-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.form-container {
  margin-top: 1rem;
}
</style>

//\src\components\ToastNotification.vue
<template>
  <div
    v-for="toast in toasts"
    :key="toast.id"
    :class="['toast', toast.type]"
    @click="dismissToast(toast.id)"
  >
    <div class="icon">
      <ion-icon :name="toastIcons[toast.type]"></ion-icon>
    </div>
    <div class="content">
      <h3>{{ toast.title }}</h3>
      <p>{{ toast.message }}</p>
    </div>
    <ion-icon
      name="close-outline"
      class="close-btn"
      @click.stop="dismissToast(toast.id)"
    ></ion-icon>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";

interface Toast {
  id: number;
  type: "success" | "warning" | "information" | "error" | "custom";
  title: string;
  message: string;
  persistent: boolean;
}

export default defineComponent({
  name: "ToastNotification",
  setup() {
    const toasts = reactive<Toast[]>([]);
    let nextToastId = 1;

    const toastIcons = {
      success: "checkmark-circle",
      warning: "alert-circle",
      information: "information-circle",
      error: "close-circle",
      custom: "ellipse",
    };

    const showToast = (
      type: Toast["type"],
      title: string,
      message: string,
      persistent = false,
      timeout = 5000
    ) => {
      const toast: Toast = {
        id: nextToastId++,
        type,
        title,
        message,
        persistent,
      };
      toasts.push(toast);

      // Auto-remove the toast after the specified timeout if not persistent
      if (!persistent) {
        setTimeout(() => dismissToast(toast.id), timeout);
      }
    };

    const dismissToast = (id: number) => {
      const index = toasts.findIndex((toast) => toast.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
      }
    };

    return { toasts, toastIcons, showToast, dismissToast };
  },
});
</script>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  margin: 0.5rem 0;
  cursor: pointer;
  transition: all 0.3s ease;
}
.toast.success {
  background-color: #d4edda;
  color: #155724;
}
.toast.warning {
  background-color: #fff3cd;
  color: #856404;
}
.toast.information {
  background-color: #d1ecf1;
  color: #0c5460;
}
.toast.error {
  background-color: #f8d7da;
  color: #721c24;
}
.toast.custom {
  background-color: #e2e3e5;
  color: #6c757d;
}

.icon {
  font-size: 24px;
  margin-right: 12px;
}

.content {
  flex-grow: 1;
}

h3 {
  margin: 0;
  font-size: 16px;
}

p {
  margin: 0;
  font-size: 14px;
}

.close-btn {
  font-size: 20px;
  cursor: pointer;
}
</style>

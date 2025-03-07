// src/components/buttons/Button.vue
<template>
  <button class="chat-button" @click="handleChatClick">
    <ion-icon :icon="chatIcon" />
    <span>{{ buttonText }}</span>
  </button>
</template>

<script>
import { defineComponent } from "vue";
import { chatbubbleEllipsesOutline } from "ionicons/icons";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "Button",
  props: {
    sellerId: {
      type: Number,
      required: true,
    },
    buttonText: {
      type: String,
      default: "",
    },
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      chatIcon: chatbubbleEllipsesOutline,
    };
  },
  methods: {
    handleChatClick() {
      this.router.push({
        name: "Messages",
        query: { sellerId: this.sellerId },
      });
    },
  },
});
</script>

<style scoped>
.chat-button {
  background-color: transparent;
  border-radius: 50%;
  padding: 8px;
  margin: 0 4px;
  height: auto;
  width: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
}

.chat-button ion-icon {
  font-size: 22px;
  color: orange;
}

.chat-button span {
  font-size: 16px;
  color: #000;
  margin-left: 4px;
}

.chat-button,
.chat-button ion-icon,
.chat-button span {
  padding: 0 !important;
  margin: 0 !important;
}

.chat-button:hover {
  background-color: transparent;
}
</style>

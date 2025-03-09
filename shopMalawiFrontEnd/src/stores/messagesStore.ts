// src/stores/messagesStore.ts
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { io } from "socket.io-client";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import type {
  GetConversationsResponse,
  CreateConversationPayload,
  CreateConversationResponse,
  Conversation,
  Message,
} from "@/types/messagesTypes";
import { useMessages } from "@/composables/useMessages";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:1994";

export const useMessagesStore = defineStore(
  "messages",
  () => {
    const authStore = useAuthStore();
    const route = useRoute();
    const socket = ref<any>(null);
    const ConversationsList = ref<GetConversationsResponse | null>(null);
    const selectedConversationId = ref<number | null>(null);
    const loading = ref(false);
    const sellerId = ref<number | undefined>(undefined);
    sellerId.value = route.query.sellerId
      ? Number(route.query.sellerId)
      : undefined;

    watch(
      () => route.query.sellerId,
      (newSellerId) => {
        sellerId.value = newSellerId ? Number(newSellerId) : undefined;
      }
    );

    const { conversations, fetchConversationsList } = useMessages();

    const selectedConversation = computed(() => {
      if (!selectedConversationId.value || !ConversationsList.value)
        return null;

      const conversation = ConversationsList.value.conversations.find(
        (conv) => conv.id === selectedConversationId.value
      );
      return conversation ? { ...conversation } : null;
    });

    const dummyConversation: Conversation = {
      id: -1,
      created_at: new Date().toISOString(),
      updated_at: null,
      last_message_id: null,
      is_group: false,
      unread_count: 0,
      last_message: null,
      last_activity: null,
      message_count: 0,
      current_user_last_read: null,
      current_user_joined_at: new Date().toISOString(),
      participants: [],
      is_one_on_one: false,
      other_participant: null,
    };

    const initializeWebSocket = () => {
      if (!authStore.token || !authStore.user) {
        console.error(
          "User not authenticated. WebSocket connection not established."
        );
        return;
      }
      socket.value = io(SOCKET_URL, {
        withCredentials: true,
        auth: { token: authStore.token },
      });

      socket.value.on("newMessage", (message: Message) => {
        if (ConversationsList.value) {
          const conv = ConversationsList.value.conversations.find(
            (c: Conversation) => c.id === message.conversation_id
          );
          if (conv) {
            conv.last_message = message;
            ConversationsList.value = { ...ConversationsList.value };
          }
        }
      });

      socket.value.on("error", (error: any) => {
        console.error("WebSocket error:", error);
      });
    };

    const sendMessage = async (text: string): Promise<boolean> => {
      if (!selectedConversationId.value || !socket.value) return false;
      try {
        socket.value.emit("sendMessage", {
          conversationId: selectedConversationId.value,
          content: text,
        });
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    };

    const getConversationsList = async (params?: {
      page?: number;
      limit?: number;
    }) => {
      loading.value = true;

      await fetchConversationsList(params);

      if (
        sellerId.value &&
        authStore.user &&
        sellerId.value !== authStore.user.id &&
        conversations.value
      ) {
        ConversationsList.value = {
          ...conversations.value,
          conversations: [
            dummyConversation,
            ...conversations.value.conversations,
          ],
        };
        selectedConversationId.value = dummyConversation.id;
      } else {
        ConversationsList.value = conversations.value;
      }

      loading.value = false;
    };

    const selectConversation = (conversation: Conversation) => {
      selectedConversationId.value = conversation.id;
    };

    const startNewConversation = async (
      payload: CreateConversationPayload
    ): Promise<CreateConversationResponse | null> => {
      if (!socket.value) {
        initializeWebSocket();
        if (!socket.value) return null;
      }

      loading.value = true;

      return new Promise((resolve) => {
        socket.value.emit("startConversation", payload);

        socket.value.once(
          "conversationStarted",
          (response: CreateConversationResponse) => {
            loading.value = false;
            resolve(response);
          }
        );

        socket.value.once("error", (error: any) => {
          console.error("Error starting conversation:", error);
          loading.value = false;
          resolve(null);
        });
      });
    };

    return {
      loading,
      ConversationsList,
      selectedConversationId,
      selectedConversation,
      sellerId,
      initializeWebSocket,
      sendMessage,
      getConversationsList,
      selectConversation,
      startNewConversation,
    };
  },
  {
    persist: true,
  }
);
